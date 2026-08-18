/* Service worker mínimo: solo existe para que el navegador permita "Instalar" la app
   en el móvil y para que abra un poco más rápido la segunda vez. NO guarda tus fotos
   ni tus documentos, ni funciona sin conexión para nada que hable con Google Drive
   (eso siempre necesita internet). Solo cachea el "cascarón" de la propia aplicación:
   el HTML, el manifest y los iconos. */
var CACHE_NAME = 'archivo-familiar-v1';
var ARCHIVOS_APP = ['./index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', function(evento){
  evento.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(ARCHIVOS_APP); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(evento){
  evento.waitUntil(
    caches.keys().then(function(nombres){
      return Promise.all(nombres.filter(function(n){return n!==CACHE_NAME;}).map(function(n){return caches.delete(n);}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(evento){
  var url = evento.request.url;
  // Solo se sirve desde caché el propio archivo de la app (mismo origen). Todo lo demás
  // (Google Drive, Google Identity, las librerías de terceros) siempre va a la red:
  // nunca queremos servir una foto o un dato antiguo desde una caché.
  if(evento.request.method !== 'GET' || url.indexOf(self.location.origin) !== 0){
    return;
  }
  evento.respondWith(
    caches.match(evento.request).then(function(respuestaCache){
      var redFetch = fetch(evento.request).then(function(respuestaRed){
        if(respuestaRed && respuestaRed.ok){
          var copia = respuestaRed.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(evento.request, copia); });
        }
        return respuestaRed;
      }).catch(function(){ return respuestaCache; });
      return respuestaCache || redFetch;
    })
  );
});
