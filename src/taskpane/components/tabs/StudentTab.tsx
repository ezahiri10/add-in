import * as React from "react";
import type { DocumentVariable, PlaceholderVariable } from "../../types/variable";
import { getVariableOptionKind } from "../../types/variable";
import { insertVariableIntoWord } from "../../services/wordService";
import VariableOptionsForm, { type VariableOptions, optionsToMetadata } from "../shared/VariableOptionsForm";

interface Props {
  variables: DocumentVariable[];
}

const StudentTab: React.FC<Props> = ({ variables }) => {
  const [inserting, setInserting] = React.useState<number | null>(null);
  const [optionsVar, setOptionsVar] = React.useState<DocumentVariable | null>(null);
  const [query, setQuery] = React.useState("");

  const userVars = variables.filter((v) => v.type === "user");
  const studentVars = variables.filter((v) => v.type === "student");

  const buildVariable = (docVar: DocumentVariable, options?: VariableOptions): PlaceholderVariable => ({
    id: String(docVar.id),
    label: docVar.label_en,
    placeholder: `{{${docVar.name}}}`,
    tag: {
      type: "document_variable",
      variableId: docVar.id,
      variableName: docVar.name,
      variableType: docVar.type,
      metadata: options ? optionsToMetadata(options) : {},
    },
  });

  const handleInsert = async (docVar: DocumentVariable, options?: VariableOptions) => {
    try {
      setInserting(docVar.id);
      await insertVariableIntoWord(buildVariable(docVar, options));
      setOptionsVar(null);
    } finally {
      setInserting(null);
    }
  };

  // ── Options form (pane takeover) ──────────────────────────────────────────
  if (optionsVar) {
    return (
      <VariableOptionsForm
        variable={optionsVar}
        onBack={() => setOptionsVar(null)}
        onInsert={(v, opts) => handleInsert(v, opts)}
        inserting={inserting === optionsVar.id}
      />
    );
  }

  // ── Variable list ─────────────────────────────────────────────────────────
  const allVars = [...userVars, ...studentVars];
  const filteredAll = query
    ? allVars.filter((v) => v.label_en.toLowerCase().includes(query.toLowerCase()))
    : null;

  const renderList = (vars: DocumentVariable[]) =>
    vars.map((v) => (
      <VarRow
        key={v.id}
        variable={v}
        inserting={inserting === v.id}
        onInsert={() => handleInsert(v)}
        onOptions={() => setOptionsVar(v)}
      />
    ));

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search variables…"
        style={{
          width: "100%",
          padding: "7px 10px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          fontSize: "13px",
          boxSizing: "border-box",
          marginBottom: "12px",
          outline: "none",
        }}
      />

      {filteredAll ? (
        <div style={{ display: "grid", gap: "6px" }}>
          {filteredAll.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#999", margin: 0 }}>No results</p>
          ) : (
            renderList(filteredAll)
          )}
        </div>
      ) : (
        <>
          <Section title="User">{renderList(userVars)}</Section>
          <Section title="Student">{renderList(studentVars)}</Section>
        </>
      )}
    </div>
  );
};

const VarRow: React.FC<{
  variable: DocumentVariable;
  inserting: boolean;
  onInsert: () => void;
  onOptions: () => void;
}> = ({ variable, inserting, onInsert, onOptions }) => {
  const hasOptions = getVariableOptionKind(variable) !== null;

  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "stretch" }}>
      <button
        onClick={onInsert}
        disabled={inserting}
        style={{
          flex: 1,
          padding: "8px 10px",
          border: "1px solid #e0e0e0",
          borderRadius: "7px",
          background: inserting ? "#f3f0ff" : "#fff",
          cursor: inserting ? "not-allowed" : "pointer",
          textAlign: "left",
          fontSize: "13px",
        }}
      >
        <div style={{ fontWeight: 600, color: "#1a1a1a" }}>{variable.label_en}</div>
        <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{`{{${variable.name}}}`}</div>
      </button>

      {hasOptions && (
        <button
          onClick={onOptions}
          title="Options"
          style={{
            padding: "0 10px",
            border: "1px solid #e0e0e0",
            borderRadius: "7px",
            background: "#fff",
            cursor: "pointer",
            fontSize: "15px",
            color: "#7c3aed",
            flexShrink: 0,
          }}
        >
          ✎
        </button>
      )}
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: "16px" }}>
    <div
      style={{
        fontSize: "11px",
        fontWeight: 700,
        color: "#7c3aed",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: "6px",
      }}
    >
      {title}
    </div>
    <div style={{ display: "grid", gap: "6px" }}>{children}</div>
  </div>
);

export default StudentTab;
