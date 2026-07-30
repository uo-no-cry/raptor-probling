export type Environment = "DEV" | "TEST" | "STG" | "PROD";
export type HttpMethod = "GET" | "HEAD" | "POST";
export type SuiteStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "ARCHIVED";
export type TokenStatus = "ACTIVE" | "REVOKED" | "EXPIRED";
export type ExecutorState = "ONLINE" | "DRAINING" | "OFFLINE" | "QUARANTINED";

export interface SuiteInput {
  name: string;
  appId: string;
  environment: Environment;
  method: HttpMethod | string;
  targetUrl: string;
  intervalSeconds: number;
  timeoutMs: number;
  tokenId?: string;
}

export interface ProbeSuite extends Omit<SuiteInput, "method"> {
  id: string;
  method: HttpMethod;
  status: SuiteStatus;
  version: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface TokenInput {
  name: string;
  appId: string;
  environment: Environment;
  type: "Bearer" | "API Key" | "Basic";
  secret: string;
}

export interface ProbeToken {
  id: string;
  name: string;
  appId: string;
  environment: Environment;
  type: TokenInput["type"];
  maskedValue: string;
  version: number;
  status: TokenStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ScalingSignals {
  targetTps: number;
  kafkaLag: number;
  inFlight: number;
  safeTpsPerPod: number;
  minReplicas: number;
  maxReplicas: number;
}

export interface ProbeResult {
  id: string;
  suiteId: string;
  suiteName: string;
  status: "SUCCESS" | "HTTP_ERROR" | "TIMEOUT";
  statusCode: number | null;
  latencyMs: number;
  executorId: string;
  createdAt: string;
}

const allowedMethods = new Set(["GET", "HEAD", "POST"]);

export function validateSuiteInput(input: SuiteInput): string[] {
  const errors: string[] = [];
  if (input.name.trim().length < 2) errors.push("测试套名称至少需要 2 个字符");
  if (!allowedMethods.has(input.method)) errors.push("仅支持 GET、HEAD 和受控 POST");

  try {
    const url = new URL(input.targetUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      errors.push("目标地址必须是 HTTP/HTTPS URL");
    }
  } catch {
    errors.push("目标地址必须是 HTTP/HTTPS URL");
  }

  if (input.intervalSeconds < 10 || input.intervalSeconds > 3600) {
    errors.push("拨测周期必须在 10–3600 秒之间");
  }
  if (input.timeoutMs < 100 || input.timeoutMs > 5000) {
    errors.push("超时必须在 100–5000ms 之间");
  }
  return errors;
}

export function createSuite(input: SuiteInput, id: string, now: string): ProbeSuite {
  const errors = validateSuiteInput(input);
  if (errors.length > 0) throw new Error(errors.join("；"));

  return {
    ...input,
    name: input.name.trim(),
    appId: input.appId.trim(),
    method: input.method as HttpMethod,
    targetUrl: input.targetUrl.trim(),
    id,
    status: "DRAFT",
    version: 1,
    revision: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateSuite(
  suite: ProbeSuite,
  changes: Partial<SuiteInput>,
  now: string,
): ProbeSuite {
  if (suite.status === "ARCHIVED") throw new Error("已归档测试套不可编辑");
  const candidate = { ...suite, ...changes };
  const errors = validateSuiteInput(candidate);
  if (errors.length > 0) throw new Error(errors.join("；"));
  return {
    ...candidate,
    method: candidate.method as HttpMethod,
    status: suite.status === "PUBLISHED" ? "DRAFT" : suite.status,
    revision: suite.revision + 1,
    updatedAt: now,
  };
}

export function publishSuite(suite: ProbeSuite, now: string): ProbeSuite {
  if (suite.status === "ARCHIVED") throw new Error("已归档测试套不可发布");
  return {
    ...suite,
    status: "PUBLISHED",
    version: suite.version + 1,
    revision: suite.revision + 1,
    updatedAt: now,
  };
}

export function pauseSuite(suite: ProbeSuite, now: string): ProbeSuite {
  if (suite.status !== "PUBLISHED") return suite;
  return { ...suite, status: "PAUSED", revision: suite.revision + 1, updatedAt: now };
}

export function resumeSuite(suite: ProbeSuite, now: string): ProbeSuite {
  if (suite.status !== "PAUSED") return suite;
  return { ...suite, status: "PUBLISHED", revision: suite.revision + 1, updatedAt: now };
}

export function archiveSuite(suite: ProbeSuite, now: string): ProbeSuite {
  return { ...suite, status: "ARCHIVED", revision: suite.revision + 1, updatedAt: now };
}

function maskSecret(secret: string): string {
  const suffix = secret.slice(-4).padStart(4, "•");
  return `••••${suffix}`;
}

export function createTokenMetadata(input: TokenInput, id: string, now: string): ProbeToken {
  if (input.name.trim().length < 2) throw new Error("Token 名称至少需要 2 个字符");
  if (input.secret.length < 8) throw new Error("Token 至少需要 8 个字符");
  return {
    id,
    name: input.name.trim(),
    appId: input.appId.trim(),
    environment: input.environment,
    type: input.type,
    maskedValue: maskSecret(input.secret),
    version: 1,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };
}

export function rotateToken(token: ProbeToken, secret: string, now: string): ProbeToken {
  if (token.status !== "ACTIVE") throw new Error("只有 ACTIVE Token 可以轮换");
  if (secret.length < 8) throw new Error("Token 至少需要 8 个字符");
  return {
    ...token,
    maskedValue: maskSecret(secret),
    version: token.version + 1,
    updatedAt: now,
  };
}

export function revokeToken(token: ProbeToken, now: string): ProbeToken {
  return { ...token, status: "REVOKED", updatedAt: now };
}

export function calculateDesiredReplicas(signals: ScalingSignals): number {
  const safeTpsPerPod = Math.max(1, signals.safeTpsPerPod);
  const fromRate = Math.ceil(Math.max(0, signals.targetTps) / safeTpsPerPod);
  const fromLag = Math.ceil(Math.max(0, signals.kafkaLag) / 2_000);
  const fromInFlight = Math.ceil(Math.max(0, signals.inFlight) / 800);
  const buffered = Math.ceil(Math.max(fromRate, fromLag, fromInFlight) * 1.3);
  return Math.min(signals.maxReplicas, Math.max(signals.minReplicas, buffered));
}

export function drainExecutor<T extends { state: string }>(executor: T): T {
  if (executor.state !== "ONLINE") return executor;
  return { ...executor, state: "DRAINING" };
}

export function simulateProbe(
  suite: ProbeSuite,
  executorId: string,
  randomValue: number,
  id: string,
  now: string,
): ProbeResult {
  const latencyMs = Math.round(55 + randomValue * Math.min(1_800, suite.timeoutMs));
  const timedOut = latencyMs >= suite.timeoutMs;
  const httpError = !timedOut && randomValue > 0.88;
  return {
    id,
    suiteId: suite.id,
    suiteName: suite.name,
    status: timedOut ? "TIMEOUT" : httpError ? "HTTP_ERROR" : "SUCCESS",
    statusCode: timedOut ? null : httpError ? 503 : 200,
    latencyMs: timedOut ? suite.timeoutMs : latencyMs,
    executorId,
    createdAt: now,
  };
}
