import { Navbar } from '@/components/shared/navbar';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-slate-50">
        {children}
      </main>
    </div>
  );
}
