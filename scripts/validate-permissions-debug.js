// Debug script: Sayfa manifesti ile kullanıcı yetkilerini doğrulama
// Bu script admin/kullanici-ekle.html sayfasında konsola çalıştırılabilir

async function validatePermissions() {
  console.log('🔍 Yetki doğrulama başlatılıyor...');
  
  const supabase = await getSupabase();
  if (!supabase) {
    console.error('❌ Supabase bağlantısı yok');
    return;
  }
  
  // 1. Sayfa manifestini çek
  console.log('\n📋 1. Sayfa manifesti çekiliyor...');
  const { data: manifestData, error: manifestError } = await supabase
    .from('sayfa_manifesti')
    .select('id, order, title, pages')
    .order('order', { ascending: true });
  
  if (manifestError) {
    console.error('❌ Manifest çekilemedi:', manifestError);
    return;
  }
  
  console.log(`✅ Manifest yüklendi: ${manifestData.length} panel`);
  
  // Tüm sayfa key'lerini topla
  const allPageKeys = new Set();
  manifestData.forEach(panel => {
    const pages = Array.isArray(panel.pages) ? panel.pages : [];
    pages.forEach(page => {
      const pageKey = page.key || `${panel.id}: ${page.title}`;
      allPageKeys.add(pageKey);
    });
  });
  
  console.log(`📄 Toplam ${allPageKeys.size} sayfa bulundu`);
  console.log('Sayfa key\'leri:', Array.from(allPageKeys));
  
  // 2. Kullanıcıları çek
  console.log('\n👥 2. Kullanıcılar çekiliyor...');
  const { data: usersData, error: usersError } = await supabase
    .from('kullanicilar')
    .select('id, adsoyad, email, yetkiler')
    .eq('aktif', true);
  
  if (usersError) {
    console.error('❌ Kullanıcılar çekilemedi:', usersError);
    return;
  }
  
  console.log(`✅ ${usersData.length} aktif kullanıcı bulundu`);
  
  // 3. Her kullanıcının yetkilerini kontrol et
  console.log('\n🔍 3. Yetki kontrolü yapılıyor...');
  const issues = [];
  
  usersData.forEach(user => {
    const yetkiler = Array.isArray(user.yetkiler) ? user.yetkiler : [];
    const invalidKeys = [];
    const validKeys = [];
    
    yetkiler.forEach(yetki => {
      const yetkiStr = String(yetki || '').trim();
      if (!yetkiStr) return;
      
      if (allPageKeys.has(yetkiStr)) {
        validKeys.push(yetkiStr);
      } else {
        invalidKeys.push(yetkiStr);
      }
    });
    
    if (invalidKeys.length > 0) {
      issues.push({
        user: user.adsoyad || user.email,
        userId: user.id,
        invalidKeys: invalidKeys,
        validKeys: validKeys
      });
    }
  });
  
  // 4. Sonuçları göster
  console.log('\n📊 SONUÇLAR:');
  if (issues.length === 0) {
    console.log('✅ Tüm kullanıcı yetkileri geçerli!');
  } else {
    console.log(`⚠️ ${issues.length} kullanıcıda geçersiz yetki bulundu:\n`);
    issues.forEach(issue => {
      console.log(`👤 ${issue.user} (${issue.userId}):`);
      console.log(`   ❌ Geçersiz yetkiler (${issue.invalidKeys.length}):`, issue.invalidKeys);
      console.log(`   ✅ Geçerli yetkiler (${issue.validKeys.length}):`, issue.validKeys);
      console.log('');
    });
  }
  
  // 5. Özet istatistikler
  console.log('\n📈 ÖZET:');
  console.log(`   Toplam panel: ${manifestData.length}`);
  console.log(`   Toplam sayfa: ${allPageKeys.size}`);
  console.log(`   Aktif kullanıcı: ${usersData.length}`);
  console.log(`   Sorunlu kullanıcı: ${issues.length}`);
  
  return {
    manifest: manifestData,
    users: usersData,
    allPageKeys: Array.from(allPageKeys),
    issues: issues
  };
}

// Kullanım: validatePermissions() fonksiyonunu konsolda çalıştır

