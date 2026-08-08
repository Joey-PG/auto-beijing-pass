import assert from 'node:assert/strict';
import test from 'node:test';

import {
  exchangeBusinessToken,
  getUrlParam,
} from '../src/lib/bjt-login.js';
import { API_BASE_URL } from '../src/constants.js';

test('uses the current JTGL API port', () => {
  assert.equal(API_BASE_URL, 'https://jjz.jtgl.beijing.gov.cn:1443');
});

test('preserves raw URL parameters without corrupting base64', () => {
  assert.equal(
    getUrlParam('https://example.test/callback?token=a+b/c==', 'token'),
    'a+b/c==',
  );
});

test('exchanges an intermediate callback token for business accessToken', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return {
      ok: true,
      status: 200,
      json: async () => ({
        code: 200,
        data: { accessToken: 'business-access-token' },
      }),
    };
  };

  const token = await exchangeBusinessToken(
    'intermediate-token',
    fetchImpl,
  );

  assert.equal(token, 'business-access-token');
  assert.equal(requests.length, 1);
  assert.equal(
    requests[0].url,
    (
      'https://jjz.jtgl.beijing.gov.cn:1443' +
      '/auth/userController/loginUserByUserCenter?state=101000004072'
    ),
  );
  assert.equal(
    requests[0].options.headers.source,
    '6ff67657da8346ddab418205e0442a64',
  );
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    token: 'intermediate-token',
    state: '101000004072',
  });
});
