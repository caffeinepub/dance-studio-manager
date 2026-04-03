import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// ============================================================
// CRITICAL: DO NOT replace AuthProvider with InternetIdentityProvider.
// This app uses a custom mobile/password login system. AuthProvider
// from contexts/AuthContext.tsx is the ONLY provider that works here.
// Replacing it with InternetIdentityProvider will cause a blank screen.
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
    {/* CRITICAL: AuthProvider must wrap App. Do NOT remove or replace. */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>,
);
