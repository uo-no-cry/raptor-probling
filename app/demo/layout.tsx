import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raptor 拨测平台 Demo",
  description: "测试套、Token、执行机与自动扩缩容的可交互拨测平台演示。",
};

export default function DemoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
