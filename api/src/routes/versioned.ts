import { Hono } from 'hono';

export const createVersionedRouter = () => {
  const router = new Hono();
  
  const v1 = new Hono();
  v1.get('/ping', (c) => c.text('pong v1'));
  
  const v2 = new Hono();
  v2.get('/ping', (c) => c.json({ message: 'pong', version: 2 }));

  router.route('/v1', v1);
  router.route('/v2', v2);

  // Content negotiation based on Accept header
  router.get('/ping', (c) => {
    const accept = c.req.header('Accept') || '';
    if (accept.includes('application/vnd.mailops.v2+json')) {
      return c.json({ message: 'pong', version: 2 });
    }
    return c.text('pong v1');
  });

  return router;
};
