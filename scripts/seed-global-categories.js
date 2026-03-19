const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultCategories = [
  {
    name: "Elektronik",
    children: [
      {
        name: "Bilgisayar & Tablet",
        children: [
          { name: "Dizüstü Bilgisayar (Laptop)" },
          { name: "Masaüstü Bilgisayar" },
          { name: "Tablet" }
        ]
      },
      {
        name: "Telefon & Aksesuarlar",
        children: [
          { name: "Cep Telefonu" },
          { name: "Cep Telefonu Aksesuarları" },
          { name: "Giyilebilir Teknoloji (Akıllı Saat)" }
        ]
      }
    ]
  },
  {
    name: "Otomotiv & Yedek Parça",
    children: [
      {
        name: "Otomobil & Araç Modifiye",
        children: [
          { name: "Motor Yağları ve Sıvılar" },
          { name: "Fren & Süspansiyon" },
          { name: "Filtreler (Hava, Polen, Yağ)" }
        ]
      },
      {
        name: "Motosiklet",
        children: [
          { name: "Motosiklet Kaskı" },
          { name: "Motosiklet Aksesuar" }
        ]
      }
    ]
  },
  {
    name: "Giyim & Ayakkabı",
    children: [
      {
        name: "Kadın Giyim",
        children: [
          { name: "Elbise" },
          { name: "Tișört" }
        ]
      },
      {
        name: "Erkek Giyim",
        children: [
          { name: "Gömlek" },
          { name: "Pantolon" }
        ]
      }
    ]
  }
];

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function main() {
  console.log("Seeding Global Categories...");
  
  for (const rootCat of defaultCategories) {
    // Check if root exists
    const rootSlug = slugify(rootCat.name);
    let rootRecord = await prisma.globalCategory.findUnique({ where: { slug: rootSlug } });
    if (!rootRecord) {
      rootRecord = await prisma.globalCategory.create({
        data: { name: rootCat.name, slug: rootSlug }
      });
    }

    if (rootCat.children) {
      for (const subCat of rootCat.children) {
        const subSlug = slugify(subCat.name);
        let subRecord = await prisma.globalCategory.findUnique({ where: { slug: subSlug } });
        if (!subRecord) {
          subRecord = await prisma.globalCategory.create({
            data: { name: subCat.name, slug: subSlug, parentId: rootRecord.id }
          });
        }

        if (subCat.children) {
          for (const leafCat of subCat.children) {
            const leafSlug = slugify(leafCat.name);
            let leafRecord = await prisma.globalCategory.findUnique({ where: { slug: leafSlug } });
            if (!leafRecord) {
              await prisma.globalCategory.create({
                data: { name: leafCat.name, slug: leafSlug, parentId: subRecord.id }
              });
            }
          }
        }
      }
    }
  }

  console.log("Global categories seeded successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
