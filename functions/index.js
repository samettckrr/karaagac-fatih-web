// functions/index.js
// Node 20 + CommonJS
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { GoogleAuth } = require("google-auth-library");
const { Storage } = require("@google-cloud/storage");
const cors = require("cors");
const cronParser = require("cron-parser");

admin.initializeApp();

const REGION = "europe-west1";
const auth = new GoogleAuth();
const storage = new Storage();

// ---- ENV okuyucu ----
function readEnv() {
  const SHOTTER_BASE = (process.env.SHOTTER_URL || "").replace(/\/+$/, "");
  const BUCKET_NAME = process.env.BUCKET_NAME || `${process.env.GCLOUD_PROJECT}-shotter`;
  const SAVE_TO_GCS = ["1","true","yes"].includes(String(process.env.SAVE_TO_GCS || "").toLowerCase());
  const SIGNED_URL_TTL = parseInt(process.env.SIGNED_URL_TTL || "900", 10);
  const ALLOW_ORIGINS = String(process.env.CORS_ALLOW_ORIGIN || "*")
    .split(",").map(s => s.trim()).filter(Boolean);
  const SCHEDULE_TZ = process.env.SCHEDULE_TZ || "UTC";
  return { SHOTTER_BASE, BUCKET_NAME, SAVE_TO_GCS, SIGNED_URL_TTL, ALLOW_ORIGINS, SCHEDULE_TZ };
}

// ---- CORS ----
function makeCors(ALLOW_ORIGINS) {
  return cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (ALLOW_ORIGINS.includes("*")) return cb(null, true);
      return cb(null, ALLOW_ORIGINS.includes(origin));
    },
    methods: ["GET","POST","OPTIONS"],
    allowedHeaders: ["Authorization","Content-Type"],
    maxAge: 86400
  });
}

// ---- Auth: Firebase ID token bekler ----
async function requireAuth(req) {
  const hdr = req.get("Authorization") || "";
  const m = hdr.match(/^Bearer (.+)$/);
  if (!m) throw new Error("no_token");
  const idToken = m[1];
  return admin.auth().verifyIdToken(idToken); // { uid, email, ... }
}

// ---- Shotter'a gidip PNG döndürme ----
async function shotterRender({ SHOTTER_BASE, url, w, h, selector }) {
  const client = await auth.getIdTokenClient(SHOTTER_BASE);
  const qs = new URLSearchParams({ url, w: String(w), h: String(h) });
  if (selector) qs.append("selector", String(selector));
  const { data, status } = await client.request({
    url: `${SHOTTER_BASE}/render?${qs.toString()}`,
    responseType: "arraybuffer",
    timeout: 60000,
  });
  return Buffer.from(data);
}

// ---- PNG'yi bucket'a kaydet + v4 imzalı link döndür ----
async function saveToGCS({ BUCKET_NAME, uid, buf, meta }) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `shots/${uid}/${ts}.png`;
  const file = storage.bucket(BUCKET_NAME).file(fileName);
  await file.save(buf, {
    resumable: false,
    contentType: "image/png",
    metadata: { cacheControl: "public, max-age=3600", metadata: meta || {} },
  });
  return { fileName };
}

// ---- Sağlık ----
exports.ping = functions.region(REGION).https.onRequest((_, res) => res.status(200).send("OK"));

// ---- Manuel (login gerekli) ----
exports.render = functions.region(REGION).https.onRequest(async (req, res) => {
  const { SHOTTER_BASE, BUCKET_NAME, SAVE_TO_GCS, SIGNED_URL_TTL, ALLOW_ORIGINS } = readEnv();
  if (!SHOTTER_BASE) return res.status(500).send("Missing env: SHOTTER_URL");
  const handleCors = makeCors(ALLOW_ORIGINS);
  return handleCors(req, res, async () => {
    if (req.method === "OPTIONS") return res.status(204).send("");
    try {
      const user = await requireAuth(req);
      const uid = user.uid;

      const url = req.query.url;
      const w = req.query.w || "1366";
      const h = req.query.h || "900";
      const selector = String(req.query.selector || "");
      const forceSave = ["1","true","yes"].includes(String(req.query.save || "").toLowerCase());
      if (!url) return res.status(400).send("Missing url");

      const buf = await shotterRender({ SHOTTER_BASE, url, w, h, selector });

      if (SAVE_TO_GCS || forceSave) {
        const { fileName } = await saveToGCS({
          BUCKET_NAME,
          uid,
          buf,
          meta: { uid, url, w, h, selector }
        });
        const [signedUrl] = await storage
          .bucket(BUCKET_NAME).file(fileName)
          .getSignedUrl({ version: "v4", action: "read", expires: Date.now() + SIGNED_URL_TTL * 1000 });

        // (Opsiyonel) geçmiş kaydı
        // await admin.firestore().collection("screens").add({
        //   uid, url, w: Number(w), h: Number(h), selector,
        //   bucket: BUCKET_NAME, name: fileName,
        //   createdAt: admin.firestore.FieldValue.serverTimestamp()
        // });

        return res.status(200).json({ url: signedUrl, bucket: BUCKET_NAME, name: fileName, expiresInSeconds: SIGNED_URL_TTL });
      }

      res.set("Content-Type", "image/png");
      return res.status(200).send(buf);
    } catch (e) {
      console.error(e);
      return res.status(401).send(e.message || "Unauthorized");
    }
  });
});

// =========================
//  OTOMATİK ÇALIŞAN KISIM
// =========================

// JOB ŞEMASI (Firestore /jobs/{id})
// {
//   uid: string,
//   url: string,
//   selector?: string,
//   w: number,
//   h: number,
//   cron: string,        // "*/10 * * * *" gibi
//   tz: string,          // "Europe/Istanbul" (opsiyonel; yoksa .env SCHEDULE_TZ)
//   active: boolean,
//   nextRunAt: Timestamp,
//   lastRunAt?: Timestamp,
//   lastError?: string
// }

// 1) Kullanıcının job oluşturması (login gerekli, POST JSON)
exports.createJob = functions.region(REGION).https.onRequest(async (req, res) => {
  const { ALLOW_ORIGINS, SCHEDULE_TZ } = readEnv();
  const handleCors = makeCors(ALLOW_ORIGINS);
  return handleCors(req, res, async () => {
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).send("Method not allowed");
    try {
      const user = await requireAuth(req);
      const uid = user.uid;

      const { url, cron, selector = "", w = 1366, h = 900, active = true, tz } = req.body || {};
      if (!url || !cron) return res.status(400).send("Missing url/cron");

      // ilk nextRunAt hesapla
      const interval = cronParser.parseExpression(cron, { tz: tz || SCHEDULE_TZ });
      const next = interval.next().toDate();

      const docRef = await admin.firestore().collection("jobs").add({
        uid, url, selector, w: Number(w), h: Number(h),
        cron, tz: tz || SCHEDULE_TZ, active: Boolean(active),
        nextRunAt: admin.firestore.Timestamp.fromDate(next),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.status(200).json({ id: docRef.id });
    } catch (e) {
      console.error(e);
      res.status(500).send(e.message || "error");
    }
  });
});

// 2) Zamanlayıcı: her dakika due job'ları çalıştır
exports.runJobs = functions.region(REGION)
  .pubsub.schedule("every 1 minutes")
  .timeZone("UTC") // tetikleyici saati; job bazında cron'u tz ile hesaplıyoruz
  .onRun(async () => {
    const { SHOTTER_BASE, BUCKET_NAME, SCHEDULE_TZ } = readEnv();
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    // Aynı anda çok iş çıkmasın diye 20 ile sınırlayalım (ihtiyaca göre artır)
    const snap = await db.collection("jobs")
      .where("active", "==", true)
      .where("nextRunAt", "<=", now)
      .limit(20)
      .get();

    if (snap.empty) return null;

    const batch = db.batch();

    for (const doc of snap.docs) {
      const job = doc.data();
      const uid = job.uid;
      try {
        const buf = await shotterRender({
          SHOTTER_BASE,
          url: job.url,
          w: job.w || 1366,
          h: job.h || 900,
          selector: job.selector || ""
        });

        const { fileName } = await saveToGCS({
          BUCKET_NAME,
          uid,
          buf,
          meta: { uid, url: job.url, w: String(job.w), h: String(job.h), selector: job.selector || "", jobId: doc.id }
        });

        // tarihçeye bir kayıt (opsiyonel)
        await db.collection("screens").add({
          uid, url: job.url, selector: job.selector || "", w: job.w, h: job.h,
          bucket: BUCKET_NAME, name: fileName,
          jobId: doc.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // sıradaki zamanı hesapla
        const interval = cronParser.parseExpression(job.cron, { tz: job.tz || SCHEDULE_TZ });
        const next = interval.next().toDate();

        batch.update(doc.ref, {
          lastRunAt: now,
          nextRunAt: admin.firestore.Timestamp.fromDate(next),
          lastError: admin.firestore.FieldValue.delete()
        });

      } catch (err) {
        console.error("job failed", doc.id, err.message);
        // hata yaz, 5 dk sonra tekrar dene (çok basit backoff)
        const retry = new Date(Date.now() + 5 * 60 * 1000);
        batch.update(doc.ref, {
          lastRunAt: now,
          nextRunAt: admin.firestore.Timestamp.fromDate(retry),
          lastError: String(err.message || err)
        });
      }
    }

    await batch.commit();
    return null;
  });