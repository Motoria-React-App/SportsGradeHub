import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Classes from "@/pages/Classes";
import Students from "@/pages/Students";
import StudentDetail from "@/pages/StudentDetail";
import Analytics from "@/pages/Analytics";
import Valutazioni from "@/pages/Valutazioni";
import { CommandDialogDemo } from "@/components/commandDialog";
import Exercises from "@/pages/Exercises";
import LoginPage from "@/pages/LoginPage";
import Settings from "@/pages/Settings";
import WelcomePage from "@/pages/WelcomePage";


// Layout wrapper for authenticated pages (with sidebar and command dialog)
// Layout wrapper for authenticated pages (with sidebar and command dialog)
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import ScrollToTop from "@/components/ScrollToTop";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <CommandDialogDemo />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

function App() {

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Login page - standalone without sidebar */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated routes */}
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/dashboard" element={<AuthenticatedLayout><Dashboard /></AuthenticatedLayout>} />
        <Route path="/exercises" element={<AuthenticatedLayout><Exercises /></AuthenticatedLayout>} />
        <Route path="/valutazioni" element={<Navigate to="/valutazioni/all/all" replace />} />
        <Route path="/valutazioni/:classId/:exerciseId" element={<AuthenticatedLayout><Valutazioni /></AuthenticatedLayout>} />
        <Route path="/classes/:id" element={<AuthenticatedLayout><Classes /></AuthenticatedLayout>} />
        <Route path="/students" element={<AuthenticatedLayout><Students /></AuthenticatedLayout>} />
        <Route path="/students/:id" element={<AuthenticatedLayout><StudentDetail /></AuthenticatedLayout>} />
        <Route path="/analytics" element={<AuthenticatedLayout><Analytics /></AuthenticatedLayout>} />
        <Route path="/settings" element={<AuthenticatedLayout><Settings /></AuthenticatedLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
