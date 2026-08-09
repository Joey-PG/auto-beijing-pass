# AGENTS.md

## Communication

- 默认使用中文沟通。
- 修改功能后主动说明验证结果。
- 只有用户明确要求“部署”或“同步 ECS”时，才修改线上环境。

## Workspace and repository workflow

- 本项目使用 Git worktree。开始工作前运行 `git rev-parse --show-toplevel` 和 `git status --short --branch`，确认当前所在的实际工作树及已有改动。
- 处理 Web 应用时，应在包含 `package.json`、`web/`、`src/` 和 `test/` 的应用工作树中修改代码，不要误在仅包含文档的工作树中实现功能。
- 保留已有未提交改动，不覆盖、清理或回退与当前任务无关的文件。
- 前端源码位于 `web/src/`。
- `src/web/public/` 是 Vite 构建产物，禁止手工编辑；修改前端后通过构建命令重新生成。
- 完成用户要求的修改并完成相应验证后，按功能边界创建本地 Git Commit；不同主题不要混在同一个 Commit 中。
- Commit 信息使用清晰的 Conventional Commits 格式，并准确描述实际修改内容。
- 默认不执行 `git push`；只有用户明确要求推送时，才同步到远端仓库。
- 修改尚未完成或验证失败时不要提交，应先修复；如果无法修复，向用户说明阻塞原因。

## Verification

修改前端后依次运行：

1. `npx tsc --noEmit -p web/tsconfig.json`
2. `npm run web:build`
3. `npm test`

构建后还要确认：

- `src/web/public/index.html` 引用的资源真实存在。
- 不保留入口文件引用不到的旧哈希资源。
- 仅修改文档或说明文件时，可以不运行应用测试，但交付时必须明确说明。

## Product constraints

- 车辆和续签记录从北京交管接口实时读取，不维护本地车辆副本。
- Web 端默认不显示车辆绑定、解绑或删除入口；除非用户明确要求恢复。
- 首次进入车辆页面不得自动打开第一辆车。
- 编辑账号配置和修改京通密码保持为两个独立操作。
- 页面规范路由为 `/vehicles`、`/logs`、`/accounts` 和 `/system`。
- `/audit` 仅作为兼容入口，并规范跳转到 `/logs`。

## ECS deployment

- SSH 主机别名：`ecs`。
- 应用目录：`/opt/auto-beijing-pass`。
- 服务名称：`auto-beijing-pass-web.service`。
- 公网地址：`https://pass.picfix.top`。
- ECS 未安装 `rsync`，使用 `scp` 或受控的 tar 流同步。
- 部署前备份本次将覆盖的具体文件。
- 先上传新的哈希资源，再上传 `index.html`，避免入口暂时引用不存在的资源。
- 确认新资源存在后，才能删除旧哈希资源。
- 部署后执行远端类型检查和相关测试，再重启服务。
- 重启后轮询 `127.0.0.1:3751`，最后检查公网页面以及入口引用的主要资源。
- 不读取、输出或覆盖 `~/.auto-bj-pass` 中的密码、令牌、配置和日志。
- 部署前确认本地代码没有落后于 ECS 或远端 `main`，避免回退线上功能。
