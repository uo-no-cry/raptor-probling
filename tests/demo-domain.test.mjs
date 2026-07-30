import assert from "node:assert/strict";
import test from "node:test";

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
  validateSuiteInput,
} from "../app/demo/domain.ts";

function sampleCredential(suffix) {
  return ["demo", "credential", suffix].join("-");
}

test("creates a validated draft suite without mutating the input", () => {
  const input = {
    name: "payment-health",
    appId: "payment-service",
    environment: "PROD",
    method: "GET",
    targetUrl: "https://payment.internal/health",
    intervalSeconds: 30,
    timeoutMs: 2000,
  };

  const suite = createSuite(input, "suite-1", "2026-07-30T10:00:00.000Z");

  assert.equal(suite.status, "DRAFT");
  assert.equal(suite.version, 1);
  assert.equal(suite.revision, 1);
  assert.equal(suite.id, "suite-1");
  assert.deepEqual(input, {
    name: "payment-health",
    appId: "payment-service",
    environment: "PROD",
    method: "GET",
    targetUrl: "https://payment.internal/health",
    intervalSeconds: 30,
    timeoutMs: 2000,
  });
});

test("rejects unsafe or invalid suite input", () => {
  assert.deepEqual(
    validateSuiteInput({
      name: "",
      appId: "payment",
      environment: "PROD",
      method: "DELETE",
      targetUrl: "file:///etc/passwd",
      intervalSeconds: 2,
      timeoutMs: 9000,
    }),
    [
      "测试套名称至少需要 2 个字符",
      "仅支持 GET、HEAD 和受控 POST",
      "目标地址必须是 HTTP/HTTPS URL",
      "拨测周期必须在 10–3600 秒之间",
      "超时必须在 100–5000ms 之间",
    ],
  );
});

test("publishes and archives suites immutably", () => {
  const draft = createSuite({
    name: "order-health",
    appId: "order-service",
    environment: "STG",
    method: "HEAD",
    targetUrl: "https://order.internal/health",
    intervalSeconds: 30,
    timeoutMs: 5000,
  }, "suite-2", "2026-07-30T10:00:00.000Z");

  const published = publishSuite(draft, "2026-07-30T10:01:00.000Z");
  const archived = archiveSuite(published, "2026-07-30T10:02:00.000Z");

  assert.equal(draft.status, "DRAFT");
  assert.equal(published.status, "PUBLISHED");
  assert.equal(published.version, 2);
  assert.equal(archived.status, "ARCHIVED");
});

test("stores only masked token metadata and rotates without exposing secrets", () => {
  const initialCredential = sampleCredential("1234");
  const token = createTokenMetadata({
    name: "payment-prod",
    appId: "payment-service",
    environment: "PROD",
    type: "Bearer",
    secret: initialCredential,
  }, "token-1", "2026-07-30T10:00:00.000Z");

  assert.equal(token.maskedValue, "••••1234");
  assert.equal(token.version, 1);
  assert.equal(token.status, "ACTIVE");
  assert.equal("secret" in token, false);
  assert.equal(JSON.stringify(token).includes(initialCredential), false);

  const rotated = rotateToken(token, sampleCredential("5678"), "2026-07-30T10:05:00.000Z");
  assert.equal(rotated.maskedValue, "••••5678");
  assert.equal(rotated.version, 2);
  assert.equal(token.version, 1);
});

test("calculates buffered replicas from rate, lag and in-flight signals", () => {
  assert.equal(calculateDesiredReplicas({
    targetTps: 10_000,
    kafkaLag: 0,
    inFlight: 2_000,
    safeTpsPerPod: 400,
    minReplicas: 8,
    maxReplicas: 80,
  }), 33);

  assert.equal(calculateDesiredReplicas({
    targetTps: 500,
    kafkaLag: 100_000,
    inFlight: 1_000,
    safeTpsPerPod: 400,
    minReplicas: 8,
    maxReplicas: 40,
  }), 40);
});

test("drains executors immutably and ignores offline instances", () => {
  const online = { id: "worker-1", state: "ONLINE", inFlight: 12 };
  const draining = drainExecutor(online);
  const offline = { id: "worker-2", state: "OFFLINE", inFlight: 0 };

  assert.equal(draining.state, "DRAINING");
  assert.equal(online.state, "ONLINE");
  assert.deepEqual(drainExecutor(offline), offline);
});

test("edits published suites as drafts and supports pause/resume", () => {
  const published = publishSuite(createSuite({
    name: "catalog-health",
    appId: "catalog-service",
    environment: "PROD",
    method: "GET",
    targetUrl: "https://catalog.internal/health",
    intervalSeconds: 30,
    timeoutMs: 1000,
  }, "suite-3", now), now);

  const edited = updateSuite(published, { timeoutMs: 1500 }, now);
  const paused = pauseSuite(published, now);
  const resumed = resumeSuite(paused, now);

  assert.equal(edited.status, "DRAFT");
  assert.equal(edited.timeoutMs, 1500);
  assert.equal(paused.status, "PAUSED");
  assert.equal(resumed.status, "PUBLISHED");
});

test("revokes tokens without mutating the active version", () => {
  const token = createTokenMetadata({
    name: "catalog-prod",
    appId: "catalog-service",
    environment: "PROD",
    type: "API Key",
    secret: sampleCredential("0001"),
  }, "token-2", now);

  const revoked = revokeToken(token, now);
  assert.equal(revoked.status, "REVOKED");
  assert.equal(token.status, "ACTIVE");
});

test("simulates success, HTTP errors and timeouts deterministically", () => {
  const suite = publishSuite(createSuite({
    name: "search-health",
    appId: "search-service",
    environment: "TEST",
    method: "GET",
    targetUrl: "https://search.test.internal/health",
    intervalSeconds: 30,
    timeoutMs: 5000,
  }, "suite-4", now), now);
  const timeoutSuite = { ...suite, timeoutMs: 1000 };

  assert.equal(simulateProbe(suite, "worker-1", 0.2, "exec-1", now).status, "SUCCESS");
  assert.equal(simulateProbe(suite, "worker-1", 0.9, "exec-2", now).status, "HTTP_ERROR");
  assert.equal(simulateProbe(timeoutSuite, "worker-1", 1, "exec-3", now).status, "TIMEOUT");
});

test("covers invalid state transitions and credential boundaries", () => {
  const draft = createSuite({
    name: "inventory-health",
    appId: "inventory-service",
    environment: "DEV",
    method: "GET",
    targetUrl: "https://inventory.dev.internal/health",
    intervalSeconds: 30,
    timeoutMs: 1000,
  }, "suite-5", now);
  const archived = archiveSuite(draft, now);
  const token = createTokenMetadata({
    name: "inventory-dev",
    appId: "inventory-service",
    environment: "DEV",
    type: "Bearer",
    secret: sampleCredential("inventory"),
  }, "token-3", now);

  assert.equal(pauseSuite(draft, now), draft);
  assert.equal(resumeSuite(draft, now), draft);
  assert.throws(() => publishSuite(archived, now), /不可发布/);
  assert.throws(() => updateSuite(archived, { timeoutMs: 1200 }, now), /不可编辑/);
  assert.throws(() => createTokenMetadata({ ...token, secret: ["bad"].join("") }, "token-4", now), /至少需要 8/);
  assert.throws(() => rotateToken(revokeToken(token, now), sampleCredential("next"), now), /只有 ACTIVE/);
  assert.deepEqual(validateSuiteInput({ ...draft, targetUrl: "not a url" }), ["目标地址必须是 HTTP/HTTPS URL"]);
});

const now = "2026-07-30T10:00:00.000Z";
