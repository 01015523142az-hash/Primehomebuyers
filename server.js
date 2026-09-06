const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Prevent direct access to internal project config files
app.use((req, res, next) => {
  const blocked = ['/package.json', '/package-lock.json', '/server.js', '/metadata.json', '/.env', '/.env.example'];
  if (blocked.includes(req.path) || req.path.startsWith('/node_modules') || req.path.startsWith('/.git')) {
    return res.status(404).send('Not Found');
  }
  next();
});

// Serve static assets and html files from the root directory
app.use(express.static(__dirname, {
  extensions: ['html', 'htm']
}));

// Route fallback: for any unmatched paths, serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`PrimeHome Buyers server listening on http://${HOST}:${PORT}`);
});
