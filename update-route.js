const fs = require('fs');
const path = 'src/app/api/admin/website/route.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    'Use AI to <strong>talk to your data</strong> and move from insights to action faster. 👆',
    'Periodya Enterprise ile tanışın. <strong>E-Ticaret ve Ön Muhasebe yönetiminizi tek ekrandan yapın!</strong> 👆'
).replace(
    'Modern BI software for agencies <br />that need answers now',
    'E-Ticaret ve <br />Ön Muhasebede <br /><span class="text-[#2563EB]">Üstün</span> Sonuçlar'
).replace(
    'Empower your entire team to easily see, share and act on data — without the cost or complexity of legacy BI software.',
    'Günümüzün rekabetçi ticaretinde, etkin ve düşük maliyetli yazılım çözümlerine olan ihtiyaç hiç bu kadar kritik olmamıştı.'
).replace(
    />Try It Free</g,
    '>Ücretsiz Başla<'
).replace(
    /'Try It Free'/g,
    "'Ücretsiz Başla'"
).replace(
    /'https:\/\/databox.com\/wp-content\/uploads\/2023\/04\/databox-dashboards.png'/g,
    "'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80'"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Updated route.ts default texts');
