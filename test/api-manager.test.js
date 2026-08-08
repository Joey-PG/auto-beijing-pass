import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiManager } from '../src/lib/api-manager.js';

test('sends the captured WeChat mini-program headers for JTGL APIs', async () => {
  const originalFetch = globalThis.fetch;
  let capturedRequest;

  try {
    globalThis.fetch = async (url, options) => {
      capturedRequest = { url, options };
      return {
        json: async () => ({ code: 200, data: {} }),
      };
    };

    const api = new ApiManager('https://example.test:1443', 'token');
    await api.getStateData();

    assert.equal(
      capturedRequest.url,
      'https://example.test:1443/pro/applyRecordController/stateList',
    );
    assert.deepEqual(JSON.parse(capturedRequest.options.body), {});

    const { headers } = capturedRequest.options;
    assert.equal(headers.Authorization, 'token');
    assert.equal(headers['Content-Type'], 'application/json');
    assert.equal(headers.Accept, '*/*');
    assert.equal(headers['Accept-Language'], 'zh-CN,zh;q=0.9');
    assert.match(headers['User-Agent'], /MicroMessenger\/7\.0\.20/);
    assert.match(headers['User-Agent'], /MiniProgramEnv\/Mac/);
    assert.equal(
      headers.Referer,
      'https://servicewechat.com/wxebe8663cdfb4efbb/47/page-frame.html',
    );
    assert.equal(headers.xweb_xhr, '1');
    assert.equal(headers['Sec-Fetch-Site'], 'cross-site');
    assert.equal(headers['Sec-Fetch-Mode'], 'cors');
    assert.equal(headers['Sec-Fetch-Dest'], 'empty');

    assert.equal(Object.hasOwn(headers, 'Host'), false);
    assert.equal(Object.hasOwn(headers, 'Content-Length'), false);
    assert.equal(Object.hasOwn(headers, 'Connection'), false);
    assert.equal(Object.hasOwn(headers, 'Accept-Encoding'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('allows callers to override a mini-program header', async () => {
  const originalFetch = globalThis.fetch;
  let capturedHeaders;

  try {
    globalThis.fetch = async (_url, options) => {
      capturedHeaders = options.headers;
      return {
        json: async () => ({ code: 200, data: {} }),
      };
    };

    const api = new ApiManager('https://example.test:1443', 'token');
    await api.callApi(
      'pro/example',
      {},
      { Referer: 'https://example.test/custom' },
    );

    assert.equal(
      capturedHeaders.Referer,
      'https://example.test/custom',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('loads the mini-program home page with the captured concurrent requests', async () => {
  const originalFetch = globalThis.fetch;
  const capturedRequests = [];

  try {
    globalThis.fetch = async (url, options) => {
      capturedRequests.push({ url, options });
      return {
        json: async () => ({
          code: 200,
          data: url.endsWith('/stateList') ? { bzclxx: [] } : {},
        }),
      };
    };

    const api = new ApiManager('https://example.test:1443', 'token');
    const home = await api.loadHomePageData();

    assert.deepEqual(
      capturedRequests.map(({ url }) => new URL(url).pathname),
      [
        '/auth/userController/getLoginType',
        '/pro/configRecordController/getConfigRecordInfo',
        '/pro/applyRecordController/stateList',
        '/pro/noticeController/list',
      ],
    );
    assert.deepEqual(
      capturedRequests.map(({ options }) => options.method),
      ['GET', 'POST', 'POST', 'GET'],
    );
    assert.equal(
      Object.hasOwn(capturedRequests[0].options, 'body'),
      false,
    );
    assert.deepEqual(
      JSON.parse(capturedRequests[1].options.body),
      {},
    );
    assert.deepEqual(
      JSON.parse(capturedRequests[2].options.body),
      {},
    );
    assert.equal(
      Object.hasOwn(capturedRequests[3].options, 'body'),
      false,
    );
    assert.deepEqual(home.state, { bzclxx: [] });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('aborts a JTGL request when it exceeds the configured timeout', async () => {
  const fetchImpl = async (_url, { signal }) =>
    new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => {
        const err = new Error('aborted');
        err.name = 'AbortError';
        reject(err);
      });
    });
  const api = new ApiManager(
    'https://example.test:1443',
    'token',
    { fetchImpl, timeoutMs: 5 },
  );

  await assert.rejects(
    () => api.getStateData(),
    /API timeout.*5ms/,
  );
});
