import * as React from "react";
import { fetchVariables } from "../services/api";
import { insertVariableIntoWord } from "../services/wordService";
import { authClient } from "../lib/auth-client";
import type { PlaceholderVariable } from "../types/variable";

/* global console */

interface AppProps {
  title: string;
}

const App: React.FC<AppProps> = () => {
  const [variables, setVariables] = React.useState<PlaceholderVariable[]>([]);
  const [loadingVars, setLoadingVars] = React.useState(true);
  const [unauthorized, setUnauthorized] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const [isLoading, setIsLoading] = React.useState<string | null>(null);
  const [inserted, setInserted] = React.useState<PlaceholderVariable[]>([]);

  // sign-in form state
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [signingIn, setSigningIn] = React.useState(false);
  const [signInError, setSignInError] = React.useState<string | null>(null);

  const loadVariables = React.useCallback(async () => {
    setLoadingVars(true);
    setUnauthorized(false);
    setFetchError(null);

    const result = await fetchVariables();

    if (result.status === "ok") {
      setVariables(result.variables);
    } else if (result.status === "unauthorized") {
      setUnauthorized(true);
    } else {
      setFetchError(result.message);
    }

    setLoadingVars(false);
  }, []);

  React.useEffect(() => {
    loadVariables();
  }, [loadVariables]);

  const handleInsert = async (variable: PlaceholderVariable) => {
    try {
      setIsLoading(variable.id);
      await insertVariableIntoWord(variable);
      setInserted((prev) => {
        const alreadyExists = prev.some((v) => v.id === variable.id);
        return alreadyExists ? prev : [...prev, variable];
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    setSigningIn(true);
    const { error } = await authClient.signIn.email({ email, password });
    setSigningIn(false);
    if (error) {
      setSignInError(error.message ?? "Sign-in failed");
      return;
    }
    await loadVariables();
  };

  // ── Not authenticated — inline sign-in form ─────────────────────────────────
  if (unauthorized) {
    return (
      <main style={{ padding: "16px", fontFamily: "Arial, sans-serif" }}>
        <h2 style={{ marginTop: 0 }}>Sign in</h2>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
          Sign in to load your variables.
        </p>
        <form onSubmit={handleSignIn} style={{ display: "grid", gap: "10px" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "8px 10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box",
              width: "100%",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "8px 10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box",
              width: "100%",
            }}
          />
          {signInError && (
            <p style={{ margin: 0, fontSize: "13px", color: "#c00" }}>{signInError}</p>
          )}
          <button
            type="submit"
            disabled={signingIn}
            style={{
              padding: "10px",
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: signingIn ? "not-allowed" : "pointer",
              opacity: signingIn ? 0.7 : 1,
            }}
          >
            {signingIn ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </main>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loadingVars) {
    return (
      <main style={{ padding: "16px", fontFamily: "Arial, sans-serif" }}>
        <p style={{ fontSize: "14px", color: "#888" }}>Loading variables…</p>
      </main>
    );
  }

  // ── Fetch error ─────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <main style={{ padding: "16px", fontFamily: "Arial, sans-serif" }}>
        <p style={{ fontSize: "14px", color: "#c00" }}>{fetchError}</p>
        <button
          onClick={loadVariables}
          style={{
            marginTop: "8px",
            padding: "8px 14px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            background: "#fff",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Retry
        </button>
      </main>
    );
  }

  // ── Variables list ──────────────────────────────────────────────────────────
  return (
    <main style={{ padding: "16px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginTop: 0 }}>Transcript Variables</h2>
      <p style={{ fontSize: "14px", color: "#555" }}>
        Click a variable to insert it at the current cursor position.
      </p>

      <div style={{ display: "grid", gap: "10px" }}>
        {variables.map((variable) => (
          <button
            key={variable.id}
            onClick={() => handleInsert(variable)}
            disabled={isLoading !== null}
            style={{
              padding: "10px 12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              background: "#fff",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ fontWeight: 600 }}>{variable.label}</div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              {variable.placeholder}
            </div>
          </button>
        ))}
      </div>

      {isLoading && (
        <p style={{ marginTop: "12px", fontSize: "14px", color: "#888" }}>Inserting…</p>
      )}

      {inserted.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ fontSize: "14px", marginBottom: "10px" }}>Inserted Variables</h3>
          <div style={{ display: "grid", gap: "8px" }}>
            {inserted.map((variable) => (
              <div
                key={variable.id}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  background: "#f9f9f9",
                  fontSize: "13px",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: "6px" }}>{variable.label}</div>
                <div style={{ color: "#555", lineHeight: "1.6" }}>
                  <div>
                    <span style={{ color: "#888" }}>key: </span>
                    {variable.metadata.variableKey}
                  </div>
                  {variable.metadata.studentId != null && (
                    <div>
                      <span style={{ color: "#888" }}>studentId: </span>
                      {variable.metadata.studentId}
                    </div>
                  )}
                  {variable.metadata.courseId != null && (
                    <div>
                      <span style={{ color: "#888" }}>courseId: </span>
                      {variable.metadata.courseId}
                    </div>
                  )}
                  {variable.metadata.programId != null && (
                    <div>
                      <span style={{ color: "#888" }}>programId: </span>
                      {variable.metadata.programId}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
};

export default App;
