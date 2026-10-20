import { describe, expect, it } from 'vitest';
import { messageForStatus, OFFLINE_MESSAGE, NetworkError, errorText } from './apiErrorMessages';

/**
 * Most screens put `err.message` straight into a toast, so whatever this layer
 * produces is what a shopkeeper reads mid-queue. These tests pin the two
 * decisions that are easy to undo by accident.
 */

/** Nothing a person can act on should contain developer vocabulary. */
const JARGON = [
  'status', 'undefined', 'null', 'fetch', 'request failed',
  'exception', 'stack', 'constraint', '<html', '500',
];

const assertReadable = (msg: string) => {
  expect(msg.length).toBeGreaterThan(10);
  // Ends like a sentence, because it is shown as one.
  expect(msg.trim()).toMatch(/[.!]$/);
  for (const word of JARGON) {
    expect(msg.toLowerCase()).not.toContain(word);
  }
};

describe('messageForStatus', () => {
  it('prefers the server’s own message for a 4xx', () => {
    // These are written for the person reading them and are the most specific
    // thing we can show: "not enough stock" beats any generic we could invent.
    expect(messageForStatus(400, 'Not enough stock to sell 5 of these.'))
      .toBe('Not enough stock to sell 5 of these.');
    expect(messageForStatus(409, 'This sale has already been refunded.'))
      .toBe('This sale has already been refunded.');
  });

  it('ignores the server’s message for a 5xx', () => {
    // The 500 handlers say things like "Failed to load expenses" — accurate
    // about our failure, useless about their situation.
    const msg = messageForStatus(500, 'Failed to load expenses');
    expect(msg).not.toContain('Failed to load expenses');
    assertReadable(msg);
    // The question a shopkeeper actually has is whether to do it again.
    expect(msg.toLowerCase()).toContain('nothing was saved');
  });

  it('never shows a raw body, even when the server sent one', () => {
    assertReadable(messageForStatus(502, '<html><body>Bad Gateway</body></html>'));
    assertReadable(messageForStatus(500, 'ER_DUP_ENTRY: duplicate key value'));
  });

  it('gives every common status something to do about it', () => {
    for (const status of [400, 403, 404, 408, 409, 413, 422, 429, 500, 502, 503, 504]) {
      assertReadable(messageForStatus(status));
    }
  });

  it('falls back readably for a status it has never seen', () => {
    assertReadable(messageForStatus(418));
    assertReadable(messageForStatus(599));
  });

  it('does not treat an empty or blank server message as a message', () => {
    expect(messageForStatus(404, '   ')).toBe(messageForStatus(404));
    expect(messageForStatus(404, undefined)).toBe(messageForStatus(404));
    expect(messageForStatus(404, 42 as unknown)).toBe(messageForStatus(404));
  });
});

describe('errorText', () => {
  it('keeps the specific message over the caller’s generic one', () => {
    // This is the whole point: "Not enough stock" beats "Failed to update".
    expect(errorText(new Error('Not enough stock to sell 5 of these.'), 'That could not be saved.'))
      .toBe('Not enough stock to sell 5 of these.');
  });

  it('falls back when there is nothing usable', () => {
    const fallback = 'That shipment could not be saved.';
    expect(errorText(undefined, fallback)).toBe(fallback);
    expect(errorText({}, fallback)).toBe(fallback);
    expect(errorText(new Error('   '), fallback)).toBe(fallback);
    expect(errorText({ message: 42 }, fallback)).toBe(fallback);
  });

  it('falls back when the message is plainly internal', () => {
    const fallback = 'That could not be saved.';
    // A bare runtime error, a serialised object or a stack frame is not a
    // sentence anyone can act on, however specific it is.
    expect(errorText(new TypeError('Cannot read properties of undefined'), fallback)).toBe(fallback);
    expect(errorText(new Error('{"code":"ER_DUP"}'), fallback)).toBe(fallback);
    expect(errorText(new Error('at handler (server.js:12)'), fallback)).toBe(fallback);
  });

  it('passes the offline message through, since it is written for a person', () => {
    expect(errorText(new NetworkError(), 'nope')).toBe(OFFLINE_MESSAGE);
  });
});

describe('NetworkError', () => {
  it('reads as a connection problem, not a browser error', () => {
    const err = new NetworkError();
    expect(err.message).toBe(OFFLINE_MESSAGE);
    assertReadable(err.message);
  });

  it('is identifiable by flag, not by its wording', () => {
    // The offline queue decides between retrying and dead-lettering on this.
    // Matching the words would mean rewording the message silently changed
    // retry behaviour — a queued sale dropped instead of replayed.
    const err = new NetworkError(new TypeError('Failed to fetch'));
    expect(err.isNetworkError).toBe(true);
    expect((err as { cause?: unknown }).cause).toBeInstanceOf(TypeError);
  });
});
