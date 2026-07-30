"use client";

const modules = [
  { id: "probe", index: "01", title: "拨测平台", subtitle: "调度、执行、聚合与弹性" },
  { id: "sumo", index: "02", title: "日志查询插件", subtitle: "受控检索与上下文压缩" },
  { id: "jira", index: "03", title: "Jira 工单插件", subtitle: "结构化草稿与安全提交" },
  { id: "slack", index: "04", title: "Slack 通知重构", subtitle: "模板、路由与可追溯投递" },
];

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="label">{children}</span>
);

const Node = ({
  title,
  meta,
  tone = "",
}: {
  title: string;
  meta: string;
  tone?: string;
}) => (
  <div className={`arch-node ${tone}`}>
    <strong>{title}</strong>
    <span>{meta}</span>
  </div>
);

const Arrow = ({ text = "" }: { text?: string }) => (
  <div className="arrow" aria-hidden="true">
    <span>{text}</span>
    <i>→</i>
  </div>
);

function Difficulty({
  number,
  title,
  problem,
  solution,
  tradeoff,
}: {
  number: string;
  title: string;
  problem: string;
  solution: string;
  tradeoff: string;
}) {
  return (
    <article className="difficulty">
      <div className="difficulty-number">{number}</div>
      <div>
        <h4>{title}</h4>
        <p><b>难点</b>{problem}</p>
        <p><b>方案</b>{solution}</p>
        <p className="tradeoff"><b>取舍</b>{tradeoff}</p>
      </div>
    </article>
  );
}

function FlowStep({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <span>{number}</span>
      <div><strong>{title}</strong><p>{children}</p></div>
    </li>
  );
}

function ProjectStage({
  index,
  title,
  owner,
  activities,
  artifacts,
  entry,
  exit,
}: {
  index: string;
  title: string;
  owner: string;
  activities: string[];
  artifacts: string[];
  entry: string;
  exit: string;
}) {
  return (
    <article className="project-stage">
      <div className="stage-head">
        <span>{index}</span>
        <div><h4>{title}</h4><p>{owner}</p></div>
      </div>
      <div className="stage-body">
        <div><b>主要活动</b><ul>{activities.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><b>文档产物</b><ul>{artifacts.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </div>
      <div className="stage-gates">
        <p><strong>准入标准</strong>{entry}</p>
        <p><strong>准出标准</strong>{exit}</p>
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="返回顶部">
          <span className="brand-mark">R</span>
          <span>RAPTOR <small>REFERENCE DESIGN</small></span>
        </a>
        <nav aria-label="章节导航">
          {modules.map((item) => <a key={item.id} href={`#${item.id}`}>{item.index}</a>)}
        </nav>
        <button className="print-button" onClick={() => window.print()}>打印 / 导出 PDF</button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <Label>INTERVIEW PREPARATION · v1.0</Label>
          <h1>Raptor 运维能力<br /><em>参考架构设计</em></h1>
          <p className="hero-lead">
            将四段简历描述拆成可讨论、可质疑、可演进的工程方案。重点不是背组件名，
            而是说清楚边界、数据流、容量、失败策略与安全取舍。
          </p>
          <div className="hero-note">
            <strong>使用边界</strong>
            <span>本文是基于给定背景构造的假设性设计，不代表真实生产交付记录。面试时请明确区分“做过”与“我的设计方案”。</span>
          </div>
        </div>
        <div className="hero-panel">
          <div className="radar">
            <div className="radar-ring r1" />
            <div className="radar-ring r2" />
            <div className="radar-ring r3" />
            <div className="radar-axis x" />
            <div className="radar-axis y" />
            <div className="sweep" />
            <span className="pulse p1" />
            <span className="pulse p2" />
            <span className="pulse p3" />
            <div className="radar-center">R</div>
          </div>
          <div className="metrics">
            <div><b>200+</b><span>应用</span></div>
            <div><b>500+</b><span>微服务</span></div>
            <div><b>10k</b><span>峰值探测请求/s*</span></div>
          </div>
          <p>* 设计容量，不等于稳定业务吞吐或长期平均流量。</p>
        </div>
      </section>

      <section className="intro section-shell">
        <div className="section-heading">
          <Label>00 · SYSTEM CONTEXT</Label>
          <h2>先统一平台边界</h2>
          <p>Raptor 管理应用与资源元数据，四项能力共享身份、应用目录、审计和通知基础设施，但各自保持故障隔离。</p>
        </div>
        <div className="context-map">
          <div className="context-users">
            <Node title="研发 / SRE" meta="Portal · Claude Code" tone="accent" />
          </div>
          <Arrow text="SSO / RBAC" />
          <div className="context-core">
            <div className="context-title">RAPTOR CONTROL PLANE</div>
            <div className="node-grid">
              <Node title="应用目录" meta="App · Service · Owner" />
              <Node title="拨测控制面" meta="Probe · Policy · Result" />
              <Node title="MCP / Plugin Gateway" meta="Tool · Audit · Guardrail" />
              <Node title="通知中心" meta="Template · Route · Delivery" />
            </div>
          </div>
          <Arrow text="受控调用" />
          <div className="context-external">
            <Node title="Kubernetes" meta="执行面 / HPA" />
            <Node title="Sumo Logic" meta="日志检索" />
            <Node title="Jira / Slack" meta="工单与通知" />
          </div>
        </div>
        <div className="principles">
          <article><span>01</span><h3>控制面 / 数据面分离</h3><p>配置失败不能拖垮探测；执行节点无状态，可独立扩缩。</p></article>
          <article><span>02</span><h3>异步化与背压</h3><p>Kafka 削峰，分区保证局部顺序；消费延迟触发扩容和降级。</p></article>
          <article><span>03</span><h3>最小权限与审计</h3><p>Claude 只通过白名单工具访问外部系统，敏感字段脱敏。</p></article>
          <article><span>04</span><h3>事实与推测分离</h3><p>设计指标、压测值、生产值分别标注，避免用“1W TPS”掩盖口径。</p></article>
        </div>
      </section>

      <section className="module section-shell" id="probe">
        <div className="module-index">01</div>
        <div className="section-heading">
          <Label>SYNTHETIC MONITORING</Label>
          <h2>拨测平台：HTTP 多环境主动探测</h2>
          <p>当前版本仅支持 HTTP/HTTPS 类型接口拨测。目标是从指定探测点验证应用各部署环境的网络可达性、HTTP 可用性与响应时延，并避免把网络未开通误判成应用故障。</p>
        </div>

        <div className="scope-grid">
          <article><h3>功能范围</h3><ul><li>仅支持 HTTP/HTTPS，支持 GET、HEAD 和受控 POST</li><li>周期、手动、发布后触发</li><li>按应用环境选择 URL 与探测点</li><li>状态码、JSONPath/文本、时延断言</li><li>连续失败与多点仲裁告警</li></ul></article>
          <article><h3>非目标</h3><ul><li>暂不支持独立 TCP、gRPC、DNS 和浏览器事务拨测</li><li>不替代真实用户监控 APM</li><li>不承载大响应体或压测流量</li><li>不把网络不通或单次失败直接等价为应用事故</li><li>不允许任意 URL 形成 SSRF 通道</li></ul></article>
          <article><h3>SLO 建议</h3><ul><li>调度准时率 ≥ 99.9%</li><li>结果入库延迟 P99 ≤ 10s</li><li>控制面月可用性 ≥ 99.9%</li><li>探测结果至少一次送达</li></ul></article>
        </div>

        <div className="environment-design">
          <div className="diagram-title"><span>MULTI-ENVIRONMENT MODEL</span><b>应用—环境—探测点网络连通性矩阵</b></div>
          <div className="environment-topology">
            <div className="environment-app">
              <Label>APPLICATION</Label>
              <h3>payment-service</h3>
              <p>同一应用在不同环境拥有独立 URL、网络域、凭据引用和告警策略。</p>
            </div>
            <div className="environment-list">
              <article><span>DEV</span><b>开发环境</b><small>dev.internal / zone-dev</small></article>
              <article><span>TEST</span><b>测试环境</b><small>test.internal / zone-test</small></article>
              <article><span>STG</span><b>预发环境</b><small>stg.internal / zone-stg</small></article>
              <article><span>PROD</span><b>生产环境</b><small>prod.internal / zone-prod</small></article>
            </div>
          </div>
          <div className="matrix-wrap">
            <table className="connectivity-matrix">
              <thead><tr><th>探测点 \ 环境</th><th>DEV</th><th>TEST</th><th>STAGING</th><th>PROD</th></tr></thead>
              <tbody>
                <tr><th>办公网 Probe</th><td className="reachable">可达</td><td className="reachable">可达</td><td className="blocked">未开通</td><td className="blocked">禁止访问</td></tr>
                <tr><th>非生产 K8S Probe</th><td className="reachable">可达</td><td className="reachable">可达</td><td className="reachable">可达</td><td className="blocked">隔离</td></tr>
                <tr><th>生产 K8S Probe</th><td className="unknown">未配置</td><td className="unknown">未配置</td><td className="reachable">可达</td><td className="reachable">可达</td></tr>
              </tbody>
            </table>
          </div>
          <div className="connectivity-rule">
            <strong>判定规则</strong>
            <p>先执行 DNS 解析、TCP 建连、TLS 握手和 HTTP 请求四阶段诊断；这些是 HTTP 探测的内部阶段，不对外提供独立协议拨测。只有网络矩阵为 REACHABLE 时，HTTP 失败才进入应用健康告警；BLOCKED/UNKNOWN 进入网络开通流程，禁止把网络不通判定为应用故障。</p>
          </div>
        </div>

        <div className="diagram-card">
          <div className="diagram-title"><span>ARCHITECTURE</span><b>控制面、消息总线与执行面</b></div>
          <div className="flow-diagram probe-flow">
            <Node title="Portal / API" meta="创建任务 · 校验权限" tone="accent" />
            <Arrow text="CRUD" />
            <Node title="MySQL" meta="任务 · 版本 · 告警策略" />
            <Arrow text="增量加载" />
            <Node title="Scheduler" meta="时间轮 · 分片 · 防重" tone="green" />
            <Arrow text="ProbeCommand" />
            <Node title="Kafka" meta="按 probePoint + environment 分区" tone="orange" />
            <Arrow text="pull + backpressure" />
            <Node title="HTTP Worker Pool" meta="连接复用 · 分阶段计时 · 限流" tone="purple" />
          </div>
          <div className="return-flow">
            <span>结果路径</span><i>Worker → Result Topic → Aggregator → MySQL/时序存储 → Rule Engine → 通知中心</i>
          </div>
        </div>

        <div className="two-column">
          <div>
            <h3 className="subheading">一次探测的完整链路</h3>
            <ol className="timeline">
              <FlowStep number="1" title="环境与端点版本化">保存 applicationId、environmentId、baseUrl、path、HTTP 方法、周期、超时、断言与密钥引用；发布后生成不可变 version。</FlowStep>
              <FlowStep number="2" title="网络准入">查询网络连通性矩阵；UNKNOWN/BLOCKED 不进入业务拨测队列，而是生成网络开通或复检任务。</FlowStep>
              <FlowStep number="3" title="确定性调度">Scheduler 以 executionId = taskId + environmentId + scheduledAt + probePoint 生成命令；Redis SET NX 或数据库租约防止重复投递。</FlowStep>
              <FlowStep number="4" title="有界 HTTP 执行">Worker 做 URL 白名单、DNS 重绑定防护、环境配额与响应体限制，记录 DNS/TCP/TLS/TTFB/总时延。</FlowStep>
              <FlowStep number="5" title="结果分类">区分 NETWORK_BLOCKED、DNS_ERROR、TLS_ERROR、HTTP_ERROR、ASSERTION_FAILED 与 TIMEOUT，避免故障归因混淆。</FlowStep>
              <FlowStep number="6" title="告警判定">采用连续 N 次失败、M/N 窗口和多探测点仲裁；状态机只在 OK↔FIRING 变化时通知。</FlowStep>
            </ol>
          </div>
          <div className="capacity-card">
            <div className="diagram-title"><span>CAPACITY MODEL</span><b>“1W TPS”必须先解释口径</b></div>
            <div className="formula">并发数 ≈ QPS × 平均耗时</div>
            <p>若峰值到达率为 10,000 req/s、平均耗时 200ms，则同时在途约 2,000；若 P99 超时 3s，最坏在途可逼近 30,000。</p>
            <table>
              <tbody>
                <tr><th>单 Pod 安全吞吐</th><td>500 req/s（压测假设）</td></tr>
                <tr><th>峰值基础 Pod</th><td>10,000 ÷ 500 = 20</td></tr>
                <tr><th>冗余后建议</th><td>26–30 Pods</td></tr>
                <tr><th>HPA 信号</th><td>Kafka lag + in-flight + CPU</td></tr>
                <tr><th>保护阈值</th><td>全局 / 租户 / 目标三级限流</td></tr>
                <tr><th>结果数据量</th><td>1KB × 10k/s ≈ 864GB/日（峰值若持续）</td></tr>
              </tbody>
            </table>
            <p className="callout">容量口径：系统按 1 万次 HTTP 探测请求/秒的突发目标设计；只有具备机器规格、持续时长、延迟分布和瓶颈记录的真实报告时，才可以称为“已压测验证”。</p>
          </div>
        </div>

        <h3 className="subheading">关键难点与解决方案</h3>
        <div className="difficulty-list">
          <Difficulty number="A" title="调度风暴与整点尖峰" problem="大量分钟级任务在整分触发，Scheduler 和下游瞬时过载。" solution="对周期任务增加确定性 jitter；分片调度器只负责生成命令，Kafka 削峰；设置租户配额与优先级队列。" tradeoff="jitter 会让任务偏离整点，需要在产品上展示“计划时间”和“实际时间”。" />
          <Difficulty number="B" title="重复执行与结果幂等" problem="调度器故障转移、Kafka 重试会产生重复命令，网络调用本身不可事务化。" solution="用稳定 executionId；Worker 允许至少一次执行，结果存储以 executionId 唯一键 upsert；通知以 incidentId + state 做幂等。" tradeoff="不追求昂贵的端到端 exactly-once，而是在副作用边界做去重。" />
          <Difficulty number="C" title="网络不通与应用故障混淆" problem="应用刚部署到新环境但防火墙尚未开通，直接开始拨测会持续产生假告警。" solution="维护应用—环境—探测点网络连通性矩阵；环境接入先做网络准入，BLOCKED/UNKNOWN 走网络开通流程；只有 REACHABLE 的链路才参与健康计算。" tradeoff="引入额外状态与复检流程，但能把平台故障、网络故障和应用故障分层归因。" />
          <Difficulty number="D" title="自动扩缩容滞后" problem="只看 CPU 时，I/O 型 Worker 的 Kafka lag 已堆积但 CPU 仍不高。" solution="KEDA/HPA 同时使用 lag、in-flight 和 CPU；保留最小热池；预估定时任务峰值做 scheduled scaling。" tradeoff="多指标扩容更复杂，需要限制最大副本数并验证下游承载力。" />
          <Difficulty number="E" title="SSRF 与凭据安全" problem="允许用户配置 URL、Header 和脚本，可能访问元数据地址或泄露密钥。" solution="目标必须属于应用目录；阻断私有保留地址和重绑定；Secret 只保存引用并在 Worker 运行时短期获取；响应体截断并脱敏。" tradeoff="严格白名单会降低灵活性，例外需审批和审计。" />
        </div>

        <details>
          <summary>数据模型与表设计 <span>展开</span></summary>
          <div className="detail-body">
            <table className="wide-table">
              <thead><tr><th>实体</th><th>关键字段</th><th>约束 / 索引</th></tr></thead>
              <tbody>
                <tr><td>app_environment</td><td>environmentId, app_id, name, network_zone, status</td><td>(app_id, name) 唯一；环境停用后禁止新调度</td></tr>
                <tr><td>probe_endpoint</td><td>id, environmentId, method, base_url, path, headers_ref</td><td>仅允许 http/https；URL 与应用目录绑定</td></tr>
                <tr><td>network_connectivity</td><td>environmentId, probe_point_id, connectivityStatus, checked_at, evidence</td><td>组合唯一；状态为 UNKNOWN/PENDING/REACHABLE/BLOCKED/DEGRADED</td></tr>
                <tr><td>probe_task</td><td>id, endpoint_id, schedule, probe_points, enabled</td><td>endpoint_id 索引；配置本身不覆盖历史版本</td></tr>
                <tr><td>probe_version</td><td>task_id, version, timeout, assertion, secret_ref</td><td>(task_id, version) 唯一</td></tr>
                <tr><td>probe_execution</td><td>execution_id, environmentId, probe_point_id, status, latency_ms, error_code</td><td>execution_id 唯一；按日期分区 / TTL</td></tr>
                <tr><td>incident</td><td>rule_id, fingerprint, state, opened_at, recovered_at</td><td>(fingerprint, active_state) 防重复告警</td></tr>
              </tbody>
            </table>
          </div>
        </details>

        <div className="project-dossier">
          <div className="section-heading">
            <Label>SIMULATED PROJECT DOSSIER</Label>
            <h2>仿真项目档案：完整软件开发流程</h2>
            <p>以下按真实研发治理方式给出阶段、活动、责任人、准入标准、准出标准和文档产物，用于设计演练与面试准备，不是对真实历史记录的证明。</p>
          </div>

          <div className="phase-map">
            {["立项调研","需求分析","功能设计","架构设计","详细设计","开发实现","测试与验收","发布与运维","复盘改进"].map((item, index) => (
              <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><b>{item}</b></div>
            ))}
          </div>

          <div className="project-stages">
            <ProjectStage
              index="01" title="立项与问题调研" owner="Owner：产品负责人 / SRE / 技术负责人"
              activities={["访谈应用 Owner、SRE 与网络团队，确认手工巡检痛点", "盘点 200+ 应用、环境、URL、网络域和现有告警渠道", "定义 HTTP-only MVP、成功指标、预算与主要风险"]}
              artifacts={["项目章程（Project Charter）", "现状调研报告", "干系人清单与 RACI", "风险登记册"]}
              entry="业务痛点、项目 Sponsor 和核心参与人明确。"
              exit="范围、目标、里程碑、资源和是否立项通过评审。"
            />
            <ProjectStage
              index="02" title="需求分析" owner="Owner：产品经理；参与：SRE、研发、网络、安全、测试"
              activities={["梳理应用、环境、HTTP 端点、探测点和告警用户旅程", "定义周期拨测、手动拨测、网络准入、结果查询和告警闭环", "确定性能、安全、可用性、数据保留等非功能需求", "建立需求优先级与需求—测试可追踪关系"]}
              artifacts={["产品需求文档（PRD）", "需求规格说明书（SRS）", "用例清单与验收标准", "非功能需求清单", "需求追踪矩阵（RTM）"]}
              entry="项目范围获批，关键用户和系统边界可访问。"
              exit="需求无重大歧义，P0/P1 验收标准可测试，产品/研发/测试联合签字。"
            />
            <ProjectStage
              index="03" title="功能设计" owner="Owner：产品经理 / UX；评审：研发、测试、SRE"
              activities={["设计应用环境接入、端点配置、网络矩阵、任务与告警页面", "定义 HTTP 方法、Header/Body、断言、超时和重试的产品约束", "设计任务、连通性和告警状态机，以及 RBAC 操作权限", "制作原型并完成可用性走查"]}
              artifacts={["功能设计说明书", "页面原型与交互稿", "字段数据字典", "权限矩阵", "状态机与异常提示清单"]}
              entry="SRS 通过评审，核心业务规则和验收标准稳定。"
              exit="页面、字段、状态、异常分支和权限均可被研发与测试实现。"
            />
            <ProjectStage
              index="04" title="架构设计" owner="Owner：架构师 / 技术负责人"
              activities={["拆分配置控制面、调度器、Kafka、HTTP Worker、聚合器和告警引擎", "完成容量估算、分区策略、HPA 指标、容灾与数据保留设计", "完成 SSRF、密钥、RBAC、审计和网络隔离威胁建模", "用 ADR 记录 Kafka、幂等语义、网络矩阵等关键取舍"]}
              artifacts={["总体架构设计文档（HLD）", "部署架构图与数据流图", "容量评估报告", "威胁模型与安全设计", "架构决策记录（ADR）"]}
              entry="功能设计稳定，技术约束、基础设施和容量目标已知。"
              exit="架构评审通过；关键风险有验证计划；运维、安全和网络团队认可边界。"
            />
            <ProjectStage
              index="05" title="详细设计" owner="Owner：模块负责人"
              activities={["设计数据库表、索引、状态迁移和数据清理策略", "定义 REST API、Kafka Command/Result Schema 与错误码", "细化调度幂等、Worker 并发、网络准入、告警去重时序", "设计配置迁移、灰度开关与回滚兼容"]}
              artifacts={["详细设计说明书（LLD）", "接口设计文档 / OpenAPI", "数据库设计与 ER 图", "Kafka 消息契约", "时序图、错误码与配置清单"]}
              entry="HLD 通过，模块边界、Owner 和关键接口明确。"
              exit="接口与数据契约冻结；可测试性、异常路径和兼容策略经评审确认。"
            />
            <ProjectStage
              index="06" title="开发实现" owner="Owner：后端 / 前端研发；保障：技术负责人"
              activities={["按任务拆分迭代，先写单元与契约测试，再完成最小实现", "实现环境/端点管理、网络矩阵、调度、HTTP Worker、结果与告警", "执行代码评审、静态检查、依赖安全扫描与配置审计", "通过 Feature Flag 逐环境联调，维护变更日志"]}
              artifacts={["源代码与合并请求", "单元测试 / 契约测试", "数据库迁移脚本", "K8S 与 HPA 配置", "开发自测记录、README 与变更日志"]}
              entry="LLD、接口契约和迭代任务已评审，测试环境准备完成。"
              exit="代码评审通过；单测和静态检查通过；核心模块可在测试环境部署联调。"
            />
            <ProjectStage
              index="07" title="测试与验收" owner="Owner：QA；参与：研发、SRE、产品、安全"
              activities={["执行功能、接口、集成、端到端和回归测试", "覆盖 URL 校验、网络隔离、超时、重投、扩缩容和故障恢复", "执行容量压测、安全测试、稳定性测试和告警演练", "由试点应用 Owner 完成 UAT 与需求追踪矩阵关闭"]}
              artifacts={["测试计划与测试用例", "自动化测试脚本", "缺陷清单", "性能与安全测试报告", "测试报告", "UAT 验收单"]}
              entry="提测版本可部署，测试数据、网络环境和准出指标准备完毕。"
              exit="P0/P1 缺陷清零；回归、容量、安全和 UAT 通过；残留风险获批准。"
            />
            <ProjectStage
              index="08" title="发布与运维" owner="Owner：发布负责人 / SRE"
              activities={["按测试→预发→生产小流量应用逐步灰度", "启用 Dashboard、SLO、Kafka Lag、任务年龄和通知成功率监控", "验证回滚、任务暂停、网络状态降级和应急联系人", "完成用户培训、值班交接和上线后观察"]}
              artifacts={["上线方案与发布 Checklist", "回滚方案", "监控告警清单与 Dashboard", "运维手册（Runbook）", "应急预案、培训材料与上线验收报告"]}
              entry="测试报告和上线审批通过；回滚、监控、值班和变更窗口就绪。"
              exit="灰度及全量观察期指标正常；无阻断缺陷；业务、研发和 SRE 完成上线验收。"
            />
            <ProjectStage
              index="09" title="复盘与持续改进" owner="Owner：技术负责人 / 产品负责人"
              activities={["对照成功指标分析覆盖率、误报率、调度延迟和使用率", "复盘上线问题、告警事件和人工操作成本", "识别技术债与下一阶段需求，如更多断言或协议扩展", "形成行动项、Owner、优先级和完成期限"]}
              artifacts={["项目复盘报告", "指标效果报告", "问题与行动项清单", "技术债 Backlog", "下一阶段 Roadmap"]}
              entry="系统稳定运行一个约定观察周期，数据与用户反馈可用。"
              exit="复盘结论获确认；行动项进入计划并有负责人；文档归档完成。"
            />
          </div>

          <h3 className="subheading">文档基线与评审责任</h3>
          <div className="matrix-wrap">
            <table className="wide-table governance-table">
              <thead><tr><th>基线</th><th>主责</th><th>必须评审</th><th>变更控制</th></tr></thead>
              <tbody>
                <tr><td>需求基线</td><td>产品经理</td><td>研发、测试、SRE、应用 Owner</td><td>需求变更单 + 影响分析 + RTM 更新</td></tr>
                <tr><td>设计基线</td><td>技术负责人</td><td>架构、安全、网络、DBA、测试</td><td>ADR / 设计变更记录 + 兼容性评估</td></tr>
                <tr><td>发布基线</td><td>发布负责人</td><td>产品、研发、测试、SRE</td><td>变更审批 + Checklist + 回滚确认</td></tr>
                <tr><td>运维基线</td><td>SRE</td><td>研发、值班负责人、平台 Owner</td><td>Runbook 演练 + 告警规则版本化</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="subheading">核心文档产物正文（仿真模板）</h3>
          <div className="artifact-stack">
            <details>
              <summary>01 · 需求规格说明书与功能设计摘录 <span>展开</span></summary>
              <div className="detail-body">
                <table className="wide-table artifact-table">
                  <thead><tr><th>ID</th><th>需求与验收标准</th><th>优先级</th></tr></thead>
                  <tbody>
                    <tr><td>REQ-ENV-001</td><td>应用可维护标准或自定义环境；environmentId 稳定唯一，停用环境不再产生任务。</td><td>P0</td></tr>
                    <tr><td>REQ-NET-001</td><td>发布任务前必须存在有效的探测点—环境连通关系；无合法关系时返回 NOT_SCHEDULABLE。</td><td>P0</td></tr>
                    <tr><td>REQ-HTTP-001</td><td>仅支持 HTTP/HTTPS；默认 GET/HEAD，POST 必须是审批后的无副作用探测接口。</td><td>P0</td></tr>
                    <tr><td>REQ-AST-001</td><td>支持状态码、响应 Header、JSONPath/文本和总耗时断言；响应体读取有上限。</td><td>P0</td></tr>
                    <tr><td>REQ-ALM-001</td><td>连续失败且满足多探测点仲裁才告警；网络阻断与探测点故障不计为应用失败。</td><td>P0</td></tr>
                    <tr><td>REQ-AUD-001</td><td>配置、连通性、手动执行和告警操作均记录操作者、版本、时间与变更摘要。</td><td>P1</td></tr>
                  </tbody>
                </table>
                <p className="artifact-note"><b>功能页面：</b>应用环境管理、HTTP 端点管理、网络连通性矩阵、拨测任务、执行记录、告警事件、审计日志。所有生产环境写操作均要求 RBAC 校验和审计。</p>
              </div>
            </details>
            <details>
              <summary>02 · 接口设计文档与消息契约摘录 <span>展开</span></summary>
              <div className="detail-body">
                <table className="wide-table artifact-table">
                  <thead><tr><th>接口 / Topic</th><th>用途</th><th>关键约束</th></tr></thead>
                  <tbody>
                    <tr><td>POST /api/environments</td><td>登记应用部署环境</td><td>appId + code 唯一；prod 需要更高权限</td></tr>
                    <tr><td>PUT /api/connectivity/:id/verify</td><td>触发网络连通性复检</td><td>返回各阶段证据，不允许直接修改为 REACHABLE</td></tr>
                    <tr><td>POST /api/probes</td><td>创建 HTTP 拨测定义</td><td>校验 URL 归属、方法、副作用和 Secret 引用</td></tr>
                    <tr><td>POST /api/probes/:id/publish</td><td>发布不可变配置版本</td><td>无合法探测点时拒绝发布</td></tr>
                    <tr><td>probe-command-v1</td><td>调度器向 Worker 下发执行命令</td><td>携带 executionId、environmentId、probePointId、version、deadline</td></tr>
                    <tr><td>probe-result-v1</td><td>Worker 返回结构化结果</td><td>错误分类、分阶段耗时、断言结果；executionId 幂等</td></tr>
                  </tbody>
                </table>
                <pre>{`ProbeCommandV1 {
  executionId, taskId, version,
  applicationId, environmentId, probePointId,
  method, url, headersRef, bodyRef,
  timeoutMs, assertions[], scheduledAt, deadline
}`}</pre>
              </div>
            </details>
            <details>
              <summary>03 · 开发实现计划与完成定义 <span>展开</span></summary>
              <div className="detail-body">
                <div className="implementation-grid">
                  <article><b>Iteration 1</b><p>应用环境、HTTP Endpoint、网络矩阵 CRUD 与 RBAC。</p></article>
                  <article><b>Iteration 2</b><p>ElasticJob 分片调度、Kafka Command、幂等键和过期任务处理。</p></article>
                  <article><b>Iteration 3</b><p>Go HTTP Worker、连接池、分阶段计时、断言与 SSRF 防护。</p></article>
                  <article><b>Iteration 4</b><p>结果聚合、告警状态机、Slack 通知、查询页面与审计。</p></article>
                  <article><b>Iteration 5</b><p>HPA/KEDA、自监控、容量验证、灰度开关和 Runbook。</p></article>
                </div>
                <p className="artifact-note"><b>Definition of Done：</b>需求与设计可追踪；测试先行；代码评审完成；单元、契约和集成测试通过；无 Critical/High 安全问题；数据库迁移向后兼容；指标、日志、告警和运维文档随代码交付。</p>
              </div>
            </details>
            <details>
              <summary>04 · 测试计划、用例与测试报告摘录 <span>展开</span></summary>
              <div className="detail-body">
                <table className="wide-table artifact-table">
                  <thead><tr><th>用例 ID</th><th>场景</th><th>期望结果</th><th>类型</th></tr></thead>
                  <tbody>
                    <tr><td>TEST-FUNC-001</td><td>创建 dev/prod 和自定义环境</td><td>环境可版本化；重复 code 被拒绝</td><td>功能</td></tr>
                    <tr><td>TEST-NET-002</td><td>网络矩阵为 BLOCKED 时发布任务</td><td>发布失败并提示网络开通，不产生应用告警</td><td>集成</td></tr>
                    <tr><td>TEST-SEC-003</td><td>URL 重定向到云元数据地址</td><td>每次跳转重新校验并阻断，记录审计</td><td>安全</td></tr>
                    <tr><td>TEST-REL-004</td><td>Kafka 重复投递相同 executionId</td><td>允许重复执行但结果与通知不重复落库</td><td>可靠性</td></tr>
                    <tr><td>TEST-CHAOS-005</td><td>一个探测点对大量应用同时失败</td><td>标记探测点异常并抑制批量业务告警</td><td>故障演练</td></tr>
                    <tr><td>TEST-PERF-006</td><td>逐级提高 Mock Endpoint 流量</td><td>记录延迟、错误率、Kafka Lag、FD 和扩容曲线</td><td>容量</td></tr>
                  </tbody>
                </table>
                <p className="artifact-note"><b>测试报告结论模板：</b>记录版本、环境、数据规模、通过率、未关闭缺陷、性能机器规格、测试持续时间和风险接受人。这里不填写虚构的通过率或压测结果。</p>
              </div>
            </details>
            <details>
              <summary>05 · 上线方案、验收报告与复盘报告摘录 <span>展开</span></summary>
              <div className="detail-body">
                <div className="release-columns">
                  <article><b>上线方案</b><ul><li>Shadow 模式：只记录不告警</li><li>非生产试点应用</li><li>预发扩大覆盖</li><li>少量生产只读健康接口</li><li>分批全量并保留停止条件</li></ul></article>
                  <article><b>回滚条件</b><ul><li>出现未授权网络访问</li><li>调度或结果延迟突破阈值</li><li>批量假阳性告警</li><li>Kafka 积压持续扩大</li><li>数据库或下游被明显拖慢</li></ul></article>
                  <article><b>验收报告</b><ul><li>需求追踪矩阵全部闭环</li><li>P0/P1 缺陷满足准出要求</li><li>技术、安全、业务验收意见</li><li>遗留问题与整改期限</li><li>SLO 正式统计起点</li></ul></article>
                  <article><b>复盘报告</b><ul><li>目标与实际指标对照</li><li>问题时间线与促成因素</li><li>保护机制为何生效或失效</li><li>行动项、角色 Owner、期限</li><li>文档与测试更新记录</li></ul></article>
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

      <section className="module section-shell" id="sumo">
        <div className="module-index">02</div>
        <div className="section-heading">
          <Label>CLAUDE CODE TOOLING</Label>
          <h2>Sumo Logic 日志查询插件</h2>
          <p>把自然语言意图转换为受控查询，而不是把 Sumo Token 或任意查询权限直接交给模型。插件更适合实现为本地 MCP Server / Claude Code 工具集。</p>
        </div>

        <div className="diagram-card">
          <div className="diagram-title"><span>TRUST BOUNDARY</span><b>模型能“请求工具”，不能越过策略网关</b></div>
          <div className="flow-diagram plugin-flow">
            <Node title="Developer" meta="描述故障与应用" tone="accent" />
            <Arrow />
            <Node title="Claude Code" meta="选择工具 · 解释结果" />
            <Arrow text="typed args" />
            <Node title="Local MCP Server" meta="schema · redaction · audit" tone="green" />
            <Arrow text="mTLS / OAuth" />
            <Node title="Raptor Gateway" meta="RBAC · scope · rate limit" tone="orange" />
            <Arrow />
            <Node title="Sumo Logic API" meta="Search Job · Page" tone="purple" />
          </div>
        </div>

        <div className="tool-grid">
          <article><code>resolve_app()</code><p>把应用名解析为 sourceCategory、环境和用户可见范围，避免模型猜索引。</p></article>
          <article><code>search_logs()</code><p>只接受 app、env、timeRange、keywords、level、limit 等结构化参数。</p></article>
          <article><code>get_search_page()</code><p>分页读取搜索结果；默认 limit 100、最大时间窗 2h，避免一次性拉取海量日志。</p></article>
          <article><code>summarize_errors()</code><p>在网关侧按错误指纹聚合、脱敏和采样，再返回给模型，减少上下文与泄露面。</p></article>
        </div>

        <div className="two-column">
          <div>
            <h3 className="subheading">查询协议</h3>
            <pre>{`search_logs({
  app: "payment-api",
  env: "prod",
  timeRange: { from: "-30m", to: "now" },
  filters: { level: ["ERROR"], keyword: "timeout" },
  limit: 100
})

→ { searchId, status, rows[], nextCursor, querySummary }`}</pre>
          </div>
          <div>
            <h3 className="subheading">安全控制</h3>
            <ul className="check-list">
              <li><b>授权继承</b>用户身份透传，按 app owner / on-call / environment 校验。</li>
              <li><b>查询约束</b>服务端拼装 DSL，拒绝任意 source、子查询和超长时间窗。</li>
              <li><b>字段脱敏</b>Token、Cookie、手机号、邮箱和业务敏感字段规则化遮蔽。</li>
              <li><b>审计留痕</b>记录用户、应用、时间窗、规范化查询哈希、行数与结果状态，不落完整日志正文。</li>
            </ul>
          </div>
        </div>

        <h3 className="subheading">关键难点与解决方案</h3>
        <div className="difficulty-list">
          <Difficulty number="A" title="自然语言查询不可控" problem="模型可能生成全局、长时间窗或高成本 DSL。" solution="把工具参数设计成封闭 schema；应用范围来自 Raptor 元数据；由服务端模板生成最终 DSL 并估算成本。" tradeoff="牺牲任意查询表达力，换取稳定性与权限可证明性。" />
          <Difficulty number="B" title="异步 Search Job" problem="Sumo 查询通常需要创建 Job、轮询状态、再分页读取，Claude 单次工具调用容易超时。" solution="create/search/status/page 分段；返回 searchId 与 cursor；短查询可在网关内有限轮询，超时后让 Claude 继续调用。" tradeoff="多轮工具调用略显繁琐，但避免长连接和不可控等待。" />
          <Difficulty number="C" title="日志量超出上下文" problem="原始日志重复且体量大，直接返回既贵又难定位。" solution="服务端按 fingerprint 聚类、头尾采样、字段裁剪；优先返回趋势和代表样本，用户确认后再下钻。" tradeoff="聚合可能隐藏罕见样本，因此保留 cursor 和原始事件 ID。" />
          <Difficulty number="D" title="提示注入（Prompt Injection）与敏感信息" problem="日志正文是不可信输入，可能包含伪指令或凭据。" solution="工具结果标记为 untrusted data；不允许日志内容触发其他工具；脱敏后再返回；高敏环境默认禁用正文导出。" tradeoff="无法完全依赖模型遵守，关键边界必须在网关强制。" />
        </div>
      </section>

      <section className="module section-shell" id="jira">
        <div className="module-index">03</div>
        <div className="section-heading">
          <Label>CHANGE AUTOMATION</Label>
          <h2>Jira Ticket 生成插件</h2>
          <p>将应用元数据、拨测证据和用户输入组合为结构化工单。默认只生成草稿；真正创建工单属于有副作用操作，必须二次确认。</p>
        </div>

        <div className="sequence">
          <div className="sequence-head">
            <span>用户</span><span>Claude / MCP</span><span>Raptor</span><span>Jira</span>
          </div>
          <div className="sequence-row"><b>1</b><span>描述问题</span><i>→</i><span>resolve_app</span><i>→</i><span>返回 owner / CMDB / 模板</span></div>
          <div className="sequence-row"><b>2</b><span>补充影响</span><i>→</i><span>draft_ticket</span><i>→</i><span>校验必填字段与证据链接</span></div>
          <div className="sequence-row"><b>3</b><span>确认草稿</span><i>→</i><span>create_ticket</span><i>→</i><span>幂等创建并返回 Jira Key</span></div>
        </div>

        <div className="three-column">
          <article><Label>INPUT</Label><h3>结构化事实</h3><p>appId、环境、变更类型、影响范围、时间窗、日志/拨测证据 ID、期望完成时间。</p></article>
          <article><Label>POLICY</Label><h3>模板与路由</h3><p>项目、IssueType、Components、Labels、优先级由规则计算；用户不能任意指定敏感项目。</p></article>
          <article><Label>OUTPUT</Label><h3>可审阅草稿</h3><p>标题、背景、影响、复现步骤、验收标准、回滚方案与附件链接；明确标注模型推断项。</p></article>
        </div>

        <h3 className="subheading">关键难点与解决方案</h3>
        <div className="difficulty-list">
          <Difficulty number="A" title="幻觉写入正式工单" problem="模型可能把不确定信息当作事实，造成错误优先级、错误责任人或无效工单。" solution="字段标注 source：user / raptor / inferred；inferred 字段在 UI 高亮；create 前返回完整草稿并要求确认。" tradeoff="多一步确认，但把不可逆副作用留给用户决策。" />
          <Difficulty number="B" title="重复创建" problem="网络超时后重试 create，可能生成多个相同 Ticket。" solution="clientRequestId 作为幂等键；Raptor 保存 requestId→jiraKey；Jira description/property 同时写入关联 ID。" tradeoff="幂等记录需设置合理 TTL，并处理用户确实想重开工单的场景。" />
          <Difficulty number="C" title="字段动态且项目差异大" problem="不同 Jira Project 的必填字段、工作流和选项不同，硬编码很快失效。" solution="定时同步 Jira metadata；按 project + issueType 缓存 schema；创建前实时校验，失败时返回可修复字段而非裸 API 错误。" tradeoff="需要管理 schema 版本与缓存失效。" />
          <Difficulty number="D" title="权限与附件泄露" problem="日志证据可能包含敏感数据，工单可见范围可能比日志系统更大。" solution="默认附短期授权链接而非复制正文；按目标项目可见性校验证据；服务账号仅拥有白名单项目创建权限。" tradeoff="证据链接过期会影响复盘，可用受控归档替代长期公开附件。" />
        </div>
      </section>

      <section className="module section-shell" id="slack">
        <div className="module-index">04</div>
        <div className="section-heading">
          <Label>NOTIFICATION PLATFORM</Label>
          <h2>Slack 通知模块重构</h2>
          <p>把散落在业务代码里的 Webhook、Channel、文案和重试逻辑收敛为“事件 → 模板 → 路由 → 投递 → 回执”的稳定模型。</p>
        </div>

        <div className="before-after">
          <div className="before">
            <Label>BEFORE</Label>
            <h3>业务直接调用 Slack</h3>
            <div className="spaghetti">
              <span>部署模块</span><i>↘</i><span>Webhook A</span>
              <span>拨测模块</span><i>→</i><span>Webhook B</span>
              <span>工单模块</span><i>↗</i><span>Webhook C</span>
            </div>
            <p>Channel 和 JSON 文案硬编码；失败静默；模板无法追溯；各模块重复处理限流。</p>
          </div>
          <div className="after">
            <Label>AFTER</Label>
            <h3>统一通知能力模型</h3>
            <div className="notification-pipeline">
              <Node title="Domain Event" meta="type · payload · severity" />
              <Arrow />
              <Node title="Template" meta="version · schema · render" tone="green" />
              <Arrow />
              <Node title="Route" meta="app · env · channel" tone="orange" />
              <Arrow />
              <Node title="Delivery" meta="retry · rate limit · receipt" tone="purple" />
            </div>
          </div>
        </div>

        <div className="two-column">
          <div>
            <h3 className="subheading">核心领域模型</h3>
            <table className="wide-table">
              <tbody>
                <tr><th>NotificationEvent</th><td>eventId, type, appId, severity, occurredAt, payload</td></tr>
                <tr><th>TemplateVersion</th><td>templateKey, version, schema, blocks, status</td></tr>
                <tr><th>RouteRule</th><td>eventType, app/env/severity 条件, channelRef</td></tr>
                <tr><th>Delivery</th><td>eventId, routeId, templateVersion, status, attempt, slackTs</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="subheading">状态机</h3>
            <div className="state-machine">
              <span>CREATED</span><i>→</i><span>RENDERED</span><i>→</i><span>SENDING</span><i>→</i><span className="ok">SENT</span>
              <div><span className="warn">RETRY_WAIT</span><i>↺</i><span className="bad">DEAD</span></div>
            </div>
            <p className="callout">HTTP 429 尊重 Retry-After；5xx 指数退避 + jitter；4xx 配置错误直接进入 DEAD 并告警维护者。</p>
          </div>
        </div>

        <h3 className="subheading">关键难点与解决方案</h3>
        <div className="difficulty-list">
          <Difficulty number="A" title="模板演进与历史可追溯" problem="模板可编辑后，无法解释历史消息为何长这样，也难以安全回滚。" solution="模板发布即生成不可变版本；Delivery 固化 templateVersion、routeId 和渲染变量哈希；草稿、发布、废弃走状态流。" tradeoff="版本数量增加，需要清理未发布草稿但保留已使用版本。" />
          <Difficulty number="B" title="事务成功但通知事件丢失" problem="业务提交成功后直接调用 Slack，进程崩溃会丢消息；先发消息又可能出现业务回滚但通知已发。" solution="业务数据与 Outbox 在同一 MySQL 事务提交；Relay 异步发布 Kafka；发送链路与核心事务解耦。" tradeoff="Outbox 增加表和 Relay 运维成本，但能明确解决双写一致性。" />
          <Difficulty number="C" title="Channel 配置漂移" problem="Channel 被归档、Bot 被移除或不同环境误投到同一频道。" solution="保存 channelId 而非名称；配置发布时调用 Slack 校验；生产与非生产路由加环境约束；定期健康检查。" tradeoff="依赖 Slack API 可用性，配置校验需缓存并允许受控降级。" />
          <Difficulty number="D" title="重复消息与顺序" problem="Kafka 重投、网络超时和多个消费者会导致重复；同一事故恢复消息可能先于告警到达。" solution="eventId + routeId 唯一约束；按 fingerprint 分区；Delivery 状态用乐观锁；Slack client_msg_id/本地回执辅助去重。" tradeoff="只能保证同一 key 局部顺序，跨事件全局顺序没有必要且代价高。" />
          <Difficulty number="E" title="限流和级联故障" problem="大面积故障会同时产生海量通知，Slack 429 反过来拖垮业务线程。" solution="业务只写 NotificationEvent；独立消费者按 workspace/channel 令牌桶限流；合并同指纹事件；重试队列与 DLQ 隔离。" tradeoff="非紧急消息可能延迟，需按 severity 设计优先级。" />
        </div>
      </section>

      <section className="interview section-shell" id="interview">
        <div className="section-heading">
          <Label>INTERVIEW MODE</Label>
          <h2>如何把设计讲得可信</h2>
          <p>面试官通常不是在验证你是否记得组件，而是在判断你能否定义问题、守住边界并解释取舍。</p>
        </div>
        <div className="answer-framework">
          <article><span>1</span><h3>背景与约束</h3><p>规模、协议、网络区域、告警时效、安全边界；先说哪些信息是已知，哪些是假设。</p></article>
          <article><span>2</span><h3>核心链路</h3><p>用一句话说清主流程，再展开调度、队列、执行、聚合和通知。</p></article>
          <article><span>3</span><h3>最难的两个点</h3><p>优先讲调度尖峰、告警去噪或工具安全，并说明失败过的方案与取舍。</p></article>
          <article><span>4</span><h3>证据与复盘</h3><p>能诚实提供什么：代码、压测方法、监控指标、PR 设计；没有的数据不要编。</p></article>
        </div>

        <div className="honesty-script">
          <div>
            <Label>RECOMMENDED WORDING</Label>
            <h3>如果该经历并非真实主导</h3>
          </div>
          <blockquote>
            “这段简历表述得过头了，我参与/接触过相关场景，但没有真实完成所写规模的从 0 到 1 上线。
            我为此做过完整设计推演：如果由我负责，我会把系统拆成控制面、Kafka 和无状态执行面，
            并用 lag 与 in-flight 驱动扩容。下面我可以具体讲设计和取舍。”
          </blockquote>
        </div>

        <h3 className="subheading">高频追问速查</h3>
        <div className="faq-grid">
          <details><summary>为什么 Kafka 不直接用 ElasticJob 调 Worker？</summary><p>ElasticJob 适合分布式定时触发，但不擅长承接高峰背压。让它只生成命令，Kafka 负责削峰、重放和消费组扩展，执行面更容易故障隔离。</p></details>
          <details><summary>怎么证明 1W TPS？</summary><p>说明压测模型：目标响应延迟分布、连接复用比例、Pod 规格、持续时长、错误率、P99、Kafka lag 和下游是否被 mock。没有压测报告就只能称“设计目标”。</p></details>
          <details><summary>为什么结果不是 exactly-once？</summary><p>网络调用无法纳入 Kafka 事务。使用至少一次投递，在结果、工单和通知这些副作用边界用稳定幂等键去重，复杂度更可控。</p></details>
          <details><summary>Claude Code Plugin 与 MCP 是什么关系？</summary><p>可把“插件”落成一个本地 MCP Server：暴露少量类型化工具，由 Raptor 网关做真正授权和审计。模型不持有 Sumo/Jira 的宽权限 Token。</p></details>
          <details><summary>日志里的提示注入怎么处理？</summary><p>日志是非可信数据。工具结果需明确隔离；日志文本不能决定调用其他工具；服务端脱敏、限字段、限行数，敏感操作仍需用户确认。</p></details>
          <details><summary>Slack 模板为什么要版本化？</summary><p>为了回溯“哪条消息用了哪个模板和路由”，支持灰度与回滚，并避免编辑模板导致历史投递不可解释。</p></details>
        </div>
      </section>

      <footer>
        <div><span className="brand-mark">R</span><b>Raptor Reference Design</b></div>
        <p>假设性方案 · 面试准备材料 · 生成日期 2026-07-30</p>
        <a href="#top">回到顶部 ↑</a>
      </footer>
    </main>
  );
}
