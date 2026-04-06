import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// ============================================================
// CRITICAL: DO NOT REPLACE AuthProvider WITH InternetIdentityProvider
// This app uses a CUSTOM mobile/password login system via AuthContext.
// InternetIdentityProvider is NOT used and will break the app.
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
    {/* CRITICAL: AuthProvider MUST wrap App. DO NOT replace with InternetIdentityProvider. */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>,
);
