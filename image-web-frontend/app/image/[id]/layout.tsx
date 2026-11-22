import type { Metadata } from "next";

export const metadata: Metadata = { title: "Image" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
