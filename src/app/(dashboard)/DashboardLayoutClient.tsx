'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutTeacher } from '@/actions/authActions';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  GraduationCap,
  Wallet,
  Menu,
  X,
  BookOpen,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Data Siswa', href: '/siswa', icon: Users },
  { name: 'Absensi Kelas', href: '/absensi', icon: CalendarCheck2 },
  { name: 'Nilai Akademik', href: '/nilai', icon: GraduationCap },
  { name: 'Tabungan Siswa', href: '/tabungan', icon: Wallet },
];

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  teacher: {
    name: string;
    email: string;
  };
}

export default function DashboardLayoutClient({ children, teacher }: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => setMobileOpen(!mobileOpen);

  const handleLogout = async () => {
    const res = await logoutTeacher();
    if (res.success) {
      toast.success('Berhasil keluar aplikasi');
      router.push('/sign-in');
      router.refresh();
    } else {
      toast.error(res.error || 'Gagal keluar aplikasi.');
    }
  };

  const initialName = teacher.name ? teacher.name.charAt(0).toUpperCase() : 'G';

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-zinc-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Smart Class
            </h1>
            <p className="text-xs text-zinc-500">Command Center</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50 shadow-md shadow-emerald-950/20'
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile section */}
      <div className="border-t border-zinc-900 pt-4 flex flex-col gap-3 px-2">
        <div className="flex items-center gap-3">
          {/* Custom Avatar with Emerald gradient */}
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-500/20 border border-emerald-500/30">
            {initialName}
          </div>
          <div className="flex flex-col max-w-[130px] flex-1">
            <span className="text-xs font-semibold text-zinc-300 truncate">
              {teacher.name || 'Guru Smart Class'}
            </span>
            <span className="text-[10px] text-zinc-500 truncate">
              {teacher.email || ''}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl h-9 text-xs justify-start gap-2 px-3 border border-transparent hover:border-rose-950/30 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar Aplikasi</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-zinc-950/80 backdrop-blur-md border-r border-zinc-900">
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col">
        {/* Mobile Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-zinc-900 px-4 md:hidden bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-500" />
            <span className="font-bold text-emerald-400 text-sm">Smart Class</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-zinc-400 hover:text-zinc-200"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={toggleSidebar}
            />
            {/* Drawer */}
            <aside className="relative flex w-64 max-w-xs flex-col bg-zinc-950 border-r border-zinc-900 animate-in slide-in-from-left duration-200">
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Workspace content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
