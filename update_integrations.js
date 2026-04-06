const fs = require('fs');
let c = fs.readFileSync('src/app/(app)/admin/integrations/page.tsx', 'utf8');

c = c.replace(/isNative: false, \/\/ route to old/g, 'isNative: true,');

const modalTargetStr = `{activeModal.category === 'SHIPPING' && (`;

const newInputs = `
                             {activeModal.category === 'EMAIL' && (
                                 <div className="space-y-4">
                                     <EnterpriseInput 
                                        label="SMTP Email Adresi" 
                                        required 
                                        value={formData.credentials?.email || ''}
                                        onChange={(e: any) => setFormData({...formData, credentials: {...formData.credentials, email: e.target.value}})}
                                     />
                                     <EnterpriseInput 
                                        label="Uygulama Şifresi (App Password)" 
                                        type="password"
                                        required 
                                        value={formData.credentials?.password || ''}
                                        onChange={(e: any) => setFormData({...formData, credentials: {...formData.credentials, password: e.target.value}})}
                                     />
                                 </div>
                             )}

                             {activeModal.category === 'SMS' && (
                                 <div className="space-y-4">
                                     <EnterpriseInput 
                                        label="Kullanıcı Adı (Usercode)" 
                                        required 
                                        value={formData.credentials?.usercode || ''}
                                        onChange={(e: any) => setFormData({...formData, credentials: {...formData.credentials, usercode: e.target.value}})}
                                     />
                                     <EnterpriseInput 
                                        label="API Şifresi (Password)" 
                                        type="password"
                                        required 
                                        value={formData.credentials?.password || ''}
                                        onChange={(e: any) => setFormData({...formData, credentials: {...formData.credentials, password: e.target.value}})}
                                     />
                                 </div>
                             )}

                             `;

if (c.includes(modalTargetStr)) {
    c = c.replace(modalTargetStr, newInputs + modalTargetStr);
    fs.writeFileSync('src/app/(app)/admin/integrations/page.tsx', c, 'utf8');
    console.log("Successfully updated integrations page Modal!");
} else {
    console.log("Failed to find insertion point inside page.tsx!");
}
