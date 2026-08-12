'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutTeacher } from '@/actions/authActions';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  School,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ConfirmDialog';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

interface SidebarGroup {
  category: string;
  items: SidebarItem[];
}

const adminMenuGroups: SidebarGroup[] = [
  {
    category: 'MENU UTAMA',
    items: [{ name: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
  },
  {
    category: 'MANAJEMEN MASTER',
    items: [
      { name: 'Kelola Sekolah', href: '/admin/sekolah', icon: School },
      { name: 'Kelola Wali Kelas', href: '/admin/guru', icon: Users },
    ],
  },
  {
    category: 'PENGATURAN AKUN',
    items: [{ name: 'Profil Admin', href: '/admin/profile', icon: User }],
  },
];

interface AdminLayoutClientProps {
  children: React.ReactNode;
  admin: {
    name: string;
    email: string;
  };
}

export default function AdminLayoutClient({
  children,
  admin,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => setMobileOpen(!mobileOpen);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutSubmit = async () => {
    setIsLoggingOut(true);
    const res = await logoutTeacher();
    setIsLoggingOut(false);
    setShowLogoutConfirm(false);
    if (res.success) {
      toast.success('Berhasil keluar aplikasi');
      router.push('/sign-in');
      router.refresh();
    } else {
      toast.error(res.error || 'Gagal keluar aplikasi.');
    }
  };

  const initialName = admin.name ? admin.name.charAt(0).toUpperCase() : 'A';

  const sidebarContent = (
    <div className='flex h-full flex-col justify-between p-4 bg-white'>
      <div>
        {/* Brand Header */}
        <div className='flex items-center gap-3 px-2 py-4 mb-6 border-b border-slate-200/80'>
          <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20'>
            <ShieldCheck className='h-5 w-5' />
          </div>
          <div>
            <h1 className='text-lg font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent'>
              Smart Admin
            </h1>
            <p className='text-[10px] text-slate-400 font-bold tracking-widest uppercase'>
              Dashboard Admin
            </p>
          </div>
        </div>

        {/* Grouped Navigation Items */}
        <nav className='space-y-5'>
          {adminMenuGroups.map((group) => (
            <div key={group.category} className='space-y-1.5'>
              <div className='px-3 text-[10px] font-black uppercase tracking-wider text-slate-400'>
                {group.category}
              </div>

              <div className='space-y-1'>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                        isActive
                          ? 'bg-emerald-50/80 text-emerald-900 border border-emerald-200/80 shadow-xs font-bold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      <Icon
                        className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${
                          isActive
                            ? 'text-emerald-600'
                            : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      <span>{item.name}</span>
                      {isActive && (
                        <span className='ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600' />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer / User Profile section */}
      <div className='border-t border-slate-200 pt-4 px-1'>
        <div className='flex items-center justify-between p-2 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100/60 transition-colors group'>
          <Link
            href='/admin/profile'
            onClick={() => setMobileOpen(false)}
            className='flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer'
            title='Edit Profil Admin'
          >
            <div className='h-9 w-9 shrink-0 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs group-hover:scale-105 transition-transform'>
              {initialName}
            </div>
            <div className='flex flex-col min-w-0 flex-1'>
              <span className='text-xs font-bold text-slate-900 truncate group-hover:text-emerald-600 transition-colors'>
                {admin.name || 'Administrator'}
              </span>
              <span className='text-[10px] text-slate-500 truncate font-medium'>
                {admin.email || ''}
              </span>
            </div>
          </Link>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setShowLogoutConfirm(true)}
            title='Keluar Aplikasi'
            className='h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl cursor-pointer shrink-0 transition-colors ml-1'
          >
            <LogOut className='h-4 w-4' />
            <span className='sr-only'>Keluar Aplikasi</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className='flex min-h-screen bg-slate-50 text-slate-900'>
      {/* Desktop Sidebar */}
      <aside className='hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200/80 shadow-xs'>
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <div className='flex-1 md:pl-64 flex flex-col min-w-0 max-w-full'>
        {/* Mobile Top Header */}
        <header className='flex h-16 items-center justify-between border-b border-slate-200 px-4 md:hidden bg-white/90 backdrop-blur-md sticky top-0 z-40'>
          <div className='flex items-center gap-2'>
            <ShieldCheck className='h-5 w-5 text-emerald-600' />
            <span className='font-bold text-emerald-700 text-sm'>
              Smart Admin
            </span>
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={toggleSidebar}
            className='text-slate-600 hover:text-slate-900'
          >
            {mobileOpen ? (
              <X className='h-6 w-6' />
            ) : (
              <Menu className='h-6 w-6' />
            )}
          </Button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className='fixed inset-0 z-50 md:hidden flex'>
            {/* Backdrop overlay */}
            <div
              className='fixed inset-0 bg-slate-900/40 backdrop-blur-xs'
              onClick={toggleSidebar}
            />
            {/* Drawer */}
            <aside className='relative flex w-64 max-w-xs flex-col bg-white border-r border-slate-200 animate-in slide-in-from-left duration-200'>
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Workspace content */}
        <main className='flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto min-w-0 max-w-full overflow-hidden'>
          {children}
        </main>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title='Konfirmasi Keluar Admin'
        description='Apakah Anda yakin ingin keluar dari sistem Smart Admin?'
        confirmText='Ya, Keluar'
        cancelText='Batal'
        variant='danger'
        isLoading={isLoggingOut}
        onConfirm={handleLogoutSubmit}
      />
    </div>
  );
}
