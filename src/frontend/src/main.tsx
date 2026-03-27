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

// CRITICAL: AuthProvider MUST wrap App or the entire app will crash with a blank screen.
// DO NOT remove or replace AuthProvider with InternetIdentityProvider alone.
// CSS import must be "../index.css" (not "./index.css") - main.tsx is inside src/
ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
