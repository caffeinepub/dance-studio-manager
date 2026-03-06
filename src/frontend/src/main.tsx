import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
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

// CRITICAL: AuthProvider MUST always wrap App. Removing it causes a blank page
// because useAuth() in App.tsx will throw "useAuth must be used within AuthProvider".
ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
