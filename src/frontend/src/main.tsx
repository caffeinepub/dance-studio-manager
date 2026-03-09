import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
// CRITICAL: AuthProvider MUST always be present here. Do NOT remove it.
// Removing AuthProvider causes useAuth() to throw and the app to show a blank page.
import { AuthProvider } from "./contexts/AuthContext";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
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
    <InternetIdentityProvider>
      {/* CRITICAL: AuthProvider must wrap App — never remove this wrapper */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
