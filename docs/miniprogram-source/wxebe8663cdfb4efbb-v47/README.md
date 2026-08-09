# 进京证办理小程序源码提取记录

- AppID：`wxebe8663cdfb4efbb`
- 缓存版本：`47`
- `packages/`：从本机微信缓存原样复制的 1 个主包和 6 个分包
- `source/`：解密并反编译后的源码
- `mappings.json`：进京目的、北京市区县的 `label/value` 映射

`mappings.json` 的完整映射于 2026-08-09 使用项目中已有的北京通业务
TOKEN 调用下述字典接口验证；未在文件中保存 TOKEN、账号或密码。

## 字典数据流

当前小程序没有把选项直接硬编码在页面源码中，而是在登录后请求：

```text
POST https://jjz.jtgl.beijing.gov.cn:1443/pro/ucDicController/queryDic
```

- 进京目的请求参数：`{"type":"jjmd"}`
- 区县请求参数：`{"type":"qjxz"}`
- 显示字段：`zdz`
- 提交值字段：`zdbm`

关键源码位置：

- `source/pagesSqbz/jjxx/jjxx.js`：加载 `jjmd`，并把选中的 `zdbm` 写入 `jjmd`
- `source/pagesSqbz/jjxx/jjxx.wxml`：界面显示 `item.zdz`
- `source/pagesSqbz/mdd/mdd.js`：加载 `qjxz`，并把区县的 `zdbm` 写入 `jjdq`
- `source/common/vendor.js`：接口基础地址和请求封装

`mappings.json` 中保留字符串前导零，调用接口时不要把 `value` 转成数字。
