import { readFile, writeFile } from "node:fs/promises";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("export", `${Date.now()}`);
const { default: worker } = await import(workerUrl.href);

const response = await worker.fetch(
  new Request("http://localhost/", { headers: { accept: "text/html" } }),
  { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
  { waitUntil() {}, passThroughOnException() {} },
);

if (!response.ok) {
  throw new Error(`Static export failed with HTTP ${response.status}`);
}

let html = await response.text();
const cssHref = html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"[^>]*>/)?.[1];

if (!cssHref) {
  throw new Error("Unable to locate the generated stylesheet");
}

const css = await readFile(new URL(`../dist/client${cssHref}`, import.meta.url), "utf8");
html = html
  .replace(/<link[^>]+rel="stylesheet"[^>]*>/g, `<style>${css}</style>`)
  .replace(/<link[^>]+rel="modulepreload"[^>]*>/g, "")
  .replace(/<script[\s\S]*?<\/script>/g, "")
  .replace(/<button class="print-button">/, '<button class="print-button" onclick="window.print()">')
  .replace(/<\/html>[\s\S]*$/, "</html>");

const fullDocumentUrl = new URL("../Raptor-参考架构设计.html", import.meta.url);
await writeFile(fullDocumentUrl, html, "utf8");

const probeSection = html.match(
  /<section class="module section-shell" id="probe">[\s\S]*?(?=<section class="module section-shell" id="sumo">)/,
)?.[0];

if (!probeSection) {
  throw new Error("Unable to locate the probe design section");
}

const standaloneHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Raptor HTTP 多环境拨测平台独立参考设计文档">
  <title>Raptor HTTP 拨测平台架构设计</title>
  <style>${css}
    .standalone-cover{max-width:1180px;margin:0 auto;padding:72px 24px 48px}
    .standalone-cover h1{max-width:850px;margin:14px 0;font-size:clamp(42px,7vw,82px);line-height:1;letter-spacing:-.055em}
    .standalone-cover>p{max-width:800px;color:var(--muted);font-size:17px}
    .standalone-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:28px}
    .standalone-meta span{padding:7px 12px;border:1px solid var(--line);border-radius:20px;background:var(--card);font:10px ui-monospace,monospace}
    .standalone-warning{max-width:1180px;margin:0 auto;padding:16px 24px;color:#7c492c;background:#fff0e7;border-left:4px solid var(--orange);font-size:12px}
    .standalone-actions{position:fixed;right:24px;bottom:24px;z-index:20}
    .standalone-actions button{padding:11px 18px;border:0;border-radius:24px;color:white;background:var(--green);cursor:pointer;box-shadow:var(--shadow)}
    body>.module{border-top:0}.module-index{display:none}
    @media print{
      .standalone-cover{padding:28px 24px}.standalone-cover h1{font-size:42px}
      .standalone-actions{display:none}.standalone-warning{margin-top:12px}
    }
  </style>
</head>
<body>
  <header class="standalone-cover">
    <span class="label">STANDALONE DESIGN DOCUMENT · HTTP ONLY</span>
    <h1>Raptor HTTP 多环境<br>拨测平台架构设计</h1>
    <p>面向 200+ 应用、500+ 微服务的主动探测参考方案，覆盖需求边界、应用架构、网络架构、数据流、容量、难点、详细设计以及完整软件开发流程。</p>
    <div class="standalone-meta">
      <span>协议：HTTP / HTTPS</span>
      <span>环境：DEV / TEST / STG / PROD</span>
      <span>执行：K8S Worker Pool</span>
      <span>调度：ElasticJob + Kafka</span>
      <span>弹性：KEDA / HPA</span>
    </div>
  </header>
  <aside class="standalone-warning"><b>使用边界：</b>本文是基于给定背景构造的参考设计与仿真项目档案，不代表真实生产交付、上线或压测记录。</aside>
  ${probeSection}
  <div class="standalone-actions"><button type="button" onclick="window.print()">打印 / 导出 PDF</button></div>
</body>
</html>`;

const probeDocumentUrl = new URL("../Raptor-拨测平台架构设计.html", import.meta.url);
await writeFile(probeDocumentUrl, standaloneHtml, "utf8");
console.log(fullDocumentUrl.pathname);
console.log(probeDocumentUrl.pathname);
