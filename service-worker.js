const version = "0.0.1";
const cacheName = `yahm-supervisor-${version}`;
self.addEventListener('install', function(event) {
    console.log("Installing and caching");
});

self.addEventListener('fetch', function(event) {});