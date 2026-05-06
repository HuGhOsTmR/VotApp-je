'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  NAV_ITEMS_ADMIN,
  NAV_ITEMS_SECRETARY,
  NAV_ITEMS_PARLIAMENTARIAN,
  NAV_ITEMS_PUBLIC,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { userRole } = useAuth();

  let navItems: readonly { label: string; href: string }[];

  if (userRole === 'secretary') {
    navItems = NAV_ITEMS_SECRETARY;
  } else if (userRole === 'admin') {
    navItems = NAV_ITEMS_ADMIN;
  } else if (userRole === 'parliamentarian') {
    navItems = NAV_ITEMS_PARLIAMENTARIAN;
  } else {
    navItems = NAV_ITEMS_PUBLIC;
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-bold text-sidebar-foreground mb-6">Navegación</h2>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block px-4 py-2 rounded-lg transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
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
