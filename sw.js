const CACHE_NAME = 'masrbokra-cache-v4.1'; // قمت بزيادة الإصدار للتحديث

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 1. التثبيت مع معالجة الأخطاء
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('جاري محاولة حفظ الملفات...');
      // نستخدم catch للتأكد من أن خطأ في ملف واحد لا يوقف العملية
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.error('فشل حفظ بعض الملفات في الكاش، تأكد من وجود الأيقونات:', err);
      });
    })
  );
});

// 2. التفعيل وحذف القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. معالجة الطلبات (الاستراتيجية المحسنة)
self.addEventListener('fetch', (event) => {
  // استثناء روابط جوجل (جوجل شيت)
  if (event.request.url.includes('google.com') || event.request.url.includes('googleusercontent.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        // إذا فشل الإنترنت، نبحث في الكاش
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // إذا لم يجد الملف في الكاش أيضاً، نعيد استجابة فارغة أو رسالة بدلاً من undefined
          return new Response('عذراً، هذا المحتوى غير متوفر بدون إنترنت.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
          });
        });
      })
  );
});
