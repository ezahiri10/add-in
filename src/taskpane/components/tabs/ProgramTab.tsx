import * as React from "react";
import type { DocumentVariable, PlaceholderVariable } from "../../types/variable";
import { getDocVarSubcategory, getVariableOptionKind } from "../../types/variable";
import { insertVariableIntoWord } from "../../services/wordService";
import VariableOptionsForm, { type VariableOptions, optionsToMetadata } from "../shared/VariableOptionsForm";

interface Props {
  variables: DocumentVariable[];
}

type Subcategory = "institution" | "program" | "cohort" | "class" | "other";

const SUBCATEGORIES: { key: Subcategory; label: string }[] = [
  { key: "institution", label: "Institution" },
  { key: "program",     label: "Program" },
  { key: "cohort",      label: "Cohort" },
  { key: "class",       label: "Class" },
  { key: "other",       label: "Other" },
];

const ProgramTab: React.FC<Props> = ({ variables }) => {
  const [active, setActive] = React.useState<Subcategory | null>(null);
  const [query, setQuery] = React.useState("");
  const [inserting, setInserting] = React.useState<number | null>(null);
  const [optionsVar, setOptionsVar] = React.useState<DocumentVariable | null>(null);

  const varsBySubcategory = React.useMemo(() => {
    const map: Record<Subcategory, DocumentVariable[]> = {
      institution: [], program: [], cohort: [], class: [], other: [],
    };
    for (const v of variables) {
      if (v.type === "organization") { map.institution.push(v); continue; }
      if (v.type === "other") { map.other.push(v); continue; }
      if (v.type === "program") {
        const sub = getDocVarSubcategory(v.name);
        const key = sub === "program" || sub === "cohort" || sub === "class" ? sub : "program";
        map[key].push(v);
      }
    }
    return map;
  }, [variables]);

  const buildVariable = (v: DocumentVariable, options?: VariableOptions): PlaceholderVariable => ({
    id: String(v.id),
    label: v.label_en,
    placeholder: `{{${v.name}}}`,
    tag: {
      type: "document_variable",
      variableId: v.id,
      variableName: v.name,
      variableType: v.type,
      metadata: options ? optionsToMetadata(options) : {},
    },
  });

  const handleInsert = async (v: DocumentVariable, options?: VariableOptions) => {
    try {
      setInserting(v.id);
      await insertVariableIntoWord(buildVariable(v, options));
      setOptionsVar(null);
    } finally {
      setInserting(null);
    }
  };

  const handleBack = () => {
    setActive(null);
    setQuery("");
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

  // ── Level 2: variable list ────────────────────────────────────────────────
  if (active) {
    const items = varsBySubcategory[active];
    const filtered = query
      ? items.filter((v) => v.label_en.toLowerCase().includes(query.toLowerCase()))
      : items;

    return (
      <div>
        <button
          onClick={handleBack}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "13px", color: "#7c3aed", padding: "0 0 10px 0",
            fontWeight: 600, display: "flex", alignItems: "center", gap: "4px",
          }}
        >
          ← {SUBCATEGORIES.find((s) => s.key === active)?.label}
        </button>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          style={{
            width: "100%", padding: "7px 10px", border: "1px solid #ddd",
            borderRadius: "6px", fontSize: "13px", boxSizing: "border-box",
            marginBottom: "8px", outline: "none",
          }}
        />

        <div style={{ display: "grid", gap: "6px" }}>
          {filtered.length === 0 && (
            <p style={{ fontSize: "13px", color: "#999", margin: 0 }}>No results</p>
          )}
          {filtered.map((v) => {
            const hasOptions = getVariableOptionKind(v) !== null;
            return (
              <div key={v.id} style={{ display: "flex", gap: "6px", alignItems: "stretch" }}>
                <button
                  onClick={() => handleInsert(v)}
                  disabled={inserting === v.id}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "7px",
                    background: inserting === v.id ? "#f3f0ff" : "#fff",
                    cursor: inserting === v.id ? "not-allowed" : "pointer",
                    textAlign: "left",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#1a1a1a" }}>{v.label_en}</div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{`{{${v.name}}}`}</div>
                </button>

                {hasOptions && (
                  <button
                    onClick={() => setOptionsVar(v)}
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
          })}
        </div>
      </div>
    );
  }

  // ── Level 1: subcategory list ─────────────────────────────────────────────
  return (
    <div style={{ display: "grid", gap: "8px" }}>
      {SUBCATEGORIES.map(({ key, label }) => {
        const count = varsBySubcategory[key].length;
        return (
          <button
            key={key}
            onClick={() => setActive(key)}
            style={{
              padding: "12px 14px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              background: "#fff",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: "14px", color: "#1a1a1a" }}>{label}</span>
            <span style={{ fontSize: "12px", color: "#999" }}>{count} vars ›</span>
          </button>
        );
      })}
    </div>
  );
};

export default ProgramTab;
