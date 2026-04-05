import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// ============================================================
// CRITICAL: DO NOT REPLACE AuthProvider WITH InternetIdentityProvider
// This app uses a CUSTOM mobile/password login system, NOT Internet Identity.
// Replacing AuthProvider WILL cause a blank/broken page on load.
// The CSS import must be "../index.css" (one level up from src/).
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
    {/* CRITICAL: AuthProvider MUST stay here. Do NOT swap for InternetIdentityProvider. */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>,
);
