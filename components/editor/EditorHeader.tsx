'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, ChevronDown, LogOut, Settings, User, ArrowLeft } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { href: '/', label: '生成历史' },
  { href: '/templates', label: '风格模板库' },
  { href: '/editor', label: '画布编辑' },
];

interface EditorHeaderProps {
  showBackButton?: boolean;
}

export default function EditorHeader({ showBackButton }: EditorHeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/history';
    }
    if (href === '/editor') {
      return pathname.startsWith('/editor');
    }
    return pathname === href || pathname.startsWith(href);
  };

  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name.charAt(0).toUpperCase();
    }
    if (session?.user?.email) {
      return session.user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg -ml-2">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
        )}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-gray-900">Temu AI Studio</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 ml-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                isActive(item.href)
                  ? 'text-orange-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
              {isActive(item.href) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full" />
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Credits */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-full">
          <Zap className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-600">
            {(session?.user as any)?.credits ?? 0} Pts
          </span>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
            <Avatar className="w-8 h-8">
              <AvatarImage src={session?.user?.image || ''} />
              <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-sm text-gray-500">
              {session?.user?.email}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              个人中心
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              设置
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
