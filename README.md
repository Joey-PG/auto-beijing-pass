# auto-beijing-pass

Self-hosted multi-account CLI for authorized Beijing entry permit automation.

This project is designed for personal/server-side use. It stores multiple Beijing Tong accounts, encrypts credentials, checks permit state, runs permit renewal/application logic, and supports per-account schedules.

## Safety And Authorized Use

Use this tool only for Beijing Tong accounts you own or are explicitly authorized to manage.

This project does not attempt to bypass CAPTCHA, platform risk controls, account protections, or legal restrictions. If Beijing Tong credentials are wrong or platform verification changes, the tool should fail safely and ask for credential maintenance.

## Project Status

The first version is a modular CLI application:

- Multiple Beijing Tong accounts
- PostgreSQL storage
- AES-256-GCM encrypted passwords, tokens, and notification URLs
- Per-account cron schedules
- Manual permit status and run commands
- Job and audit logs
- Notification URL compatibility inspired by Apprise-style schemes

## Attribution

This project uses `fichas/cross_beijing_cli` as the implementation base for the Beijing Tong login flow, JTGL API client, OCR model usage, permit decision logic, and notification channel behavior.

Original project:

https://github.com/fichas/cross_beijing_cli

The original project is MIT licensed. This repository keeps MIT compatibility and attribution.

## Requirements

- Node.js 20+
- PostgreSQL
- Server cron

Development database used during setup:

```text
auto_bj_dev
```

Recommended production database:

```text
auto_bj_prod
```

## Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set:

```text
DATABASE_URL=postgres://auto_bj_dev:password@127.0.0.1:5432/auto_bj_dev
APP_SECRET_KEY=base64-encoded-32-byte-key
TZ=Asia/Shanghai
LOG_LEVEL=info
```

Generate a 32-byte key:

```bash
openssl rand -base64 32
```

Do not lose `APP_SECRET_KEY`. If it is lost, encrypted passwords, tokens, and notification URLs cannot be decrypted.

## Install

```bash
npm install
npm run build
```

For local development:

```bash
npm run dev -- doctor
```

## Database

Check configuration:

```bash
auto-bj doctor
auto-bj db status
```

Apply schema with Drizzle:

```bash
npx drizzle-kit push
```

## Basic Usage

Add an account:

```bash
auto-bj account add
```

List accounts:

```bash
auto-bj account list
```

Sync vehicles:

```bash
auto-bj vehicle sync zhangsan
auto-bj vehicle list zhangsan
```

Set preferred vehicle:

```bash
auto-bj vehicle set-preferred zhangsan 京A12345
```

Run manually:

```bash
auto-bj account show zhangsan
auto-bj status zhangsan
auto-bj run --account zhangsan
```

Configure schedule:

```bash
auto-bj schedule set zhangsan "0 8 * * *"
```

Run scheduler tick:

```bash
auto-bj scheduler tick
```

System cron example:

```bash
*/5 * * * * auto-bj scheduler tick >> /var/log/auto-bj/scheduler.log 2>&1
```

## Notifications

Add a notification URL:

```bash
auto-bj notify add zhangsan bark://your-key
auto-bj notify test zhangsan
```

Supported schemes include:

- `bark://`
- `tgram://`
- `dingtalk://`
- `wecom://`
- `feishu://`
- `slack://`
- `json://`

Notification URLs are encrypted at rest and redacted in CLI output.

## Security Behavior

Plain display:

- Phone numbers
- Plate numbers

Never displayed:

- Beijing Tong passwords

Redacted:

- Beijing Tong tokens
- Notification URL tokens, keys, secrets, and path credentials

Encrypted at rest:

- Passwords
- Tokens
- Notification URLs

## Development

Run checks:

```bash
npm run build
npm run lint
npm test
```

Or:

```bash
npm run check
```

## License

MIT
