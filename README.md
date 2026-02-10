# AppSport Admin Dashboard

لوحة تحكم المدير لتطبيق AppSport - واجهة ويب كاملة لإدارة جميع وظائف التطبيق.

## المتطلبات

- **Node.js** >= 18
- **Backend API** يعمل على `http://localhost:3000` (أو عنوان الخادم الحقيقي)

## التشغيل المحلي (Development)

```bash
# 1. نسخ ملف الإعدادات
cp .env.example .env.local

# 2. تعديل NEXT_PUBLIC_API_URL في .env.local

# 3. تثبيت المكتبات
npm install --legacy-peer-deps

# 4. تشغيل
npm run dev
```

يفتح على: `http://localhost:3000`

## النشر على الخادم الحقيقي (Production)

### الطريقة 1: Node.js + PM2 (موصى به)

```bash
# 1. على الخادم، انسخ المشروع
git clone <repo> && cd admin-dashboard

# 2. أنشئ ملف .env.local
echo "NEXT_PUBLIC_API_URL=https://your-api-domain.com/api" > .env.local

# 3. ثبّت المكتبات وابنِ
npm ci --legacy-peer-deps
npm run build

# 4. انسخ الملفات الثابتة
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

# 5. شغّل بـ PM2
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### الطريقة 2: Docker

```bash
docker build -t admin-dashboard .
docker run -d \
  -p 3001:3001 \
  -e NEXT_PUBLIC_API_URL=https://your-api-domain.com/api \
  --name admin-dashboard \
  admin-dashboard
```

### الطريقة 3: Windows Server

```cmd
deploy.bat
set PORT=3001
set HOSTNAME=0.0.0.0
node .next\standalone\server.js
```

## إعداد Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## البورتات

| الخدمة | البورت |
|--------|--------|
| Backend API | 3000 |
| Admin Dashboard | 3001 |

## الصفحات

| الصفحة | الوظيفة |
|--------|---------|
| `/login` | تسجيل دخول المدير |
| `/` | لوحة الإحصائيات |
| `/matches` | إدارة المباريات |
| `/teams` | إدارة الفرق واللاعبين |
| `/competitions` | إدارة المسابقات |
| `/users` | إدارة المستخدمين |
| `/operators` | إدارة المشغلين |
| `/store/products` | إدارة المنتجات |
| `/store/categories` | إدارة الأقسام |
| `/store/banners` | إدارة البانرات |
| `/orders` | إدارة الطلبات |
| `/news` | إدارة الأخبار |
| `/sliders` | إدارة السلايدر |
| `/legal` | إدارة الصفحات القانونية |
| `/events` | سجل الأحداث |
