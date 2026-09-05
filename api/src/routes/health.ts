import { Hono } from 'hono';

const healthRouter = new Hono<{ Bindings: { DB: any } }>();

const startTime = Date.now();

healthRouter.get('/', async (c) => {
  let dbStatus = 'ok';
  
  try {
    if (c.env && c.env.DB) {
      await c.env.DB.prepare('SELECT 1').run();
    } else {
      dbStatus = 'unavailable';
    }
  } catch (e) {
    dbStatus = 'error';
  }

  const uptime = Math.floor((Date.now() - startTime) / 1000);

  return c.json({
    status: 'ok',
    uptime,
    version: '1.0.0',
    db: dbStatus,
    timestamp: new Date().toISOString()
  });
});

export default healthRouter;
