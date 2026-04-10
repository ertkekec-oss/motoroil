const fs = require('fs');

const pageFile = 'src/app/(app)/settings/page.tsx';
let c1 = fs.readFileSync(pageFile, 'utf8');

if (!c1.includes('company_default_branch: appSettings')) {
    c1 = c1.replace(
        "company_district: appSettings.company_district || '',\r\n                company_phone: appSettings.company_phone || ''\r\n            });",
        "company_district: appSettings.company_district || '',\n                company_phone: appSettings.company_phone || '',\n                company_default_branch: appSettings.company_default_branch || ''\n            });"
    );
     c1 = c1.replace(
        "company_district: appSettings.company_district || '',\n                company_phone: appSettings.company_phone || ''\n            });",
        "company_district: appSettings.company_district || '',\n                company_phone: appSettings.company_phone || '',\n                company_default_branch: appSettings.company_default_branch || ''\n            });"
    );

    fs.writeFileSync(pageFile, c1);
    console.log("Patched page.tsx");
}

const formFile = 'src/app/(app)/settings/_components/forms/CompanyProfileForm.tsx';
let c2 = fs.readFileSync(formFile, 'utf8');

if (!c2.includes('Varsayılan Merkez Şube')) {
    c2 = c2.replace(
        `<ERPField label="Dahili İlçe">`,
        `<ERPField label="Varsayılan Şube (Default Branch)">
                                    <ERPSelect
                                        value={tempCompanyInfo?.company_default_branch || ''}
                                        onChange={(e: any) => setTempCompanyInfo({ ...tempCompanyInfo, company_default_branch: e.target.value })}
                                    >
                                        <option value="">Sabit Merkez Kelimesini Kullan</option>
                                        <option value="Merkez">Merkez</option>
                                        {(props.contextBranches || []).map((b: any) => (
                                            <option key={b.id} value={b.name}>{b.name}</option>
                                        ))}
                                    </ERPSelect>
                                </ERPField>
                                <ERPField label="Dahili İlçe">`
    );
    // make sure contextBranches is passed! It already is via `...sharedProps`!
    c2 = c2.replace('div className="grid grid-cols-1 md:grid-cols-2 gap-5"', 'div className="grid grid-cols-1 md:grid-cols-3 gap-5"');

    fs.writeFileSync(formFile, c2);
    console.log("Patched CompanyProfileForm.tsx");
}
