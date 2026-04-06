const fs = require('fs');

const path = 'src/components/landing/ModernLanding.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace Hero Title & Subtitle block
const oldBlock = `                        <h1 className="text-5xl md:text-[64px] lg:text-[72px] text-[#0E1528] leading-[1.1] tracking-tight mb-8">
                            <span className="font-light">E-Ticaret</span> <span className="font-bold">ve</span><br/>
                            <span className="font-bold">Ön Muhasebede</span><br/>
                            <span className="font-bold text-[#2563EB]">Üstün</span> <span className="font-light whitespace-nowrap">Sonuçlar</span>
                        </h1>
                        
                        <p className="text-slate-500 text-base md:text-lg mb-12 max-w-[480px] font-medium leading-relaxed">
                            Günümüzün rekabetçi ticaretinde, etkin ve düşük maliyetli yazılım çözümlerine olan ihtiyaç hiç bu kadar kritik olmamıştı.
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-6 relative">
                            <Link href="/register" className="px-8 py-3.5 bg-[#2563EB] text-white text-[15px] font-bold rounded-sm shadow-[0_15px_30px_rgba(37,99,235,0.25)] hover:-translate-y-1 transition-transform">
                                Ücretsiz Başla
                            </Link>`.replace(/\r\n/g, '\n');

const newBlock = `                        <h1 
                            className="text-5xl md:text-[64px] lg:text-[72px] text-[#0E1528] leading-[1.1] tracking-tight mb-8"
                            dangerouslySetInnerHTML={{ __html: heroTitle }}
                        ></h1>
                        
                        <p 
                            className="text-slate-500 text-base md:text-lg mb-12 max-w-[480px] font-medium leading-relaxed" 
                            dangerouslySetInnerHTML={{ __html: heroSubtitle }}
                        ></p>
                        
                        <div className="flex flex-wrap items-center gap-6 relative">
                            <Link href="/register" className="px-8 py-3.5 bg-[#2563EB] text-white text-[15px] font-bold rounded-sm shadow-[0_15px_30px_rgba(37,99,235,0.25)] hover:-translate-y-1 transition-transform">
                                {heroBtnText}
                            </Link>`;

content = content.replace(/\r\n/g, '\n');
if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
} else {
    console.error("oldBlock not found in content");
}

const oldImg = `<img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80" alt="Business Professional" className="w-full h-[500px] object-cover rounded-t-[115px] rounded-b-[38px] grayscale-[0.3]" />`;
const newImg = `<img src={visualUrl} alt="Hero Visual" className="w-full h-[500px] object-cover rounded-t-[115px] rounded-b-[38px] grayscale-[0.3]" />`;
content = content.replace(oldImg, newImg);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated ModernLanding");
