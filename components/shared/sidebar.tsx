'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  NAV_ITEMS_ADMIN,
  NAV_ITEMS_PARLIAMENTARIAN,
  NAV_ITEMS_PUBLIC,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { userRole } = useAuth();

  let navItems: typeof NAV_ITEMS_ADMIN = [];

  if (userRole === 'admin') {
    navItems = NAV_ITEMS_ADMIN;
  } else if (userRole === 'parliamentarian') {
    navItems = NAV_ITEMS_PARLIAMENTARIAN;
  } else {
    navItems = NAV_ITEMS_PUBLIC;
  }

  return (
    <aside className="w-64 bg-slate-100 border-r border-slate-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Navegación</h2>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block px-4 py-2 rounded-lg transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-blue-900 text-white'
                  : 'text-slate-700 hover:bg-slate-200'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
