import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="shell">
        <Sidebar />
        <div className="main">
          <Topbar />
          <div className="content">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}
