const express = require('express');
const path = require('path');

const app = express();
const port = Number(process.env.PORT || 8080);
const distDir = path.join(__dirname, 'dist');

app.disable('x-powered-by');
app.use(express.static(distDir, { index: false, maxAge: '1h' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'producto-frontend' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`producto-frontend listening on ${port}`);
});
