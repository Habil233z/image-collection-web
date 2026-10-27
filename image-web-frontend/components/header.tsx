"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  username: string | null;
}

export default function Header({ username }: HeaderProps) {
  const router = useRouter();

  async function logout() {
    try {
      await api.post("http://localhost:8080/logout");
      localStorage.removeItem("username");
      router.push("/login");
    } catch (err) {
      alert("Error during logout");
      console.log(err);
    }
  }

  return (
    <header className="h-20 bg-linear-to-b from-sky-400 via-sky-500 to-blue-500 w-full border-b border-sky-300/40 shadow-lg flex items-center justify-between px-6 mb-6 sticky top-0 z-40 text-white">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="bg-white h-10 w-10 rounded-full flex items-center justify-center text-sky-600 font-bold shadow-md group-hover:scale-105 transition">
          🖼️
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Image Web</h1>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <div className="flex items-center gap-3 bg-sky-600/40 hover:bg-sky-600/60 border px-3 py-1.5 rounded-full transition shadow-xs text-white">
            <span className="text-base font-semibold text-white">{username || "Account"}</span>
            <div className="h-10 w-10 rounded-full overflow-hidden bg-white">
              <img 
                className="h-full w-full object-cover" 
                src="/" 
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/user.png"; }} 
                alt="Avatar"
              />
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-xl border border-gray-100 bg-white/95 backdrop-blur-md">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs uppercase tracking-wider text-gray-400 px-2 py-1.5">My Account</DropdownMenuLabel>
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
    </header>
  );
}