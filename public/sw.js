/* Service worker mínimo: cacheia estáticos e páginas visitadas.
   Não intercepta /api. Estratégia network-first para navegação. */
const CACHE = "tjsp-escrevente-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copia));
          return resposta;
        })
        .catch(() =>
          caches.match(request).then((cacheada) => cacheada || caches.match("/")),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cacheada) => {
      if (cacheada) return cacheada;
      return fetch(request).then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copia));
        }
        return resposta;
      });
    }),
  );
});
