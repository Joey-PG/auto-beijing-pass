---
name: auto-bj-pass
version: 1.0.0
description: "进京证 CLI 工具：办理/续签进京证、查看状态、管理车辆、配置通知。当用户提到进京证、北京通行证、车辆进京、六环、进京许可等关键词时触发。"
---

# auto-bj-pass 进京证 CLI

帮助用户通过命令行办理和管理北京车辆进京证（进京通行证）。

## 安装检测

使用前先检查是否已安装：

```bash
which auto-bj-pass
```

如果未安装：

```bash
npm install -g auto-beijing-pass
```

## 初始化检测

```bash
auto-bj-pass status
```

如果返回"未初始化"错误，询问用户的北京通手机号和密码，然后执行：

```bash
auto-bj-pass init --name <name> --phone <phone> --password <password>
```

可选参数：`--entry-type <六环内|六环外>`（新账号默认六环外）、`--notify <url>`（可多次指定）、`-f`（更新已有账号）

可重复执行 `init` 添加多个账号；相同手机号需加 `-f` 更新。更新时未显式传入的进京证类型、通知渠道和其他业务配置会保持不变。

`init` 会自动完成新版北京通 OAuth 和交管局业务 token 交换。若后续状态查询提示 token 失效，使用相同手机号重新执行 `init -f`。

## 命令参考

### 续签进京证

```bash
auto-bj-pass run                                # 依次处理全部账号
auto-bj-pass run --account <名称|手机号|序号>     # 只处理指定账号
auto-bj-pass run --no-notify                    # 只续签不通知
auto-bj-pass run --plate <plate>                # 指定车牌
auto-bj-pass run --entry-type 六环外             # 指定类型
```

自动判断是否需要续签：生效中且剩余≤1天→申请明天的，无记录→申请今天的，审核中/待生效→不申请。

各账号独立计算到期时间；`auto-renew` 关闭的账号会被 `run` 和 cron 跳过。

随机 cron 只有在账号成功完成检查后才写入当天去重状态；执行失败时每 5 分钟重试，随机窗口结束后继续补偿检查 30 分钟。

### 查看状态

```bash
auto-bj-pass status                             # 全部账号状态
auto-bj-pass status --account <名称|手机号|序号>  # 指定账号
auto-bj-pass status -v                          # 含配置信息
auto-bj-pass status -n                          # 状态通过通知渠道发送
auto-bj-pass status --plate <plate>             # 指定车牌
```

### 车辆管理

```bash
auto-bj-pass vehicle list                       # 查看绑定车辆
auto-bj-pass vehicle add --plate <plate> --engine <engine> --brand <brand> --reg-date <YYYY-MM-DD>
auto-bj-pass vehicle remove <plate>             # 删除车辆
auto-bj-pass vehicle set <plate>                # 设置首选车辆
auto-bj-pass vehicle swap <newPlate>            # 换牌（保留其他信息）
auto-bj-pass vehicle swap <newPlate> --from <oldPlate>  # 指定替换哪辆
```

`vehicle add` 可选参数：`--plate-type`（号牌种类，8位车牌默认新能源）、`--vehicle-type`（车辆类型，默认客车）

配置多个账号后，车辆写操作需增加 `--account <名称|手机号|序号>`。

### 通知管理

```bash
auto-bj-pass notify add <url>                   # 添加通知渠道
auto-bj-pass notify remove <url>                # 删除通知渠道
auto-bj-pass notify test                        # 测试通知
```

通知 URL 格式兼容 [Apprise](https://github.com/caronc/apprise/wiki)：`bark://`、`tgram://`、`dingtalk://`、`wecom://`、`feishu://`、`slack://`、`json://`

配置多个账号后，通知操作需增加 `--account <名称|手机号|序号>`。

### 配置

```bash
auto-bj-pass set entry-type <六环内|六环外> --account <名称|手机号|序号>
auto-bj-pass set auto-renew off --account <名称|手机号|序号>
auto-bj-pass set auto-renew on --account <名称|手机号|序号>
```

关闭 `auto-renew` 后仍可执行 `status`，但 `run` 和定时任务会跳过该账号。

### 出行地址与安全预览

账号自定义地址优先；未配置时使用系统默认地址。当前支持“已在京”，且在京地址与目的地可分别配置：

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

只修改其中一处时可省略另一处参数，已有配置会被保留。旧的
`--address/--longitude/--latitude` 参数仍可同时设置两处地址。

`--dry-run` 只读取状态并输出脱敏申请预览，不调用提交申请接口。正式执行前应先让用户核对预览中的地址、坐标、区县、申请日期和证件类型。

### 账号管理

```bash
auto-bj-pass account list
auto-bj-pass account remove <名称|手机号|序号>
```

### 定时任务

```bash
auto-bj-pass cron setup                         # 每天 9:00 依次处理全部账号
auto-bj-pass cron setup --schedule '0 8 * * *'  # 自定义时间
auto-bj-pass cron status
auto-bj-pass cron remove
```

## 安全规则

- 不要在终端明文输出用户密码
- 执行 `run` 前确认用户意图
- 不要伪造、随机化或擅自修改用户的地址和坐标
- 未经用户核对时优先使用 `run --dry-run`
- 不要修改用户已有的通知配置，除非用户明确要求
