import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import AuthGuard from "@/components/AuthGuard";
import { DomainProvider } from "@/components/DomainProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DomainProvider>
        <div className="shell">
          <Sidebar />
          <div className="main">
            <Topbar />
            <div className="content">{children}</div>
          </div>
        </div>
      </DomainProvider>
    </AuthGuard>
  );
}
