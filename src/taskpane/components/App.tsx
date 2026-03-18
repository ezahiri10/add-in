import * as React from "react";
import { VARIABLES } from "../data/variables";
import { insertVariableIntoWord } from "../services/wordService";
import type { PlaceholderVariable } from "../types/variable";

/* global console */

interface AppProps {
  title: string;
}

const App: React.FC<AppProps> = () => {
  const [isLoading, setIsLoading] = React.useState<string | null>(null);
  const [inserted, setInserted] = React.useState<PlaceholderVariable[]>([]);

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

  return (
    <main style={{ padding: "16px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginTop: 0 }}>Transcript Variables</h2>
      <p style={{ fontSize: "14px", color: "#555" }}>
        Click a variable to insert it at the current cursor position.
      </p>

      <div style={{ display: "grid", gap: "10px" }}>
        {VARIABLES.map((variable) => (
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
        <p style={{ marginTop: "12px", fontSize: "14px", color: "#888" }}>Inserting...</p>
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
