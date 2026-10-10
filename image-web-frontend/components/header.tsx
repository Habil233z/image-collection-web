"use client";

interface HeaderProps {
  username: string | null;
}

export default function Header({ username }: HeaderProps) {
  return (
    <div className="h-20 bg-linear-to-b from-blue-500 via-blue-600 to-blue-700 w-screen border-b border-gray-600 flex items-center">
      hello {username}
    </div>
  );
}