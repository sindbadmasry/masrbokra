const CACHE_NAME = 'masrbokra-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// تثبيت ملفات الكاش الأساسية
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// تفعيل وتنظيف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
});

// استراتيجية جلب البيانات: 
// للصفحة نستخدم الكاش، ولبيانات جوجل شيت نستخدم الإنترنت دائماً
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // لا تقم بعمل كاش لروابط جوجل شيت وسكريبت جوجل عشان البيانات تتحدث دايماً
  if (requestUrl.hostname.includes('google.com') || requestUrl.hostname.includes('googleusercontent.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // لباقي الملفات (HTML, CSS) استخدم Network First ثم الكاش
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
