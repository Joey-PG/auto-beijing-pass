# Auto Beijing Pass Design Spec

## Goal

Build a self-hosted multi-account CLI tool for automatically checking and applying for Beijing entry permits for authorized Beijing Tong accounts.

The first version is for personal use on a server. It supports multiple Beijing Tong accounts, encrypted credential storage, per-account schedules, permit status checks, renewal/application execution, notifications, execution history, and audit logs.

## Non-Goals

- No web management console in the first version.
- No public registration, multi-tenant permission system, billing, or SaaS features.
- No CAPTCHA bypass, risk-control bypass, or unauthorized account handling.
- No large-scale bulk processing beyond user-authorized accounts.
- No permanent worker process in the first version.

## Confirmed Product Scope

The first version is a modular Node.js/TypeScript CLI application deployed on the server.

Primary commands:

```bash
auto-bj account add
auto-bj account list
auto-bj account status <account>
auto-bj run --account <account>
auto-bj run-all
auto-bj schedule set <account> "0 9 * * *"
auto-bj scheduler tick
```

`auto-bj scheduler tick` is invoked by system cron every minute or every five minutes. It reads PostgreSQL schedules, determines which accounts are due, and runs only those accounts.

## Recommended Approach

Use a modular monolithic CLI.

This keeps the first version small enough to ship quickly while avoiding the original single-user CLI's coupling between command parsing, local config files, credentials, and permit execution. The design should allow a future web console or persistent worker without requiring a full rewrite.

Rejected approaches:

- Directly patching the original CLI: fastest initially, but likely to preserve the single-user assumptions and create fragile code.
- CLI plus persistent worker from day one: more production-like, but adds process supervision and deployment complexity too early.

## Architecture

Proposed module layout:

```text
bin/auto-bj.ts
src/cli/
src/accounts/
src/credentials/
src/database/
src/permits/
src/scheduler/
src/notifications/
src/bjt/
src/jtgl/
src/audit/
src/config/
src/output/
models/
tests/
```

Module responsibilities:

- `cli`: command definitions, argument parsing, interactive prompts, and terminal output.
- `database`: PostgreSQL connection, Drizzle schema, migrations, and repositories.
- `credentials`: AES-256-GCM encryption and decryption for passwords, tokens, and notification URLs.
- `accounts`: Beijing Tong account CRUD, login validation, enable/disable state, and account status.
- `bjt`: Beijing Tong login flow, cookie handling, RSA payload encryption, and OCR.
- `jtgl`: Beijing traffic management API client and response models.
- `permits`: status checks, vehicle selection, renewal decision logic, and application submission.
- `scheduler`: per-account cron expressions, due-account selection, job locks, and job execution.
- `notifications`: Apprise-style notification URL handling and account-level notifications.
- `audit`: sensitive operation audit logging.
- `config`: environment variable parsing and validation.
- `output`: formatting and redaction helpers.

Important boundaries:

- CLI commands call services; they do not directly query PostgreSQL.
- Permit execution does not know how credentials are stored; it receives decrypted credentials only when needed.
- Scheduler logic does not contain permit business logic; it identifies due accounts and invokes the permit service.
- Sensitive values are never written to logs in plaintext.

## Source Project Migration

The project will use `fichas/cross_beijing_cli` as the base.

Reusable modules:

- `src/lib/bjt-login.js` -> `src/bjt/login.ts`
- `src/lib/ocr.js` -> `src/bjt/ocr.ts`
- `src/lib/api-manager.js` -> `src/jtgl/api-client.ts`
- `src/lib/models.js` -> `src/jtgl/models.ts`
- `src/lib/notifier.js` -> `src/notifications/notifier.ts`
- Core logic from `src/commands/run.js` -> `src/permits/permit-service.ts`

Modules to replace:

- `src/lib/config-manager.js`: replace local JSON config with PostgreSQL and credential encryption.
- `src/commands/init.js`: replace single-account initialization with account management commands.
- `src/commands/cron.js`: replace direct crontab manipulation with per-account schedules and `scheduler tick`.
- Any command logic that assumes the first user in a local config file.

The original project is MIT licensed. The repository should preserve attribution and license compatibility.

## Data Model

PostgreSQL is used for both development and production.

Current development database:

```text
auto_bj_dev
```

Suggested production database:

```text
auto_bj_prod
```

Environment switching is done through `DATABASE_URL`.

Core tables:

```text
accounts
credentials
vehicles
notification_channels
schedules
job_runs
permit_records
audit_logs
```

### accounts

Stores Beijing Tong account metadata.

```text
id
name
phone
default_entry_type
preferred_plate
enabled
last_login_at
last_run_at
created_at
updated_at
```

### credentials

Stores encrypted sensitive values.

```text
id
account_id
kind              # password / token
ciphertext
iv
auth_tag
key_version
created_at
updated_at
```

### vehicles

Stores vehicle snapshots synced from Beijing Tong.

```text
id
account_id
plate_number
plate_type
vehicle_type
engine_number_masked
brand
registration_date
external_vehicle_id
is_preferred
last_seen_at
created_at
updated_at
```

### notification_channels

Stores encrypted notification endpoints.

```text
id
account_id
type
encrypted_url
enabled
created_at
updated_at
```

### schedules

Stores per-account schedules.

```text
id
account_id
cron_expr
timezone
enabled
next_run_at
last_run_at
created_at
updated_at
```

### job_runs

Stores every manual or scheduled execution.

```text
id
account_id
trigger_type      # manual / scheduled
status            # running / success / failed / skipped
started_at
finished_at
error_code
error_message
summary
```

### permit_records

Stores permit status snapshots.

```text
id
account_id
job_run_id
plate_number
status_name
valid_from
valid_to
remaining_days
remaining_times
entry_type
apply_time
raw_snapshot_json
created_at
```

### audit_logs

Stores sensitive operation history.

```text
id
actor             # local_cli in v1
action
account_id
metadata_json
created_at
```

## Security Design

Sensitive values are encrypted before storage:

- Beijing Tong passwords
- Beijing Tong tokens
- Notification URLs
- Future webhook secrets

Encryption:

- Use `APP_SECRET_KEY` from environment variables as the main key.
- Require a 32-byte random key, stored as base64.
- Use `AES-256-GCM`.
- Generate a unique IV per encrypted value.
- Store `ciphertext`, `iv`, `auth_tag`, and `key_version`.
- Keep plaintext only briefly in memory during login or notification dispatch.

Display and redaction rules:

```text
phone: show plaintext
plate number: show plaintext
password: never display
token: redact
notification URL: redact token/key/secret parts
```

CLI safety:

- `account add` prompts for passwords using hidden input.
- Command-line password flags should be discouraged because they can enter shell history.
- `account show` does not reveal passwords.
- There is no command for showing plaintext passwords.
- Use `account update-password` and `account login-test` for credential maintenance.

Server safety:

- `.env` is never committed.
- `APP_SECRET_KEY` loss means encrypted credentials cannot be recovered.
- PostgreSQL should be restricted to local access on the server.
- Development and production databases are separate.
- Database backups are sensitive and should be protected.

Audit events:

- Account creation/removal
- Password update
- Notification channel update
- Schedule update
- Manual permit execution
- Scheduled permit execution failure

Audit logs must not contain plaintext sensitive values.

## Permit Execution Flow

Manual entry points:

```bash
auto-bj run --account <account>
auto-bj run-all
```

Execution flow:

```text
load account
decrypt password/token
ensure login/session
query vehicles and permit state
select vehicle
decide whether application is needed
submit application or skip
save permit snapshot
save job_run
send notification
```

Renewal decision logic follows the original CLI:

- No record: apply for today.
- Approved and active with remaining days <= 1: apply for tomorrow.
- Approved and active with remaining days > 1: skip.
- Reviewing or pending active date: skip.
- Expired or rejected: apply for today.
- Remaining times and remaining days are both zero: skip and notify quota exhaustion.

Vehicle selection follows the original CLI:

1. Use `--plate` if specified.
2. Prefer a vehicle with an active, reviewing, or pending record.
3. Use `preferred_plate` if configured.
4. Fall back to the first vehicle.

After adding an account, the CLI should sync vehicles and recommend setting a preferred plate:

```bash
auto-bj vehicle set-preferred <account> <plate>
```

This recommendation is not mandatory in v1.

## Scheduling Flow

Each account can have its own cron expression.

Example commands:

```bash
auto-bj schedule set zhangsan "0 8 * * *"
auto-bj schedule set lisi "30 9 * * *"
auto-bj schedule list
auto-bj schedule disable zhangsan
```

System cron invokes the scheduler:

```bash
*/5 * * * * auto-bj scheduler tick >> /var/log/auto-bj/scheduler.log 2>&1
```

`scheduler tick` flow:

```text
read enabled schedules
select schedules where now >= next_run_at
create a job_run for each due account
acquire account-level lock
execute permit flow
update last_run_at and next_run_at
record success, failure, or skipped status
```

Duplicate execution prevention:

- Account-level lock prevents the same account from running concurrently.
- If an account is already running, the new due job is marked `skipped`.

Error handling:

- Wrong password: mark account as requiring password update and do not retry immediately.
- OCR/captcha failure: retry briefly, then fail and notify.
- Token invalid: re-login.
- API temporary error: fail current job; next scheduled run may retry.
- Running lock already held: mark as skipped.

## CLI Design

The CLI is command-first with interactive prompts for setup.

### Account Commands

```bash
auto-bj account add
auto-bj account add --name zhangsan --phone 13800138000
auto-bj account list
auto-bj account show zhangsan
auto-bj account enable zhangsan
auto-bj account disable zhangsan
auto-bj account update-password zhangsan
auto-bj account login-test zhangsan
auto-bj account remove zhangsan
```

### Vehicle Commands

```bash
auto-bj vehicle sync zhangsan
auto-bj vehicle list zhangsan
auto-bj vehicle set-preferred zhangsan 京A12345
auto-bj vehicle clear-preferred zhangsan
```

Manual vehicle add/remove/swap can be deferred unless the migrated original API support is needed immediately.

### Notification Commands

```bash
auto-bj notify add zhangsan <url>
auto-bj notify list zhangsan
auto-bj notify remove zhangsan <id>
auto-bj notify test zhangsan
```

Notification URLs are encrypted at rest and redacted in output.

### Schedule Commands

```bash
auto-bj schedule set zhangsan "0 8 * * *"
auto-bj schedule list
auto-bj schedule show zhangsan
auto-bj schedule enable zhangsan
auto-bj schedule disable zhangsan
auto-bj schedule remove zhangsan
```

### Execution Commands

```bash
auto-bj status zhangsan
auto-bj run --account zhangsan
auto-bj run-all
auto-bj scheduler tick
```

### Logs and Diagnostics

```bash
auto-bj jobs list
auto-bj jobs show <jobId>
auto-bj audit list
auto-bj doctor
auto-bj db migrate
auto-bj db status
```

Typical first setup:

```bash
auto-bj db migrate
auto-bj account add
auto-bj vehicle sync zhangsan
auto-bj vehicle list zhangsan
auto-bj schedule set zhangsan "0 8 * * *"
auto-bj notify test zhangsan
auto-bj run --account zhangsan
```

## Technical Stack

```text
Runtime: Node.js >= 20
Language: TypeScript
CLI: commander + @inquirer/prompts
Database: PostgreSQL
ORM: Drizzle ORM
Migration: drizzle-kit
Cron parsing: cron-parser
Encryption: node:crypto AES-256-GCM
HTTP: native fetch
Testing: Vitest
Lint/Format: ESLint + Prettier
Scheduling: system cron -> auto-bj scheduler tick
```

Drizzle ORM is preferred over Prisma for v1 because this is a CLI-focused project and benefits from a lighter runtime and deployment footprint.

Environment variables:

```text
DATABASE_URL=postgres://auto_bj_dev:***@127.0.0.1:5432/auto_bj_dev
APP_SECRET_KEY=base64-encoded-32-byte-key
TZ=Asia/Shanghai
LOG_LEVEL=info
```

## Testing Strategy

- `credentials`: AES-256-GCM encrypt/decrypt, wrong key failure, unique IV behavior.
- `permits`: renewal decision cases for no record, one day remaining, reviewing, expired, rejected, quota exhausted.
- `vehicle-selector`: specified plate, active vehicle, preferred vehicle, and first-vehicle fallback.
- `scheduler`: cron parsing, `next_run_at`, repeated tick behavior, lock behavior.
- `redaction`: passwords never output; token and notification URLs redacted; phone and plate shown plainly.
- `repositories`: CRUD behavior using a test database or transaction rollback.
- External Beijing Tong and JTGL APIs: mock in tests; do not hit real government endpoints in automated tests.

## Deployment Strategy

1. Install Node.js 20+ on the server.
2. Use PostgreSQL development database `auto_bj_dev`.
3. Configure `.env` with `DATABASE_URL` and `APP_SECRET_KEY`.
4. Run migrations:

```bash
auto-bj db migrate
```

5. Add accounts:

```bash
auto-bj account add
```

6. Test login and status:

```bash
auto-bj account login-test <account>
auto-bj status <account>
```

7. Set per-account schedules:

```bash
auto-bj schedule set <account> "0 8 * * *"
```

8. Add system cron:

```bash
*/5 * * * * auto-bj scheduler tick >> /var/log/auto-bj/scheduler.log 2>&1
```

## Milestones

### M1: Project Skeleton and Database

- TypeScript CLI skeleton
- Drizzle schema and migrations
- Environment config
- `doctor`
- `db status`

### M2: Accounts and Credential Security

- `account add/list/show`
- Encrypted password storage
- `login-test`
- Audit logging

### M3: Original Permit Capability Migration

- Beijing Tong login
- JTGL API client
- Status query
- Vehicle sync
- Manual `run`

### M4: Multi-Account Scheduling

- `schedule set/list/enable/disable`
- `scheduler tick`
- `job_runs`
- Account-level lock

### M5: Notifications and Operability

- `notify add/list/test`
- Success/failure notifications
- `jobs` and `audit` queries
- README deployment docs

### M6: Production Hardening

- Production database `auto_bj_prod`
- GitHub Actions tests
- Dependency audit
- Database backup notes
- MIT attribution
- Security and authorized-use statement

## Open Implementation Notes

- The first implementation plan should avoid building a web UI.
- The command naming can be refined during implementation, but the service boundaries should remain.
- Production deployment should not happen until credential encryption and redaction tests pass.
