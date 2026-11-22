import type { Metadata } from "next";
import ChatShell from "@/components/chat-shell";

export const metadata: Metadata = { title: "Messages" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ChatShell>{children}</ChatShell>;
}
