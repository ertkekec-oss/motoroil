"use client";

export default function ThemeTestPage() {
    return (
        <div style={{
            padding: '40px',
            minHeight: '100vh',
            background: 'var(--bg-deep)',
            color: 'var(--text-main)',
            transition: 'all 0.3s ease'
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                <h1 style={{
                    fontSize: '48px',
                    marginBottom: '20px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #FF8A00 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    🎨 Theme Test Sayfası
                </h1>

                <p style={{
                    fontSize: '18px',
                    color: 'var(--text-muted)',
                    marginBottom: '40px'
                }}>
                    Sağ alt köşedeki butona tıklayarak temayı değiştirebilirsiniz!
                </p>

                <div className="card" style={{
                    padding: '30px',
                    marginBottom: '20px'
                }}>
                    <h2 style={{ marginBottom: '15px', fontSize: '24px' }}>
                        ✅ Theme Toggle Butonu
                    </h2>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        Sağ alt köşeye bakın! Yuvarlak bir buton göreceksiniz.
                        <br /><br />
                        <strong>Dark Mode'dayken:</strong> ☀️ Güneş ikonu
                        <br />
                        <strong>Light Mode'dayken:</strong> 🌙 Ay ikonu
                    </p>
                </div>

                <div className="card" style={{
                    padding: '30px',
                    marginBottom: '20px',
                    background: 'var(--bg-card)'
                }}>
                    <h2 style={{ marginBottom: '15px', fontSize: '24px' }}>
                        🎯 Nasıl Kullanılır?
                    </h2>
                    <ol style={{
                        color: 'var(--text-muted)',
                        lineHeight: '1.8',
                        paddingLeft: '20px'
                    }}>
                        <li>Sağ alt köşedeki yuvarlak butonu bulun</li>
                        <li>Butona tıklayın</li>
                        <li>Tema anında değişecek!</li>
                        <li>Tercihiniz otomatik kaydedilecek</li>
                    </ol>
                </div>

                <div className="card" style={{
                    padding: '30px',
                    background: 'linear-gradient(135deg, rgba(255, 85, 0, 0.1), rgba(255, 85, 0, 0.05))',
                    border: '1px solid var(--primary)'
                }}>
                    <h2 style={{ marginBottom: '15px', fontSize: '24px' }}>
                        💡 İpucu
                    </h2>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        Buton her zaman sabit konumda kalır. Sayfayı aşağı kaydırsanız bile
                        sağ alt köşede görünmeye devam eder.
                    </p>
                </div>

                <div style={{
                    marginTop: '40px',
                    padding: '20px',
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        👇 Sağ alt köşeye bakın! 👇
                    </p>
                    <div style={{
                        fontSize: '48px',
                        marginTop: '10px',
                        animation: 'pulse 2s infinite'
                    }}>
                        ↘️
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }
      `}</style>
        </div>
    );
}
