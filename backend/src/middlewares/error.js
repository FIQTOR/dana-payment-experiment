/** Central error handler — keeps responses consistent. */
export function errorHandler(err, _req, res, _next) {
  const status = err.response?.status || err.status || 500;
  const payload = {
    success: false,
    error: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Something went wrong',
  };

  // Surface DANA API error bodies when available.
  if (err.response?.data) {
    payload.danaError = err.response.data;
  }

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json(payload);
}

/** 404 handler for unknown API routes. */
export function notFound(_req, res) {
  res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Route not found' });
}
