import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Classes from "@/pages/Classes";
import Students from "@/pages/Students";
import Analytics from "@/pages/Analytics";
import Valutazioni from "@/pages/Valutazioni";
import { CommandDialogDemo } from "@/components/commandDialog";
import Exercises from "@/pages/Exercises";
import LoginPage from "@/pages/LoginPage";

// Layout wrapper for authenticated pages (with sidebar and command dialog)
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CommandDialogDemo />
      {children}
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Login page - standalone without sidebar */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated routes */}
        <Route path="/dashboard" element={<AuthenticatedLayout><Dashboard /></AuthenticatedLayout>} />
        <Route path="/exercises" element={<AuthenticatedLayout><Exercises /></AuthenticatedLayout>} />
        <Route path="/valutazioni" element={<AuthenticatedLayout><Valutazioni /></AuthenticatedLayout>} />
        <Route path="/classes" element={<AuthenticatedLayout><Classes /></AuthenticatedLayout>} />
        <Route path="/students" element={<AuthenticatedLayout><Students /></AuthenticatedLayout>} />
        <Route path="/analytics" element={<AuthenticatedLayout><Analytics /></AuthenticatedLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
