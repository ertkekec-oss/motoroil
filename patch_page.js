const fs = require('fs');

const file_path = 'src/app/(app)/inventory/page.tsx';
let content = fs.readFileSync(file_path, 'utf8');

const oldCode = `        if (productsToImport.length > 0) {
          showSuccess(
            "Yükleniyor...",
            \`\${productsToImport.length} ürün işleniyor, lütfen bekleyin.\`,
          );

          const res = await fetch("/api/products/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ products: productsToImport }),
          });

          const result = await res.json();

          if (result.success) {
            // Refresh products from server
            const pRes = await fetch("/api/products");
            const pData = await pRes.json();
            if (pData.success) setProducts(pData.products);

            showSuccess(
              "İşlem Tamamlandı",
              \`\${result.results.created} yeni ürün eklendi. \${result.results.updated} ürün güncellendi.\` +
              (result.results.errors.length > 0
                ? \`\\n\${result.results.errors.length} hata oluştu.\`
                : ""),
            );
          } else {
            showError("Yükleme Hatası", result.error || "Bilinmeyen hata");
          }
        } else {
          showWarning(
            "Geçerli Ürün Bulunamadı",
            "Dosyada eklenecek geçerli ürün verisi bulunamadı.",
          );
        }`;

const newCode = `        if (productsToImport.length > 0) {
          showConfirm(
            "Yapay Zeka Kategori Ataması",
            \`Toplu yüklenen \${productsToImport.length} ürün için kategoriler yapay zeka tarafından otomatik eşleştirilecektir. Dilerseniz ürünler yüklendikten sonra ürün sayfasından kategori değişimini manuel yapabilirsiniz.\`,
            async () => {
              showSuccess(
                "Yükleniyor...",
                \`\${productsToImport.length} ürün işleniyor, lütfen bekleyin.\`,
              );
    
              try {
                const res = await fetch("/api/products/import", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ products: productsToImport }),
                });
    
                const result = await res.json();
    
                if (result.success) {
                  // Refresh products from server
                  const pRes = await fetch("/api/products");
                  const pData = await pRes.json();
                  if (pData.success) setProducts(pData.products);
    
                  showSuccess(
                    "İşlem Tamamlandı",
                    \`\${result.results.created} yeni ürün eklendi. \${result.results.updated} ürün güncellendi.\` +
                    (result.results.errors.length > 0
                      ? \`\\n\${result.results.errors.length} hata oluştu.\`
                      : ""),
                  );
                } else {
                  showError("Yükleme Hatası", result.error || "Bilinmeyen hata");
                }
              } catch(e) {
                 showError("Hata", "Toplu yükleme sırasında hata oluştu.");
              } finally {
                 setIsProcessing(false);
              }
            }
          );
        } else {
          showWarning(
            "Geçerli Ürün Bulunamadı",
            "Dosyada eklenecek geçerli ürün verisi bulunamadı.",
          );
          setIsProcessing(false);
        }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(file_path, content, 'utf8');
console.log('Done!');
