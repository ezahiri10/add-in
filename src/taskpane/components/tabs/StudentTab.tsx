import * as React from "react";
import SearchableList, { type ListItem } from "../shared/SearchableList";
import type { DocumentVariable, PlaceholderVariable } from "../../types/variable";
import { getDocVarSubcategory, subcategoryToVariableType } from "../../types/variable";
import { insertVariableIntoWord } from "../../services/wordService";

interface Props {
  variables: DocumentVariable[];
}

const StudentTab: React.FC<Props> = ({ variables }) => {
  const [inserting, setInserting] = React.useState<number | null>(null);

  const userVars = variables.filter((v) => getDocVarSubcategory(v.name) === "user");
  const studentVars = variables.filter((v) => getDocVarSubcategory(v.name) === "student");

  const handleInsert = async (_item: ListItem, docVar: DocumentVariable) => {
    const sub = getDocVarSubcategory(docVar.name);
    const variable: PlaceholderVariable = {
      id: String(docVar.id),
      label: docVar.label_en,
      placeholder: `{{${docVar.name}}}`,
      tag: {
        type: "document_variable",
        variableId: docVar.id,
        variableName: docVar.name,
        variableType: subcategoryToVariableType(sub),
        metadata: {},
      },
    };
    try {
      setInserting(docVar.id);
      await insertVariableIntoWord(variable);
    } finally {
      setInserting(null);
    }
  };

  const toListItems = (vars: DocumentVariable[]): ListItem[] =>
    vars.map((v) => ({ id: v.id, label: v.label_en, sublabel: `{{${v.name}}}` }));

  const [query, setQuery] = React.useState("");

  const allVars = [...userVars, ...studentVars];
  const filteredAll = query
    ? allVars.filter((v) => v.label_en.toLowerCase().includes(query.toLowerCase()))
    : null;

  const renderList = (vars: DocumentVariable[]) =>
    vars.map((v) => (
      <button
        key={v.id}
        onClick={() => handleInsert({ id: v.id, label: v.label_en }, v)}
        disabled={inserting === v.id}
        style={{
          padding: "8px 10px",
          border: "1px solid #e0e0e0",
          borderRadius: "7px",
          background: inserting === v.id ? "#f3f0ff" : "#fff",
          cursor: "pointer",
          textAlign: "left",
          fontSize: "13px",
        }}
      >
        <div style={{ fontWeight: 600, color: "#1a1a1a" }}>{v.label_en}</div>
        <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{`{{${v.name}}}`}</div>
      </button>
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
          <Section title="User">
            {renderList(userVars)}
          </Section>
          <Section title="Student">
            {renderList(studentVars)}
          </Section>
        </>
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
