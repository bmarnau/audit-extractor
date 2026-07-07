const express = require('express');
const app = express();

// Response wrapper middleware
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    console.log('[Wrapper] Wrapping response for', req.path);
    return originalJson.call(this, { wrapped: true, original: data });
  };
  next();
});

// Debug middleware
app.use((req, res, next) => {
  console.log('[Main] Request to:', req.path);
  next();
});

// Create a test router
const testRouter = express.Router();

testRouter.use((req, res, next) => {
  console.log('[TestRouter middleware] Request to:', req.path);
  next();
});

testRouter.post('/test', (req, res) => {
  console.log('[TestRouter handler] POST /test called');
  res.json({ message: 'Test endpoint works' });
});

// Mount the router
app.use('/api/test', testRouter);
console.log('Router mounted at /api/test');

// 404 handler
app.use((req, res) => {
  console.log('[404] No route found for', req.method, req.path);
  res.status(404).json({ error: 'Not found' });
});

app.listen(3001, () => {
  console.log('Test server on port 3001');
  console.log('Try: POST http://localhost:3001/api/test/test');
});
