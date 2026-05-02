import { Navbar } from '@/components/shared/navbar';
import { Sidebar } from '@/components/shared/sidebar';
import { AuthGuard } from '@/components/auth/auth-guard';
import { UserRole } from '@/lib/types';
import { NAV_ITEMS_SECRETARY } from '@/lib/constants';

export default function SecretaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole={UserRole.SECRETARY}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex">
          {/* Sidebar */}
<Sidebar />
          {/* Main content */}
          <main className="flex-1 p-6 md:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

