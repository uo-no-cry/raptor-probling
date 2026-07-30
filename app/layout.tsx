import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raptor 运维能力参考架构设计",
  description: "拨测平台、日志查询插件、Jira 工单插件与 Slack 通知中心的假设性架构设计和面试讲解材料。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
