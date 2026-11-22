"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import api from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { clearSession, getStoredAvatar, getStoredUsername, setStoredAvatar } from "@/lib/auth";

interface HeaderProps {
  username: string | null;
}

export default function Header({ username }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [storedUsername, setStoredUsername] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string>("");

  useEffect(() => {
    const user = getStoredUsername();
    setStoredUsername(user);
    setMounted(true);
    if (!user) return;

    const cached = getStoredAvatar();
    if (cached !== null) {
      setAvatar(cached);
    } else {
      api.get("api/profile")
        .then((res) => {
          const url = res.data?.data?.avatar_url ?? "";
          setStoredAvatar(url);
          setAvatar(url);
        })
        .catch(() => {});
    }

    const onChange = () => setAvatar(getStoredAvatar() ?? "");
    window.addEventListener("avatar-changed", onChange);
    return () => window.removeEventListener("avatar-changed", onChange);
  }, []);

  const currentUser = username || storedUsername;

  async function logout() {
    try {
      await api.post("logout");
      clearSession();
      window.location.href = "/";
    } catch (err) {
      alert("Error during logout");
      console.log(err);
    }
  }

  return (
    <header className="sticky top-0 z-40 h-16 bg-linear-to-r from-sky-500/95 via-sky-500/95 to-blue-500/95 backdrop-blur-xl shadow-lg shadow-sky-900/15 ring-1 ring-white/40 flex items-center justify-between pl-3 pr-3 sm:pl-4 sm:pr-4 text-white">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="bg-white h-10 w-10 rounded-full flex items-center justify-center text-lg shadow-md ring-2 ring-white/50 group-hover:rotate-6 group-hover:scale-105 transition duration-300">
          🖼️
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm">Image Web</h1>
      </Link>

      {!mounted ? (
        <div className="h-10 w-32" />
      ) : currentUser ? (
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/liked" className="hidden sm:flex items-center gap-1.5 font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition">
            <span aria-hidden>♥</span> Liked
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className="flex items-center gap-3 bg-white/15 hover:bg-white/25 border border-white/30 pl-4 pr-1.5 py-1 rounded-full transition text-white">
                <span className="hidden sm:block text-base font-semibold text-white max-w-32 truncate">{currentUser}</span>
                <div className="h-10 w-10 rounded-full overflow-hidden bg-white ring-2 ring-white/70">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="h-full w-full object-cover"
                    src={avatar || "/user.png"}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/user.png"; }}
                    alt="Avatar"
                  />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-xl border border-white/60 bg-white/95 backdrop-blur-xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs uppercase tracking-wider text-gray-400 px-2 py-1.5">My Account</DropdownMenuLabel>
                <Link href="/liked">
                  <DropdownMenuItem className="cursor-pointer font-medium rounded-xl px-3 py-2 focus:bg-sky-50 focus:text-sky-600 transition text-gray-800">
                    Liked Images
                  </DropdownMenuItem>
                </Link>
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer font-medium rounded-xl px-3 py-2 focus:bg-sky-50 focus:text-sky-600 transition text-gray-800">
                    Profile
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-1 border-gray-100" />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer font-medium text-red-600 rounded-xl px-3 py-2 focus:bg-red-50 focus:text-red-700 transition"
                >
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link href="/login" className="font-semibold text-white hover:bg-white/15 px-4 py-2 rounded-full transition">
            Log In
          </Link>
          <Link href="/register" className="font-semibold bg-white text-sky-600 hover:bg-sky-50 px-5 py-2 rounded-full shadow-md hover:shadow-lg transition">
            Register
          </Link>
        </div>
      )}
    </header>
  );
}
