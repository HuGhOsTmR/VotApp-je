import { AuthGuard } from '@/components/auth/auth-guard';
import { Navbar } from '@/components/shared/navbar';
import { Sidebar } from '@/components/shared/sidebar';
import { UserRole } from '@/lib/types';

export default function ParliamentarianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole={UserRole.PARLIAMENTARIAN}>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 bg-slate-50">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
