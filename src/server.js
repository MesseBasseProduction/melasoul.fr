const express = require('express');
const path = require('path');
const compression = require('compression');
const zlib = require('node:zlib');

// App and preferences
const APP_VERSION = '1.3.0';
const APP_NAME = 'Melasoul.fr';
const APP_PORT = 8025;

// Log server start
console.log(`${(new Date()).toISOString()} | ${APP_NAME} v${APP_VERSION} | Starting web server`);
const app = express();

// Ensure responses are compressed through this midleware
app.use(compression({
  level: zlib.constants.Z_BEST_COMPRESSION,
}));

// URL definitions
app.use('/assets', express.static(path.join(__dirname, '../assets'), { // Serve static files
  maxAge: '864000000' // 10 days caching for app assets
}));

// Page urls
app.get(['/', '/index', '/index.html'],  (req, res) => {
  console.log(`${(new Date()).toISOString()} | ${APP_NAME} v${APP_VERSION} | HTTP 200 ${req.url} page requested, return index.html`);
  res.sendFile(path.join(__dirname, '../assets/html/index.html'));
});

// Send / for all urls, avoid 404
app.use((req, res) => {
  console.log(`${(new Date()).toISOString()} | ${APP_NAME} v${APP_VERSION} | HTTP 404 ${req.url} page requested, return index.html`);
  res.sendFile(path.join(__dirname, '../assets/html/index.html'));
});

// Start server console
app.listen(APP_PORT, () => {
  console.log(`${(new Date()).toISOString()} | ${APP_NAME} v${APP_VERSION} | Server started and listening on port ${APP_PORT}`);
});
