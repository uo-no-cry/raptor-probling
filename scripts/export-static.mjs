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

await writeFile(new URL("../Raptor-参考架构设计.html", import.meta.url), html, "utf8");
console.log(new URL("../Raptor-参考架构设计.html", import.meta.url).pathname);
