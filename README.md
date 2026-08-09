# auto-beijing-pass

进京证 CLI 工具 — 让人类和 AI Agent 都能在终端中办理进京证。

[安装](#安装) · [Web 管理后台](#web-管理后台) · [阿里云 ECS 部署](#阿里云-ecs-部署) · [命令参考](#命令参考) · [审计日志](#审计日志) · [通知渠道](#通知渠道) · [已知问题](./KNOWN_ISSUES.md)

## 为什么选 auto-beijing-pass？

- **为 Agent 原生设计** — [Skills](./skills/) 开箱即用，Agent 无需额外适配
- **零 Python 依赖** — `npm install -g` 即装即用
- **智能续签** — 自动判断是否需要续签，剩余1天时提前申请
- **多账号支持** — 每个账号独立配置、独立判断和独立随机调度
- **失败恢复** — 请求超时保护、定时任务互斥、失败重试和窗口后补偿
- **多渠道通知** — Bark、Telegram、钉钉、企业微信、飞书、Slack
- **一键定时** — `auto-bj-pass cron setup` 写入 crontab

## 功能

| 类别 | 能力 |
|------|------|
| 进京证 | 智能续签、状态查询、到期提醒、多类型支持（六环内/六环外） |
| 车辆管理 | 添加/删除车辆、首选车辆设置、换牌（保留信息） |
| 通知 | Bark、Telegram、钉钉、企业微信、飞书、Slack、Webhook |
| 定时任务 | 每账号每日随机调度、当天去重、服务器重启补偿 |
| 审计 | 持久化运行日志、结构化事件、按时间/账号/事件查询 |

## 安装

```bash
npm install -g auto-beijing-pass
```

npm 包名为 `auto-beijing-pass`，CLI 命令为 `auto-bj-pass`。要求 Node.js >= 18。

## 阿里云 ECS 部署

推荐在常驻的 Linux ECS 上运行自动续签。本项目当前约定：

- 代码目录：`/opt/auto-beijing-pass`
- 命令入口：`/usr/local/bin/auto-bj-pass`
- 配置目录：`~/.auto-bj-pass`
- 定时状态：`~/.auto-bj-pass/cron-state.json`
- 日志目录：`~/.auto-bj-pass/logs`
- cron 输出：`~/.auto-bj-pass/logs/cron.log`
- 每日运行日志：`~/.auto-bj-pass/logs/app-YYYY-MM-DD.log`
- 每月审计日志：`~/.auto-bj-pass/logs/audit-YYYY-MM.jsonl`
- Web 会话：`~/.auto-bj-pass/web-sessions.json`

同步代码并安装依赖后，将命令入口指向项目文件：

```bash
cd /opt/auto-beijing-pass
npm install --omit=dev
chmod 0755 bin/auto-bj-pass.js
sudo ln -sfn \
  /opt/auto-beijing-pass/bin/auto-bj-pass.js \
  /usr/local/bin/auto-bj-pass
```

设置北京时间并启动 cron 服务：

```bash
sudo timedatectl set-timezone Asia/Shanghai

# Alibaba Cloud Linux / CentOS
sudo systemctl enable --now crond

# Ubuntu 使用：
# sudo systemctl enable --now cron
```

启用并验证：

```bash
auto-bj-pass --version
auto-bj-pass cron setup
auto-bj-pass cron status
crontab -l
systemctl is-active crond
tail -n 100 ~/.auto-bj-pass/logs/cron.log
auto-bj-pass audit --since 7d
```

账号凭证和出行信息保存在用户主目录，不要随项目代码同步或提交到 Git。
首次使用新命令时，如果 `~/.auto-bj-pass` 尚不存在但检测到旧的
`~/.cross-bj-next`，程序会把旧配置、日志和定时状态复制到新目录；旧目录
会保留为迁移备份。
仅更新业务代码且依赖未变化时可以保留现有 `node_modules`；依赖发生变化时再
依据 `package-lock.json` 重新安装，并在切换前保留可恢复备份。

## 快速开始（人类用户）

> **Note for AI assistants:** 如果你是 AI Agent，请跳转到[快速开始（AI Agent）](#快速开始ai-agent)。

```bash
# 1. 添加第一个账号（交互式引导完成登录、配置）
auto-bj-pass init --name 家庭账号

# 可继续添加其他账号
auto-bj-pass init --name 工作账号

# 2. 查看状态
auto-bj-pass status

# 3. 一键续签
auto-bj-pass run

# 4. 设置自动续签（默认每账号每天在 07:30-08:30 独立随机）
auto-bj-pass cron setup
```

## Web 管理后台

项目内置基于 React 与 Ant Design 的无数据库管理后台，可新增、编辑、重新登录和
删除北京通账号，并可为指定账号添加/删除车辆、修改自动续签配置、设置首选车辆、
立即检查续签状态，以及查看车辆续签历史和最近运行记录。车辆与续签历史实时读取
北京交管接口；账号配置和审计日志继续使用 `~/.auto-bj-pass`，不会维护第二份业务数据。

运行记录支持按时间范围、账号、事件和执行结果筛选，并展示管理后台操作人、
业务账号、车辆和来源；数据通过服务端分页读取，不会因为前端固定条数而遗漏较早记录。

本机启动：

```bash
auto-bj-pass web
# 浏览器访问 http://127.0.0.1:3751
```

也可以在项目目录中运行：

```bash
npm run web
```

开发前端界面时可使用热更新服务；提交或启动正式管理后台前需要重新构建静态资源：

```bash
npm run web:dev
npm run web:build
```

默认只监听 `127.0.0.1`。如果需要让其他人通过服务器访问，必须设置管理后台
账号密码才能监听公网网卡：

```bash
export AUTO_BJ_PASS_WEB_USERNAME='<管理后台账号>'
export AUTO_BJ_PASS_WEB_PASSWORD='<足够长的随机密码>'
auto-bj-pass web --host 0.0.0.0 --port 3751
```

生产环境应使用 Nginx/Caddy 配置 HTTPS，并通过安全组限制访问来源。北京通密码
仅在新增或重新登录时通过 HTTPS 提交且不会落盘，业务 token 加密保存且不会返回浏览器，
普通日志继续保持敏感信息脱敏。受限权限的结构化审计日志会保留业务账号和车牌，
用于管理员追溯操作；密码、token、通知地址和出行地址仍不会写入审计日志。
Web 登录会话以服务端文件持久化，因此服务重启或代码部署不会主动退出登录；文件
权限固定为 `0600`，只保存随机 Cookie 令牌的 SHA-256 哈希、用户名和过期时间，
不会保存原始 Cookie。退出登录和 12 小时绝对有效期仍由服务端强制执行。
CLI 的 `auto-bj-pass init` 仍可用于账号初始化。

反向代理与应用运行在同一台主机且通过回环地址连接时，可显式设置
`AUTO_BJ_PASS_WEB_TRUST_PROXY=true`，让应用使用代理提供的
`X-Real-IP` 和 `X-Forwarded-Proto`。未设置时这些请求头会被忽略，不能由公网客户端
自行伪造安全状态或登录限流来源。

## 快速开始（AI Agent）

> 以下步骤面向 AI Agent，部分步骤需要用户配合提供信息。

**第 1 步 — 安装**

```bash
npm install -g auto-beijing-pass
npx skills add fichas/auto-beijing-pass -y -g
```

**第 2 步 — 初始化（非交互式，需要用户提供手机号和密码）**

```bash
auto-bj-pass init --name <name> --phone <phone> --password-stdin < /安全路径/password
```

新账号默认办理“六环外”；如需“六环内”，增加
`--entry-type 六环内`。

**第 3 步 — 验证**

```bash
auto-bj-pass status
```

## 命令参考


### 初始化

```bash
auto-bj-pass init                                    # 交互式添加账号（别名为空时使用手机号）
auto-bj-pass init --name 家庭账号                    #   指定账号名称
auto-bj-pass init --phone <phone> --password-stdin   # 从标准输入非交互式添加账号
  [--name <name>]                                #   多账号选择名称
  [--entry-type <六环内|六环外>]                 #   新账号默认六环外
  [--notify <url>...]
  [-f, --force]                                  #   更新相同手机号账号
```

相同手机号使用 `--force` 更新登录信息时，未显式传入的账号名称、进京证
类型、通知渠道、首选车辆、自动续签开关和出行地址都会保留原配置。

### 续签

```bash
auto-bj-pass run                        # 依次处理全部账号
  [--account <名称|手机号|序号>]      #   只处理指定账号
  [--plate <plate>]                 #   指定车牌（默认首选车辆）
  [--entry-type <六环内|六环外>]      #   指定进京证类型（默认使用配置值）
  [--no-notify]                     #   不发送通知
  [--dry-run]                       #   生成脱敏申请预览，不提交
```

无参数执行 `auto-bj-pass` 等同于 `auto-bj-pass run`。

在 Web 后台添加账号时，需要明确选择使用系统默认出行配置或为账号自定义配置；
旧账号如果从未选择且没有完整自定义配置，会自动使用系统默认配置。可使用
`--dry-run` 核对完整申请信息，确认后再等待自动续签。

### 状态

```bash
auto-bj-pass status                     # 查看全部账号状态
  [--account <名称|手机号|序号>]      #   只查看指定账号
  [-v]                              #   含配置信息
  [-n]                              #   将状态通过通知渠道发送
  [--plate <plate>]                 #   指定车牌（默认首选车辆）
```

### 车辆管理

```bash
auto-bj-pass vehicle list               # 单账号时直接使用
  [--account <名称|手机号|序号>]      #   多账号时必须指定
auto-bj-pass vehicle add                # 添加车辆
  --plate <plate>                   #   号牌号码（必填）
  --engine <engine>                 #   发动机号后6位（必填）
  --brand <brand>                   #   品牌型号（必填）
  --reg-date <YYYY-MM-DD>           #   注册日期（必填）
  [--plate-type <type>]             #   号牌种类（默认按车牌长度推断）
  [--vehicle-type <type>]           #   车辆类型（默认01=客车）
auto-bj-pass vehicle remove <plate>     # 删除车辆
auto-bj-pass vehicle set <plate>        # 设置首选车辆
auto-bj-pass vehicle swap <newPlate>    # 换牌（保留其他信息）
  [--from <oldPlate>]               #   指定替换哪辆（默认首选）
```

多账号配置下，所有车辆写操作均需增加 `--account`。

### 通知

```bash
auto-bj-pass notify add <url>           # 添加通知渠道
auto-bj-pass notify remove <url>        # 删除通知渠道
auto-bj-pass notify test                # 发送测试通知
```

多账号配置下需增加 `--account <名称|手机号|序号>`。

### 配置

```bash
auto-bj-pass set entry-type <六环内|六环外>   # 修改进京证类型
  [--account <名称|手机号|序号>]
auto-bj-pass set auto-renew <on|off>          # 开启或关闭指定账号自动续签
  --account <名称|手机号|序号>
```

### 审计日志

```bash
auto-bj-pass audit                             # 最近 30 天，最多 100 条
auto-bj-pass audit --since 7d                  # 最近 7 天
auto-bj-pass audit --since 2026-07-01          # 指定起始日期
auto-bj-pass audit --account <名称|手机号>      # 按账号筛选
auto-bj-pass audit --event renewal_submitted   # 按事件筛选
auto-bj-pass audit --limit 500 --json          # 输出 JSON
```

日志文件分工：

| 文件 | 内容 |
|------|------|
| `cron.log` | cron 进程的标准输出和错误；首次定时执行前可能为空 |
| `app-YYYY-MM-DD.log` | CLI 每日可读运行记录 |
| `audit-YYYY-MM.jsonl` | 每行一个 JSON 审计事件，适合筛选和后续导入 |

主要审计事件：

| 事件 | 含义 |
|------|------|
| `cron_configured` / `cron_removed` | 定时任务配置或移除 |
| `cron_tick_completed` | 随机窗口中的一次轻量检查 |
| `cron_account_selected` | 某账号命中当天随机执行时间 |
| `cron_account_completed` | 账号检查成功完成并写入当天去重状态 |
| `cron_account_failed` | 账号检查失败，记录下次重试时间 |
| `renewal_check_started` | 开始检查账号是否需要续签 |
| `renewal_skipped` | 因未到期、关闭开关或额度不足跳过 |
| `renewal_submitted` / `renewal_failed` | 续签提交成功或失败 |
| `config_changed` / `trip_profile_changed` | 配置或地址发生修改 |
| `account_*` / `web_login_*` / `web_logout` | 账号管理及后台登录、退出操作 |
| `vehicle_*` / `notification_*` | 车辆和通知渠道操作 |

日志时间使用服务器本地 ISO 8601 时间并携带时区偏移；ECS 配置为
`Asia/Shanghai` 时会显示 `+08:00`。普通日志中的手机号、车牌、身份证、发动机号、
地址、令牌和通知 URL 均会脱敏。结构化审计日志保留业务账号与车牌，方便管理员
准确追溯；密码、token、通知地址、出行地址与坐标仍会脱敏。日志目录权限为
`0700`，日志文件权限为 `0600`。
文件按日/月拆分，目前不会自动删除；如需长期保留，可定期归档到 OSS。

### 出行地址

当前支持“已在京”，在京地址与进京目的地可分别配置：

每个账号都可以选择使用系统默认配置或保存自己的真实出行配置。没有完整自定义
配置的账号会使用系统默认配置；系统默认配置可在账号管理中查看，切换为自定义
配置不会影响其他账号。

Web 管理后台添加账号时必须选择服务有效期，并选择“使用系统默认配置”或“自定义
出行配置”。使用系统默认配置时可直接完成添加；选择自定义时再进入出行信息步骤。
新账号默认开启自动续签、进京证类型默认为“六环外”，之后均可在账号管理中修改。
手动检查/续签时会先展示本次使用的在京地址、进京目的地和进京目的，允许临时修改，
并可选择是否同时保存为账号自定义配置。

```bash
auto-bj-pass trip set \
  --account <名称|手机号|序号> \
  --in-beijing-address <当前在京地址> \
  --in-beijing-longitude <高德经度> \
  --in-beijing-latitude <高德纬度> \
  --destination-address <进京目的地> \
  --destination-longitude <高德经度> \
  --destination-latitude <高德纬度> \
  --area <区县> \
  --district-code <小程序区县字典代码>

auto-bj-pass trip show --account <名称|手机号|序号>
auto-bj-pass run --dry-run --account <名称|手机号|序号>
```

只修改其中一处时，可省略另一处参数，命令会保留该账号已有配置。原有的
`--address/--longitude/--latitude` 参数继续兼容，并会同时设置两处地址。

地址和坐标必须与实际出行信息一致。`--dry-run` 会读取车辆、驾驶人和证件状态，只在本机输出脱敏预览，不调用提交申请接口。

### 账号管理

```bash
auto-bj-pass account list                    # 查看全部账号（手机号脱敏）
auto-bj-pass account remove <名称|手机号|序号> # 删除指定账号
```

### 定时任务

```bash
auto-bj-pass cron setup                 # 每个账号每天在 07:30-08:30 内各自随机一次
  [--random-window 'HH:MM-HH:MM']   #   自定义随机时间段
  [--schedule '<cron>']             #   使用固定 cron 表达式
auto-bj-pass cron remove                # 移除定时任务
auto-bj-pass cron status                # 查看定时状态
```

随机模式下，cron 会在窗口内逐分钟进行轻量检查。每个账号每天都会重新独立
随机，并通过服务器状态文件确保成功完成后当天不再重复。账号失败时不会写成
已完成，而是每 5 分钟重试；随机窗口结束后还有 30 分钟补偿检查。cron tick
使用单实例锁，避免前一次尚未结束时重复启动同一批检查。crontab 还会写入
`@reboot` 补偿任务：服务器在时间段后重启时，会检查当天状态，尚未成功完成的
账号会立即补跑。
固定 `--schedule` 模式仍会在指定时间依次处理全部账号。

交管局业务接口请求超时为 20 秒，超时后会进入上述续签重试流程。通知渠道
请求超时为 15 秒，超时会记录审计事件，但不会阻塞续签结果。

随机时间以北京时间为准。部署前需确认服务器时区：

```bash
sudo timedatectl set-timezone Asia/Shanghai
timedatectl
auto-bj-pass cron setup
```

## 智能续签逻辑

`auto-bj-pass run` 自动判断是否需要续签：

| 当前状态 | 行为 |
|----------|------|
| 无记录（新车） | 申请今天的进京证 |
| 审核通过（生效中），剩余 ≤ 1 天 | 提前申请明天的进京证 |
| 审核通过（生效中），剩余 > 1 天 | 无需续签 |
| 审核中 / 待生效 | 无需续签 |
| 已失效 / 审核失败 | 申请今天的进京证 |
| 剩余次数和天数均为 0 | 无法续签（配额用完） |

每个账号独立计算有效期和剩余天数。剩余天数包含当天；例如证件在明天到期，今天显示剩余 2 天，到期当天显示剩余 1 天并申请次日生效的证件。`auto-renew` 关闭的账号不会进入续签判断。

## 登录与凭证

`init` 和 Web 后台的“添加账号/重新登录”都会完成北京通 OAuth 登录，并将 SSO
中间 token 交换为交管局业务接口接受的 `accessToken`。账号密码不会保存；token 使用
AES-256-GCM 加密后写入当前执行用户的 `~/.auto-bj-pass/config.json`。本地密钥默认保存
在同目录的 `credentials.key`，两个文件权限均为 `0600`；生产环境也可通过
`AUTO_BJ_PASS_CREDENTIAL_KEY` 注入独立的 32 字节密钥。已有账号
重新登录时，原业务配置保持不变；登录失败不会覆盖现有可用凭据。

登录和状态查询使用当前 `:1443` 业务接口。现阶段已保存 token 失效后不会自动重新登录；遇到登录失效时，需要使用相同手机号重新执行：

```bash
auto-bj-pass init --phone <phone> --password-stdin --force < /安全路径/password
```

## 首选车辆逻辑

申请进京证时的车辆选择优先级：

1. `--plate` 参数指定 → 用它
2. 有正在申请/生效中的车辆 → 用它
3. 有手动设置的首选车辆（`auto-bj-pass vehicle set`）→ 用它
4. 都没有 → 用第一辆

只有一辆车时自动视为首选。换牌（`vehicle swap`）后自动更新首选。

## 通知渠道

通过 `auto-bj-pass notify add <url>` 添加。URL 格式兼容 [Apprise](https://github.com/caronc/apprise)，支持以下渠道：

| 渠道 | URL 格式 |
|------|----------|
| Bark | `bark://<server>/<key>` 或 `bark://<key>` |
| Telegram | `tgram://<bot_token>/<chat_id>` |
| 钉钉机器人 | `dingtalk://<access_token>[/<secret>]` |
| 企业微信机器人 | `wecom://<key>` |
| 飞书机器人 | `feishu://<hook_id>[/<secret>]` |
| Slack | `slack://<T>/<B>/<token>` |
| 通用 Webhook | `json://<host>/<path>` |

详细的 URL 格式说明参见 [Apprise Wiki](https://github.com/caronc/apprise/wiki)。

## 配置文件

配置存储在 `~/.auto-bj-pass/config.json`，由 `auto-bj-pass init` 或 Web 后台账号管理
自动创建，无需手动编辑。账号保存在 `users` 数组中，配置文件采用原子替换方式写入，
权限会自动设置为 `0600`。读取旧版明文配置时会自动删除已保存密码并将业务 token
迁移为加密格式；迁移后必须同时备份 `config.json` 和 `credentials.key` 才能恢复账号。

单账号用户原有命令保持兼容。配置多个账号后：

- `status` 和 `run` 默认依次处理全部账号；
- `auto-renew` 关闭的账号仍可查询状态，但 `run` 和定时任务会跳过；
- `vehicle`、`notify` 和 `set` 等写操作要求使用 `--account`；
- `trip_profile_mode` 记录账号明确选择的 `default` 或 `custom`；
- `trip_profile` 只保存账号自定义地址，选择 `default` 时实时使用系统默认配置；
- 没有模式或没有完整自定义配置的旧账号自动使用系统默认配置；
- `--account` 支持账号名称、完整手机号或 `account list` 展示的序号。

## Agent Skills

| Skill | 说明 |
|-------|------|
| `auto-bj-pass` | 进京证办理、状态查询、车辆管理、通知配置 |

## License

MIT
