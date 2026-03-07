// في كل مرة تقوم بتعديل الموقع، قم بتغيير هذا الرقم (مثلاً v2, v3, وهكذا) 
// هذا التغيير هو ما يخبر المتصفح أن هناك تحديثاً جديداً!
const CACHE_NAME = 'masrbokra-v2'; 

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 1. تثبيت الملفات
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

// 2. تفعيل وتنظيف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  // تأكيد أن الـ Service Worker الجديد يمسك زمام الأمور فوراً
  self.clients.claim(); 
});

// 3. الاستماع لأمر التحديث الفوري القادم من ملف HTML
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. استراتيجية جلب البيانات (Network First للملفات الأساسية)
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // استثناء روابط جوجل شيت (تأتي من الإنترنت دائماً ولا تحفظ بالكاش)
  if (requestUrl.hostname.includes('google.com') || requestUrl.hostname.includes('googleusercontent.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // لباقي الملفات: حاول جلبها من الإنترنت أولاً (لضمان أحدث نسخة)، 
  // وإذا كان الإنترنت مفصولاً، استخدم الكاش
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
