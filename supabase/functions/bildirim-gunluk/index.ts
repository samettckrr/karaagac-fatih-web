// bildirim-gunluk — Zamanlanmış akıllı bildirim üretici
//
// Eskiden Workmanager (guncelleme_servis.dart) içinde çalışan akıllı bildirim
// mantığı buraya taşındı. pg_cron bu fonksiyonu günün çeşitli saatlerinde
// tetikler; fonksiyon her aktif personel için hesaplama yapıp
// `public.bildirim_gonder(...)` RPC'si ile bildirim atar (FCM webhook zinciri
// devamını getirir).
//
// Çağrı şekli:
//   POST /functions/v1/bildirim-gunluk?tip=<tip>
//   Yetki (biri yeterli): x-cron-secret: BILDIRIM_CRON_SECRET | Authorization: Bearer SERVICE_ROLE_KEY
//
// Tip değerleri (cron saatleri TR — pg_cron migrations):
//   alacak-sabah      → Kalan alacak hatırlatması (TR günlük 09:05)
//   alacak-aksam      → Bugünkü tahsilat özeti
//   alacak-haftalik   → Geçen hafta tahsilat özeti (TR Pazartesi 08:45)
//   alacak-aylik      → Geçen ay tahsilat özeti (Ayın 1'i)
//   kurban-ilerleme   → Bağış hisse hedefine göre ilerleme (TR günlük 09:15)
//   yoklama-uyari     → TR 22:00 — gün içi namaz yoklaması eksikse belirli kullanıcılara uyarı
//   nobet-pazar       → Hafta başı TR Pazartesi 09:45 — bu haftaki Pazar evli nöbeti hatırlatması
//   (takrir tipleri devreden çıkarıldı)
//
// Tahakkuk kaynakları (mobil "Alacak" ekranı ile birebir):
//   • public.tahakkuklar (tahakkuk)
//   • public.ramazan_kayitlari (tip iftar/sahur) → tutar
//   • public.taahhut_kayitlari (silinmemiş) → miktar
//
// Tahsilat kaynakları:
//   • public.tahsilatlar (tutar, tarih timestamptz)
//   • public.ramazan_tahsilat (tutar, tahsilat_tarihi date) →
//     parent ramazan_kayitlari VEYA taahhut_kayitlari üzerinden personel çözülür
//
// Secrets:
//   BILDIRIM_CRON_SECRET → pg_cron header'ı ile eşleşen paylaşılan sır
//   SUPABASE_URL              → otomatik
//   SUPABASE_SERVICE_ROLE_KEY → otomatik

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

const TR_TZ_OFFSET_MINUTES = 180; // TR = UTC+3

function trNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + TR_TZ_OFFSET_MINUTES * 60_000);
}

function ymd(d: Date): string {
  return d.toISOString().substring(0, 10);
}

function lira(n: number): string {
  return `₺${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;
}

/// Türkçe büyük/küçük harf farkını da kapsayan personel-adı normalizasyonu.
/// 'SAMET ÇAKIR' ↔ 'Samet Çakır' birebir eşleşir.
function normalize(s: unknown): string {
  return (s ?? "").toString().toLocaleLowerCase("tr-TR").trim();
}

const AYLAR = [
  "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

interface Personel {
  id: string;
  adsoyad: string;
  key: string;
}

async function aktifPersoneller(sb: SupabaseClient): Promise<Personel[]> {
  const { data, error } = await sb
    .from("kullanicilar")
    .select("id, adsoyad")
    .eq("aktif", true);
  if (error) throw error;
  return (data ?? [])
    .filter((k) => (k.adsoyad ?? "").trim().length > 0)
    .map((k) => ({
      id: k.id as string,
      adsoyad: k.adsoyad as string,
      key: normalize(k.adsoyad),
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Tahakkuk / Tahsilat birleşik toplamları
// ─────────────────────────────────────────────────────────────────────────────

/// Mobil uygulamadaki "Alacak" ekranıyla birebir aynı hesaplama:
///   tahakkuklar + ramazan_kayitlari(iftar/sahur) + taahhut_kayitlari(silinmemiş)
async function tahakkukToplamlari(sb: SupabaseClient): Promise<Map<string, number>> {
  const [tah, ram, taa] = await Promise.all([
    sb.from("tahakkuklar").select("tahakkuk, personel"),
    sb
      .from("ramazan_kayitlari")
      .select("tutar, personel, personeladi, tip")
      .in("tip", ["iftar", "sahur"]),
    sb.from("taahhut_kayitlari").select("miktar, personel, silindi"),
  ]);

  if (tah.error) throw tah.error;
  if (ram.error) console.error("[tahakkuk] ramazan_kayitlari:", ram.error.message);
  if (taa.error) console.error("[tahakkuk] taahhut_kayitlari:", taa.error.message);

  const m = new Map<string, number>();

  for (const r of tah.data ?? []) {
    const k = normalize(r.personel);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + Number(r.tahakkuk ?? 0));
  }
  for (const r of ram.data ?? []) {
    const k = normalize(r.personeladi ?? r.personel);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + Number(r.tutar ?? 0));
  }
  for (const r of taa.data ?? []) {
    if (r.silindi === true) continue;
    const k = normalize(r.personel);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + Number(r.miktar ?? 0));
  }
  return m;
}

/// Tahsilat = tahsilatlar + ramazan_tahsilat (mobil ile aynı birleşim)
/// bas/bit verilirse tarih aralığı uygulanır (bas dahil, bit hariç).
async function tahsilatToplamlari(
  sb: SupabaseClient,
  bas?: Date,
  bit?: Date,
): Promise<Map<string, number>> {
  const m = new Map<string, number>();

  // 1) Core tahsilatlar (tarih: timestamptz)
  {
    let q = sb.from("tahsilatlar").select("tutar, tarih, personel");
    if (bas) q = q.gte("tarih", bas.toISOString());
    if (bit) q = q.lt("tarih", bit.toISOString());
    const { data, error } = await q;
    if (error) throw error;
    for (const r of data ?? []) {
      const k = normalize(r.personel);
      if (!k) continue;
      m.set(k, (m.get(k) ?? 0) + Number(r.tutar ?? 0));
    }
  }

  // 2) Ramazan tahsilatları (tahsilat_tarihi: date, YYYY-MM-DD)
  try {
    let q = sb
      .from("ramazan_tahsilat")
      .select("tutar, tahsilat_tarihi, kayit_id")
      .not("tahsilat_tarihi", "is", null);
    if (bas) q = q.gte("tahsilat_tarihi", ymd(bas));
    if (bit) {
      // date için lt("YYYY-MM-DD") dahil/hariç davranışı tam oturmaz; bit'i bir gün geri alıp lte yapalım
      const bitInc = new Date(bit.getTime() - 24 * 3600 * 1000);
      q = q.lte("tahsilat_tarihi", ymd(bitInc));
    }
    const { data: rTsl, error } = await q;
    if (error) throw error;
    const satirlar = rTsl ?? [];
    if (satirlar.length === 0) return m;

    const kayitIds = [
      ...new Set(satirlar.map((r) => r.kayit_id).filter((x) => !!x)),
    ] as string[];
    if (kayitIds.length === 0) return m;

    // Parent hem ramazan_kayitlari hem taahhut_kayitlari olabilir
    const [ram, taa] = await Promise.all([
      sb
        .from("ramazan_kayitlari")
        .select("id, personel, personeladi")
        .in("id", kayitIds),
      sb
        .from("taahhut_kayitlari")
        .select("id, personel")
        .in("id", kayitIds),
    ]);

    const parentKey = new Map<string, string>();
    for (const k of ram.data ?? []) {
      const key = normalize(k.personeladi ?? k.personel);
      if (key) parentKey.set(k.id as string, key);
    }
    for (const k of taa.data ?? []) {
      const key = normalize(k.personel);
      if (key) parentKey.set(k.id as string, key);
    }

    for (const r of satirlar) {
      const key = parentKey.get(r.kayit_id as string);
      if (!key) continue;
      m.set(key, (m.get(key) ?? 0) + Number(r.tutar ?? 0));
    }
  } catch (e) {
    console.error("[tahsilat] ramazan_tahsilat alt dalı:", e);
  }

  return m;
}

async function bildirimGonder(
  sb: SupabaseClient,
  targetUid: string,
  baslik: string,
  icerik: string,
  rota: string,
  gonderici: string,
): Promise<void> {
  const { error } = await sb.rpc("bildirim_gonder", {
    target_uid: targetUid,
    baslik,
    icerik,
    rota,
    gonderici,
  });
  if (error) console.error("[bildirim_gonder] hata:", error.message);
}

/// Tam ad ile aktif kullanıcı id (Türkçe yerel küçük harf eşlemesi).
async function kullaniciIdAdIle(sb: SupabaseClient, tamAd: string): Promise<string | null> {
  const hedef = normalize(tamAd);
  const { data, error } = await sb
    .from("kullanicilar")
    .select("id, adsoyad")
    .eq("aktif", true);
  if (error) {
    console.error("[kullaniciIdAdIle]", error.message);
    return null;
  }
  const bul = (data ?? []).find((r) => normalize(r.adsoyad) === hedef);
  return bul ? (bul.id as string) : null;
}

/** TR takvim "26 Nisan" (yıl yok — push kısa) */
function trGunAyKisa(d: Date): string {
  return `${d.getUTCDate()} ${AYLAR[d.getUTCMonth() + 1]}`;
}

const _YOKLAMA_DEVRELER = ["5.Devre", "6.Devre", "7.Devre", "8.Devre"];
const _YOKLAMA_UYARI_ADLAR = ["Mehmet Taha Keskin", "Ahmetali Emre Şahin"];

/**
 * Her devre için talebe sayısı ile yoklama satırı sayısını karşılaştırır.
 * Eksik varsa yalnızca atanmış iki kullanıcıya uyarı gönderilir.
 */
async function yoklamaUyari(sb: SupabaseClient): Promise<number> {
  const bugun = trNow();
  const gunStr = ymd(bugun);

  const eksikDevreler: string[] = [];
  for (const devre of _YOKLAMA_DEVRELER) {
    const { count: talebeSayi, error: te } = await sb
      .from("talebeler")
      .select("id", { count: "exact", head: true })
      .eq("devre", devre);
    if (te) {
      console.error("[yoklamaUyari] talebeler:", te.message);
      continue;
    }
    const ts = talebeSayi ?? 0;
    if (ts <= 0) continue;

    const { count: yokSayi, error: ye } = await sb
      .from("yoklama_namazlar")
      .select("id", { count: "exact", head: true })
      .eq("devre", devre)
      .eq("gun", gunStr);
    if (ye) {
      console.error("[yoklamaUyari] yoklama_namazlar:", ye.message);
      continue;
    }
    const ys = yokSayi ?? 0;
    if (ys < ts) eksikDevreler.push(devre);
  }

  if (eksikDevreler.length === 0) return 0;

  const uidler = new Set<string>();
  for (const ad of _YOKLAMA_UYARI_ADLAR) {
    const uid = await kullaniciIdAdIle(sb, ad);
    if (uid) uidler.add(uid);
  }
  if (uidler.size === 0) {
    console.error("[yoklamaUyari] hedef kullanıcı uid çözülemedi");
    return 0;
  }

  const ozet = eksikDevreler.join(", ");
  const govde =
    `${trGunAyKisa(bugun)} tarihli namaz yoklaması henüz tamamlanmadı ` +
    `(eksik devre: ${ozet}).`;

  let sayac = 0;
  for (const uid of uidler) {
    await bildirimGonder(
      sb,
      uid,
      "Namaz Yoklaması Uyarısı",
      govde,
      "/talebe/yoklama",
      "yoklama_uyari",
    );
    sayac++;
  }
  return sayac;
}

/**
 * Bu haftanın Pazar günü için role=evli nöbet satırı varsa:
 * - nöbetçi(ler)e "Nöbet Hatırlatma"
 * - diğer tüm aktif kullanıcılara "Pazar Nöbeti Bildirimi"
 * Evli nöbet yoksa hiç bildirim göndermez.
 */
async function nobetPazarHaftaBasi(sb: SupabaseClient): Promise<number> {
  const bugun = trNow();
  const y = bugun.getUTCFullYear();
  const m = bugun.getUTCMonth();
  const d = bugun.getUTCDate();
  const pazar = new Date(Date.UTC(y, m, d + 6));
  const pazarStr = ymd(pazar);

  const { data: rows, error } = await sb
    .from("nobet_index")
    .select("person, date, role")
    .eq("role", "evli");
  if (error) throw error;

  const buPazar = (rows ?? []).filter((r) => {
    const ds = (r.date ?? "").toString();
    return ds.substring(0, 10) === pazarStr;
  });

  if (buPazar.length === 0) return 0;

  const isimler = [
    ...new Set(
      buPazar.map((r) => (r.person ?? "").toString().trim()).filter((x) => x.length > 0),
    ),
  ];
  const gunKisa = trGunAyKisa(pazar);

  const personeller = await aktifPersoneller(sb);
  const nobetciUids = new Set<string>();
  for (const ad of isimler) {
    const p = personeller.find((x) => x.key === normalize(ad));
    if (p) {
      nobetciUids.add(p.id);
      continue;
    }
    const uidFallback = await kullaniciIdAdIle(sb, ad);
    if (uidFallback) nobetciUids.add(uidFallback);
  }

  const digerMetin =
    isimler.length === 1
      ? `${gunKisa} Pazar günü ${isimler[0]} nöbetçidir.`
      : `${gunKisa} Pazar günü ${isimler.join(" ve ")} nöbetçidir.`;

  const nobetciAdAnahtarlari = new Set(isimler.map((ad) => normalize(ad)));

  let sayac = 0;

  for (const uid of nobetciUids) {
    await bildirimGonder(
      sb,
      uid,
      "Nöbet Hatırlatma",
      `${gunKisa} Pazar günü nöbetiniz var.`,
      "/personel/nobet",
      "nobet_pazar",
    );
    sayac++;
  }

  for (const p of personeller) {
    if (nobetciUids.has(p.id)) continue;
    if (nobetciAdAnahtarlari.has(p.key)) continue;
    await bildirimGonder(
      sb,
      p.id,
      "Pazar Nöbeti Bildirimi",
      digerMetin,
      "/personel/nobet",
      "nobet_pazar",
    );
    sayac++;
  }

  return sayac;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler'lar
// ─────────────────────────────────────────────────────────────────────────────

async function alacakSabah(sb: SupabaseClient): Promise<number> {
  const [personeller, tahMap, tslMap] = await Promise.all([
    aktifPersoneller(sb),
    tahakkukToplamlari(sb),
    tahsilatToplamlari(sb),
  ]);

  let sayac = 0;
  for (const p of personeller) {
    const tah = tahMap.get(p.key) ?? 0;
    const tsl = tslMap.get(p.key) ?? 0;
    const kalan = tah - tsl;
    if (kalan > 0.5) {
      await bildirimGonder(
        sb,
        p.id,
        "Alacak Hatırlatması",
        `Bugün tahsilat yapabilirsin - Kalan Alacak: ${lira(kalan)}`,
        "/personel/alacak/analiz",
        "alacak_sabah",
      );
      sayac++;
    }
  }
  return sayac;
}

async function alacakAksam(sb: SupabaseClient): Promise<number> {
  const bugun = trNow();
  const bas = new Date(Date.UTC(bugun.getUTCFullYear(), bugun.getUTCMonth(), bugun.getUTCDate()));
  const bit = new Date(bas.getTime() + 24 * 3600 * 1000);

  const [personeller, tahMap, donemMap] = await Promise.all([
    aktifPersoneller(sb),
    tahakkukToplamlari(sb),
    tahsilatToplamlari(sb, bas, bit),
  ]);

  let sayac = 0;
  for (const p of personeller) {
    const donemTsl = donemMap.get(p.key) ?? 0;
    if (donemTsl > 0.5) {
      const tah = tahMap.get(p.key) ?? 0;
      const oranToplam = tah > 0 ? (donemTsl / tah) * 100 : 0;
      await bildirimGonder(
        sb,
        p.id,
        "Bugünkü Tahsilatın",
        `Bugün ${lira(donemTsl)} tahsilat yaptın (toplam alacağın %${oranToplam.toFixed(1)}'i)`,
        "/personel/alacak/analiz",
        "alacak_aksam",
      );
      sayac++;
    }
  }
  return sayac;
}

async function alacakHaftalik(sb: SupabaseClient): Promise<number> {
  const bugun = trNow();
  const weekday = bugun.getUTCDay() === 0 ? 7 : bugun.getUTCDay(); // Pzt=1..Paz=7
  const gecenPzt = new Date(bugun);
  gecenPzt.setUTCDate(bugun.getUTCDate() - (weekday - 1) - 7);
  gecenPzt.setUTCHours(0, 0, 0, 0);
  const gecenPaz = new Date(gecenPzt);
  gecenPaz.setUTCDate(gecenPzt.getUTCDate() + 6);
  const bit = new Date(gecenPaz.getTime() + 24 * 3600 * 1000);

  const [personeller, tahMap, donemMap] = await Promise.all([
    aktifPersoneller(sb),
    tahakkukToplamlari(sb),
    tahsilatToplamlari(sb, gecenPzt, bit),
  ]);

  let sayac = 0;
  for (const p of personeller) {
    const tah = tahMap.get(p.key) ?? 0;
    if (tah <= 0) continue;
    const donemTsl = donemMap.get(p.key) ?? 0;
    const oranToplam = (donemTsl / tah) * 100;
    const iyi = oranToplam >= 50;
    const mesaj = iyi
      ? `Geçen hafta ${lira(donemTsl)} tahsilat yaptın (toplam alacağın %${oranToplam.toFixed(1)}'i). Emeğine sağlık!`
      : `Geçen hafta ${lira(donemTsl)} tahsilat yapıldı (toplam alacağın %${oranToplam.toFixed(1)}'i). Bu hafta daha fazla gayret bekliyoruz.`;
    await bildirimGonder(sb, p.id, "Haftalık Tahsilat Özeti", mesaj, "/personel/alacak/analiz", "alacak_haftalik");
    sayac++;
  }
  return sayac;
}

async function alacakAylik(sb: SupabaseClient): Promise<number> {
  const bugun = trNow();
  const gecenAy = bugun.getUTCMonth() === 0 ? 12 : bugun.getUTCMonth();
  const gecenYil = bugun.getUTCMonth() === 0 ? bugun.getUTCFullYear() - 1 : bugun.getUTCFullYear();
  const bas = new Date(Date.UTC(gecenYil, gecenAy - 1, 1));
  const bit = new Date(Date.UTC(gecenYil, gecenAy, 1));
  const ayAdi = AYLAR[gecenAy];

  const [personeller, tahMap, donemMap] = await Promise.all([
    aktifPersoneller(sb),
    tahakkukToplamlari(sb),
    tahsilatToplamlari(sb, bas, bit),
  ]);

  let sayac = 0;
  for (const p of personeller) {
    const tah = tahMap.get(p.key) ?? 0;
    if (tah <= 0) continue;
    const donemTsl = donemMap.get(p.key) ?? 0;
    const oranToplam = (donemTsl / tah) * 100;
    const iyi = oranToplam >= 50;
    const mesaj = iyi
      ? `${ayAdi} ayında ${lira(donemTsl)} tahsilat yapıldı (toplam alacağın %${oranToplam.toFixed(1)}'i). Teşekkür ederiz!`
      : `${ayAdi} ayında ${lira(donemTsl)} tahsilat yapıldı (toplam alacağın %${oranToplam.toFixed(1)}'i). Bu ay tahsilat gayretlerini artırmanı bekliyoruz.`;
    await bildirimGonder(sb, p.id, "Aylık Tahsilat Özeti", mesaj, "/personel/alacak/analiz", "alacak_aylik");
    sayac++;
  }
  return sayac;
}

async function kurbanIlerleme(sb: SupabaseClient, force = false): Promise<number> {
  const bugun = trNow();
  const sonGun = new Date(Date.UTC(2026, 4, 26)); // 26 Mayıs 2026
  if (bugun > sonGun) return 0;

  const kalanGun = Math.ceil((sonGun.getTime() - bugun.getTime()) / (24 * 3600 * 1000));
  const aralik = kalanGun > 45 ? 3 : kalanGun > 21 ? 2 : 1;
  const yilBasi = new Date(Date.UTC(bugun.getUTCFullYear(), 0, 1));
  const gunNo = Math.floor((bugun.getTime() - yilBasi.getTime()) / (24 * 3600 * 1000));
  // force=true: throttle bypass (manuel test için)
  if (!force && gunNo % aralik !== 0) return 0;

  const { data: hedefler } = await sb
    .from("kurban_2026_hedefler")
    .select("id, personel_uid, bagis_hedef, tebrik_gonderildi")
    .eq("yil", 2026);

  let sayac = 0;
  for (const h of hedefler ?? []) {
    const uid = h.personel_uid as string;
    const hedef = Number(h.bagis_hedef ?? 0);
    if (hedef <= 0) continue;

    const { count } = await sb
      .from("kurban_2026_bagis_hisse")
      .select("id", { count: "exact", head: true })
      .eq("yil", 2026)
      .eq("created_by_uid", uid);
    const mevcut = count ?? 0;
    const kalan = hedef - mevcut;
    const ilerleme = (mevcut / hedef) * 100;

    // Hedefe ulaşmış veya geçmiş: tebrik daha önce gönderilmediyse bir kez gönder, sonra atla
    if (ilerleme >= 100) {
      if (h.tebrik_gonderildi === true) continue;
      await bildirimGonder(
        sb, uid,
        "Tebrikler! Hedefinize ulaştınız",
        `Bağış hisse hedefinizi tamamladınız! Kurbana ${kalanGun} gün kaldı. Emeğinize sağlık!`,
        "/kurban",
        "kurban_ilerleme",
      );
      await sb.from("kurban_2026_hedefler").update({ tebrik_gonderildi: true }).eq("id", h.id);
      sayac++;
      continue;
    }

    let baslik: string;
    let govde: string;
    if (ilerleme >= 67) {
      baslik = "Maşallah, hedefinize yaklaşıyorsunuz!";
      govde = `Bağış hisse hedefinize ${kalan} kayıt kaldı. Kurbana ${kalanGun} gün var, gayretiniz güzel!`;
    } else if (ilerleme >= 33) {
      baslik = "Gayretiniz için teşekkürler!";
      govde = `Hedefinize ${kalan} kayıt kaldı. Kurbana ${kalanGun} gün var, devam edin!`;
    } else if (kalanGun <= 7) {
      baslik = `Son ${kalanGun} gün — Acil!`;
      govde = `Bağış hisse hedefinize ${kalan} kayıt kaldı. Lütfen gayretlerinizi artırın, zaman daralıyor!`;
    } else if (kalanGun <= 14) {
      baslik = `Kurbana ${kalanGun} gün kaldı`;
      govde = `Hedefinize ${kalan} kayıt kaldı. Zaman daralıyor, gayretlerinizi bekliyoruz.`;
    } else if (kalanGun <= 30) {
      baslik = "Kurban bağış hisse hatırlatması";
      govde = `Kurbana ${kalanGun} gün kaldı. Hedefinize ${kalan} kayıt kaldı, gayretlerinizi artırmanızı bekliyoruz.`;
    } else {
      baslik = "Kurban bağış hisse hatırlatması";
      govde = `Kurbana ${kalanGun} gün var. Bağış hisse hedefinize ulaşmak için ${kalan} kayıt kaldı.`;
    }

    await bildirimGonder(sb, uid, baslik, govde, "/kurban", "kurban_ilerleme");
    sayac++;
  }
  return sayac;
}

// ─────────────────────────────────────────────────────────────────────────────
// Takrir günlük bildirim (mobil TakrirScreen ile uyumlu puan: verdi=1, yarım=0,5, diğer=0)
// ─────────────────────────────────────────────────────────────────────────────

const TAKRIR_ESIK_YUZDE = 75;
const TAKRIR_DEVRELER = ["6.Devre", "7.Devre", "8.Devre"];
const TAKRIR_ROTA = "/talebe/ders";
const TAKRIR_RAPOR_MAX_SATIR = 40;

function bekle(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function durumdanPuan(d: unknown): number {
  const x = (d ?? "").toString().trim();
  if (x === "verdi") return 1;
  if (x === "yarim") return 0.5;
  return 0;
}

/** İsim listesi: verdi/yarım dışı kalanlar (veremedi, henüz verilmedi, belirsiz). */
function takipIsmiIcinUygunDurum(d: unknown): boolean {
  const x = (d ?? "").toString().trim();
  return x !== "verdi" && x !== "yarim";
}

function takrirSatirAnahtar(devre: string, kitap: string, dersAdi: string): string {
  return `${devre}|||${kitap}|||${dersAdi}`;
}

/** Kayıt zamanını İstanbul takvim günü YYYY-MM-DD yapar (gün filtresi için). */
function isoTarihIstanbulGun(iso: unknown): string {
  if (iso == null) return "";
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}

/** Bugünün İstanbul tarihi (rapor günü — akşam bildirimi). */
function istanbulBugunYmd(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}

/** Dünün İstanbul tarihi (sabah "dün" raporu). */
function istanbulDunYmd(): string {
  return new Date(Date.now() - 86400000).toLocaleDateString("en-CA", {
    timeZone: "Europe/Istanbul",
  });
}

interface TakrirOzetSatir {
  devre: string;
  kitap: string;
  dersAdi: string;
  yuzde: number;
  takipIsimleri: string[];
}

/** Test: secret yok → yalnızca test adı. TAKRIR_BILDIRIM_TUM_PERSONEL=1 → tüm aktif kullanıcılar. */
async function takrirHedefUidler(sb: SupabaseClient): Promise<string[]> {
  const tumPersonel = Deno.env.get("TAKRIR_BILDIRIM_TUM_PERSONEL") === "1";
  if (tumPersonel) {
    const p = await aktifPersoneller(sb);
    return p.map((x) => x.id);
  }
  const ad = Deno.env.get("TAKRIR_BILDIRIM_TEST_ADSOYAD") ?? "Samet Çakır";
  const uid = await kullaniciIdAdIle(sb, ad);
  if (!uid) console.error("[takrir] Test modu: kullanıcı bulunamadı:", ad);
  return uid ? [uid] : [];
}

async function takrirGunluk(sb: SupabaseClient, sabahMi: boolean): Promise<number> {
  const uidler = await takrirHedefUidler(sb);
  if (uidler.length === 0) return 0;

  /** Akşam: bugün takviminde güncellenen satırlar; sabah: dün takviminde güncellenen satırlar. */
  const raporGunYmd = sabahMi ? istanbulDunYmd() : istanbulBugunYmd();

  const { data: talebeRows, error: te } = await sb
    .from("talebeler")
    .select("id, talebe_adi, devre")
    .in("devre", TAKRIR_DEVRELER);
  if (te) throw te;

  const talebeByDevre = new Map<string, Array<{ id: string; ad: string }>>();
  for (const r of talebeRows ?? []) {
    const devre = (r.devre ?? "").toString().trim();
    const id = r.id?.toString() ?? "";
    const ad = (r.talebe_adi ?? "").toString().trim();
    if (!devre || !id) continue;
    const arr = talebeByDevre.get(devre) ?? [];
    arr.push({ id, ad });
    talebeByDevre.set(devre, arr);
  }

  const { data: kayitRows, error: ke } = await sb
    .from("ders_kayitlari")
    .select("devre, kitap, ders_adi, talebe_uid, ders_verme_durumu, updated_at")
    .in("devre", TAKRIR_DEVRELER)
    .limit(50000);
  if (ke) throw ke;

  /** Rapor gününde (İstanbul) en az bir güncellenmiş kaydı olan kitap/ders anahtarları — yalnız bunlar bildirilir. */
  const raporGunundaIslemGorenAnahtarlar = new Set<string>();
  for (const r of kayitRows ?? []) {
    const gun = isoTarihIstanbulGun(r.updated_at);
    if (gun !== raporGunYmd) continue;
    const devre = (r.devre ?? "").toString().trim();
    const kitap = (r.kitap ?? "").toString().trim();
    const dersAdi = (r.ders_adi ?? "").toString().trim();
    if (!devre || !kitap || !dersAdi) continue;
    raporGunundaIslemGorenAnahtarlar.add(takrirSatirAnahtar(devre, kitap, dersAdi));
  }

  if (raporGunundaIslemGorenAnahtarlar.size === 0) return 0;

  /** Yüzde hesabı: seçilen kitap/ders için o dersteki güncel tüm talebe kayıtları (tüm tarihlerden birleşik snapshot). */
  const kayitHarita = new Map<string, Map<string, string | null>>();
  for (const r of kayitRows ?? []) {
    const devre = (r.devre ?? "").toString().trim();
    const kitap = (r.kitap ?? "").toString().trim();
    const dersAdi = (r.ders_adi ?? "").toString().trim();
    const talebeUid = r.talebe_uid?.toString() ?? "";
    if (!devre || !kitap || !dersAdi || !talebeUid) continue;
    const kk = takrirSatirAnahtar(devre, kitap, dersAdi);
    if (!raporGunundaIslemGorenAnahtarlar.has(kk)) continue;
    if (!kayitHarita.has(kk)) kayitHarita.set(kk, new Map());
    kayitHarita.get(kk)!.set(talebeUid, r.ders_verme_durumu?.toString() ?? null);
  }

  const anahtarlar = new Map<string, { devre: string; kitap: string; dersAdi: string }>();
  for (const kk of raporGunundaIslemGorenAnahtarlar) {
    const parca = kk.split("|||");
    if (parca.length !== 3) continue;
    anahtarlar.set(kk, { devre: parca[0], kitap: parca[1], dersAdi: parca[2] });
  }

  const satirlar: TakrirOzetSatir[] = [];

  for (const { devre, kitap, dersAdi } of anahtarlar.values()) {
    const tList = talebeByDevre.get(devre) ?? [];
    const n = tList.length;
    if (n <= 0) continue;

    const kk = takrirSatirAnahtar(devre, kitap, dersAdi);
    const uidDurum = kayitHarita.get(kk);

    let puanTop = 0;
    const takipAdlari: string[] = [];
    for (const t of tList) {
      const dur = uidDurum?.get(t.id) ?? null;
      puanTop += durumdanPuan(dur);
      if (takipIsmiIcinUygunDurum(dur) && t.ad.length > 0) {
        takipAdlari.push(t.ad);
      }
    }
    takipAdlari.sort((a, b) => a.localeCompare(b, "tr"));

    const yuzde = Math.round((100 * puanTop) / n);
    satirlar.push({ devre, kitap, dersAdi, yuzde, takipIsimleri: takipAdlari });
  }

  satirlar.sort((a, b) => {
    const k = a.kitap.localeCompare(b.kitap, "tr");
    if (k !== 0) return k;
    return a.dersAdi.localeCompare(b.dersAdi, "tr");
  });

  if (satirlar.length === 0) return 0;

  let gonderilen = 0;

  const baslikRapor = sabahMi ? "Dün Takrir Raporu" : "Bugün Takrir Raporu";
  let govdeRapor = "";
  if (sabahMi) {
    const dusukVar = satirlar.some((s) => s.yuzde < TAKRIR_ESIK_YUZDE);
    if (dusukVar) {
      govdeRapor += "Dün bazı ders satırlarında takrir açısından dikkat gereken durumlar vardı.\n\n";
    }
  }

  const satirMetinleri = satirlar.slice(0, TAKRIR_RAPOR_MAX_SATIR).map((s) =>
    `${s.kitap} / ${s.dersAdi} = %${s.yuzde}`
  );
  govdeRapor += satirMetinleri.join("\n");
  if (satirlar.length > TAKRIR_RAPOR_MAX_SATIR) {
    govdeRapor += `\n… ve ${satirlar.length - TAKRIR_RAPOR_MAX_SATIR} satır daha`;
  }

  for (const uid of uidler) {
    await bildirimGonder(sb, uid, baslikRapor, govdeRapor, TAKRIR_ROTA, "takrir_gunluk");
    gonderilen++;
  }

  const kotu = satirlar.filter((s) => s.yuzde < TAKRIR_ESIK_YUZDE);

  if (kotu.length === 0) return gonderilen;

  if (kotu.length > 3) {
    const ozet = kotu.slice(0, 8).map((s) => `${s.kitap}/${s.dersAdi} (%${s.yuzde})`).join(", ");
    const govdeGenel =
      `${kotu.length} ders satırında takrir oranı %${TAKRIR_ESIK_YUZDE} altında: ${ozet}` +
      (kotu.length > 8 ? " …" : "") +
      "\nDetay ve talebe listesi için Takrir sayfasına bakınız.";
    for (const uid of uidler) {
      await bildirimGonder(
        sb,
        uid,
        "Takrir — Dikkat (özet)",
        govdeGenel,
        TAKRIR_ROTA,
        "takrir_gunluk",
      );
      gonderilen++;
    }
    return gonderilen;
  }

  for (let i = 0; i < kotu.length; i++) {
    const s = kotu[i];
    let govdeUyari = `Oran %${s.yuzde} (eşik %${TAKRIR_ESIK_YUZDE} altında).`;
    const isimler = s.takipIsimleri;
    if (isimler.length === 0) {
      govdeUyari += " Detay için Takrir sayfasına bakınız.";
    } else if (isimler.length > 5) {
      govdeUyari += ` Birden fazla talebe takipte (${isimler.length}) — Takrir sayfasından bakınız.`;
    } else {
      govdeUyari += ` Takip: ${isimler.join(", ")}.`;
    }

    for (const uid of uidler) {
      await bildirimGonder(
        sb,
        uid,
        `Takrir — Dikkat: ${s.kitap} / ${s.dersAdi}`,
        govdeUyari,
        TAKRIR_ROTA,
        "takrir_gunluk",
      );
      gonderilen++;
    }

    if (i < kotu.length - 1) {
      await bekle(60_000);
    }
  }

  return gonderilen;
}

async function takrirSabah(sb: SupabaseClient): Promise<number> {
  return takrirGunluk(sb, true);
}

async function takrirAksam(sb: SupabaseClient): Promise<number> {
  return takrirGunluk(sb, false);
}

/// pg_cron: x-cron-secret = BILDIRIM_CRON_SECRET. Manuel test: Authorization: Bearer SERVICE_ROLE_KEY (Edge secret).
function bildirimGunlukIstekYetkili(req: Request): boolean {
  const cronSecret = Deno.env.get("BILDIRIM_CRON_SECRET") ?? "";
  const incomingCron = req.headers.get("x-cron-secret") ?? "";
  const sr = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const auth = req.headers.get("Authorization") ?? "";
  const cronOk = cronSecret.length > 0 && incomingCron === cronSecret;
  const srOk = sr.length > 0 && auth === `Bearer ${sr}`;
  return cronOk || srOk;
}

Deno.serve(async (req) => {
  try {
    if (!bildirimGunlukIstekYetkili(req)) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const tip = url.searchParams.get("tip") ?? "";
    const force = url.searchParams.get("force") === "1" || url.searchParams.get("force") === "true";

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    let sonuc: number;
    switch (tip) {
      case "alacak-sabah":
        sonuc = await alacakSabah(sb);
        break;
      case "alacak-aksam":
        sonuc = await alacakAksam(sb);
        break;
      case "alacak-haftalik":
        sonuc = await alacakHaftalik(sb);
        break;
      case "alacak-aylik":
        sonuc = await alacakAylik(sb);
        break;
      case "kurban-ilerleme":
        sonuc = await kurbanIlerleme(sb, force);
        break;
      case "yoklama-uyari":
        sonuc = await yoklamaUyari(sb);
        break;
      case "nobet-pazar":
        sonuc = await nobetPazarHaftaBasi(sb);
        break;
      default:
        return new Response(JSON.stringify({ error: `geçersiz tip: '${tip}'` }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
    }

    return new Response(
      JSON.stringify({ ok: true, tip, gonderilen: sonuc }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});
