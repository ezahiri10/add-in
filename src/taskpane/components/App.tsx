import * as React from "react";
import ProgramSelector from "./ProgramSelector";
import StudentTab from "./tabs/StudentTab";
import ProgramTab from "./tabs/ProgramTab";
import GradesTab from "./tabs/GradesTab";
import type { Program, DocumentVariable } from "../types/variable";
import { fetchPrograms, fetchDocumentVariables } from "../services/queries";

/* global console */

type Tab = "student" | "program" | "grades";

const TABS: { key: Tab; label: string }[] = [
  { key: "student", label: "Student" },
  { key: "program", label: "Program" },
  { key: "grades",  label: "Grades" },
];

const App: React.FC<{ title: string }> = () => {
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [programsLoading, setProgramsLoading] = React.useState(true);

  const [docVars, setDocVars] = React.useState<DocumentVariable[]>([]);
  const [docVarsLoading, setDocVarsLoading] = React.useState(true);

  const [selectedProgram, setSelectedProgram] = React.useState<Program | null>(null);
  const [activeTab, setActiveTab] = React.useState<Tab>("student");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchPrograms()
      .then(setPrograms)
      .catch((e) => { console.error(e); setError("Failed to load programs"); })
      .finally(() => setProgramsLoading(false));

    fetchDocumentVariables()
      .then(setDocVars)
      .catch((e) => { console.error(e); setError("Failed to load variables"); })
      .finally(() => setDocVarsLoading(false));
  }, []);

  const disabled = !selectedProgram;

  return (
    <main style={{ fontFamily: "Arial, sans-serif", padding: "12px", height: "100%", boxSizing: "border-box" }}>
      {/* Program selector */}
      <ProgramSelector
        programs={programs}
        selected={selectedProgram}
        onSelect={setSelectedProgram}
        loading={programsLoading}
      />

      {error && (
        <p style={{ fontSize: "13px", color: "#c00", margin: "0 0 10px 0" }}>{error}</p>
      )}

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #e0e0e0",
          marginBottom: "14px",
          gap: "2px",
        }}
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => !disabled && setActiveTab(key)}
            disabled={disabled}
            style={{
              flex: 1,
              padding: "8px 4px",
              border: "none",
              borderBottom: activeTab === key && !disabled ? "2px solid #7c3aed" : "2px solid transparent",
              marginBottom: "-2px",
              background: "none",
              cursor: disabled ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: activeTab === key && !disabled ? 700 : 400,
              color: disabled ? "#bbb" : activeTab === key ? "#7c3aed" : "#555",
              transition: "color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {disabled ? (
        <p style={{ fontSize: "13px", color: "#999", textAlign: "center", marginTop: "24px" }}>
          Select a program to browse variables
        </p>
      ) : docVarsLoading ? (
        <p style={{ fontSize: "13px", color: "#888" }}>Loading variables…</p>
      ) : (
        <>
          {activeTab === "student" && <StudentTab variables={docVars} />}
          {activeTab === "program" && <ProgramTab variables={docVars} />}
          {activeTab === "grades" && <GradesTab key={selectedProgram.id} programId={selectedProgram.id} />}
        </>
      )}
    </main>
  );
};

export default App;
