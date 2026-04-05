import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// ============================================================
// CRITICAL: DO NOT CHANGE AuthProvider TO InternetIdentityProvider
// This app uses a custom mobile/password login system.
// InternetIdentityProvider will CRASH the app with a blank screen.
// AuthProvider is defined in src/contexts/AuthContext.tsx
// CSS import MUST be "../index.css" (NOT "./index.css")
// ============================================================
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "../index.css";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    {/* CRITICAL: AuthProvider MUST wrap App. Do NOT replace with InternetIdentityProvider */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>,
);
