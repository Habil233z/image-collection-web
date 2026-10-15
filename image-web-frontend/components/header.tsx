"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Cookies from "js-cookie";
import Link from "next/dist/client/link";
import { useRouter } from "next/navigation";


interface HeaderProps {
  username: string | null;
}

export default function Header({ username }: HeaderProps) {
  const router = useRouter()

  function logout() {
    try {
      Cookies.remove("image-web-auth_token", { path: "/", domain: "localhost" })
      localStorage.removeItem("username")
      router.push("/login")
    } catch (err) {
      alert("Error during logout")
      console.log(err)
    }}

  return (
    <div className="h-20 bg-linear-to-b from-blue-500 via-blue-600 to-blue-700 w-screen border-b border-gray-600 flex items-center justify-between mb-4">
      <Link href="/">
        <div className="flex ml-3 items-center">
            <div className="bg-white h-15 w-15 rounded-full"></div>
            <h1 className="text-4xl font-medium text-gray-100 ml-4">Image Web</h1>
        </div>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="flex mr-3 items-center">
            <h1 className="text-2xl font-medium text-gray-100">{username}</h1>
            <div className="bg-white h-15 w-15 ml-4 rounded-full"></div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <Link href="/profile"><DropdownMenuItem className="focus:bg-linear-to-r from-blue-300 to-blue-400">Profile</DropdownMenuItem></Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={logout} className="focus:bg-linear-to-r from-red-500 to-red-700 focus:border">Log Out</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}