export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AuthErrorBoundary } from "@/components/auth-error-boundary";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="pl-64">
          <AppHeader />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthErrorBoundary>
  );
}
