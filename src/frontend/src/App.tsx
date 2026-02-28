import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import BatchesPage from "./pages/BatchesPage";
import DashboardPage from "./pages/DashboardPage";
import FeeCollectionPage from "./pages/FeeCollectionPage";
import SoloProgrammesPage from "./pages/SoloProgrammesPage";
import StudentsPage from "./pages/StudentsPage";

export type Page = "dashboard" | "students" | "batches" | "solo" | "fees";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

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
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">{renderPage()}</main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
