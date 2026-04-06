const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'landing', 'ModernLanding.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
content = content.replace("import LoginSpotlight from './LoginSpotlight';\nimport Login3DHoloCard from './Login3DHoloCard';", "import LoginHoloModal from './LoginHoloModal';");

// 2. Component Call
content = content.replace("<LoginSpotlight isOpen={isLoginOpen} setIsOpen={setIsLoginOpen} />", "<LoginHoloModal isOpen={isLoginOpen} setIsOpen={setIsLoginOpen} />");

// 3. Revert Hero block (Concept 3 removal)
content = content.replace(
    /\{\/\* Main Subject Card \(Holo Login Concept\) \*\/\}[\s\S]*?<Login3DHoloCard \/>[\s\S]*?<\/div>/,
    `{/* Main Subject Card (Rounded Arches) */}
                        <div className="w-[85%] max-w-[420px] bg-white rounded-t-[120px] rounded-b-[40px] p-1.5 pb-0 shadow-[0_30px_60px_rgba(0,0,0,0.05)] relative z-20">
                            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80" alt="Business Professional" className="w-full h-[500px] object-cover rounded-t-[115px] rounded-b-[38px] grayscale-[0.3]" />
                        </div>`
);

// 4. Revert Bento Grid Cyan Box (Concept 2 removal) -> Careful with regex matching multiple divs
content = content.replace(
    /\{\/\* Concept 2: Inline Bento Widget Login \*\/\}[\s\S]*?Konsept 2: Bento Kutu[\s\S]*?<\/div>\r?\n\s+<\/div>/,
    `{/* Bottom Left: Cyan Card */}
                            <div className="md:col-span-4 h-[240px] rounded-md bg-[#BCEBFA] p-6 flex flex-col justify-between shadow-sm">
                                <div className="flex -space-x-2">
                                    <img src="https://i.pravatar.cc/100?img=4" className="w-8 h-8 rounded-full border border-[#A8F0FF]" alt="User" />
                                    <img src="https://i.pravatar.cc/100?img=5" className="w-8 h-8 rounded-full border border-[#A8F0FF]" alt="User" />
                                    <img src="https://i.pravatar.cc/100?img=6" className="w-8 h-8 rounded-full border border-[#A8F0FF]" alt="User" />
                                </div>
                                <div>
                                    <h3 className="text-[#0E1528] text-[42px] font-medium leading-none mb-2">30x</h3>
                                    <p className="text-[#0E1528]/80 text-[14px] font-medium italic leading-snug">Zaman tasarrufu sağlayan kusursuz altyapı.</p>
                                </div>
                            </div>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned up temp concepts and applied HoloModal successfully.');
