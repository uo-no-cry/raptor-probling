import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Raptor reference design", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Raptor 运维能力参考架构设计<\/title>/i);
  assert.match(html, /Raptor 运维能力/);
  assert.match(html, /假设性设计/);
  assert.match(html, /拨测平台/);
  assert.match(html, /Sumo Logic 日志查询插件/);
  assert.match(html, /Jira Ticket 生成插件/);
  assert.match(html, /Slack 通知模块重构/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("contains the key engineering and interview guardrails", async () => {
  const html = await (await render()).text();
  const required = [
    "TPS",
    "并发数",
    "Kafka",
    "executionId",
    "SSRF",
    "HPA",
    "prompt injection",
    "幂等",
    "二次确认",
    "templateVersion",
    "Outbox",
    "没有真实完成",
  ];

  for (const phrase of required) {
    assert.match(html, new RegExp(phrase, "i"), `missing content: ${phrase}`);
  }

  assert.match(html, /id="probe"/);
  assert.match(html, /id="sumo"/);
  assert.match(html, /id="jira"/);
  assert.match(html, /id="slack"/);
});

test("documents the HTTP-only multi-environment probe scope", async () => {
  const html = await (await render()).text();
  const required = [
    "仅支持 HTTP/HTTPS",
    "应用—环境—探测点",
    "网络连通性矩阵",
    "environmentId",
    "connectivityStatus",
    "禁止把网络不通判定为应用故障",
  ];

  for (const phrase of required) {
    assert.match(html, new RegExp(phrase, "i"), `missing HTTP probe scope: ${phrase}`);
  }
});

test("contains the simulated SDLC activities and artifacts", async () => {
  const html = await (await render()).text();
  const required = [
    "仿真项目档案",
    "需求分析",
    "功能设计",
    "架构设计",
    "详细设计",
    "开发实现",
    "测试与验收",
    "发布与运维",
    "需求规格说明书",
    "接口设计文档",
    "测试报告",
    "上线方案",
    "复盘报告",
    "准入标准",
    "准出标准",
  ];

  for (const phrase of required) {
    assert.match(html, new RegExp(phrase, "i"), `missing SDLC artifact: ${phrase}`);
  }
});
