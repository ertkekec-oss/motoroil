"use client";

import { useState } from 'react';

export default function HelpPage() {
    const [activeSection, setActiveSection] = useState('getting-started');

    return (
        <div className="p-6 md:p-8 animate-in fade-in zoom-in-95 font-sans text-white">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-sm">
                        ❓ Kullanıcı Yardım Merkezi
                    </h1>
                    <p className="text-gray-400 text-sm font-medium mt-1">
                        Sistem kullanımı, modüller ve sıkça sorulan sorular için detaylı rehber.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-1 space-y-2">
                    <NavButton id="getting-started" label="🚀 Başlarken" current={activeSection} set={setActiveSection} />
                    <NavButton id="pos" label="💳 Satış ve POS" current={activeSection} set={setActiveSection} />
                    <NavButton id="customers" label="👥 Müşteri & Cari" current={activeSection} set={setActiveSection} />
                    <NavButton id="inventory" label="📦 Stok & Ürünler" current={activeSection} set={setActiveSection} />
                    <NavButton id="service" label="🛠️ Servis İşlemleri" current={activeSection} set={setActiveSection} />
                    <NavButton id="quotes" label="📋 Teklif Hazırlama" current={activeSection} set={setActiveSection} />
                    <NavButton id="faq" label="🙋 Sıkça Sorulan Sorular" current={activeSection} set={setActiveSection} />
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="card glass-plus p-8 min-h-[600px] relative">

                        {activeSection === 'getting-started' && (
                            <div className="space-y-8">
                                <SectionTitle title="Periodya Sistemine Giriş" icon="🚀" />
                                <div className="space-y-6 text-gray-300">
                                    <Block title="Giriş Yapma">
                                        <p>Size verilen <strong>Kullanıcı Adı</strong> ve <strong>Şifre</strong> ile sisteme giriş yapabilirsiniz.</p>
                                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
                                            <li>Şubenizi seçmeyi unutmayın (Merkez veya diğer şubeler).</li>
                                            <li>Şifrenizi unuttuysanız yöneticinize başvurun.</li>
                                        </ul>
                                    </Block>
                                    <Block title="Menü Kullanımı">
                                        <p>Sol taraftaki menüyü kullanarak tüm modüllere erişebilirsiniz. Menü, yetkinize göre özelleştirilmiştir. Görmediğiniz bir menü varsa, o modüle erişim yetkiniz yoktur.</p>
                                    </Block>
                                    <Block title="Çıkış Yapma">
                                        <p>Güvenliğiniz için işiniz bittiğinde sol alt köşedeki <strong>Çıkış Yap</strong> butonu ile oturumunuzu kapatın.</p>
                                    </Block>
                                </div>
                            </div>
                        )}

                        {activeSection === 'pos' && (
                            <div className="space-y-8">
                                <SectionTitle title="Satış ve Kasa İşlemleri" icon="💳" />
                                <div className="space-y-6 text-gray-300">
                                    <Block title="Hızlı Satış Yapma">
                                        <ol className="list-decimal pl-5 space-y-2 text-gray-400">
                                            <li><strong>POS Terminal</strong> sayfasına gidin.</li>
                                            <li>Ürünleri barkod okutarak veya isme göre arayarak sepete ekleyin.</li>
                                            <li>Müşteri seçin (Varsayılan: Perakende Müşteri). Veresiye satış için kayıtlı bir müşteri seçmek zorunludur.</li>
                                            <li><strong>ÖDEME AL</strong> butonuna tıklayın.</li>
                                            <li>Nakit, Kredi Kartı veya Veresiye seçeneğini seçip işlemi tamamlayın.</li>
                                        </ol>
                                    </Block>
                                    <Block title="Satışı Park Etme (Beklemeye Alma)">
                                        <p>Müşteri kasada başka bir ürün almaya gittiğinde, sepeti silmeden <strong>"Beklemeye Al"</strong> butonuna basarak sıradaki müşteriye geçebilirsiniz. Bekleyen satışı daha sonra geri çağırabilirsiniz.</p>
                                    </Block>
                                    <Block title="İade Alma">
                                        <p>Satış Yönetimi sayfasından ilgili satışı bulun ve detayına giderek <strong>İade Al</strong> işlemini başlatın. İade tutarı müşterinin bakiyesinden düşülecektir.</p>
                                    </Block>
                                </div>
                            </div>
                        )}

                        {activeSection === 'customers' && (
                            <div className="space-y-8">
                                <SectionTitle title="Müşteri ve Cari Yönetimi" icon="👥" />
                                <div className="space-y-6 text-gray-300">
                                    <Block title="Müşteri Ekleme">
                                        <p><strong>Cari Hesaplar</strong> menüsünden <strong>+ Yeni Müşteri</strong> butonuna tıklayın. Ad, Soyad ve Telefon bilgilerini girmek zorunludur.</p>
                                    </Block>
                                    <Block title="Veresiye Takibi">
                                        <p>Müşteri listesinde her müşterinin güncel <strong>Bakiye</strong> durumunu görebilirsiniz.</p>
                                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
                                            <li><span className="text-red-400">Kırmızı Tutar:</span> Müşterinin bize borcu var.</li>
                                            <li><span className="text-green-400">Yeşil Tutar:</span> Müşterinin alacağı var (veya avans).</li>
                                        </ul>
                                    </Block>
                                    <Block title="Tahsilat Ekleme">
                                        <p>Müşteri borcunu ödemeye geldiğinde, müşteri detay sayfasına gidin ve <strong>TAHSİLAT EKLE</strong> butonunu kullanın. Bu işlem müşterinin borcunu düşürür ve kasa bakiyesini artırır.</p>
                                    </Block>
                                </div>
                            </div>
                        )}

                        {activeSection === 'inventory' && (
                            <div className="space-y-8">
                                <SectionTitle title="Stok ve Ürün Yönetimi" icon="📦" />
                                <div className="space-y-6 text-gray-300">
                                    <Block title="Ürün Arama">
                                        <p>Envanter sayfasında ürün adına, barkoda veya kategoriye göre arama yapabilirsiniz.</p>
                                    </Block>
                                    <Block title="Stok Ekleme">
                                        <p>Mevcut bir ürünün stoğunu artırmak için ürünü düzenleyin veya <strong>Hızlı Stok Ekleme</strong> özelliğini kullanın.</p>
                                    </Block>
                                    <Block title="Kritik Stok">
                                        <p>Stok seviyesi belirlediğiniz kritik miktarın altına düşen ürünler, anasayfada ve envanter raporlarında <strong>Kritik Stok</strong> uyarısı verir. Bu ürünleri sipariş etmeyi unutmayın.</p>
                                    </Block>
                                </div>
                            </div>
                        )}

                        {activeSection === 'service' && (
                            <div className="space-y-8">
                                <SectionTitle title="Servis ve Araç İşlemleri" icon="🛠️" />
                                <div className="space-y-6 text-gray-300">
                                    <Block title="Servis Kaydı Açma">
                                        <p>Servise gelen araç için <strong>Servis Masası</strong> &gt; <strong>+ Yeni Servis Kaydı</strong> oluşturun.</p>
                                        <p>Araç plakası, kilometresi ve müşteri şikayetini detaylıca not alın.</p>
                                    </Block>
                                    <Block title="Parça ve İşçilik Ekleme">
                                        <p>Servis kaydı açıkken, kullanılan yedek parçaları stoktan düşerek servis emrine ekleyin. İşçilik ücretini ayrıca belirtin.</p>
                                    </Block>
                                    <Block title="Servisi Tamamlama">
                                        <p>İşlem bittiğinde <strong>Servisi Tamamla</strong> butonuna basın. Bu işlem, servis ücretini müşterinin bakiyesine yansıtır veya tahsilat ekranına yönlendirir.</p>
                                    </Block>
                                </div>
                            </div>
                        )}

                        {activeSection === 'quotes' && (
                            <div className="space-y-8">
                                <SectionTitle title="Teklif Hazırlama" icon="📋" />
                                <div className="space-y-6 text-gray-300">
                                    <Block title="Teklif Oluşturma">
                                        <p><strong>Teklifler</strong> sayfasından müşteriler için profesyonel fiyat teklifleri hazırlayabilirsiniz. Teklif henüz bir satış değildir, stoktan düşmez.</p>
                                    </Block>
                                    <Block title="Teklifi Satışa Çevirme">
                                        <p>Müşteri teklifi onayladığında, teklif detayından <strong>Satışa Dönüştür</strong> diyerek tek tuşla faturaya veya servis emrine dönüştürebilirsiniz.</p>
                                    </Block>
                                    <Block title="PDF İndirme">
                                        <p>Hazırladığınız teklifi PDF olarak indirip WhatsApp veya E-posta yoluyla müşteriye gönderebilirsiniz.</p>
                                    </Block>
                                </div>
                            </div>
                        )}

                        {activeSection === 'faq' && (
                            <div className="space-y-8">
                                <SectionTitle title="Sıkça Sorulan Sorular" icon="🙋" />
                                <div className="space-y-4">
                                    <FAQ
                                        q="Yazıcıdan fiş/fatura çıkmıyor, ne yapmalıyım?"
                                        a="Öncelikle yazıcının fişe takılı ve açık olduğunu kontrol edin. Eğer bağlantı USB ise kabloyu çıkarıp takın. Sistemde 'Yazıcı Ayarları' bölümünden doğru yazıcının seçili olduğundan emin olun."
                                    />
                                    <FAQ
                                        q="Yanlışlıkla satış yaptım, nasıl iptal ederim?"
                                        a="Satış Yönetimi menüsüne gidin, yaptığınız satışı bulun ve 'İptal/İade' butonunu kullanın."
                                    />
                                    <FAQ
                                        q="Sisteme giremiyorum, 'Yetkisiz Erişim' hatası veriyor."
                                        a="Kullanıcı adınızı ve şifrenizi kontrol edin. Eğer sorun devam ederse yöneticinizden hesabınızın aktif olup olmadığını ve yetkilerinizi kontrol etmesini isteyin."
                                    />
                                    <FAQ
                                        q="Stokta ürün var ama sistemde 0 görünüyor."
                                        a="Envanter menüsünden ürünü bulup 'Stok Düzeltme' işlemi yapabilirsiniz. Bu işlem loglara kaydedilecektir."
                                    />
                                    <FAQ
                                        q="Gün sonu raporu nasıl alırım?"
                                        a="Raporlar menüsünden 'Günlük Rapor' sekmesine gidin. O gün yapılan tüm ciroyu, nakit ve kredi kartı toplamlarını görebilir ve yazdırabilirsiniz."
                                    />
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

function NavButton({ id, label, current, set }: any) {
    const isActive = current === id;
    return (
        <button
            onClick={() => set(id)}
            className={`w-full text-left px-5 py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-between group
                ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'}
            `}
        >
            <span>{label}</span>
            {isActive && <span className="text-white animate-pulse">●</span>}
        </button>
    );
}

function SectionTitle({ title, icon }: any) {
    return (
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
            <span className="text-4xl">{icon}</span>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
    );
}

function Block({ title, children }: any) {
    return (
        <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <h3 className="text-lg font-bold text-indigo-300 mb-2">{title}</h3>
            <div className="text-sm leading-relaxed">{children}</div>
        </div>
    );
}

function FAQ({ q, a }: any) {
    return (
        <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <h3 className="text-base font-bold text-orange-300 mb-2 flex items-start gap-2">
                <span>❓</span> {q}
            </h3>
            <p className="text-gray-400 text-sm ml-6">{a}</p>
        </div>
    );
}
