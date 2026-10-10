"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";

export default function Home() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername);
  }, []);

  return (
    <>
      <Header username={username} />
    </>
  );
}