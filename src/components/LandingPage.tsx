
"use client";

import Link from 'next/link';
import '../app/landing.css';

export default function LandingPage() {
  return (
    <div className="m-container">
      {/* Navbar */}
      <nav className="m-nav">
        <div className="m-logo">
          Periodya<span>.</span>
        </div>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <div className="m-nav-links" style={{ display: 'flex', gap: '20px' }}>
            <a href="#features" style={{ textDecoration: 'none', color: 'var(--m-text-muted)', fontSize: '15px' }}>Özellikler</a>
            <a href="#pricing" style={{ textDecoration: 'none', color: 'var(--m-text-muted)', fontSize: '15px' }}>Fiyatlandırma</a>
            <a href="#security" style={{ textDecoration: 'none', color: 'var(--m-text-muted)', fontSize: '15px' }}>Güvenlik</a>
          </div>
          <Link href="/login" className="m-btn m-btn-outline" style={{ border: 'none' }}>Giriş Yap</Link>
          <Link href="/register" className="m-btn m-btn-primary">Başlayın</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="m-hero">
        <h1>Birlikte çalışma şekliniz için<br />esnek bir platform</h1>
        <p>E-Fatura, stok ve finansal süreçlerinizi tek bir platformda toplayın. İşletmenizin tüm ihtiyaçları için özelleştirilebilir iş akışları oluşturun.</p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/register" className="m-btn m-btn-primary" style={{ padding: '16px 48px', fontSize: '18px' }}>Hemen Ücretsiz Başlayın ➔</Link>
        </div>
        <div style={{ marginTop: '20px', color: 'var(--m-text-muted)', fontSize: '14px' }}>Kredi kartı gerekmez • Sınırsız deneme</div>

        <div className="m-hero-visual">
          <img src="/monday_hero.png" alt="Periodya Platform" className="m-hero-img" />
        </div>
      </header>

      {/* Social Proof */}
      <section className="m-brands">
        <h2>Pek çok entegrasyon ve partner ile tam uyumlu</h2>
        <div className="m-brands-list">
          <div style={{ fontWeight: 900, fontSize: '20px' }}>GELİR İDARESİ</div>
          <div style={{ fontWeight: 900, fontSize: '20px' }}>NILVERA</div>
          <div style={{ fontWeight: 900, fontSize: '20px' }}>IYZICO</div>
          <div style={{ fontWeight: 900, fontSize: '20px' }}>TRENDYOL</div>
          <div style={{ fontWeight: 900, fontSize: '20px' }}>HEPSİBURADA</div>
        </div>
      </section>

      {/* Features Storytelling */}
      <section id="features" className="m-feature">
        <div className="m-feature-text">
          <div style={{ color: 'var(--m-blue)', fontWeight: '700', marginBottom: '10px' }}>OTOMASYON</div>
          <h2>Evrak işlerini değil, işinizi yönetin</h2>
          <p>E-Fatura ve E-Arşiv süreçlerinizi saniyeler içinde tamamlayın. GİB entegrasyonu sayesinde hata yapma riskini ortadan kaldırın.</p>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
            <li style={{ marginBottom: '10px' }}>✅ Tek tıkla toplu fatura kesimi</li>
            <li style={{ marginBottom: '10px' }}>✅ Otomatik cari bakiye güncellemeleri</li>
            <li style={{ marginBottom: '10px' }}>✅ WhatsApp üzerinden fatura gönderimi</li>
          </ul>
        </div>
        <div className="m-feature-visual">
          <img src="/monday_invoices.png" alt="Automation" />
        </div>
      </section >

      <section className="m-feature">
        <div className="m-feature-text">
          <div style={{ color: 'var(--m-pink)', fontWeight: '700', marginBottom: '10px' }}>STOK & ENVANTER</div>
          <h2>Nerede olursanız olun stoklarınız kontrol altında</h2>
          <p>Farklı şubelerinizdeki stok durumunu anlık takip edin. Kritik stok uyarıları ile ürününüzün bitmesini beklemeyin.</p>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
            <li style={{ marginBottom: '10px' }}>✅ Şubeler arası stok transferi</li>
            <li style={{ marginBottom: '10px' }}>✅ Barkod okuyucu desteği</li>
            <li style={{ marginBottom: '10px' }}>✅ Karlılık analiz raporları</li>
          </ul>
        </div>
        <div className="m-feature-visual">
          <img src="/monday_inventory.png" alt="Inventory" />
        </div>
      </section >

      {/* Pricing Section (NEW) */}
      < section id="pricing" style={{ padding: '100px 20px', textAlign: 'center', background: '#f8fafc' }
      }>
        <h2 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '16px' }}>Her boyutta işletme için uygun</h2>
        <p style={{ color: 'var(--m-text-muted)', fontSize: '18px', marginBottom: '60px' }}>Gizli ücret yok, karmaşık sözleşmeler yok. İhtiyacınız olanı seçin.</p>

        <div className="pricing-grid">
          <div className="pricing-card">
            <h3>Starter</h3>
            <div className="pricing-price">₺499<span>/ay</span></div>
            <p style={{ color: 'var(--m-text-muted)', fontSize: '14px' }}>Yeni başlayan küçük işletmeler için ideal.</p>
            <ul className="pricing-features">
              <li>Ayda 100 Fatura</li>
              <li>1 Kullanıcı</li>
              <li>1 Şube</li>
              <li>E-Fatura Entegrasyonu</li>
              <li>Temel Raporlama</li>
            </ul>
            <Link href="/register" className="m-btn m-btn-outline" style={{ border: '1px solid var(--m-blue)', color: 'var(--m-blue)' }}>Hemen Başlayın</Link>
          </div>

          <div className="pricing-card popular">
            <h3>Business</h3>
            <div className="pricing-price">₺999<span>/ay</span></div>
            <p style={{ color: 'var(--m-text-muted)', fontSize: '14px' }}>Büyümekte olan, profesyonel ekipler için.</p>
            <ul className="pricing-features">
              <li>Ayda 1000 Fatura</li>
              <li>5 Kullanıcı</li>
              <li>Sınırsız Şube</li>
              <li>Gelişmiş Stok Yönetimi</li>
              <li>WhatsApp Bildirimleri</li>
              <li>Banka Entegrasyonları</li>
            </ul>
            <Link href="/register" className="m-btn m-btn-primary">Ücretsiz Deneyin</Link>
          </div>

          <div className="pricing-card">
            <h3>Enterprise</h3>
            <div className="pricing-price">₺2499<span>/ay</span></div>
            <p style={{ color: 'var(--m-text-muted)', fontSize: '14px' }}>Büyük ölçekli operasyonlar ve holdingler için.</p>
            <ul className="pricing-features">
              <li>Sınırsız Fatura</li>
              <li>Sınırsız Kullanıcı</li>
              <li>Proaktif Upsell Radarı</li>
              <li>Özel Hesap Yöneticisi</li>
              <li>API Erişimi</li>
              <li>Özel SLA Desteği</li>
            </ul>
            <Link href="/register" className="m-btn m-btn-outline">İletişime Geçin</Link>
          </div>
        </div>

        <div style={{ marginTop: '40px' }}>
          <img src="/landing_pricing.png" alt="Pricing Calculator" style={{ maxWidth: '600px', width: '100%', borderRadius: '12px' }} />
        </div>
      </section >

      {/* Security & Trust (NEW) */}
      < section id="security" className="m-feature" >
        <div className="m-feature-text">
          <div style={{ color: 'var(--m-green)', fontWeight: '700', marginBottom: '10px' }}>GÜVENLİK & UYUM</div>
          <h2>Verileriniz banka düzeyinde güvenlikte</h2>
          <p>Periodya, verilerinizi 256-bit AES şifreleme ile korur. Tüm süreçlerimiz GİB ve KVKK mevzuatlarına %100 uyumludur.</p>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
            <li style={{ marginBottom: '10px' }}>🔒 Günlük Bulut Yedekleme</li>
            <li style={{ marginBottom: '10px' }}>🛡️ İki Faktörlü Doğrulama (2FA)</li>
            <li style={{ marginBottom: '10px' }}>📜 KVKK ve GDPR Uyumluluğu</li>
          </ul>
        </div>
        <div className="m-feature-visual">
          <img src="/landing_security.png" alt="Security" />
        </div>
      </section >

      {/* FAQ (NEW) */}
      < section className="faq-section" >
        <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '40px' }}>Sıkça Sorulan Sorular</h2>
        <div className="faq-item">
          <h4>Periodya'yı denemek ücretli mi?</h4>
          <p>Hayır, Periodya'yı kredi kartı gerekmeden sınırsız tüm özellikleri ile test edebilirsiniz. Memnun kaldığınızda planınızı güncelleyebilirsiniz.</p>
        </div>
        <div className="faq-item">
          <h4>Mevcut verilerimi aktarabilir miyim?</h4>
          <p>Kesinlikle. Excel veya diğer muhasebe yazılımlarından dışa aktardığınız stok ve cari listelerinizi saniyeler içinde Periodya'ya içe aktarabilirsiniz.</p>
        </div>
        <div className="faq-item">
          <h4>E-Fatura geçiş süreci ne kadar sürer?</h4>
          <p>Aktivasyon işlemleriniz tamamlandıktan sonra aynı gün içinde ilk e-faturanızı kesmeye başlayabilirsiniz. Uzman ekibimiz size ücretsiz destek verecektir.</p>
        </div>
      </section >

      {/* Final CTA */}
      < section style={{ background: 'var(--m-blue)', color: '#fff', padding: '100px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '24px' }}>Hazırsanız, işinizi birlikte büyütelim</h2>
        <p style={{ fontSize: '20px', opacity: 0.9, marginBottom: '40px' }}>14 günlük ücretsiz deneme sürenizi başlatın, farkı bugün hissedin.</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/register" className="m-btn" style={{ background: '#fff', color: 'var(--m-blue)', padding: '16px 48px' }}>Ücretsiz Başlayın</Link>
          <Link href="/login" className="m-btn" style={{ border: '1px solid #fff', color: '#fff', padding: '16px 48px' }}>Giriş Yap</Link>
        </div>
      </section >

      {/* Footer */}
      < footer className="m-footer" >
        <div className="m-footer-grid">
          <div>
            <div className="m-logo" style={{ color: '#fff', marginBottom: '20px' }}>Periodya<span>.</span></div>
            <p>Küçük ve orta ölçekli işletmeler için dünyanın en verimli finansal yönetim platformu.</p>
          </div>
          <div>
            <h4>Ürün</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span>E-Fatura</span>
              <span>Stok Takibi</span>
              <span>CRM</span>
              <span>Raporlama</span>
            </div>
          </div>
          <div>
            <h4>Kurumsal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span>Hakkımızda</span>
              <span>Gizlilik Politikası</span>
              <span>Mevzuat Uyumu</span>
              <span>İletişim</span>
            </div>
          </div>
          <div>
            <h4>Destek</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span>Yardım Merkezi</span>
              <span>Eğitim Videoları</span>
              <span>API Dökümantasyonu</span>
              <span>Canlı Destek</span>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '80px', paddingTop: '40px', fontSize: '13px', textAlign: 'center', opacity: 0.6 }}>
          © 2026 Periodya Teknolojileri A.Ş. Tüm hakları saklıdır.
        </div>
      </footer >
    </div >
  );
}
