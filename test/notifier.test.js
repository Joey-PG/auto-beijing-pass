import assert from 'node:assert/strict';
import test from 'node:test';

import { requestWithTimeout } from '../src/lib/notifier.js';

test('aborts notification delivery when it exceeds the configured timeout', async () => {
  const fetchImpl = async (_url, { signal }) =>
    new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => {
        const err = new Error('aborted');
        err.name = 'AbortError';
        reject(err);
      });
    });

  await assert.rejects(
    () =>
      requestWithTimeout(
        'https://example.test/hook',
        {},
        { fetchImpl, timeoutMs: 5 },
      ),
    /Notification request timeout: 5ms/,
  );
});
