'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConnectionStatus } from './connection-status';
import { ROLE_LABELS, NAV_ITEMS_SECRETARY } from '@/lib/constants';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const router = useRouter();
  const { user, userRole, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <nav className="bg-blue-900 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href={userRole === 'secretary' ? '/secretary' : '/'} className="text-2xl font-bold">
          📋 Sistema Parlamentario
        </Link>

        <div className="flex items-center gap-4">
          {/* Connection Status Indicator */}
          <div className="hidden sm:block">
            <ConnectionStatus showLabel={true} />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-white hover:bg-blue-800"
              >
                {user.full_name} ({ROLE_LABELS[userRole!]})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled className="text-slate-600">
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="text-xs text-slate-500">
                Rol: {ROLE_LABELS[userRole!]}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600"
              >
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
