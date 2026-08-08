import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_ENTRY_TYPE,
  resolveAccountName,
  resolveEntryType,
  resolveNotifyUrls,
} from '../src/commands/init.js';

test('init uses the phone number when a new account alias is empty', () => {
  assert.equal(
    resolveAccountName('', null, '13901224105'),
    '13901224105',
  );
  assert.equal(
    resolveAccountName('   ', null, '13901224105'),
    '13901224105',
  );
});

test('init preserves an existing alias when updating without a name', () => {
  assert.equal(
    resolveAccountName('', { name: '家庭账号' }, '13901224105'),
    '家庭账号',
  );
});

test('init prefers an explicitly supplied alias', () => {
  assert.equal(
    resolveAccountName(
      '  新别名  ',
      { name: '旧别名' },
      '13901224105',
    ),
    '新别名',
  );
});

test('init defaults new accounts to outside the sixth ring', () => {
  assert.equal(DEFAULT_ENTRY_TYPE, '六环外');
  assert.equal(resolveEntryType(undefined, null), '六环外');
});

test('init preserves existing business settings unless explicitly overridden', () => {
  const existingUser = {
    entry_type: '六环外',
    notify_urls: ['bark://existing-key'],
  };

  assert.equal(
    resolveEntryType(undefined, existingUser),
    '六环外',
  );
  assert.equal(
    resolveEntryType('六环内', existingUser),
    '六环内',
  );
  assert.deepEqual(
    resolveNotifyUrls(undefined, existingUser),
    ['bark://existing-key'],
  );
  assert.deepEqual(
    resolveNotifyUrls([], existingUser),
    [],
  );
});
