"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./demo.module.css";
import {
  archiveSuite,
  calculateDesiredReplicas,
  createSuite,
  createTokenMetadata,
  drainExecutor,
  pauseSuite,
  publishSuite,
  resumeSuite,
  revokeToken,
  rotateToken,
  simulateProbe,
  updateSuite,
  type Environment,
  type ExecutorState,
  type HttpMethod,
  type ProbeResult,
  type ProbeSuite,
  type ProbeToken,
  type SuiteInput,
} from "./domain";

type Tab = "overview" | "suites" | "tokens" | "executors" | "scaling";
type Executor = {
  id: string;
  pool: string;
  zone: string;
  version: string;
  capacity: number;
  inFlight: number;
  successRate: number;
  state: ExecutorState;
};

const now = "2026-07-30T10:00:00.000Z";
const baseSuiteInput: SuiteInput = {
  name: "payment-core-health",
  appId: "payment-service",
  environment: "PROD",
  method: "GET",
  targetUrl: "https://payment.internal/health",
  intervalSeconds: 30,
  timeoutMs: 2_000,
};

const seedSuites: ProbeSuite[] = [
  publishSuite(createSuite(baseSuiteInput, "suite-payment", now), now),
  publishSuite(createSuite({
    ...baseSuiteInput,
    name: "order-api-smoke",
    appId: "order-service",
    environment: "STG",
    targetUrl: "https://order.stg.internal/ready",
    intervalSeconds: 60,
  }, "suite-order", now), now),
  createSuite({
    ...baseSuiteInput,
    name: "account-readiness",
    appId: "account-service",
    environment: "TEST",
    targetUrl: "https://account.test.internal/health",
  }, "suite-account", now),
];

const seedTokens: ProbeToken[] = [{
  id: "token-payment",
  name: "payment-prod",
  appId: "payment-service",
  environment: "PROD",
  type: "Bearer",
  maskedValue: "••••8f3a",
  version: 3,
  status: "ACTIVE",
  createdAt: now,
  updatedAt: now,
}];

const seedExecutors: Executor[] = Array.from({ length: 8 }, (_, index) => ({
  id: `worker-prod-${String(index + 1).padStart(2, "0")}`,
  pool: index < 4 ? "prod-zone-a" : "prod-zone-b",
  zone: index < 4 ? "cn-a" : "cn-b",
  version: index === 7 ? "v1.5.0-canary" : "v1.4.2",
  capacity: 400,
  inFlight: 130 + index * 31,
  successRate: 99.91 - index * 0.01,
  state: "ONLINE",
}));

const emptySuiteForm: SuiteInput = {
  name: "",
  appId: "",
  environment: "TEST",
  method: "GET",
  targetUrl: "https://",
  intervalSeconds: 30,
  timeoutMs: 2_000,
};

const tabs: { id: Tab; label: string; detail: string }[] = [
  { id: "overview", label: "运行总览", detail: "Overview" },
  { id: "suites", label: "测试套", detail: "Probe Suites" },
  { id: "tokens", label: "Token 管理", detail: "Credentials" },
  { id: "executors", label: "执行机", detail: "Executors" },
  { id: "scaling", label: "弹性模拟", detail: "Autoscaling" },
];

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function currentTime() {
  return new Date().toISOString();
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: "草稿", PUBLISHED: "运行中", PAUSED: "已暂停", ARCHIVED: "已归档",
    ACTIVE: "可用", REVOKED: "已吊销", EXPIRED: "已过期",
    ONLINE: "在线", DRAINING: "排空中", OFFLINE: "离线", QUARANTINED: "已隔离",
    SUCCESS: "成功", HTTP_ERROR: "HTTP 错误", TIMEOUT: "超时",
  };
  return labels[status] ?? status;
}

export default function DemoPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [suites, setSuites] = useState(seedSuites);
  const [tokens, setTokens] = useState(seedTokens);
  const [executors, setExecutors] = useState(seedExecutors);
  const [results, setResults] = useState<ProbeResult[]>([]);
  const [suiteForm, setSuiteForm] = useState<SuiteInput>(emptySuiteForm);
  const [editingSuiteId, setEditingSuiteId] = useState<string | null>(null);
  const [tokenForm, setTokenForm] = useState({
    name: "", appId: "", environment: "TEST" as Environment, type: "Bearer" as ProbeToken["type"], secret: "",
  });
  const [rotatingTokenId, setRotatingTokenId] = useState<string | null>(null);
  const [rotationSecret, setRotationSecret] = useState("");
  const [feedback, setFeedback] = useState("演示环境已就绪，所有拨测均为安全模拟。");
  const [hydrated, setHydrated] = useState(false);
  const [targetTps, setTargetTps] = useState(10_000);
  const [kafkaLag, setKafkaLag] = useState(0);
  const [inFlight, setInFlight] = useState(2_000);
  const [currentReplicas, setCurrentReplicas] = useState(8);

  const desiredReplicas = useMemo(() => calculateDesiredReplicas({
    targetTps,
    kafkaLag,
    inFlight,
    safeTpsPerPod: 400,
    minReplicas: 8,
    maxReplicas: 80,
  }), [targetTps, kafkaLag, inFlight]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("raptor-demo-state-v1");
      if (saved) {
        const parsed = JSON.parse(saved) as { suites?: ProbeSuite[]; tokens?: ProbeToken[]; results?: ProbeResult[] };
        if (parsed.suites) setSuites(parsed.suites);
        if (parsed.tokens) setTokens(parsed.tokens);
        if (parsed.results) setResults(parsed.results);
      }
    } catch {
      setFeedback("本地演示数据读取失败，已使用默认数据。");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("raptor-demo-state-v1", JSON.stringify({ suites, tokens, results: results.slice(0, 30) }));
  }, [hydrated, suites, tokens, results]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentReplicas((current) => {
        if (current === desiredReplicas) return current;
        if (current < desiredReplicas) return Math.min(desiredReplicas, current + 4);
        return Math.max(desiredReplicas, current - 1);
      });
    }, 550);
    return () => window.clearInterval(timer);
  }, [desiredReplicas]);

  const activeSuites = suites.filter((suite) => suite.status === "PUBLISHED");
  const onlineExecutors = executors.filter((executor) => executor.state === "ONLINE");
  const successRate = results.length === 0
    ? 99.92
    : results.filter((result) => result.status === "SUCCESS").length / results.length * 100;

  function submitSuite(event: FormEvent) {
    event.preventDefault();
    try {
      if (editingSuiteId) {
        setSuites((current) => current.map((suite) =>
          suite.id === editingSuiteId ? updateSuite(suite, suiteForm, currentTime()) : suite));
        setFeedback(`测试套 ${suiteForm.name} 已保存为新草稿。`);
      } else {
        const created = createSuite(suiteForm, makeId("suite"), currentTime());
        setSuites((current) => [created, ...current]);
        setFeedback(`测试套 ${created.name} 已创建。`);
      }
      setSuiteForm(emptySuiteForm);
      setEditingSuiteId(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "保存失败");
    }
  }

  function editSuite(suite: ProbeSuite) {
    setEditingSuiteId(suite.id);
    setSuiteForm({
      name: suite.name,
      appId: suite.appId,
      environment: suite.environment,
      method: suite.method,
      targetUrl: suite.targetUrl,
      intervalSeconds: suite.intervalSeconds,
      timeoutMs: suite.timeoutMs,
      tokenId: suite.tokenId,
    });
  }

  function changeSuite(suiteId: string, action: "publish" | "pause" | "resume" | "archive") {
    setSuites((current) => current.map((suite) => {
      if (suite.id !== suiteId) return suite;
      if (action === "publish") return publishSuite(suite, currentTime());
      if (action === "pause") return pauseSuite(suite, currentTime());
      if (action === "resume") return resumeSuite(suite, currentTime());
      return archiveSuite(suite, currentTime());
    }));
    setFeedback(`测试套状态操作已完成：${action.toUpperCase()}。`);
  }

  function runProbe(suite: ProbeSuite) {
    if (suite.status !== "PUBLISHED") {
      setFeedback("只有运行中的测试套可以执行拨测。");
      return;
    }
    const executor = onlineExecutors[Math.floor(Math.random() * Math.max(1, onlineExecutors.length))];
    if (!executor) {
      setFeedback("没有可用执行机，任务已保留在队列。");
      return;
    }
    const result = simulateProbe(suite, executor.id, Math.random(), makeId("exec"), currentTime());
    setResults((current) => [result, ...current].slice(0, 30));
    setFeedback(`${suite.name} 执行完成：${statusLabel(result.status)}，${result.latencyMs}ms。`);
  }

  function submitToken(event: FormEvent) {
    event.preventDefault();
    try {
      const metadata = createTokenMetadata(tokenForm, makeId("token"), currentTime());
      setTokens((current) => [metadata, ...current]);
      setTokenForm({ name: "", appId: "", environment: "TEST", type: "Bearer", secret: "" });
      setFeedback("Token 已安全保存；演示版只持久化掩码元数据，明文已丢弃。");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Token 创建失败");
    }
  }

  function submitRotation(event: FormEvent, token: ProbeToken) {
    event.preventDefault();
    try {
      setTokens((current) => current.map((item) =>
        item.id === token.id ? rotateToken(item, rotationSecret, currentTime()) : item));
      setRotatingTokenId(null);
      setRotationSecret("");
      setFeedback(`${token.name} 已轮换到下一版本。`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Token 轮换失败");
    }
  }

  function resetDemo() {
    localStorage.removeItem("raptor-demo-state-v1");
    setSuites(seedSuites);
    setTokens(seedTokens);
    setExecutors(seedExecutors);
    setResults([]);
    setFeedback("演示数据已重置。");
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}><span>R</span><div><b>RAPTOR</b><small>SYNTHETIC OPS</small></div></div>
        <nav aria-label="演示功能导航">
          {tabs.map((item) => (
            <button key={item.id} className={tab === item.id ? styles.activeNav : ""} onClick={() => setTab(item.id)}>
              <span>{item.label}</span><small>{item.detail}</small>
            </button>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <span className={styles.liveDot} /> Demo Cluster
          <Link href="/">返回设计文档</Link>
        </div>
      </aside>

      <section className={styles.content}>
        <header className={styles.header}>
          <div><span className={styles.kicker}>HTTP SYNTHETIC MONITORING</span><h1>{tabs.find((item) => item.id === tab)?.label}</h1></div>
          <div className={styles.headerActions}><span className={styles.feedback}>{feedback}</span><button onClick={resetDemo}>重置演示</button></div>
        </header>

        {tab === "overview" && (
          <>
            <div className={styles.metrics}>
              <Metric label="运行测试套" value={String(activeSuites.length)} detail={`${suites.length} 个配置`} tone="green" />
              <Metric label="当前执行机" value={String(currentReplicas)} detail={`目标 ${desiredReplicas} Pods`} tone="purple" />
              <Metric label="模拟吞吐" value={`${targetTps.toLocaleString()}`} detail="HTTP req/s" tone="orange" />
              <Metric label="拨测成功率" value={`${successRate.toFixed(2)}%`} detail={`${results.length} 条本地结果`} tone="lime" />
            </div>
            <div className={styles.overviewGrid}>
              <section className={styles.card}>
                <CardHeader title="测试套运行状态" action={<button onClick={() => setTab("suites")}>管理测试套</button>} />
                <div className={styles.suiteSummary}>
                  {suites.slice(0, 5).map((suite) => (
                    <div key={suite.id}><Status value={suite.status} /><span><b>{suite.name}</b><small>{suite.appId} · {suite.environment} · {suite.intervalSeconds}s</small></span><button onClick={() => runProbe(suite)}>立即执行</button></div>
                  ))}
                </div>
              </section>
              <section className={styles.card}>
                <CardHeader title="弹性容量" action={<button onClick={() => setTab("scaling")}>调整信号</button>} />
                <div className={styles.capacityGauge}>
                  <div style={{ width: `${Math.min(100, currentReplicas / 80 * 100)}%` }} />
                </div>
                <div className={styles.capacityNumbers}><span><b>{currentReplicas}</b> 当前</span><span><b>{desiredReplicas}</b> 期望</span><span><b>80</b> 上限</span></div>
                <p className={styles.cardNote}>按 400 req/s/Pod 和 30% 冗余计算；扩容每 550ms 模拟增加 4 个副本，缩容每次减少 1 个。</p>
              </section>
              <section className={`${styles.card} ${styles.resultCard}`}>
                <CardHeader title="最近执行结果" action={<span className={styles.simulationBadge}>安全模拟 · 不发真实网络请求</span>} />
                <ResultTable results={results} />
              </section>
            </div>
          </>
        )}

        {tab === "suites" && (
          <div className={styles.managementGrid}>
            <section className={styles.card}>
              <CardHeader title="测试套列表" action={<span>{suites.length} records</span>} />
              <div className={styles.list}>
                {suites.map((suite) => (
                  <article key={suite.id} className={styles.listItem}>
                    <div className={styles.listTitle}><Status value={suite.status} /><div><b>{suite.name}</b><small>{suite.appId} · {suite.environment} · v{suite.version}</small></div></div>
                    <code>{suite.method} {suite.targetUrl}</code>
                    <div className={styles.listMeta}><span>周期 {suite.intervalSeconds}s</span><span>超时 {suite.timeoutMs}ms</span><span>revision {suite.revision}</span></div>
                    <div className={styles.rowActions}>
                      <button onClick={() => runProbe(suite)}>执行</button>
                      <button onClick={() => editSuite(suite)}>编辑</button>
                      {suite.status === "DRAFT" && <button onClick={() => changeSuite(suite.id, "publish")}>发布</button>}
                      {suite.status === "PUBLISHED" && <button onClick={() => changeSuite(suite.id, "pause")}>暂停</button>}
                      {suite.status === "PAUSED" && <button onClick={() => changeSuite(suite.id, "resume")}>恢复</button>}
                      {suite.status !== "ARCHIVED" && <button className={styles.danger} onClick={() => changeSuite(suite.id, "archive")}>归档</button>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <section className={`${styles.card} ${styles.stickyCard}`}>
              <CardHeader title={editingSuiteId ? "编辑测试套" : "新建测试套"} action={editingSuiteId ? <button onClick={() => { setEditingSuiteId(null); setSuiteForm(emptySuiteForm); }}>取消</button> : null} />
              <form className={styles.form} onSubmit={submitSuite}>
                <Field label="名称"><input required minLength={2} value={suiteForm.name} onChange={(e) => setSuiteForm({ ...suiteForm, name: e.target.value })} placeholder="payment-health" /></Field>
                <Field label="应用 ID"><input required value={suiteForm.appId} onChange={(e) => setSuiteForm({ ...suiteForm, appId: e.target.value })} placeholder="payment-service" /></Field>
                <div className={styles.formRow}>
                  <Field label="环境"><select value={suiteForm.environment} onChange={(e) => setSuiteForm({ ...suiteForm, environment: e.target.value as Environment })}>{["DEV", "TEST", "STG", "PROD"].map((value) => <option key={value}>{value}</option>)}</select></Field>
                  <Field label="方法"><select value={suiteForm.method} onChange={(e) => setSuiteForm({ ...suiteForm, method: e.target.value as HttpMethod })}>{["GET", "HEAD", "POST"].map((value) => <option key={value}>{value}</option>)}</select></Field>
                </div>
                <Field label="目标 URL"><input required type="url" value={suiteForm.targetUrl} onChange={(e) => setSuiteForm({ ...suiteForm, targetUrl: e.target.value })} /></Field>
                <div className={styles.formRow}>
                  <Field label="周期（秒）"><input type="number" min={10} max={3600} value={suiteForm.intervalSeconds} onChange={(e) => setSuiteForm({ ...suiteForm, intervalSeconds: Number(e.target.value) })} /></Field>
                  <Field label="超时（ms）"><input type="number" min={100} max={5000} value={suiteForm.timeoutMs} onChange={(e) => setSuiteForm({ ...suiteForm, timeoutMs: Number(e.target.value) })} /></Field>
                </div>
                <Field label="Token（可选）"><select value={suiteForm.tokenId ?? ""} onChange={(e) => setSuiteForm({ ...suiteForm, tokenId: e.target.value || undefined })}><option value="">无需认证</option>{tokens.filter((token) => token.status === "ACTIVE").map((token) => <option value={token.id} key={token.id}>{token.name} · {token.maskedValue}</option>)}</select></Field>
                <div className={styles.securityHint}>演示执行不会访问该 URL；生产实现必须在 Worker 侧做域名归属、DNS 重绑定和保留地址校验。</div>
                <button className={styles.primaryButton} type="submit">{editingSuiteId ? "保存新草稿" : "创建草稿"}</button>
              </form>
            </section>
          </div>
        )}

        {tab === "tokens" && (
          <div className={styles.managementGrid}>
            <section className={styles.card}>
              <CardHeader title="Token 列表" action={<span className={styles.secureBadge}>明文永不回显</span>} />
              <div className={styles.list}>
                {tokens.map((token) => (
                  <article key={token.id} className={styles.tokenItem}>
                    <div className={styles.listTitle}><Status value={token.status} /><div><b>{token.name}</b><small>{token.appId} · {token.environment}</small></div></div>
                    <div className={styles.tokenValue}><code>{token.maskedValue}</code><span>{token.type} · version {token.version}</span></div>
                    {rotatingTokenId === token.id ? (
                      <form className={styles.inlineForm} onSubmit={(event) => submitRotation(event, token)}>
                        <input required minLength={8} type="password" value={rotationSecret} onChange={(e) => setRotationSecret(e.target.value)} placeholder="输入新 Token（不持久化）" />
                        <button type="submit">确认轮换</button><button type="button" onClick={() => setRotatingTokenId(null)}>取消</button>
                      </form>
                    ) : (
                      <div className={styles.rowActions}>
                        {token.status === "ACTIVE" && <><button onClick={() => setRotatingTokenId(token.id)}>轮换</button><button className={styles.danger} onClick={() => setTokens((current) => current.map((item) => item.id === token.id ? revokeToken(item, currentTime()) : item))}>吊销</button></>}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
            <section className={`${styles.card} ${styles.stickyCard}`}>
              <CardHeader title="创建 Token" action={<span>一次性输入</span>} />
              <form className={styles.form} onSubmit={submitToken}>
                <Field label="名称"><input required minLength={2} value={tokenForm.name} onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })} placeholder="payment-prod" /></Field>
                <Field label="应用 ID"><input required value={tokenForm.appId} onChange={(e) => setTokenForm({ ...tokenForm, appId: e.target.value })} /></Field>
                <div className={styles.formRow}>
                  <Field label="环境"><select value={tokenForm.environment} onChange={(e) => setTokenForm({ ...tokenForm, environment: e.target.value as Environment })}>{["DEV", "TEST", "STG", "PROD"].map((value) => <option key={value}>{value}</option>)}</select></Field>
                  <Field label="类型"><select value={tokenForm.type} onChange={(e) => setTokenForm({ ...tokenForm, type: e.target.value as ProbeToken["type"] })}>{["Bearer", "API Key", "Basic"].map((value) => <option key={value}>{value}</option>)}</select></Field>
                </div>
                <Field label="Token 明文"><input required minLength={8} type="password" autoComplete="new-password" value={tokenForm.secret} onChange={(e) => setTokenForm({ ...tokenForm, secret: e.target.value })} /></Field>
                <div className={styles.securityHint}>此简易版只提取后 4 位生成掩码，提交后立即清空明文；不会写入 localStorage。</div>
                <button className={styles.primaryButton} type="submit">安全保存元数据</button>
              </form>
            </section>
          </div>
        )}

        {tab === "executors" && (
          <section className={styles.card}>
            <CardHeader title="执行机实例" action={<span>{onlineExecutors.length} online · 2 zones</span>} />
            <div className={styles.executorGrid}>
              {executors.map((executor) => (
                <article key={executor.id} className={styles.executor}>
                  <div className={styles.executorTop}><Status value={executor.state} /><span>{executor.zone}</span></div>
                  <h3>{executor.id}</h3><small>{executor.pool} · {executor.version}</small>
                  <dl><div><dt>安全吞吐</dt><dd>{executor.capacity} req/s</dd></div><div><dt>在途请求</dt><dd>{executor.inFlight} / 800</dd></div><div><dt>成功率</dt><dd>{executor.successRate.toFixed(2)}%</dd></div></dl>
                  <div className={styles.miniGauge}><span style={{ width: `${executor.inFlight / 8}%` }} /></div>
                  <button disabled={executor.state !== "ONLINE"} onClick={() => {
                    setExecutors((current) => current.map((item) => item.id === executor.id ? drainExecutor(item) as Executor : item));
                    setFeedback(`${executor.id} 已停止领取新任务，等待在途请求排空。`);
                  }}>排空实例</button>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "scaling" && (
          <div className={styles.scalingGrid}>
            <section className={styles.card}>
              <CardHeader title="伸缩信号" action={<span>每 550ms 模拟一次控制循环</span>} />
              <div className={styles.sliderGroup}>
                <Slider label="目标探测吞吐" value={targetTps} max={10_000} step={100} suffix="req/s" onChange={setTargetTps} />
                <Slider label="Kafka Lag" value={kafkaLag} max={100_000} step={1_000} suffix="messages" onChange={setKafkaLag} />
                <Slider label="在途请求" value={inFlight} max={30_000} step={100} suffix="requests" onChange={setInFlight} />
              </div>
              <div className={styles.formula}>desired = ceil(max(TPS ÷ 400, Lag ÷ 2000, InFlight ÷ 800) × 1.3)</div>
            </section>
            <section className={styles.card}>
              <CardHeader title="副本决策" action={<Status value={currentReplicas === desiredReplicas ? "STABLE" : currentReplicas < desiredReplicas ? "SCALING_UP" : "SCALING_DOWN"} />} />
              <div className={styles.replicaHero}><span>{currentReplicas}</span><i>→</i><b>{desiredReplicas}</b></div>
              <div className={styles.podGrid}>{Array.from({ length: Math.max(currentReplicas, desiredReplicas) }, (_, index) => <i key={index} className={index < currentReplicas ? styles.runningPod : styles.pendingPod} />)}</div>
              <div className={styles.scaleLegend}><span><i className={styles.runningPod} />Running</span><span><i className={styles.pendingPod} />Pending</span></div>
            </section>
            <section className={`${styles.card} ${styles.fullWidth}`}>
              <CardHeader title="1W TPS 容量拆解" action={<span>峰值设计口径</span>} />
              <div className={styles.capacityBreakdown}>
                <div><b>25</b><span>基础副本<br />10,000 ÷ 400</span></div>
                <div><b>33</b><span>含 30% 冗余<br />ceil(25 × 1.3)</span></div>
                <div><b>36</b><span>峰前建议预热<br />跨 2 AZ</span></div>
                <div><b>128</b><span>Kafka 分区<br />并行消费上限基础</span></div>
                <div><b>30k</b><span>3s 超时最坏在途<br />必须有界排队</span></div>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return <article className={`${styles.metric} ${styles[tone]}`}><span>{label}</span><b>{value}</b><small>{detail}</small></article>;
}

function CardHeader({ title, action }: { title: string; action: React.ReactNode }) {
  return <header className={styles.cardHeader}><h2>{title}</h2><div>{action}</div></header>;
}

function Status({ value }: { value: string }) {
  const healthy = ["PUBLISHED", "ACTIVE", "ONLINE", "SUCCESS", "STABLE"].includes(value);
  const warning = ["DRAFT", "PAUSED", "DRAINING", "SCALING_UP", "SCALING_DOWN"].includes(value);
  return <span className={`${styles.status} ${healthy ? styles.healthy : warning ? styles.warning : styles.inactive}`}>{statusLabel(value)}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className={styles.field}><span>{label}</span>{children}</label>;
}

function Slider({ label, value, max, step, suffix, onChange }: { label: string; value: number; max: number; step: number; suffix: string; onChange: (value: number) => void }) {
  return <label className={styles.slider}><span><b>{label}</b><code>{value.toLocaleString()} {suffix}</code></span><input type="range" min={0} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function ResultTable({ results }: { results: ProbeResult[] }) {
  if (results.length === 0) return <div className={styles.emptyState}><b>还没有执行记录</b><span>进入“测试套”或点击上方“立即执行”生成模拟结果。</span></div>;
  return <div className={styles.resultTable}>{results.slice(0, 8).map((result) => <div key={result.id}><Status value={result.status} /><span><b>{result.suiteName}</b><small>{result.executorId}</small></span><code>{result.statusCode ?? "—"}</code><strong>{result.latencyMs}ms</strong><time>{new Date(result.createdAt).toLocaleTimeString("zh-CN", { hour12: false })}</time></div>)}</div>;
}
