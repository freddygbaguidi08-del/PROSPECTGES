// @ts-nocheck
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Sidebar } from '@/components/layouts/Sidebar';
import { SpaceBackground } from '@/components/ui/SpaceBackground';

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
    <div style={{ display: 'flex', height: '100vh', background: '#080c14', overflow: 'hidden', position: 'relative' }}>
      <SpaceBackground />
      <Sidebar user={{ name: session.name, email: session.email, orgName: session.orgName, role }} />
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }} className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
