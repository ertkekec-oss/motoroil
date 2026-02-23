import React from 'react';

/**
 * SeoContent Component
 * 
 * Bu bileşen, kullanıcı arayüzünü (UI) bozmadan Google Botları ve ekran okuyucular için
 * zengin içerik sağlar. "Visually hidden but crawlable" tekniği kullanılmıştır.
 */
const SeoContent: React.FC = () => {
    return (
        <section
            aria-label="Periodya ERP Çözümleri ve Özellikleri"
            style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: '0',
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                borderWidth: '0',
            }}
        >
            <h1>Türkiye’nin En Kapsamlı ERP Yazılımı: Periodya Enterprise</h1>

            <p>
                Periodya, modern işletmelerin ihtiyaç duyduğu tüm dijital araçları tek bir platformda sunan yeni nesil bir <strong>ERP yazılımı</strong> çözümüdür.
                Gelişmiş <strong>POS Terminal</strong> özellikleri, gerçek zamanlı <strong>stok yönetimi</strong>, uçtan uca <strong>e-Fatura</strong> ve
                ön muhasebe entegrasyonu ile operasyonlarınızı hızlandırın. <strong>Saha satış yönetimi</strong> ve <strong>PDKS</strong> (Personel Devam Kontrol Sistemi)
                gibi kritik modüllerle işletmenizin her noktasını akıllıca kontrol edin. Kurumsal kaynaklarınızı (ERP) bulut tabanlı bir yapıda yöneterek
                donanım maliyetlerinden kurtulun ve verilerinize her yerden erişim sağlayın.
            </p>

            <h2>ERP Modülleri ve Kurumsal Çözümler</h2>

            <article>
                <h3>A) Satış ve Müşteri Yönetimi (CRM & POS)</h3>
                <p>
                    Satış süreçlerinizi <strong>POS Terminal</strong>, dinamik <strong>Satış Yönetimi</strong> ve <strong>Cari Hesaplar</strong> takibi ile optimize edin.
                    Perakende satış noktalarında hızlı işlem yetenekleri sunan POS sitemimiz, nakit ve kredi kartı ödemelerini anında işler.
                    Müşterilerinize hızlı <strong>Teklifler</strong> oluşturun, satış huninizi (sales funnel) yönetin ve <strong>Saha Satış Paneli</strong> ile
                    sıcak ve soğuk satış operasyonlarınızı tek merkezden idare edin. <strong>Canlı Saha Takibi</strong> özelliği, harita üzerinden
                    ekiplerinizin performansını anlık olarak izlemenizi sağlar.
                </p>
                <ul>
                    <li><a href="/cozumler/satis-yonetimi">Satış Yönetimi ve CRM Çözümleri</a></li>
                    <li><a href="/cozumler/saha-satis">Saha Satış Otomasyonu ve Rota Planlama</a></li>
                    <li><a href="/cozumler/pos-sistemi">Yeni Nesil Bulut POS Sistemleri</a></li>
                </ul>
            </article>

            <article>
                <h3>B) Finans, Muhasebe ve Kontrol Gözetimi</h3>
                <p>
                    <strong>Finansal Yönetim</strong> modülü ile banka hesaplarınızı, kasalarınızı ve çek/senet trafiğinizi kontrol altına alın.
                    <strong>Finansal Kontrol Kulesi</strong> sayesinde tüm şubelerinizin ve departmanlarınızın finansal sağlığını tek bir gösterge panelinden analiz edin.
                    <strong>Mali Müşavir</strong> modülü ile yasal raporlamalarınızı kolaylaştırın, <strong>Denetim Kayıtları</strong> (Audit Logs) ile
                    sistemdeki her hareketin izini sürün. e-Fatura, e-Arşiv ve e-İrsaliye süreçleri ile kağıtsız ofis konseptine geçiş yapın.
                </p>
                <ul>
                    <li><a href="/cozumler/finansal-yonetim">Kurumsal Finansal Yönetim</a></li>
                    <li><a href="/cozumler/e-fatura">e-Fatura ve Muhasebe Entegrasyonu</a></li>
                </ul>
            </article>

            <article>
                <h3>C) Akıllı Stok, Envanter ve Tedarik Zinciri Yönetimi</h3>
                <p>
                    <strong>Envanter & Depo</strong> yönetimi ile stok seviyelerinizi optimize ederek maliyetlerinizi düşürün.
                    Seri no, parti numarası ve varyant bazlı takip ile depo karmaşasına son verin. <strong>Tedarikçi Ağı</strong> modülü üzerinden
                    teklif toplayın, satın alma siparişlerinizi otomatikleştirin. FIFO/LIFO gibi raporlama yöntemleri ve akıllı kritik stok uyarıları ile
                    tedarik zinciri kırılmalarını önceden görün ve önlem alın.
                </p>
                <ul>
                    <li><a href="/cozumler/envanter-depo">Akıllı Depo ve Raf Yönetim Sistemi</a></li>
                    <li><a href="/cozumler/tedarik-zinciri">Stratejik Tedarikçi Yönetim Sistemi</a></li>
                </ul>
            </article>

            <article>
                <h3>D) İnsan Kaynakları, PDKS ve İşletme Güvenliği</h3>
                <p>
                    Çalışanlarınızın özlük dosyalarını <strong>Personel Paneli</strong> üzerinden yönetin. Gelişmiş <strong>PDKS Yönetimi</strong> ile
                    biyometrik veya kartlı sistemlerden gelen verileri işleyin; vardiya, mesai ve devamsızlık hesaplamalarını saniyeler içinde tamamlayın.
                    <strong>Kaçak Satış Tespit</strong> ve anomali analizi özellikleri ile işletme içindeki her türlü usulsüzlüğün önüne geçin.
                    İş güvenliği ve çalışan verimliliği metriklerini tek panelden izleyin.
                </p>
                <ul>
                    <li><a href="/cozumler/pdks">Personel Devam Kontrol Sistemi (PDKS)</a></li>
                    <li><a href="/cozumler/ik-yonetimi">İnsan Kaynakları Yönetim Yazılımı</a></li>
                </ul>
            </article>

            <article>
                <h3>E) Operasyonel Mükemmellik, Yazılım Yönetimi ve BI</h3>
                <p>
                    Kapsamlı <strong>Yönetim Paneli</strong> üzerinden kullanıcı yetkilerini detaylıca kurgulayın. <strong>Servis Masası</strong> ile
                    iç ve dış destek taleplerini SLA standartlarında yönetin. <strong>İş Zekası & Analiz</strong> (BI) araçları sayesinde
                    verilerinizi görselleştirin, geleceğe yönelik projeksiyonlar oluşturun. <strong>Sistem Ayarları</strong> ve
                    <strong>Ekip & Yetki</strong> yönetimi ile esnek, ölçeklenebilir ve güvenli bir işletme altyapısı kurun.
                </p>
                <ul>
                    <li><a href="/cozumler/is-zekasi">Gelişmiş İş Zekası ve Veri Analitiği</a></li>
                    <li><a href="/cozumler/servis-masasi">Müşteri İlişkileri ve Servis Masası</a></li>
                </ul>
            </article>

            <section aria-label="Dijital Dönüşüm ve Bulut ERP Teknolojisi">
                <h2>Bulut Tabanlı ERP ile Dijital Dönüşüm</h2>
                <p>
                    İş dünyasının hızla değiştiği günümüzde, geleneksel yerleşik yazılımlar esnekliğini yitirmektedir. Periodya Enterprise,
                    <strong>Bulut ERP</strong> teknolojisi ile işletmelere internetin olduğu her yerden yönetim imkanı sunar. Mobil uygulama desteği sayesinde
                    cep telefonunuzdan veya tabletinizden stoklarınızı kontrol edebilir, satış raporlarınızı inceleyebilirsiniz.
                    Yüksek güvenlikli veri merkezlerinde saklanan verileriniz, günlük yedekleme ve SSL sertifikaları ile korunmaktadır.
                    Periodya ile teknolojik altyapı maliyetlerinden tasarruf ederken, en güncel ERP özelliklerine anında sahip olursunuz.
                </p>
            </section>

            <section aria-label="Sıkça Sorulan Sorular">
                <h2>Sıkça Sorulan Sorular (FAQ)</h2>

                <div>
                    <h4>Periodya ERP yazılımı kimler için uygundur?</h4>
                    <p>
                        Periodya; perakende, üretim, hizmet ve saha operasyonu yürüten tüm orta ve büyük ölçekli işletmeler için uygundur.
                        Esnek modüler yapısı sayesinde her sektörün ihtiyacına göre özelleştirilebilir bir ERP deneyimi sunar.
                    </p>
                </div>

                <div>
                    <h4>POS Terminal stok ve finansı otomatik günceller mi?</h4>
                    <p>
                        Evet, Periodya POS Terminal üzerinden yapılan her satış anında ilgili deponun stoklarından düşer ve finans modülündeki
                        kasa/banka hesaplarınıza gelir olarak işlenir. Tam entegrasyon sayesinde manuel veri girişine gerek kalmaz.
                    </p>
                </div>

                <div>
                    <h4>PDKS vardiya/mesai/giriş-çıkış yönetimini destekler mi?</h4>
                    <p>
                        Evet, gelişmiş PDKS modülümüz personellerin giriş-çıkış saatlerini, esnek vardiya planlarını ve fazla mesai hesaplamalarını
                        otomatik olarak takip eder. Veriler doğrudan bordro süreçlerine temel oluşturabilir.
                    </p>
                </div>

                <div>
                    <h4>Cari hesaplar ile finansal yönetim entegre mi?</h4>
                    <p>
                        Kesinlikle. Müşteri ve tedarikçi cari hesaplarında gerçekleşen her işlem (ödeme, tahsilat, fatura) finansal yönetim modülünde
                        anlık olarak raporlanır. Borç/alacak yaşlandırma analizleri tek tıkla alınabilir.
                    </p>
                </div>

                <div>
                    <h4>Saha satış paneli ve canlı saha takibi nasıl çalışır?</h4>
                    <p>
                        Saha ekipleri, mobil uyumlu Saha Satış Paneli üzerinden sipariş alabilir ve rota takibi yapabilir. Yöneticiler ise
                        Canlı Saha Takibi özelliği ile ekiplerin harita üzerindeki konumlarını ve günlük ziyaret performanslarını anlık izleyebilir.
                    </p>
                </div>

                <div>
                    <h4>Denetim kayıtları (audit log) neleri izler?</h4>
                    <p>
                        Denetim kayıtları modülü, sistem içindeki tüm kritik işlemleri (fatura iptali, fiyat değişikliği, kullanıcı girişleri)
                        "kim, ne zaman, hangi cihazdan yaptı" detaylarıyla kayıt altına alır, tam güvenlik sağlar.
                    </p>
                </div>

                <div>
                    <h4>İş zekası & analiz hangi raporları sunar?</h4>
                    <p>
                        Satış trendleri, karlılık haritaları, personel verimliliği, stok devir hızı ve detaylı finansal projeksiyonlar gibi
                        karar vermeyi kolaylaştıracak zengin görsel raporlar sunar.
                    </p>
                </div>
            </section>
        </section>
    );
};

export default SeoContent;
