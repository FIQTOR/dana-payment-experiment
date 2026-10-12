/** Capture the raw body for webhook signature verification. */
export function rawBodySaver(req, _res, buf) {
  if (buf && buf.length) req.rawBody = buf;
}
