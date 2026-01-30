#!/bin/bash

# MOTOROIL ERP - Natro Quick Deploy Script
# Bu script Natro sunucusunda çalıştırılmalıdır

echo "🚀 MOTOROIL ERP Deployment Başlıyor..."

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Node.js versiyonu kontrolü
echo -e "${YELLOW}📌 Node.js versiyonu kontrol ediliyor...${NC}"
node --version
npm --version

# 2. Bağımlılıkları yükle
echo -e "${YELLOW}📦 Bağımlılıklar yükleniyor...${NC}"
npm install --production

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Bağımlılıklar başarıyla yüklendi${NC}"
else
    echo -e "${RED}❌ Bağımlılık yüklemesi başarısız!${NC}"
    exit 1
fi

# 3. Build işlemi
echo -e "${YELLOW}🔨 Production build yapılıyor...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build başarılı${NC}"
else
    echo -e "${RED}❌ Build başarısız!${NC}"
    exit 1
fi

# 4. Log klasörü oluştur
echo -e "${YELLOW}📁 Log klasörü oluşturuluyor...${NC}"
mkdir -p logs

# 5. PM2 kontrolü
if ! command -v pm2 &> /dev/null
then
    echo -e "${YELLOW}📥 PM2 yükleniyor...${NC}"
    npm install -g pm2
fi

# 6. Eski instance'ı durdur
echo -e "${YELLOW}🛑 Eski instance durduruluyor...${NC}"
pm2 delete motoroil 2>/dev/null || true

# 7. Yeni instance'ı başlat
echo -e "${YELLOW}▶️  Uygulama başlatılıyor...${NC}"
pm2 start ecosystem.config.json

# 8. PM2 startup
echo -e "${YELLOW}🔄 PM2 otomatik başlatma ayarlanıyor...${NC}"
pm2 startup
pm2 save

# 9. Status kontrolü
echo -e "${YELLOW}📊 Uygulama durumu:${NC}"
pm2 status

echo -e "${GREEN}✅ Deployment tamamlandı!${NC}"
echo -e "${GREEN}🌐 Site: https://motoroil.natro.app${NC}"
echo -e "${YELLOW}📝 Logları izlemek için: pm2 logs motoroil${NC}"
