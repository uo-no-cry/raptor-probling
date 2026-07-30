# Raptor Reference Design

Raptor 运维平台的参考架构与仿真项目档案，覆盖：

- HTTP/HTTPS 多环境拨测平台
- 应用、环境与探测点网络连通性矩阵
- 调度、Kafka、HTTP Worker、结果聚合、告警与弹性伸缩
- Sumo Logic 日志查询 Claude Code Plugin
- Jira Ticket 生成 Claude Code Plugin
- Slack 通知中心重构
- 从立项、需求、设计、开发、测试到发布运维的完整 SDLC 模板

> 本项目用于系统设计学习和面试准备，不代表真实生产交付、上线记录或压测结果。

## Requirements

- Node.js `>=22.13.0`
- npm

## Development

```bash
npm install
npm run dev
```

本地页面默认运行在 `http://localhost:3000`。

可交互拨测平台演示：

```text
http://localhost:3000/demo
```

演示版支持测试套 CRUD、发布/暂停、Token 掩码管理、模拟拨测、执行机排空和 1W TPS 自动扩缩容模拟。数据保存在浏览器本地，不会向填写的目标 URL 发起真实请求。

## Verification

```bash
npm run build
npm test
npm run lint
```

## Static HTML

仓库根目录包含可直接打开的：

```text
Raptor-参考架构设计.html
Raptor-拨测平台架构设计.html
Raptor-拨测平台功能设计.html
Raptor-拨测平台真实场景详细设计.html
```

- `Raptor-参考架构设计.html`：包含拨测、日志查询插件、Jira 插件和 Slack 通知重构的总文档。
- `Raptor-拨测平台架构设计.html`：从总文档自动拆分生成的拨测平台独立设计文档，包含应用架构、网络架构及完整 SDLC 档案。
- `Raptor-拨测平台功能设计.html`：测试套 CRUD、拨测 Token、执行机和面向 1W TPS 的自动扩缩容功能设计。
- `Raptor-拨测平台真实场景详细设计.html`：真实运行场景的数据表、调度路由、执行池、网络带宽、串并行执行、异常回收和 1W TPS 压测举证。

重新生成：

```bash
npm run build
npm run export:static
```

## Important Scope

拨测设计当前仅支持 HTTP/HTTPS。DNS 解析、TCP 建连和 TLS 握手只作为 HTTP 请求内部诊断阶段，不对外提供独立协议拨测。
