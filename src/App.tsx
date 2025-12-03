import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Classes from "@/pages/Classes";
import Students from "@/pages/Students";
import Analytics from "@/pages/Analytics";
import { CommandDialogDemo } from "@/components/commandDialog";
import Exercises from "@/pages/Exercises";

function App() {
  return (
    <>
      <CommandDialogDemo />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/students" element={<Students />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
