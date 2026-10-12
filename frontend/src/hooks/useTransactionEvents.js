import { useEffect, useRef, useState } from 'react';

/**
 * Subscribes to the backend's Server-Sent Events stream (/api/events) and
 * invokes the handlers for created/updated transaction events.
 *
 * Returns { connected } so the UI can show a live indicator.
 */
export function useTransactionEvents({ onCreated, onUpdated } = {}) {
  const [connected, setConnected] = useState(false);
  const handlers = useRef({ onCreated, onUpdated });

  // Keep the latest handlers without re-opening the stream.
  useEffect(() => {
    handlers.current = { onCreated, onUpdated };
  }, [onCreated, onUpdated]);

  useEffect(() => {
    const es = new EventSource('/api/events');

    es.addEventListener('connected', () => setConnected(true));
    es.addEventListener('created', (e) => {
      try {
        handlers.current.onCreated?.(JSON.parse(e.data));
      } catch {
        /* ignore malformed */
      }
    });
    es.addEventListener('updated', (e) => {
      try {
        handlers.current.onUpdated?.(JSON.parse(e.data));
      } catch {
        /* ignore malformed */
      }
    });
    es.onerror = () => setConnected(false);

    return () => {
      es.close();
      setConnected(false);
    };
  }, []);

  return { connected };
}
