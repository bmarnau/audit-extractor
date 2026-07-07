const express = require('express');
const app = express();

console.log('[TEST] Creating app...');

// Middleware 1
app.use((req, res, next) => {
  console.log(`[TEST Middleware 1] ${req.method} ${req.path}`);
  next();
});

console.log('[TEST] Added middleware 1');

// Route
app.get('/test', (req, res) => {
  console.log('[TEST Route] /test hit');
  res.json({ message: 'test route' });
});

console.log('[TEST] Added route /test');

// Middleware 2
app.use((req, res, next) => {
  console.log(`[TEST Middleware 2] ${req.method} ${req.path}`);
  next();
});

console.log('[TEST] Added middleware 2');

// 404 handler
app.use((req, res) => {
  console.log(`[TEST 404] ${req.method} ${req.path}`);
  res.status(404).json({ error: 'not found' });
});

console.log('[TEST] Added 404 handler');

app.listen(3001, () => {
  console.log('[TEST] Server listening on 3001');
});
