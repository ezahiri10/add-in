import * as React from "react";
import ProgramSelector from "./ProgramSelector";
import StudentTab from "./tabs/StudentTab";
import ProgramTab from "./tabs/ProgramTab";
import GradesTab from "./tabs/GradesTab";
import VariableOptionsForm, {
  type VariableOptions,
  type InitialValues,
  metadataToInitialValues,
  optionsToMetadata,
} from "./shared/VariableOptionsForm";
import type { Program, DocumentVariable, DocumentVariableTag, VariableTag } from "../types/variable";
import { getVariableOptionKind } from "../types/variable";
import { fetchPrograms, fetchDocumentVariables } from "../services/queries";
import { updateContentControlTag } from "../services/wordService";

/* global Office, Word, console */

type Tab = "student" | "program" | "grades";

const TABS: { key: Tab; label: string }[] = [
  { key: "student", label: "Student" },
  { key: "program", label: "Program" },
  { key: "grades",  label: "Grades" },
];

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let t: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  }) as T;
}

type EditingCC = {
  id: number;
  variable: DocumentVariable;
  initialValues: InitialValues;
};

const App: React.FC<{ title: string }> = () => {
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [programsLoading, setProgramsLoading] = React.useState(true);

  const [docVars, setDocVars] = React.useState<DocumentVariable[]>([]);
  const [docVarsLoading, setDocVarsLoading] = React.useState(true);

  const [selectedProgram, setSelectedProgram] = React.useState<Program | null>(null);
  const [activeTab, setActiveTab] = React.useState<Tab>("student");
  const [error, setError] = React.useState<string | null>(null);

  const [editingCC, setEditingCC] = React.useState<EditingCC | null>(null);
  const [updating, setUpdating] = React.useState(false);

  // Keep docVars accessible in the selection handler without re-registering
  const docVarsRef = React.useRef<DocumentVariable[]>(docVars);
  React.useEffect(() => { docVarsRef.current = docVars; }, [docVars]);

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

  // ── Content control selection detection ────────────────────────────────────

  React.useEffect(() => {
    const handleSelectionChange = debounce(async () => {
      try {
        await Word.run(async (context) => {
          const selection = context.document.getSelection();
          const cc = selection.parentContentControlOrNullObject;
          cc.load("id,tag");
          await context.sync();

          if (cc.isNullObject || !cc.tag) {
            setEditingCC(null);
            return;
          }

          let tag: VariableTag;
          try {
            tag = JSON.parse(cc.tag) as VariableTag;
          } catch {
            setEditingCC(null);
            return;
          }

          if (tag.type !== "document_variable") {
            setEditingCC(null);
            return;
          }

          const docVarTag = tag as DocumentVariableTag;
          const variable = docVarsRef.current.find((v) => v.id === docVarTag.variableId);
          if (!variable) {
            setEditingCC(null);
            return;
          }

          const kind = getVariableOptionKind(variable);
          const initialValues: InitialValues = kind
            ? metadataToInitialValues(kind, (docVarTag.metadata ?? {}) as Record<string, unknown>)
            : {};

          setEditingCC({ id: cc.id, variable, initialValues });
        });
      } catch (e) {
        console.error("Selection check failed:", e);
      }
    }, 400);

    Office.context.document.addHandlerAsync(
      Office.EventType.DocumentSelectionChanged,
      handleSelectionChange
    );

    return () => {
      Office.context.document.removeHandlerAsync(
        Office.EventType.DocumentSelectionChanged,
        { handler: handleSelectionChange }
      );
    };
  }, []);

  // ── Update handler ─────────────────────────────────────────────────────────

  const handleUpdate = async (variable: DocumentVariable, options: VariableOptions) => {
    if (!editingCC) return;
    const newTag: DocumentVariableTag = {
      type: "document_variable",
      variableId: variable.id,
      variableName: variable.name,
      variableType: variable.type,
      metadata: optionsToMetadata(options),
    };
    try {
      setUpdating(true);
      await updateContentControlTag(editingCC.id, newTag);
      setEditingCC(null);
    } catch (e) {
      console.error("Failed to update content control:", e);
    } finally {
      setUpdating(false);
    }
  };

  // ── Pane takeover: editing an existing content control ────────────────────

  if (editingCC) {
    const kind = getVariableOptionKind(editingCC.variable);

    if (kind) {
      return (
        <main style={{ fontFamily: "Arial, sans-serif", padding: "12px", height: "100%", boxSizing: "border-box" }}>
          <VariableOptionsForm
            variable={editingCC.variable}
            onBack={() => setEditingCC(null)}
            onInsert={handleUpdate}
            inserting={updating}
            mode="update"
            initialValues={editingCC.initialValues}
          />
        </main>
      );
    }

    // Variable has no options — show read-only summary
    return (
      <main style={{ fontFamily: "Arial, sans-serif", padding: "12px", height: "100%", boxSizing: "border-box" }}>
        <button
          onClick={() => setEditingCC(null)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "13px", color: "#7c3aed", padding: "0 0 12px 0",
            fontWeight: 600, display: "flex", alignItems: "center", gap: "4px",
          }}
        >
          ← Back
        </button>
        <div style={{ padding: "14px", border: "1px solid #e0e0e0", borderRadius: "10px", background: "#fafafa" }}>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#1a1a1a", marginBottom: "4px" }}>
            {editingCC.variable.label_en}
          </div>
          <div style={{ fontSize: "12px", color: "#888" }}>{`{{${editingCC.variable.name}}}`}</div>
          <div style={{ fontSize: "12px", color: "#999", marginTop: "10px" }}>
            This variable has no configurable options.
          </div>
        </div>
      </main>
    );
  }

  // ── Normal view ────────────────────────────────────────────────────────────

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
