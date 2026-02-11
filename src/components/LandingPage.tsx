
"use client";

import { useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../app/landing.css';
import '../app/mega-menu.css';

// Helper to get menu data robustly
const getMenuData = (cms: any, menuName: string) => {
  if (!cms?.menus) return [];

  // 1. Try to find a menu that actually has items (fix for duplicate empty records)
  let menu = cms.menus.find((m: any) =>
    (m.name === menuName || m.name?.toLowerCase() === menuName.toLowerCase()) &&
    (m.items && Array.isArray(m.items) && m.items.length > 0)
  );

  // 2. If no populated menu found, take any matching menu
  if (!menu) {
    menu = cms.menus.find((m: any) => m.name === menuName || m.name?.toLowerCase() === menuName.toLowerCase());
  }

  let items = menu?.items;

  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch (e) {
      items = [];
    }
  }

  if (!Array.isArray(items)) return [];
  return items;
};

export default function LandingPage() {
  const [cms, setCms] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeRole, setActiveRole] = useState(0);
  const [bannerVisible, setBannerVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCms = async () => {
      try {
        const res = await fetch('/api/public/landing');
        if (res.ok) {
          const data = await res.json();
          setCms(data);
        }
      } catch (err: any) {
        console.error('Failed to fetch CMS', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCms();
  }, []);







  // Robust Scroll Detection
  useLayoutEffect(() => {
    const findScrollParent = (node: HTMLElement | null): HTMLElement | Window => {
      if (!node) return window;
      const overflowY = window.getComputedStyle(node).overflowY;
      const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden' && overflowY !== 'clip'; // Added 'clip' for completeness
      if (isScrollable && node.scrollHeight > node.clientHeight) return node;
      return findScrollParent(node.parentElement);
    };

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      let offset = 0;

      // Handle Window/Document scroll
      if (target === document || target === window.document) {
        offset = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      }
      // Handle Element scroll
      else if (target instanceof HTMLElement) {
        offset = target.scrollTop;
      }

      setScrolled(offset > 10);
    };

    // Find the true scrolling container
    // We start searching from a known element in this component, or body fallback
    const startNode = document.querySelector('.m-nav') as HTMLElement || document.body;
    const scrollParent = findScrollParent(startNode);

    // Attach to the identified parent
    scrollParent.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    // Also attach to window just in case
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    // Initial check
    if (scrollParent instanceof HTMLElement) {
      setScrolled(scrollParent.scrollTop > 10);
    } else {
      setScrolled(window.scrollY > 10);
    }

    return () => {
      scrollParent.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleDemo = () => {
    // Default demo action if not overridden
    router.push('/login');
  };

  const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#8b5cf6' }}>
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const FAQSection = ({ section, getStyle }: { section: any, getStyle: any }) => {
    const { content } = section;
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggle = (index: number) => {
      setOpenIndex(openIndex === index ? null : index);
    };

    return (
      <section className="m-section flex flex-col items-center" key={section.id}>
        <h2
          className="text-center w-full mb-12"
          style={getStyle(content.titleSize, content.titleColor)}
          dangerouslySetInnerHTML={{ __html: content.title || 'Frequently Asked Questions' }}
        ></h2>
        <div className="w-full max-w-4xl mx-auto text-left">
          {(content.items || []).map((faq: any, i: number) => (
            <div key={i} className="" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: '16px' }}>
              <button
                className="w-full text-left py-4 flex justify-between items-center text-lg font-bold hover:text-blue-600 transition"
                onClick={() => toggle(i)}
              >
                {faq.question}
                <span className={`transform transition-transform ${openIndex === i ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {openIndex === i && (
                <div className="pb-6 text-slate-600 leading-relaxed animate-in">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const getStyle = (size: any, color: any) => ({
    ...(size && { fontSize: isNaN(Number(size)) ? size : `${size}px` }),
    ...(color && { color })
  });

  const XIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444' }}>
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  const renderSection = (section: any) => {
    const { type: rawType, content } = section;
    const type = rawType?.toString().toUpperCase();

    if (!content) return null;
    if (!content) return null;

    switch (type) {
      case 'HERO':
        const heroVisual = content.visualUrl || content.visual;
        return (
          <header className="m-hero" key={section.id}>
            <div className="m-hero-bg"></div>
            {(content.pillText || content.badgeText) && (
              <div className="m-pill-row">
                <div className="m-pill">{content.pillText || content.badgeText}</div>
                {content.reviewsText && <span className="text-[13px] text-slate-400 font-medium self-center ml-2">{content.reviewsText}</span>}
              </div>
            )}
            <h1 style={getStyle(content.titleSize, content.titleColor)} dangerouslySetInnerHTML={{ __html: content.title || 'Modern BI Software' }}></h1>
            <p style={{ color: content.descColor || content.subtitleColor, fontSize: content.descSize ? `${content.descSize}px` : undefined }} dangerouslySetInnerHTML={{ __html: content.desc || content.subtitle || '' }}></p>
            <div className="m-hero-btns">
              {(content.primaryBtnText) && <Link href={content.primaryBtnLink || content.primaryBtnUrl || '/register'} className="m-btn m-btn-primary">{content.primaryBtnText}</Link>}
              {(content.secondaryBtnText) && <Link href={content.secondaryBtnLink || content.secondaryBtnUrl || '#'} className="m-btn m-btn-outline">{content.secondaryBtnText}</Link>}
            </div>
            {heroVisual && (
              <div style={{ marginTop: '40px', position: 'relative', maxWidth: '1000px', margin: '40px auto 0' }}>
                <div className="m-card-white" style={{ padding: '20px', borderRadius: '24px' }}>
                  <img
                    src={heroVisual}
                    alt="Hero Visual"
                    style={{ width: '100%', height: 'auto', maxHeight: '560px', objectFit: 'cover', objectPosition: 'center top', borderRadius: '16px' }}
                  />
                  {content.showFloatingCard && content.floatingCardVisualUrl && (
                    <div className="absolute -bottom-6 -right-6 w-1/3 aspect-square bg-white border-8 border-white rounded-3xl shadow-2xl overflow-hidden hidden md:block animate-in fade-in zoom-in duration-700">
                      <img src={content.floatingCardVisualUrl} className="w-full h-full object-cover" alt="Detail" />
                      {content.floatingCardTitle && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                          <div className="text-white text-xs font-bold">{content.floatingCardTitle}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </header>
        );
      case 'LOGO_CLOUD':
        return (
          <div className="m-logo-cloud" key={section.id} style={{ background: content.bg }}>
            <div className="m-logo-scroll">
              {[...(content.logos || []), ...(content.logos || [])].map((logo: string, i: number) => (
                <img key={i} src={logo} alt="Client Logo" />
              ))}
            </div>
          </div>
        );
      case 'FEATURES':
        return (
          <section className="m-section" key={section.id}>
            <div className="m-container">
              <div className="text-center mb-16">
                <h5 className="text-blue-600 font-bold uppercase tracking-widest mb-4">{content.topTitle}</h5>
                <h2 style={getStyle(content.titleSize, content.titleColor)}>{content.title}</h2>
                <p className="max-w-2xl mx-auto mt-4 text-slate-500">{content.desc}</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {(content.items || []).map((item: any, i: number) => (
                  <div key={i} className="m-feature-card">
                    <div className="text-4xl mb-4">{item.icon}</div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'CONTENT_BLOCK':
        return (
          <section className="m-section" key={section.id} style={{ background: content.bg }}>
            <div className={`m-container flex flex-col md:flex-row items-center gap-12 ${content.layout === 'right' ? 'md:flex-row-reverse' : ''}`}>
              <div className="flex-1">
                <h5 className="text-blue-600 font-bold uppercase tracking-widest mb-4">{content.topTitle}</h5>
                <h2 className="mb-6" style={getStyle(content.titleSize, content.titleColor)}>{content.title}</h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">{content.desc}</p>
                <ul className="space-y-3">
                  {(content.list || []).map((li: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 font-medium text-slate-700">
                      <CheckIcon />
                      {li}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1">
                {content.visual && <img src={content.visual} alt="Feature" className="rounded-2xl shadow-2xl border border-slate-100" />}
              </div>
            </div>
          </section>
        );
      case 'TESTIMONIALS':
        return (
          <section className="m-section bg-slate-50" key={section.id}>
            <div className="text-center mb-16">
              <h2 style={getStyle(content.titleSize, content.titleColor)}>{content.title}</h2>
            </div>
            <div className="m-container grid md:grid-cols-3 gap-6">
              {(content.items || []).map((t: any, i: number) => (
                <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative">
                  <div className="text-yellow-400 text-xl mb-4">★★★★★</div>
                  <p className="text-slate-700 font-medium mb-6">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                      {t.avatar && <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case 'CTA':
        return (
          <section className="py-24 relative overflow-hidden" key={section.id} style={{ background: '#0f172a' }}>
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            <div className="m-container relative text-center text-white">
              <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">{content.title}</h2>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">{content.desc}</p>
              <div className="flex justify-center gap-4">
                <Link href={content.btnLink || '/register'} className="m-btn m-btn-primary text-lg px-8 py-4 shadow-xl shadow-blue-500/30">
                  {content.btnText || 'Get Started Now'}
                </Link>
              </div>
            </div>
          </section>
        );
      case 'FAQ':
        return <FAQSection section={section} getStyle={getStyle} key={section.id} />;
      case 'FOOTER':
        // Footer is handled globally below
        return null;
      case 'NAV':
        // Nav is handled globally
        return null;
      case 'BANNER':
        if (!bannerVisible) return null;
        return (
          <div className="m-top-banner" key={section.id} style={{ background: content.bg || '#2a1b3d', position: 'relative' }}>
            <div dangerouslySetInnerHTML={{ __html: content.text || content.title }}></div>
            {(content.linkText || content.btnText) && <Link href={content.linkUrl || content.btnLink || '#'}>{content.linkText || content.btnText}</Link>}
            <button
              onClick={() => setBannerVisible(false)}
              style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px', opacity: 0.7 }}
            >
              ×
            </button>
          </div>
        );
      case 'GRID':
        return (
          <section className="m-section" key={section.id}>
            <div className="m-container">
              <div className="text-center mb-16 px-4">
                <h2 style={getStyle(content.titleSize, content.titleColor)} dangerouslySetInnerHTML={{ __html: content.title || content.mainTitle }}></h2>
                {(content.desc || content.subtitle) && <p className="max-w-2xl mx-auto mt-4 text-slate-500" dangerouslySetInnerHTML={{ __html: content.desc || content.subtitle }}></p>}
              </div>
              <div className="m-grid-container m-grid-3 px-4">
                {(content.items || []).map((item: any, i: number) => (
                  <div key={i} className="m-card-white overflow-hidden flex flex-col" style={{ padding: '0' }}>
                    {(item.imageUrl || item.imgUrl || item.image) && (
                      <div className="w-full h-48 overflow-hidden bg-slate-100">
                        <img src={item.imageUrl || item.imgUrl || item.image} alt={item.title} className="w-full h-full object-cover transition duration-500 hover:scale-110" />
                      </div>
                    )}
                    <div style={{ padding: '32px' }}>
                      <div className="m-card-icon text-3xl mb-6">
                        {(item.icon && (item.icon.startsWith('http') || item.icon.startsWith('/') || item.icon.startsWith('data:'))) ? (
                          <img src={item.icon} alt={item.title} className="w-12 h-12 object-contain" />
                        ) : (
                          <span>{item.icon || '✨'}</span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      // NEW CASES FROM OLD CODEBLOCK - RESTORING
      case 'PARTNERS':
        return (
          <div style={{ padding: '30px 0', background: 'transparent', display: 'flex', justifyContent: 'center', width: '100%' }} key={section.id}>
            <div className="w-full max-w-4xl flex flex-wrap justify-center gap-x-12 gap-y-8 items-center px-6">
              {(content.items || ['toast', 'bambooHR', 'SmartBug', 'CONAIR', 'dentsu', 'wistia', 'AVIDLY', 'NEW BREED+']).map((p: any, i: number) => (
                p.url ? (
                  <img key={i} src={p.url} alt={p.name} className="h-8 md:h-10 grayscale opacity-40 hover:opacity-100 transition-all object-contain" />
                ) : (
                  <span key={i} className="text-xl font-black uppercase tracking-tighter opacity-30 grayscale contrast-125" style={{ pointerEvents: 'none' }}>{typeof p === 'string' ? p : p.name}</span>
                )
              ))}
            </div>
          </div>
        );

      case 'COMPARISON':
        return (
          <section className="m-section" style={{ background: '#fff' }} key={section.id}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <h2 className="mb-6">
                <span className="text-[#0d0e12]" style={getStyle(content.titleSize, content.titleColor)}>{content.topTitle || 'Business intelligence, '}</span>
                <span className="grad-text">{content.mainTitle || 'without the baggage'}</span>
              </h2>
              <p className="m-intro mb-12" style={getStyle(content.subtitleSize, content.subtitleColor)} dangerouslySetInnerHTML={{ __html: content.subtitle || content.desc || 'Databox removes the complicated setup, steep price, and long learning curve. Your data finally works at the speed of your business.' }}></p>
              <div className="m-compare-container">
                <div className="m-compare-card before">
                  <h4>{content.beforeTitle || 'BEFORE DATABOX'}</h4>
                  <ul className="m-compare-list">
                    {(content.beforeList || [
                      'Per-seat licenses and consulting fees put BI out of reach.',
                      'ETL projects, custom code, SQL queries, and IT backlogs stall momentum.',
                      'You submit tickets and wait days for new metrics or ad-hoc reports.',
                      'Fragmented tools lead to silos, debates, and more questions.',
                      'Leaders miss opportunities because performance updates come too late.'
                    ]).map((item: string, i: number) => (
                      <li key={i}><XIcon /> {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="m-compare-card after">
                  <h4>{content.afterTitle || 'AFTER DATABOX'}</h4>
                  <ul className="m-compare-list">
                    {(content.afterList || [
                      'Unlimited users on every plan—BI for all, no extra fees.',
                      'Go live fast with 130+ integrations, 200+ templates, and no-code metric builder.',
                      'Self-serve dashboards & AI summaries give you answers instantly.',
                      'Unified datasets end "which number is right?" debates for good.',
                      'Real-time dashboards and automated reports keep leaders informed when it matters.'
                    ]).map((item: string, i: number) => (
                      <li key={i}><CheckIcon /> {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        );

      case 'METRICS':
        return (
          <section className="m-section" key={section.id}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <h2 className="mb-4">
                <span className="block text-[#9333ea] mb-2" style={getStyle(content.subtitleSize, content.subtitleColor)}>{content.topTitle || '20,000+ scaling teams & agencies'}</span>
                <span className="block text-[#0d0e12]" style={getStyle(content.titleSize, content.titleColor)}>{content.mainTitle || 'drive results that matter'}</span>
              </h2>
              {(content.subtitle || content.desc) && (
                <p
                  className="m-intro mb-8"
                  style={getStyle(content.subtitleSize, content.subtitleColor)}
                  dangerouslySetInnerHTML={{ __html: content.subtitle || content.desc }}
                />
              )}
              <div className="m-grid-container m-grid-3" style={{ marginTop: '30px' }}>
                {(content.items || [
                  { stat: '↑ 55%', label: 'increase in sales YoY', logo: 'https://databox.com/wp-content/uploads/2023/04/first-response.png' },
                  { stat: '↓ 50%', label: 'decrease in overall reporting costs', logo: 'https://databox.com/wp-content/uploads/2023/04/market-launcher.png' },
                  { stat: '↓ 60%', label: 'reduction in time spent creating reports', logo: 'https://databox.com/wp-content/uploads/2023/04/hero-factory.png' }
                ]).map((c: any, i: number) => (
                  <div key={i} className="m-metric-card">
                    <div>
                      <div className="m-metric-stat">{c.stat}</div>
                      <div className="m-metric-label">{c.label}</div>
                    </div>
                    <div className="m-metric-footer">
                      <a href={c.linkUrl || '#'} className="m-metric-link">{c.linkText || 'Read case study →'}</a>
                      {(c.logo && (c.logo.startsWith('http') || c.logo.startsWith('/') || c.logo.startsWith('data:'))) ? (
                        <img
                          src={c.logo}
                          alt="Client Logo"
                          className="m-metric-logo"
                          style={{ maxHeight: content.iconSize ? `${content.iconSize}px` : undefined, maxWidth: content.iconSize ? 'none' : undefined }}
                        />
                      ) : (
                        <span className="text-2xl opacity-50">{c.logo}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'ROLES':
        return (
          <section className="m-section" key={section.id}>
            <h2
              style={getStyle(content.titleSize, content.titleColor)}
              dangerouslySetInnerHTML={{ __html: content.title }}
            ></h2>
            <p
              className="m-intro"
              style={getStyle(content.subtitleSize, content.subtitleColor)}
              dangerouslySetInnerHTML={{ __html: content.desc || content.subtitle }}
            ></p>
            <div className="m-accordion-container" style={{ marginTop: '15px' }}>
              {(content.items || []).map((role: any, idx: number) => (
                <div
                  key={idx}
                  className={`m-role-card ${activeRole === idx ? 'active' : ''}`}
                  onMouseEnter={() => setActiveRole(idx)}
                >
                  <div className="m-role-title">{role.title}</div>
                  <div className="m-role-content">
                    <p className="m-role-desc">{role.desc}</p>
                    <ul className="m-role-list">
                      {(role.list || role.items || []).map((li: string, j: number) => (
                        <li key={j}>{li}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="m-role-icon-bottom">
                    {(role.icon && (role.icon.startsWith('http') || role.icon.startsWith('/') || role.icon.startsWith('data:'))) ? (
                      <img
                        src={role.icon}
                        alt={role.title}
                        className="object-contain"
                        style={{ height: content.iconSize ? `${content.iconSize}px` : '32px', width: content.iconSize ? `${content.iconSize}px` : '32px' }}
                      />
                    ) : (
                      <span style={{ fontSize: content.iconSize ? `${content.iconSize * 1.2}px` : '40px' }}>{role.icon || '👤'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'EXPLORE':
        return (
          <section className="m-section" key={section.id}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <h2 className="mb-4">
                <span className="text-[#0d0e12]" style={getStyle(content.titleSize, content.titleColor)}>{content.topTitle || 'Unlock data. '}</span>
                <span className="text-[#9333ea]">{content.mainTitle || 'Empower decisions.'}</span>
              </h2>
              <p className="m-intro mb-12" style={getStyle(content.subtitleSize, content.subtitleColor)}>{content.subtitle || content.desc || "Your data is useless unless your team can quickly put it to work..."}</p>
              <div className="m-grid-container m-grid-3" style={{ gap: '24px' }}>
                {(content.items || [
                  {
                    title: 'Make better decisions, together', desc: 'Send the right data to the right people, in the right format, at the right time.', icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    )
                  },
                  {
                    title: 'Measure what matters most', desc: 'Focus on what matters most to your growth.', icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    )
                  },
                  {
                    title: 'Draw better conclusions', desc: 'Know the why behind the number.', icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    )
                  },
                  {
                    title: 'Enable "DIY BI"', desc: 'Empower your entire team to self-serve data.', icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                    )
                  },
                  {
                    title: 'Provide clarity at a glance', desc: 'Understand your performance instantly.', icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    )
                  },
                  {
                    title: 'Share versions and visions', desc: 'Move faster without second-guessing the source or meaning.', icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                    )
                  }
                ]).map((c: any, i: number) => (
                  <div key={i} className="m-feature-block">
                    <div className="m-feature-icon">
                      {(c.icon && (typeof c.icon === 'string' && (c.icon.startsWith('http') || c.icon.startsWith('/') || c.icon.startsWith('data:')))) ? (
                        <img
                          src={c.icon}
                          alt={c.title}
                          className="object-contain"
                          style={{ height: content.iconSize ? `${content.iconSize}px` : '40px', width: content.iconSize ? `${content.iconSize}px` : '40px' }}
                        />
                      ) : (
                        typeof c.icon === 'string' ? (
                          <span style={{ fontSize: content.iconSize ? `${content.iconSize * 0.75}px` : '30px' }}>{c.icon}</span>
                        ) : (
                          c.icon
                        )
                      )}
                    </div>
                    <h3>{c.title}</h3>
                    <div className="summary">{c.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '48px' }} className="text-center">
                <button
                  onClick={() => content.primaryBtnUrl ? router.push(content.primaryBtnUrl) : undefined}
                  className="m-btn m-btn-primary"
                  style={{ padding: '14px 40px', borderRadius: '8px', fontSize: '15px' }}
                >
                  {content.primaryBtnText || 'Why choose Databox'}
                </button>
              </div>
            </div>
          </section>
        );

      case 'PRICING':
        return (
          <section className="m-section" style={{ background: '#fcfcfd' }} key={section.id}>
            <h2
              style={getStyle(content.titleSize, content.titleColor)}
              dangerouslySetInnerHTML={{ __html: content.title || 'Start for free, upgrade as you grow' }}
            ></h2>
            <p
              className="m-intro"
              style={getStyle(content.subtitleSize, content.subtitleColor)}
              dangerouslySetInnerHTML={{ __html: content.subtitle }}
            ></p>
            <div className="m-grid-container m-grid-3" style={{ marginTop: '15px' }}>
              {(content.items || [
                { title: 'Free', price: '0', desc: 'For individuals exploring data.', list: ['3 Dashboards', '1 App connection', 'Daily updates'] },
                { title: 'Starter', price: '47', desc: 'For small teams getting started.', list: ['Unlimited Dashboards', '5 App connections', 'Hourly updates', 'Priority support'] },
                { title: 'Professional', price: '135', desc: 'For growing agencies and teams.', list: ['Everything in Starter', 'White-labeling', 'API Access', 'Custom domain'] }
              ]).map((tier: any, i: number) => (
                <div key={i} className={`m-card-white ${i === 1 ? 'border-blue-500 ring-4 ring-blue-50' : ''}`}>
                  <h3 className="text-xl font-black mb-2">{tier.title}</h3>
                  <div className="text-4xl font-black mb-4">${tier.price}<span className="text-sm text-slate-400 font-medium">/mo</span></div>
                  <p className="text-sm text-slate-500 mb-8">{tier.desc}</p>
                  <ul className="m-list mb-8">
                    {(tier.list || []).map((li: string, j: number) => (
                      <li key={j} className="text-sm"><CheckIcon /> {li}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => tier.url ? router.push(tier.url) : (i === 0 ? router.push('/register') : handleDemo())}
                    className={`w-full m-btn ${i === 1 ? 'm-btn-primary' : 'm-btn-outline'}`}
                  >
                    {tier.btnText || (i === 0 ? 'Try It Free' : 'Get Started')}
                  </button>
                </div>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  // Helper to render Navigation
  const renderNav = (customContent?: any) => {
    let menuItems = (customContent?.menuItems && customContent.menuItems.length > 0)
      ? customContent.menuItems
      : getMenuData(cms, 'Header');

    // --- DEMO MEGA MENU DATA (Fallback if CMS is empty) ---
    const useDemoMenu = menuItems.length === 0 || (menuItems.length === 3 && menuItems[0].label === 'Özellikler' && !customContent?.menuItems);

    if (useDemoMenu) {
      menuItems = [
        {
          label: 'Products',
          link: '#',
          type: 'mega',
          sidebar: [
            { id: 'capabilities', label: 'Capabilities', active: true },
            { id: 'features', label: 'Features' },
            { id: 'integrations', label: 'Integrations' }
          ],
          content: [
            { icon: '🚀', title: 'Platform overview', desc: 'Explore how Periodya supports every step of your data journey.' },
            { icon: '🔌', title: 'Connect', desc: 'Integrate data from all your tools.' },
            { icon: '📊', title: 'Visualize', desc: 'Build interactive dashboards anyone can understand.' },
            { icon: '🤖', title: 'Automate', desc: 'Share performance updates automatically.' }
          ]
        },
        { label: 'Solutions', link: '#' },
        { label: 'Resources', link: '#' },
        { label: 'Pricing', link: '/pricing' }
      ];
    }

    const loginText = customContent?.loginText || 'Login';
    const loginUrl = customContent?.loginUrl || '/login';
    const primaryBtnText = customContent?.primaryBtnText || 'Ücretsiz Dene';
    const primaryBtnUrl = customContent?.primaryBtnUrl || '/register';
    const secondaryBtnText = customContent?.secondaryBtnText || 'Demo İste';
    const secondaryBtnUrl = customContent?.secondaryBtnUrl;

    return (
      <nav
        className={`m-nav ${scrolled ? 'scrolled' : ''}`}
        key={customContent ? 'nav-custom' : 'nav-default'}
        style={{
          backgroundColor: scrolled ? '#ffffff' : 'transparent',
          borderBottom: scrolled ? '1px solid rgba(0,0,0,0.05)' : 'none',
          transition: 'background-color 0.3s ease'
        }}
      >
        <div className="m-logo" style={{ background: 'transparent' }}>
          {cms?.settings?.logoUrl ? (
            <img
              src={cms.settings.logoUrl}
              alt="Logo"
              ref={(el) => {
                if (el) {
                  el.style.setProperty('background-color', 'transparent', 'important');
                  el.style.setProperty('max-width', '180px', 'important');
                  el.style.setProperty('max-height', '48px', 'important');
                  el.style.setProperty('width', 'auto', 'important');
                  el.style.setProperty('object-fit', 'contain', 'important');
                  el.style.setProperty('display', 'block', 'important');
                }
              }}
              style={{
                height: (customContent?.logoHeight || cms?.settings?.logoHeight) ? `${customContent?.logoHeight || cms.settings.logoHeight}px` : '40px',
              }}
            />
          ) : (
            <div className="m-logo-icon"><span></span><span></span><span></span></div>
          )}
          {!customContent?.hideTitle && (cms?.settings?.siteTitle || 'Periodya')}
        </div>

        {/* Main Navigation Links */}
        <div className="hidden md:flex gap-1 ml-12 h-full items-center">
          {menuItems.map((item: any, i: number) => (
            <div key={i} className="m-nav-item h-full flex items-center">
              <Link href={item.link || '#'} className="m-nav-link text-slate-700 font-bold">
                {item.label}
                {item.type === 'mega' && (
                  <svg className="m-nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                )}
              </Link>

              {/* MEGA MENU RENDERING */}
              {item.type === 'mega' && (
                <div className="m-mega-menu">
                  <div className="m-mega-layout">
                    {item.sidebar && item.sidebar.length > 0 && (
                      <div className="m-mega-sidebar">
                        <div className="m-mega-sidebar-title uppercase tracking-widest opacity-50 text-[10px] mb-4">Categories</div>
                        {item.sidebar.map((sb: any, idx: number) => {
                          const isLink = sb.link && sb.link !== '#';
                          const Element = isLink ? Link : 'div';
                          return (
                            <Element
                              key={idx}
                              href={isLink ? sb.link : undefined}
                              className={`m-mega-sidebar-item ${idx === 0 ? 'active' : ''} ${isLink ? 'hover:text-blue-600 transition' : ''}`}
                            >
                              {sb.label}
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </Element>
                          );
                        })}
                      </div>
                    )}
                    <div className="m-mega-content">
                      <div className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Explore Capabilities</div>
                      <div className="m-mega-grid">
                        {(item.content || []).map((c: any, cIdx: number) => (
                          <Link href={c.link || '#'} key={cIdx} className="m-mega-card">
                            <div className="m-mega-icon text-2xl flex items-center justify-center">
                              {c.icon && c.icon.length < 4 ? <span>{c.icon}</span> : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="16" x2="12" y2="12"></line>
                                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                              )}
                            </div>
                            <div className="m-mega-info">
                              <div className="m-mega-title">
                                {c.title}
                                {c.badge && <span className="m-mega-badge">{c.badge}</span>}
                              </div>
                              <div className="m-mega-desc">{c.desc}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4 ml-auto">
          <Link href={loginUrl} className="m-nav-login mr-2">
            {loginText}
          </Link>
          {secondaryBtnUrl && (
            <Link href={secondaryBtnUrl} className="m-btn m-btn-outline">
              {secondaryBtnText}
            </Link>
          )}
          <Link href={primaryBtnUrl} className="m-btn m-btn-primary shadow-lg shadow-blue-200">
            {primaryBtnText}
          </Link>
        </div>
      </nav>
    );
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  // Robust Footer Menu Logic
  let footerMenu = cms?.menus?.find((m: any) =>
    (m.name === 'Footer' || m.name?.toLowerCase() === 'footer') &&
    (m.items && Array.isArray(m.items) && m.items.length > 0)
  );
  if (!footerMenu) footerMenu = cms?.menus?.find((m: any) => m.name === 'Footer' || m.name?.toLowerCase() === 'footer');

  let footerMenuItems = footerMenu?.items;
  if (typeof footerMenuItems === 'string') {
    try { footerMenuItems = JSON.parse(footerMenuItems); } catch (e) { footerMenuItems = []; }
  }
  if (!Array.isArray(footerMenuItems)) footerMenuItems = [];

  const sections = cms?.sections || [];

  return (
    <div className="landing-page-root animate-in fade-in duration-700">
      {/* 0. Banner Logic: Ensure it's at the absolute top */}
      {sections.filter((s: any) => s.type === 'BANNER').map((s: any) => renderSection(s))}

      {/* Navigation */}
      {sections.some((s: any) => s.type === 'NAV')
        ? sections.filter((s: any) => s.type === 'NAV').map((s: any) => renderSection(s))
        : renderNav()
      }

      {/* Main Content Sections */}
      {/* 1. Hero Logic: If custom HERO exists, show it. Otherwise show default HERO. */}
      {sections.some((s: any) => s.type === 'HERO')
        ? sections.filter((s: any) => s.type === 'HERO').map((section: any) => renderSection(section))
        : (
          <header className="m-hero">
            <div className="m-hero-bg"></div>
            <div className="m-pill-row">
              <div className="m-pill">⭐ 4.4 | G2</div>
              <div className="m-pill">✨ 4.6 | CAPTERRA</div>
              <span className="text-[13px] text-slate-400 font-medium self-center ml-2">based on 1,000+ reviews</span>
            </div>
            <h1>Modern BI software for agencies <br />that need answers now</h1>
            <p>Empower your entire team to easily see, share and act on data — without the cost or complexity of legacy BI software.</p>
            <div className="m-hero-btns">
              <Link href="/register" className="m-btn m-btn-primary" style={{ padding: '14px 36px', fontSize: '15px' }}>Try It Free</Link>
              <button onClick={handleDemo} className="m-btn m-btn-outline" style={{ padding: '14px 36px', fontSize: '15px' }}>Book a Demo</button>
            </div>
            <div className="m-hero-note" style={{ color: '#667085', fontWeight: 700 }}>No card required</div>
            <div style={{ marginTop: '40px', position: 'relative', maxWidth: '1000px', margin: '40px auto 0' }}>
              <div className="m-card-white" style={{ padding: '20px', borderRadius: '24px' }}>
                <img src="https://databox.com/wp-content/uploads/2023/04/databox-dashboards.png" alt="Mockup" style={{ width: '100%', height: '320px', objectFit: 'cover', borderRadius: '16px' }} />
              </div>
            </div>
          </header>
        )
      }

      {/* 2. Other Content Sections (Exclude already rendered Nav, Banner, Footer, and Hero) */}
      {sections
        .filter((s: any) => s.type !== 'NAV' && s.type !== 'BANNER' && s.type !== 'FOOTER' && s.type !== 'HERO')
        .map((section: any) => renderSection(section))
      }

      {/* Global Footer (Dynamic Settings) */}
      {/* Footer */}
      {sections.some((s: any) => s.type === 'FOOTER')
        ? sections.filter((s: any) => s.type === 'FOOTER').map((s: any) => renderSection(s))
        : (
          <footer className="m-footer-dark">
            <div className="m-footer-grid">
              <div>
                <div className="m-logo" style={{ color: '#fff', marginBottom: '20px' }}>
                  <div className="m-logo-icon"><span></span><span></span><span></span></div>
                  {cms?.settings?.siteTitle || 'Periodya'}
                </div>
                <div className="m-footer-info">{cms?.settings?.siteTitle || 'Periodya'} Inc.</div>
                <div className="m-footer-info">Türkiye</div>

                <div className="m-footer-tagline mt-8">
                  İşletmenizi büyütmek için modern çözümler.
                </div>

                <div className="flex gap-4 mb-12 opacity-60">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="w-5 h-5 bg-white/20 rounded-full"></div>
                  ))}
                </div>
              </div>

              {footerMenuItems.length > 0 ? (
                <div className="m-footer-col">
                  <h5>Hızlı Erişim</h5>
                  <ul>
                    {footerMenuItems.map((item: any, i: number) => (
                      <li key={i}>
                        <Link href={item.link || '#'}>{item.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <>
                  <div className="m-footer-col">
                    <h5>Product</h5>
                    <ul>
                      <li>Overview</li>
                      <li>Integrations</li>
                      <li>Datasets</li>
                      <li>Metrics & KPIs</li>
                      <li>Dashboards</li>
                      <li>Reports</li>
                      <li>Benchmarks</li>
                      <li>Goals</li>
                      <li>Performance Management</li>
                    </ul>
                  </div>

                  <div className="m-footer-col">
                    <h5>Compare</h5>
                    <ul>
                      <li>vs. Tableau</li>
                      <li>vs. Power BI</li>
                      <li>vs. Looker Studio</li>
                      <li>vs. AgencyAnalytics</li>
                      <li>vs. Klipfolio</li>
                      <li>vs. Supermetrics</li>
                      <li>vs. Geckoboard</li>
                      <li>vs. Whatagraph</li>
                      <li>vs. Qlik</li>
                      <li>vs. DashThis</li>
                    </ul>
                  </div>

                  <div className="m-footer-col">
                    <h5>Company</h5>
                    <ul>
                      <li>About us</li>
                      <li>Why Databox</li>
                      <li>Careers</li>
                      <li>Product & Engineering</li>
                      <li>Talent Resources</li>
                      <li className="text-blue-400 font-bold">We're Hiring!</li>
                    </ul>
                  </div>

                  <div className="m-footer-col">
                    <h5>Support & Resources</h5>
                    <ul>
                      <li>Start Chat</li>
                      <li>Help Center</li>
                      <li>Databox Community</li>
                      <li>API Documentation</li>
                      <li>System Status</li>
                      <li>Blog</li>
                      <li>Become a Solutions Partner</li>
                      <li>Courses & Certifications</li>
                      <li>Product Updates</li>
                      <li>Affiliate Program</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
            <div style={{ marginTop: '100px', borderTop: '1px solid #1e293b', paddingTop: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              © {new Date().getFullYear()} {cms?.settings?.siteTitle || 'Periodya'} Inc. Tüm hakları saklıdır.
            </div>
          </footer>
        )
      }
    </div>
  );
}
