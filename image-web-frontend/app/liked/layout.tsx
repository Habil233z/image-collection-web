import type { Metadata } from "next";

export const metadata: Metadata = { title: "Liked Images" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
