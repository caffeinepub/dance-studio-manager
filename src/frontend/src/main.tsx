import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// ============================================================
// CRITICAL: DO NOT MODIFY THIS FILE DURING BACKEND REGENERATION
// This app uses a custom AuthProvider (NOT InternetIdentityProvider).
// Replacing AuthProvider with InternetIdentityProvider causes a blank screen.
// The correct CSS import path is "../index.css" (NOT "./index.css").
// ============================================================
import ReactDOM from "react-dom/client";
import App from "./App";
// REQUIRED: AuthProvider must wrap the entire app. DO NOT replace with InternetIdentityProvider.
import { AuthProvider } from "./contexts/AuthContext";
import "../index.css"; // CORRECT PATH: ../index.css (not ./index.css)

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
    {/* REQUIRED: AuthProvider provides custom mobile/password auth context */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>,
);
