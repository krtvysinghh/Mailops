import { Context, Next } from 'hono';

export const compression = () => {
  return async (c: Context, next: Next) => {
    await next();

    const acceptEncoding = c.req.header('Accept-Encoding') || '';
    if (!acceptEncoding) return;

    let algorithm: 'gzip' | 'deflate' | null = null;
    if (acceptEncoding.includes('gzip')) {
      algorithm = 'gzip';
    } else if (acceptEncoding.includes('deflate')) {
      algorithm = 'deflate';
    }

    if (!algorithm) return;

    const response = c.res;
    if (!response || !response.body) return;

    // Check if we should compress
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('text') && !contentType.includes('json')) return;

    // Stream compression (native Web API)
    // Need to ignore TS error as CompressionStream might not be in standard DOM types without dom.iterable/dom.asynciterable
    // @ts-ignore
    const compressionStream = new CompressionStream(algorithm);
    const compressedStream = response.body.pipeThrough(compressionStream);

    c.res = new Response(compressedStream, {
      headers: new Headers(response.headers)
    });
    c.res.headers.set('Content-Encoding', algorithm);
    c.res.headers.delete('Content-Length');
  };
};
