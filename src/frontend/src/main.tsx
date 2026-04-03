import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// CRITICAL: DO NOT REPLACE AuthProvider with InternetIdentityProvider.
// This app uses a custom mobile/password auth system via AuthContext.
// Replacing AuthProvider with InternetIdentityProvider will cause a BLANK PAGE.
// The CSS import path must be "../index.css" (not "./index.css").
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
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
