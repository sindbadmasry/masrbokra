// اسم الكاش - قم بتغيير الرقم (v1, v2...) عند تحديث الموقع ليحس المستخدم بالتغيير فوراً
const CACHE_NAME = 'masrbokra-cache-v1';

// الملفات التي سيتم حفظها للعمل بدون إنترنت
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 1. مرحلة التثبيت: حفظ الملفات الأساسية في الكاش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('جاري حفظ ملفات النظام في الكاش...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. مرحلة التفعيل: حذف الكاش القديم عند تحديث الإصدار
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('جاري حذف الكاش القديم:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // السيطرة على الصفحة فوراً
  self.clients.claim();
});

// 3. الاستجابة لأمر التحديث الفوري (SKIP_WAITING)
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. استراتيجية جلب البيانات (Network First مع Fallback to Cache)
self.addEventListener('fetch', (event) => {
  // استثناء روابط جوجل شيت حتى لا يتم تخزين بيانات قديمة (نحتاج دائماً أحدث حضور)
  if (event.request.url.includes('google.com') || event.request.url.includes('googleusercontent.com')) {
    return; // دع المتصفح يتعامل معها عبر الإنترنت فقط
  }

  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // إذا فشل الإنترنت، ابحث عن الملف في الكاش
        return caches.match(event.request);
      })
  );
});
