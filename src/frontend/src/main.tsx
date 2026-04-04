import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// ============================================================
// CRITICAL: DO NOT CHANGE AuthProvider TO InternetIdentityProvider
// This app uses a CUSTOM mobile/password login system (NOT Internet Identity).
// Replacing AuthProvider with InternetIdentityProvider WILL cause a blank page.
// The correct import is: import { AuthProvider } from "./contexts/AuthContext"
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
    {/* CRITICAL: AuthProvider MUST wrap App. Do NOT replace with InternetIdentityProvider. */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>,
);
