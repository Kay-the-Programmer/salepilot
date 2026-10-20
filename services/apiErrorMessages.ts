/**
 * What to tell someone when a request fails.
 *
 * Most screens surface `err.message` straight into a toast, so whatever this
 * produces is read by a shopkeeper mid-queue. It used to be the raw response
 * body — sometimes a stack trace, sometimes an HTML error page — or "Request
 * failed with status 500", which says what happened to the computer rather
 * than what has happened to their sale.
 *
 * Each message below says what went wrong AND what to do about it, because an
 * error a person cannot act on is just an interruption. Where it matters they
 * are told whether their work was saved, since that is the real question:
 * "do I ring this up again?"
 *
 * Kept apart from `api.ts` so it is pure: no transport, no IndexedDB, nothing
 * that needs a browser. That makes the wording directly testable.
 */

const STATUS_MESSAGE: Record<number, string> = {
  400: 'Some of those details weren’t right. Check what you entered and try again.',
  403: 'You don’t have permission to do that. Ask the shop owner to give you access.',
  404: 'We couldn’t find that — it may have been deleted. Refresh the page and try again.',
  408: 'That took too long. Check your connection and try again.',
  409: 'Someone else changed this while you were working on it. Refresh to see the latest, then try again.',
  413: 'That file is too big. Try a smaller one.',
  422: 'Some of those details weren’t right. Check what you entered and try again.',
  429: 'That was a lot of tries at once. Wait a minute, then try again.',
  500: 'Something went wrong on our side. Nothing was saved — please try again in a moment.',
  502: 'We couldn’t reach the server. Check your connection and try again.',
  503: 'The service is busy right now. Please try again in a moment.',
  504: 'The server took too long to answer. Check your connection and try again.',
};

/** Offline, DNS failure, server unreachable — the browser gives us "Failed to fetch". */
export const OFFLINE_MESSAGE = 'You appear to be offline. Check your connection and try again.';

/**
 * A request that never reached the server.
 *
 * Carries a flag rather than relying on the message text, because the message
 * is written for the shopkeeper and the offline queue needs to recognise these
 * to decide between retrying and dead-lettering. Matching on the words "failed
 * to fetch" would have made rewording this a silent change to retry behaviour
 * — a queued sale quietly dropped instead of replayed.
 */
export class NetworkError extends Error {
  readonly isNetworkError = true;
  constructor(cause?: unknown) {
    super(OFFLINE_MESSAGE);
    this.name = 'NetworkError';
    (this as { cause?: unknown }).cause = cause;
  }
}

/**
 * A raw body is never shown: it may be HTML, a stack trace or a database
 * error, none of which a shopkeeper can act on.
 *
 * A server message is used for 4xx only. Those say what was wrong with the
 * request — "This sale has already been refunded", "Not enough stock" — and
 * are the most specific, most useful thing we can show.
 *
 * A 5xx message is not. The server's 500 handlers say things like "Failed to
 * load expenses": accurate, but it describes our failure rather than their
 * situation, and offers nothing to do about it. For those the generic wins,
 * because the honest answer is the same every time — it is not your fault,
 * nothing was saved, try again.
 */
export const messageForStatus = (status: number, serverMessage?: unknown): string => {
  const fromServer = typeof serverMessage === 'string' ? serverMessage.trim() : '';
  if (fromServer && status < 500) return fromServer;
  return STATUS_MESSAGE[status]
    || (status >= 500
      ? STATUS_MESSAGE[500]
      : 'That didn’t work. Please try again.');
};
