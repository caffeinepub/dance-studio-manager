import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
/**
 * ============================================================
 * CRITICAL — DO NOT MODIFY THIS FILE WITHOUT READING THIS NOTE
 * ============================================================
 * This app uses a CUSTOM AuthProvider from ./contexts/AuthContext.
 * It does NOT use InternetIdentityProvider.
 *
 * REQUIRED imports:
 *   import { AuthProvider } from "./contexts/AuthContext";
 *   import "../index.css";   <-- note the TWO dots (../), not one
 *
 * If AuthProvider is missing or replaced with InternetIdentityProvider,
 * the app will show a BLANK WHITE SCREEN and crash silently.
 *
 * CSS path MUST be "../index.css" (not "./index.css").
 * ============================================================
 */
import React from "react";
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

// Runtime error boundary — shows a readable error instead of a blank screen
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "#1a0000",
            color: "#fff",
            fontFamily: "sans-serif",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
          <h1 style={{ color: "#ff4444", marginBottom: "0.5rem" }}>
            Application Error
          </h1>
          <p
            style={{
              color: "#ffaaaa",
              marginBottom: "1.5rem",
              maxWidth: "500px",
            }}
          >
            The app failed to load. This is usually caused by a missing
            AuthProvider or incorrect CSS import in main.tsx.
          </p>
          <pre
            style={{
              background: "#2a0000",
              color: "#ff8888",
              padding: "1rem",
              borderRadius: "8px",
              maxWidth: "600px",
              overflow: "auto",
              fontSize: "0.85rem",
              textAlign: "left",
            }}
          >
            {this.state.error?.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 2rem",
              background: "#cc0000",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      {/* AuthProvider MUST stay here — this app uses custom mobile/password auth, NOT InternetIdentity */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>,
);
