// اسم إصدار الكاش (قم بتغيير الرقم عند إجراء تحديثات كبيرة على ملفات HTML/CSS/JS)
const CACHE_NAME = 'app-cache-v4.9';

// الملفات الأساسية التي نريد الاحتفاظ بها ليعمل التطبيق بدون إنترنت
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
  // يمكنك إضافة مسارات الصور والأيقونات هنا مثل: '/icon-192.png'
];

// 1. حدث التثبيت (Install) - تخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
  // إجبار المتصفح على تنشيط النسخة الجديدة فوراً
  self.skipWaiting(); 
});

// 2. حدث التنشيط (Activate) - مسح الكاش القديم
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // السيطرة على كل الصفحات المفتوحة فوراً
  self.clients.claim();
});

// 3. حدث جلب البيانات (Fetch) - استراتيجية: الشبكة أولاً ثم الكاش (Network First)
self.addEventListener('fetch', (event) => {
  // تخطي طلبات الـ POST (مثل الاتصال بـ Google Apps Script) لعدم تعارضها مع الكاش
  if (event.request.method !== 'GET') {
    return;
  }

  // تخطي الطلبات التي تذهب إلى روابط خارجية (مثل CDNs و Google Fonts) لتقليل حجم الكاش 
  // (اختياري: يمكنك إزالة هذا الشرط إذا أردت تخزين مكتبات Tailwind و Alpine)
  if (!event.request.url.startsWith(self.location.origin)) {
      return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // التحقق من صحة الاستجابة
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // استنساخ الاستجابة لحفظها في الكاش وإرجاعها للمستخدم
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // في حالة انقطاع الإنترنت، جلب الملفات من الكاش
        console.log('[Service Worker] Network failed, serving from cache.');
        return caches.match(event.request);
      })
  );
});

// 4. الاستماع لرسائل التحديث من الواجهة الأمامية
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
