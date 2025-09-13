// CommonJS kullanıyoruz ve v1 API yeterli:
const functions = require("firebase-functions/v1");
const axios = require("axios");

const REGION = "europe-west1";

exports.ping = functions.region(REGION).https.onRequest(async (_req, res) => {
  try {
    const cfg = functions.config();
    const base = cfg.reports?.shotter_url;
    const token = cfg.reports?.shotter_token;
    if (!base || !token) {
      res.status(500).send("Missing config: reports.shotter_url / reports.shotter_token");
      return;
    }

    const target = "https://example.com"; // test amacıyla
    const url = `${base}?token=${encodeURIComponent(token)}&url=${encodeURIComponent(target)}&w=1366&h=900`;
    const r = await axios.get(url, { responseType: "arraybuffer", timeout: 60000 });

    res.status(200).send(`OK – screenshot bytes: ${r.data.length}`);
  } catch (e) {
    console.error(e);
    res.status(500).send(`ERR: ${e.message}`);
  }
});
