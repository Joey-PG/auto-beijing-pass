# Auto Beijing Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved self-hosted multi-account `auto-bj` CLI with encrypted credentials, PostgreSQL storage, per-account schedules, permit execution, notifications, logs, and deployment docs.

**Architecture:** Implement a modular monolithic TypeScript CLI. CLI commands call services; services use repositories; credentials are encrypted through AES-256-GCM; scheduled execution is driven by system cron invoking `auto-bj scheduler tick`.

**Tech Stack:** Node.js 20+, TypeScript, commander, @inquirer/prompts, Drizzle ORM, PostgreSQL, cron-parser, Vitest, ESLint, Prettier, native fetch, node:crypto.

---

## File Structure

Create:

```text
package.json
package-lock.json
tsconfig.json
vitest.config.ts
eslint.config.js
.prettierrc.json
.gitignore
.env.example
bin/auto-bj.ts
src/cli/index.ts
src/cli/commands/account.ts
src/cli/commands/db.ts
src/cli/commands/doctor.ts
src/cli/commands/jobs.ts
src/cli/commands/notify.ts
src/cli/commands/run.ts
src/cli/commands/schedule.ts
src/cli/commands/vehicle.ts
src/config/env.ts
src/output/redaction.ts
src/output/result.ts
src/credentials/crypto.ts
src/credentials/credential-service.ts
src/database/client.ts
src/database/schema.ts
src/database/repositories/accounts.repo.ts
src/database/repositories/audit.repo.ts
src/database/repositories/credentials.repo.ts
src/database/repositories/jobs.repo.ts
src/database/repositories/notifications.repo.ts
src/database/repositories/schedules.repo.ts
src/database/repositories/vehicles.repo.ts
src/accounts/account-service.ts
src/audit/audit-service.ts
src/bjt/cookie-jar.ts
src/bjt/crypto-utils.ts
src/bjt/login.ts
src/bjt/ocr.ts
src/jtgl/api-client.ts
src/jtgl/models.ts
src/notifications/notifier.ts
src/notifications/notification-service.ts
src/permits/permit-service.ts
src/permits/renewal-policy.ts
src/permits/vehicle-selector.ts
src/scheduler/lock-service.ts
src/scheduler/scheduler-service.ts
tests/credentials/crypto.test.ts
tests/output/redaction.test.ts
tests/permits/renewal-policy.test.ts
tests/permits/vehicle-selector.test.ts
tests/scheduler/scheduler-service.test.ts
tests/config/env.test.ts
README.md
LICENSE
```

Copy from source project:

```text
models/common_old.onnx
models/common_old.json
```

## Task 1: Scaffold TypeScript CLI Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `eslint.config.js`
- Create: `.prettierrc.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `bin/auto-bj.ts`
- Create: `src/cli/index.ts`
- Create: `src/output/result.ts`
- Modify: `README.md`

- [ ] **Step 1: Add project metadata and scripts**

Create `package.json`:

```json
{
  "name": "auto-beijing-pass",
  "version": "0.1.0",
  "description": "Self-hosted multi-account CLI for authorized Beijing entry permit automation.",
  "type": "module",
  "bin": {
    "auto-bj": "dist/bin/auto-bj.js"
  },
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx bin/auto-bj.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "format": "prettier --write .",
    "check": "npm run build && npm run lint && npm test"
  },
  "dependencies": {
    "@inquirer/prompts": "^8.3.2",
    "commander": "^14.0.3",
    "cron-parser": "^5.2.0",
    "drizzle-orm": "^0.44.4",
    "jimp": "^1.6.0",
    "onnxruntime-node": "^1.24.3",
    "pg": "^8.16.3"
  },
  "devDependencies": {
    "@eslint/js": "^9.31.0",
    "@types/node": "^24.0.10",
    "@types/pg": "^8.15.4",
    "drizzle-kit": "^0.31.4",
    "eslint": "^9.31.0",
    "prettier": "^3.6.2",
    "tsx": "^4.20.3",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.36.0",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and install exits with code 0.

- [ ] **Step 3: Add compiler and test configuration**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": ".",
    "types": ["node"]
  },
  "include": ["bin/**/*.ts", "src/**/*.ts", "tests/**/*.ts", "vitest.config.ts", "eslint.config.js"]
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov']
    }
  }
});
```

- [ ] **Step 4: Add lint and formatting configuration**

Create `eslint.config.js`:

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
);
```

Create `.prettierrc.json`:

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

Create `.gitignore`:

```text
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
*.log
```

- [ ] **Step 5: Add environment example**

Create `.env.example`:

```text
DATABASE_URL=postgres://auto_bj_dev:change-me@127.0.0.1:5432/auto_bj_dev
APP_SECRET_KEY=base64-encoded-32-byte-key
TZ=Asia/Shanghai
LOG_LEVEL=info
```

- [ ] **Step 6: Add minimal CLI entrypoint**

Create `src/output/result.ts`:

```ts
export type CommandResult<T = unknown> = {
  ok: boolean;
  message: string;
  data?: T;
};

export function printResult(result: CommandResult): void {
  const prefix = result.ok ? 'OK' : 'ERROR';
  console.log(`${prefix}: ${result.message}`);
  if (result.data !== undefined) {
    console.log(JSON.stringify(result.data, null, 2));
  }
}
```

Create `src/cli/index.ts`:

```ts
import { Command } from 'commander';
import { printResult } from '../output/result.js';

export function createProgram(): Command {
  const program = new Command();

  program.name('auto-bj').description('Multi-account Beijing entry permit CLI').version('0.1.0');

  program
    .command('doctor')
    .description('Check local configuration')
    .action(() => {
      printResult({ ok: true, message: 'auto-bj CLI is installed' });
    });

  return program;
}
```

Create `bin/auto-bj.ts`:

```ts
#!/usr/bin/env node
import { createProgram } from '../src/cli/index.js';

await createProgram().parseAsync(process.argv);
```

- [ ] **Step 7: Verify scaffold**

Run:

```bash
npm run build
npm test
```

Expected: build exits 0 and Vitest exits 0 with no test files or passing tests.

- [ ] **Step 8: Commit scaffold**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts eslint.config.js .prettierrc.json .gitignore .env.example bin src README.md
git commit -m "chore: scaffold auto-bj cli"
```

## Task 2: Implement Configuration and Redaction with TDD

**Files:**
- Create: `tests/config/env.test.ts`
- Create: `tests/output/redaction.test.ts`
- Create: `src/config/env.ts`
- Create: `src/output/redaction.ts`
- Modify: `src/cli/index.ts`

- [ ] **Step 1: Write failing environment tests**

Create `tests/config/env.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { loadEnv } from '../../src/config/env.js';

describe('loadEnv', () => {
  test('loads required environment values', () => {
    const env = loadEnv({
      DATABASE_URL: 'postgres://user:pass@127.0.0.1:5432/auto_bj_dev',
      APP_SECRET_KEY: Buffer.alloc(32, 1).toString('base64'),
      TZ: 'Asia/Shanghai',
      LOG_LEVEL: 'debug',
    });

    expect(env.databaseUrl).toBe('postgres://user:pass@127.0.0.1:5432/auto_bj_dev');
    expect(env.appSecretKey.byteLength).toBe(32);
    expect(env.timezone).toBe('Asia/Shanghai');
    expect(env.logLevel).toBe('debug');
  });

  test('rejects a missing database url', () => {
    expect(() =>
      loadEnv({
        APP_SECRET_KEY: Buffer.alloc(32, 1).toString('base64'),
      }),
    ).toThrow('DATABASE_URL is required');
  });

  test('rejects an invalid secret key length', () => {
    expect(() =>
      loadEnv({
        DATABASE_URL: 'postgres://user:pass@127.0.0.1:5432/auto_bj_dev',
        APP_SECRET_KEY: Buffer.alloc(16, 1).toString('base64'),
      }),
    ).toThrow('APP_SECRET_KEY must decode to 32 bytes');
  });
});
```

- [ ] **Step 2: Run env test and verify RED**

Run:

```bash
npm test -- tests/config/env.test.ts
```

Expected: FAIL because `src/config/env.ts` does not exist.

- [ ] **Step 3: Implement environment loader**

Create `src/config/env.ts`:

```ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type AppEnv = {
  databaseUrl: string;
  appSecretKey: Buffer;
  timezone: string;
  logLevel: LogLevel;
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const databaseUrl = source.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const rawSecret = source.APP_SECRET_KEY;
  if (!rawSecret) {
    throw new Error('APP_SECRET_KEY is required');
  }

  const appSecretKey = Buffer.from(rawSecret, 'base64');
  if (appSecretKey.byteLength !== 32) {
    throw new Error('APP_SECRET_KEY must decode to 32 bytes');
  }

  const timezone = source.TZ || 'Asia/Shanghai';
  const rawLogLevel = source.LOG_LEVEL || 'info';
  const logLevel = parseLogLevel(rawLogLevel);

  return { databaseUrl, appSecretKey, timezone, logLevel };
}

function parseLogLevel(value: string): LogLevel {
  if (value === 'debug' || value === 'info' || value === 'warn' || value === 'error') {
    return value;
  }
  throw new Error('LOG_LEVEL must be one of debug, info, warn, error');
}
```

- [ ] **Step 4: Verify env test GREEN**

Run:

```bash
npm test -- tests/config/env.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing redaction tests**

Create `tests/output/redaction.test.ts`:

```ts
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
      'tgram://***@***?secret=***&safe=yes',
    );
  });
});
```

- [ ] **Step 6: Run redaction test and verify RED**

Run:

```bash
npm test -- tests/output/redaction.test.ts
```

Expected: FAIL because `src/output/redaction.ts` does not exist.

- [ ] **Step 7: Implement redaction helpers**

Create `src/output/redaction.ts`:

```ts
const SECRET_QUERY_KEYS = new Set(['token', 'key', 'secret', 'access_token', 'password']);

export function redactToken(value: string | null | undefined): string {
  if (!value || value.length < 8) return '***';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function redactNotificationUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.username) url.username = '***';
    if (url.password) url.password = '***';
    if (url.hostname) url.hostname = '***';
    for (const key of Array.from(url.searchParams.keys())) {
      if (SECRET_QUERY_KEYS.has(key.toLowerCase())) {
        url.searchParams.set(key, '***');
      }
    }
    return url.toString();
  } catch {
    return redactToken(value);
  }
}
```

- [ ] **Step 8: Verify redaction test GREEN**

Run:

```bash
npm test -- tests/output/redaction.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit configuration and redaction**

```bash
git add src/config src/output tests/config tests/output
git commit -m "feat: add environment and redaction helpers"
```

## Task 3: Implement Credential Encryption with TDD

**Files:**
- Create: `tests/credentials/crypto.test.ts`
- Create: `src/credentials/crypto.ts`
- Create: `src/credentials/credential-service.ts`

- [ ] **Step 1: Write failing crypto tests**

Create `tests/credentials/crypto.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { decryptSecret, encryptSecret } from '../../src/credentials/crypto.js';

const key = Buffer.alloc(32, 7);
const otherKey = Buffer.alloc(32, 8);

describe('credential crypto', () => {
  test('encrypts and decrypts a secret', () => {
    const encrypted = encryptSecret('beijing-password', key);
    expect(encrypted.ciphertext).not.toContain('beijing-password');
    expect(decryptSecret(encrypted, key)).toBe('beijing-password');
  });

  test('uses a different iv for each encryption', () => {
    const one = encryptSecret('same', key);
    const two = encryptSecret('same', key);
    expect(one.iv).not.toBe(two.iv);
    expect(one.ciphertext).not.toBe(two.ciphertext);
  });

  test('rejects decryption with the wrong key', () => {
    const encrypted = encryptSecret('secret', key);
    expect(() => decryptSecret(encrypted, otherKey)).toThrow();
  });
});
```

- [ ] **Step 2: Run crypto test and verify RED**

Run:

```bash
npm test -- tests/credentials/crypto.test.ts
```

Expected: FAIL because `src/credentials/crypto.ts` does not exist.

- [ ] **Step 3: Implement AES-256-GCM helpers**

Create `src/credentials/crypto.ts`:

```ts
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export type EncryptedSecret = {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
};

export function encryptSecret(plaintext: string, key: Buffer, keyVersion = 1): EncryptedSecret {
  assertKey(key);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    keyVersion,
  };
}

export function decryptSecret(secret: EncryptedSecret, key: Buffer): string {
  assertKey(key);
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(secret.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(secret.authTag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(secret.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

function assertKey(key: Buffer): void {
  if (key.byteLength !== 32) {
    throw new Error('AES-256-GCM key must be 32 bytes');
  }
}
```

Create `src/credentials/credential-service.ts`:

```ts
import { decryptSecret, encryptSecret, type EncryptedSecret } from './crypto.js';

export class CredentialService {
  constructor(private readonly key: Buffer) {}

  encrypt(value: string): EncryptedSecret {
    return encryptSecret(value, this.key);
  }

  decrypt(secret: EncryptedSecret): string {
    return decryptSecret(secret, this.key);
  }
}
```

- [ ] **Step 4: Verify crypto test GREEN**

Run:

```bash
npm test -- tests/credentials/crypto.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit credential encryption**

```bash
git add src/credentials tests/credentials
git commit -m "feat: add encrypted credential helpers"
```

## Task 4: Implement Permit Policies with TDD

**Files:**
- Create: `tests/permits/renewal-policy.test.ts`
- Create: `tests/permits/vehicle-selector.test.ts`
- Create: `src/permits/renewal-policy.ts`
- Create: `src/permits/vehicle-selector.ts`

- [ ] **Step 1: Write failing renewal policy tests**

Create `tests/permits/renewal-policy.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { decidePermitAction } from '../../src/permits/renewal-policy.js';

describe('decidePermitAction', () => {
  test('applies today when no record exists', () => {
    expect(decidePermitAction(null, { today: '2026-07-08' })).toEqual({
      action: 'apply',
      applyDate: '2026-07-08',
      reason: 'no_record',
    });
  });

  test('applies tomorrow when active record has one day remaining', () => {
    expect(
      decidePermitAction(
        { statusName: '审核通过(生效中)', validTo: '2026-07-08' },
        { today: '2026-07-08' },
      ),
    ).toEqual({ action: 'apply', applyDate: '2026-07-09', reason: 'expiring' });
  });

  test('skips when active record has more than one day remaining', () => {
    expect(
      decidePermitAction(
        { statusName: '审核通过(生效中)', validTo: '2026-07-12' },
        { today: '2026-07-08' },
      ),
    ).toEqual({ action: 'skip', reason: 'still_valid' });
  });

  test('skips reviewing records', () => {
    expect(
      decidePermitAction({ statusName: '审核中', validTo: '' }, { today: '2026-07-08' }),
    ).toEqual({ action: 'skip', reason: 'in_progress' });
  });

  test('applies today for expired or rejected records', () => {
    expect(
      decidePermitAction({ statusName: '审核失败', validTo: '2026-07-01' }, { today: '2026-07-08' }),
    ).toEqual({ action: 'apply', applyDate: '2026-07-08', reason: 'inactive' });
  });
});
```

- [ ] **Step 2: Run renewal test and verify RED**

Run:

```bash
npm test -- tests/permits/renewal-policy.test.ts
```

Expected: FAIL because `src/permits/renewal-policy.ts` does not exist.

- [ ] **Step 3: Implement renewal policy**

Create `src/permits/renewal-policy.ts`:

```ts
export type PermitRecordLike = {
  statusName: string;
  validTo?: string;
};

export type PermitDecision =
  | { action: 'apply'; applyDate: string; reason: 'no_record' | 'expiring' | 'inactive' }
  | { action: 'skip'; reason: 'still_valid' | 'in_progress' };

const IN_PROGRESS_STATUSES = new Set(['审核中', '审核通过(待生效)']);

export function decidePermitAction(
  record: PermitRecordLike | null,
  options: { today: string },
): PermitDecision {
  if (!record) {
    return { action: 'apply', applyDate: options.today, reason: 'no_record' };
  }

  if (IN_PROGRESS_STATUSES.has(record.statusName)) {
    return { action: 'skip', reason: 'in_progress' };
  }

  if (record.statusName === '审核通过(生效中)') {
    const remaining = countInclusiveDays(options.today, record.validTo || options.today);
    if (remaining <= 1) {
      return { action: 'apply', applyDate: addDays(options.today, 1), reason: 'expiring' };
    }
    return { action: 'skip', reason: 'still_valid' };
  }

  return { action: 'apply', applyDate: options.today, reason: 'inactive' };
}

function countInclusiveDays(from: string, to: string): number {
  const start = parseDate(from);
  const end = parseDate(to);
  const diff = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.max(diff, 0);
}

function addDays(date: string, days: number): string {
  const parsed = parseDate(date);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function parseDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
```

- [ ] **Step 4: Verify renewal test GREEN**

Run:

```bash
npm test -- tests/permits/renewal-policy.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing vehicle selector tests**

Create `tests/permits/vehicle-selector.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { selectVehicle } from '../../src/permits/vehicle-selector.js';

const vehicles = [
  { plateNumber: '京A11111', records: [] },
  { plateNumber: '京B22222', records: [{ statusName: '审核通过(生效中)' }] },
  { plateNumber: '京C33333', records: [] },
];

describe('selectVehicle', () => {
  test('uses explicit plate first', () => {
    expect(selectVehicle(vehicles, { explicitPlate: '京C33333' })?.plateNumber).toBe('京C33333');
  });

  test('uses active vehicle before preferred plate', () => {
    expect(selectVehicle(vehicles, { preferredPlate: '京C33333' })?.plateNumber).toBe('京B22222');
  });

  test('uses preferred plate when no active vehicle exists', () => {
    expect(
      selectVehicle(
        [
          { plateNumber: '京A11111', records: [] },
          { plateNumber: '京C33333', records: [] },
        ],
        { preferredPlate: '京C33333' },
      )?.plateNumber,
    ).toBe('京C33333');
  });

  test('falls back to first vehicle', () => {
    expect(selectVehicle([{ plateNumber: '京A11111', records: [] }], {})?.plateNumber).toBe(
      '京A11111',
    );
  });
});
```

- [ ] **Step 6: Run vehicle selector test and verify RED**

Run:

```bash
npm test -- tests/permits/vehicle-selector.test.ts
```

Expected: FAIL because `src/permits/vehicle-selector.ts` does not exist.

- [ ] **Step 7: Implement vehicle selector**

Create `src/permits/vehicle-selector.ts`:

```ts
export type VehicleLike = {
  plateNumber: string;
  records?: Array<{ statusName: string }>;
};

export type VehicleSelectionOptions = {
  explicitPlate?: string;
  preferredPlate?: string | null;
};

const ACTIVE_STATUSES = new Set(['审核通过(生效中)', '审核中', '审核通过(待生效)']);

export function selectVehicle<T extends VehicleLike>(
  vehicles: T[],
  options: VehicleSelectionOptions,
): T | null {
  if (vehicles.length === 0) return null;

  if (options.explicitPlate) {
    return vehicles.find((vehicle) => vehicle.plateNumber === options.explicitPlate) || null;
  }

  const active = vehicles.find((vehicle) =>
    (vehicle.records || []).some((record) => ACTIVE_STATUSES.has(record.statusName)),
  );
  if (active) return active;

  if (options.preferredPlate) {
    const preferred = vehicles.find((vehicle) => vehicle.plateNumber === options.preferredPlate);
    if (preferred) return preferred;
  }

  return vehicles[0];
}
```

- [ ] **Step 8: Verify vehicle selector test GREEN**

Run:

```bash
npm test -- tests/permits/vehicle-selector.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit permit policies**

```bash
git add src/permits tests/permits
git commit -m "feat: add permit renewal and vehicle policies"
```

## Task 5: Implement Database Schema and Repositories

**Files:**
- Create: `src/database/schema.ts`
- Create: `src/database/client.ts`
- Create: repository files under `src/database/repositories/`
- Modify: `src/cli/commands/db.ts`
- Modify: `src/cli/index.ts`

- [ ] **Step 1: Add Drizzle schema**

Create `src/database/schema.ts` with tables from the design spec:

```ts
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  phone: text('phone').notNull(),
  defaultEntryType: text('default_entry_type').notNull().default('六环内'),
  preferredPlate: text('preferred_plate'),
  enabled: boolean('enabled').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const credentials = pgTable('credentials', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  kind: text('kind').notNull(),
  ciphertext: text('ciphertext').notNull(),
  iv: text('iv').notNull(),
  authTag: text('auth_tag').notNull(),
  keyVersion: integer('key_version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const vehicles = pgTable('vehicles', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  plateNumber: text('plate_number').notNull(),
  plateType: text('plate_type'),
  vehicleType: text('vehicle_type'),
  engineNumberMasked: text('engine_number_masked'),
  brand: text('brand'),
  registrationDate: text('registration_date'),
  externalVehicleId: text('external_vehicle_id'),
  isPreferred: boolean('is_preferred').notNull().default(false),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const notificationChannels = pgTable('notification_channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  encryptedUrl: jsonb('encrypted_url').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const schedules = pgTable('schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  cronExpr: text('cron_expr').notNull(),
  timezone: text('timezone').notNull().default('Asia/Shanghai'),
  enabled: boolean('enabled').notNull().default(true),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const jobRuns = pgTable('job_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  triggerType: text('trigger_type').notNull(),
  status: text('status').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  summary: text('summary'),
});

export const permitRecords = pgTable('permit_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  jobRunId: uuid('job_run_id').references(() => jobRuns.id, { onDelete: 'set null' }),
  plateNumber: text('plate_number').notNull(),
  statusName: text('status_name'),
  validFrom: text('valid_from'),
  validTo: text('valid_to'),
  remainingDays: integer('remaining_days'),
  remainingTimes: integer('remaining_times'),
  entryType: text('entry_type'),
  applyTime: text('apply_time'),
  rawSnapshotJson: jsonb('raw_snapshot_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actor: text('actor').notNull().default('local_cli'),
  action: text('action').notNull(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  metadataJson: jsonb('metadata_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

- [ ] **Step 2: Add database client**

Create `src/database/client.ts`:

```ts
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

export type Database = ReturnType<typeof createDatabase>;

export function createDatabase(databaseUrl: string) {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  return drizzle(pool, { schema });
}
```

- [ ] **Step 3: Add repository methods needed by CLI services**

Create repositories with focused CRUD methods:

```text
accounts.repo.ts: create, findByName, list, setEnabled, updatePasswordMetadata
credentials.repo.ts: upsertSecret, findSecret
vehicles.repo.ts: upsertForAccount, listByAccount, setPreferred
schedules.repo.ts: upsert, listDue, updateNextRun, setEnabled
jobs.repo.ts: createRunning, finishSuccess, finishFailure, listRecent
notifications.repo.ts: add, listByAccount, remove
audit.repo.ts: write, listRecent
```

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit database schema**

```bash
git add src/database
git commit -m "feat: add postgres schema and repositories"
```

## Task 6: Implement Account and Schedule CLI Services

**Files:**
- Create: `src/accounts/account-service.ts`
- Create: `src/scheduler/scheduler-service.ts`
- Create: `src/scheduler/lock-service.ts`
- Create: `tests/scheduler/scheduler-service.test.ts`
- Create/Modify: CLI command files

- [ ] **Step 1: Write scheduler service failing tests**

Create `tests/scheduler/scheduler-service.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { computeNextRun, isDue } from '../../src/scheduler/scheduler-service.js';

describe('scheduler helpers', () => {
  test('detects due schedule', () => {
    expect(isDue(new Date('2026-07-08T00:00:00Z'), new Date('2026-07-08T00:00:01Z'))).toBe(true);
  });

  test('detects future schedule as not due', () => {
    expect(isDue(new Date('2026-07-08T00:01:00Z'), new Date('2026-07-08T00:00:01Z'))).toBe(false);
  });

  test('computes next run from cron expression', () => {
    expect(computeNextRun('0 8 * * *', 'Asia/Shanghai', new Date('2026-07-08T00:00:00Z')).toISOString()).toBe(
      '2026-07-09T00:00:00.000Z',
    );
  });
});
```

- [ ] **Step 2: Run scheduler test and verify RED**

Run:

```bash
npm test -- tests/scheduler/scheduler-service.test.ts
```

Expected: FAIL because scheduler helpers do not exist.

- [ ] **Step 3: Implement scheduler helpers and services**

Create `src/scheduler/scheduler-service.ts` with `isDue`, `computeNextRun`, and a `SchedulerService` that lists due schedules and invokes a supplied runner.

Create `src/scheduler/lock-service.ts` with an in-process account lock for v1 CLI execution.

- [ ] **Step 4: Verify scheduler test GREEN**

Run:

```bash
npm test -- tests/scheduler/scheduler-service.test.ts
```

Expected: PASS.

- [ ] **Step 5: Implement account, schedule, db, doctor CLI commands**

Commands must include:

```bash
auto-bj account add
auto-bj account list
auto-bj account show <account>
auto-bj account enable <account>
auto-bj account disable <account>
auto-bj account update-password <account>
auto-bj schedule set <account> "<cron>"
auto-bj schedule list
auto-bj schedule enable <account>
auto-bj schedule disable <account>
auto-bj db status
auto-bj doctor
```

- [ ] **Step 6: Run build and tests**

Run:

```bash
npm run build
npm test
```

Expected: PASS.

- [ ] **Step 7: Commit account and schedule services**

```bash
git add src/accounts src/scheduler src/cli tests/scheduler
git commit -m "feat: add account and schedule cli services"
```

## Task 7: Migrate Original Beijing Tong, JTGL, OCR, Notification, and Permit Logic

**Files:**
- Create/Modify: `src/bjt/*`
- Create/Modify: `src/jtgl/*`
- Create/Modify: `src/notifications/*`
- Create/Modify: `src/permits/permit-service.ts`
- Create/Modify: `src/cli/commands/run.ts`
- Create/Modify: `src/cli/commands/vehicle.ts`
- Create/Modify: `src/cli/commands/notify.ts`
- Copy: `models/common_old.onnx`
- Copy: `models/common_old.json`

- [ ] **Step 1: Copy model assets**

Run:

```bash
mkdir -p models
cp /tmp/cross_beijing_cli_plan/models/common_old.onnx models/common_old.onnx
cp /tmp/cross_beijing_cli_plan/models/common_old.json models/common_old.json
```

Expected: both files exist under `models/`.

- [ ] **Step 2: Port source modules**

Port original files:

```text
/tmp/cross_beijing_cli_plan/src/lib/crypto-utils.js -> src/bjt/crypto-utils.ts
/tmp/cross_beijing_cli_plan/src/lib/ocr.js -> src/bjt/ocr.ts
/tmp/cross_beijing_cli_plan/src/lib/bjt-login.js -> src/bjt/login.ts
/tmp/cross_beijing_cli_plan/src/lib/api-manager.js -> src/jtgl/api-client.ts
/tmp/cross_beijing_cli_plan/src/lib/models.js -> src/jtgl/models.ts
/tmp/cross_beijing_cli_plan/src/lib/notifier.js -> src/notifications/notifier.ts
```

Adapt imports, types, and paths.

- [ ] **Step 3: Implement permit service**

`src/permits/permit-service.ts` must:

```text
load account
decrypt password/token
login when needed
query state
select vehicle
decide renewal
submit application or skip
save job_run and permit_record
send notifications
```

- [ ] **Step 4: Implement run/status/vehicle/notify commands**

Commands must include:

```bash
auto-bj status <account>
auto-bj run --account <account>
auto-bj run-all
auto-bj scheduler tick
auto-bj vehicle sync <account>
auto-bj vehicle list <account>
auto-bj vehicle set-preferred <account> <plate>
auto-bj notify add <account> <url>
auto-bj notify list <account>
auto-bj notify remove <account> <id>
auto-bj notify test <account>
```

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit migrated permit logic**

```bash
git add src/bjt src/jtgl src/notifications src/permits src/cli models
git commit -m "feat: migrate permit execution logic"
```

## Task 8: Documentation, License, Verification, and Push

**Files:**
- Modify: `README.md`
- Create: `LICENSE`

- [ ] **Step 1: Add README usage and safety docs**

README must cover:

```text
authorized-use statement
MIT attribution to fichas/cross_beijing_cli
development database auto_bj_dev
production database auto_bj_prod
APP_SECRET_KEY warning
setup commands
system cron example
password/token/notification URL security
```

- [ ] **Step 2: Add MIT license**

Create `LICENSE` with MIT license text and preserve attribution.

- [ ] **Step 3: Run full verification**

Run:

```bash
npm run build
npm run lint
npm test
```

Expected: all exit with code 0.

- [ ] **Step 4: Commit docs**

```bash
git add README.md LICENSE .env.example docs
git commit -m "docs: add setup and safety documentation"
```

- [ ] **Step 5: Push branch**

Run:

```bash
git push origin main
```

Expected: remote main includes all project commits.

## Self-Review Checklist

- Spec coverage:
  - Product scope: Tasks 1, 6, 7, 8.
  - PostgreSQL data model: Task 5.
  - AES-256-GCM credential security: Task 3.
  - Phone/plate plaintext and password/token/URL redaction: Task 2.
  - Permit decision and vehicle selection: Task 4.
  - Per-account scheduling: Task 6.
  - Original CLI migration: Task 7.
  - Deployment docs and attribution: Task 8.
- Placeholder scan: each task has explicit files, commands, and expected results.
- Type consistency: credential encrypted fields use `authTag` in TypeScript and `auth_tag` in database schema; permit records use `plateNumber` in code and `plate_number` in database.
