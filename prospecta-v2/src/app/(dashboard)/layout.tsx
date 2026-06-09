// @ts-nocheck
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Sidebar } from '@/components/layouts/Sidebar';

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login');

  let role = 'USER';
  try {
    const sql = (await import('@/lib/db')).default;
    const [user] = await sql`SELECT role FROM users WHERE id = ${session.userId}`;
    if (user) role = user.role;
  } catch { }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar user={{ name: session.name, email: session.email, orgName: session.orgName, role }} />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
