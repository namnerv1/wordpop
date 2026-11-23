/* WordPop service worker — ดูแลเฉพาะไฟล์ของ WordPop เท่านั้น */
const VERSION = 'V0.2.0';
const CACHE = 'wordpop-' + VERSION;
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // ลบเฉพาะแคชเก่าของ WordPop เอง ไม่แตะแคชของแอปอื่น
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('wordpop-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                 // ไม่ยุ่งกับเว็บอื่น
  if (req.mode === 'navigate'){
    // เปิดหน้าแอป: ลองเน็ตก่อน (ได้เวอร์ชันใหม่) ถ้าไม่มีเน็ต → ใช้ตัวที่เก็บไว้
    e.respondWith(fetch(req).then(res => {
      if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
      return res;
    }).catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
    return;
  }
  // ไฟล์อื่น (ไอคอน, manifest): ใช้ตัวที่เก็บไว้ก่อน
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
