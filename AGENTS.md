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

## Code synchronization and source flow

- GitHub `main` 是最终应收敛到的代码基线，但 ECS 也可能包含尚未回收到 Git 的有效修改，不能默认把 ECS 仅视为单向部署目标。
- 开始涉及功能修改、推送、部署或 ECS 同步的任务时，先检查本地 HEAD 和工作树；涉及 GitHub 时再检查远端 `main`，涉及 ECS 时再检查 ECS HEAD 和工作树，明确三方差异后再决定同步方向。
- 正常开发流程为：本地功能分支或 worktree 修改 → 本地验证 → Commit → 推送并合入 GitHub `main` → ECS 从 `main` 快进部署。
- 如果 ECS 存在本地和 GitHub 都没有的有效修改，先只读盘点并备份 ECS 差异，再把代码同步到本地功能分支或 worktree；在本地审查、合并、构建和测试后 Commit、推送 GitHub，最后让 ECS 对齐该 Commit。
- 如果本地和 ECS 同时有独有修改，必须先在本地完成合并和验证；禁止用任一方直接覆盖另一方。
- 只有用户明确要求直接在线修复时，才可以在 ECS 修改业务代码；紧急修复完成后必须尽快回收到本地并提交 GitHub，再让 ECS 对齐 Git 中的 Commit，不能长期保留仅在线上存在的代码。
- 从 ECS 回收代码时，不同步密码、令牌、运行配置、日志、`node_modules`、部署备份、构建临时文件或 `._*` AppleDouble 文件；不得读取或复制 `~/.auto-bj-pass` 中的敏感内容。
- ECS 工作树不干净时不得直接执行覆盖式部署。先查明改动来源并做可恢复备份；确认改动已回收到 Git 或确定可以舍弃后，再使用快进方式同步。
- 推荐在 ECS 使用 `git fetch origin` 后执行 `git merge --ff-only origin/main`，避免隐式合并提交；若 ECS 无法直接访问 GitHub，应先解决 Deploy Key 或网络问题，或使用经过校验的 Git bundle 传递同一 Commit。
- 同步完成后，应确认本地、GitHub `main` 和 ECS 的 Commit 一致；需要严格核验时同时比较 tree hash，并确认 ECS 工作树不存在未说明的代码改动。

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
