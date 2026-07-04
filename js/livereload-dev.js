// =========================================================
// Dev-only live reload: работает только на localhost/127.0.0.1,
// не подключается на реальном GitHub Pages деплое.
// Опрашивает файлы страницы и перезагружает вкладку при изменении.
// =========================================================

(function () {
  if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;

  const watched = [
    location.pathname,
    "/css/main.css",
    "/css/present-simple.css",
    "/js/main.js",
    "/js/present-simple.js",
  ];

  const stamps = {};

  async function checkOne(url) {
    try {
      const res = await fetch(url, { method: "HEAD", cache: "no-store" });
      return res.headers.get("Last-Modified") || res.headers.get("ETag") || res.headers.get("Content-Length");
    } catch (e) {
      return null;
    }
  }

  async function poll() {
    for (const url of watched) {
      const stamp = await checkOne(url);
      if (!stamp) continue;

      if (stamps[url] && stamps[url] !== stamp) {
        location.reload();
        return;
      }
      stamps[url] = stamp;
    }
  }

  setInterval(poll, 1000);
})();
