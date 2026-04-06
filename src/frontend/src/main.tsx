import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// ============================================================
// CRITICAL: DO NOT MODIFY THIS FILE'S PROVIDER OR CSS IMPORT
// This app uses a CUSTOM LOGIN system (AuthProvider from ./contexts/AuthContext).
// DO NOT replace AuthProvider with InternetIdentityProvider.
// CSS path MUST be "../index.css" (one level up from src/).
// Changing either will cause a BLANK WHITE SCREEN on load.
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
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>,
);
