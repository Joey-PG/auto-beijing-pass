import { describe, expect, test } from 'vitest';
import { redactNotificationUrl, redactToken } from '../../src/output/redaction.js';

describe('redaction', () => {
  test('keeps phone and plate values unchanged by policy', () => {
    expect('13800138000').toBe('13800138000');
    expect('京A12345').toBe('京A12345');
  });

  test('redacts token middle content', () => {
    expect(redactToken('abcdef1234567890')).toBe('abcd...7890');
  });

  test('redacts short token completely', () => {
    expect(redactToken('abc')).toBe('***');
  });

  test('redacts notification url credentials and query secrets', () => {
    expect(redactNotificationUrl('tgram://bot-token/chat-id?secret=abc&safe=yes')).toBe(
      'tgram://***/***?secret=***&safe=yes',
    );
  });
});
