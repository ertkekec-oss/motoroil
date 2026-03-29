const fs = require('fs');
const f = 'src/app/(app)/staff/me/page.tsx';
let c = fs.readFileSync(f, 'utf8');

// Fix bug in PayrollView: user?.id.slice -> user?.id?.slice
c = c.replace(/user\?\.id\.slice\(0, 8\)/g, 'user?.id?.slice(0, 8)');

// Fix bug in ProfileSettingsView: user?.id?.slice(0,6).toUpperCase() -> user?.id?.slice(0,6)?.toUpperCase()
c = c.replace(/user\?\.id\?\.slice\(0,6\)\.toUpperCase\(\)/g, 'user?.id?.slice(0,6)?.toUpperCase()');

// Fix border radius on profile picture wrapper
c = c.replace(/rounded-\[24px\] bg-gradient-to-br from-blue-500 to-indigo-600/g, 'rounded-[20px] bg-gradient-to-br from-blue-500 to-indigo-600');

// Replace EnterpriseCard with SoftContainer in ProfileSettingsView
const profile_rep = `<SoftContainer title="Profil & Güvenlik Ayarları" icon={<Lock className="w-4 h-4"/>} className="border-none ring-0 shadow-sm min-h-[400px]">`;
c = c.replace(/<EnterpriseCard className="border-none ring-0 shadow-sm rounded-\[32px\]">/, profile_rep);
c = c.replace(/<EnterpriseSectionHeader title="Profil & Güvenlik Ayarları" icon="⚙️" \/>/, '');
c = c.replace(/<\/EnterpriseCard>/g, '</SoftContainer>');

fs.writeFileSync(f, c);
console.log('done profile & slice fix');
