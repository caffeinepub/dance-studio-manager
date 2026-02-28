import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import InstitutionHeader from "./components/InstitutionHeader";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./contexts/AuthContext";
import BatchesPage from "./pages/BatchesPage";
import DashboardPage from "./pages/DashboardPage";
import FeeCollectionPage from "./pages/FeeCollectionPage";
import FeeTrackerPage from "./pages/FeeTrackerPage";
import LoginPage from "./pages/LoginPage";
import ReportsPage from "./pages/ReportsPage";
import SoloProgrammesPage from "./pages/SoloProgrammesPage";
import StudentsPage from "./pages/StudentsPage";
import UserManagementPage from "./pages/UserManagementPage";
import YearChangeoverPage from "./pages/YearChangeoverPage";

export type Page =
  | "dashboard"
  | "students"
  | "batches"
  | "solo"
  | "fees"
  | "feetracker"
  | "reports"
  | "yearchangeover"
  | "users";

export default function App() {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  if (!currentUser) {
    return (
      <>
        <LoginPage />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage onNavigate={setCurrentPage} />;
      case "students":
        return <StudentsPage />;
      case "batches":
        return <BatchesPage />;
      case "solo":
        return <SoloProgrammesPage />;
      case "fees":
        return <FeeCollectionPage />;
      case "feetracker":
        return <FeeTrackerPage />;
      case "reports":
        return <ReportsPage />;
      case "yearchangeover":
        return <YearChangeoverPage />;
      case "users":
        return <UserManagementPage />;
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <InstitutionHeader />
        <main className="flex-1 overflow-y-auto">{renderPage()}</main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
