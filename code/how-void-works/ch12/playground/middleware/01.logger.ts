import { defineMiddleware } from 'chibivoid';

// すべてのリクエストで動くミドルウェア
export default defineMiddleware(async (c, next) => {
  const start = Date.now();
  await next();
  c.header('X-Response-Time', `${Date.now() - start}ms`);
  console.log(`${c.req.method} ${c.req.path} → ${c.res.status}`);
});
