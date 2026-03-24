import * as React from "react";
import type {
  ProgramExpression,
  ProgramConditionalExpression,
  CourseWithGrades,
  PlaceholderVariable,
} from "../../types/variable";
import {
  fetchProgramExpressions,
  fetchConditionalExpressions,
  fetchProgramCourses,
} from "../../services/queries";
import { insertVariableIntoWord } from "../../services/wordService";

interface Props {
  programId: number;
}

type Level1 = "formulas" | "conditions" | "courses";
type Level2 =
  | { type: "formulas" }
  | { type: "conditions" }
  | { type: "courses-list" }
  | { type: "courses-detail"; course: CourseWithGrades };

const LEVEL1_ITEMS: { key: Level1; label: string }[] = [
  { key: "formulas",   label: "Formulas" },
  { key: "conditions", label: "Conditions" },
  { key: "courses",    label: "Courses" },
];

const GradesTab: React.FC<Props> = ({ programId }) => {
  const [level, setLevel] = React.useState<Level2 | null>(null);
  const [query, setQuery] = React.useState("");
  const [inserting, setInserting] = React.useState<string | null>(null);

  const [expressions, setExpressions] = React.useState<ProgramExpression[] | null>(null);
  const [conditionals, setConditionals] = React.useState<ProgramConditionalExpression[] | null>(null);
  const [courses, setCourses] = React.useState<CourseWithGrades[] | null>(null);
  const [loadingKey, setLoadingKey] = React.useState<Level1 | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const goBack = () => { setLevel(null); setQuery(""); setError(null); };

  const handleLevel1Click = async (key: Level1) => {
    setError(null);
    setQuery("");
    if (key === "formulas") {
      if (!expressions) {
        setLoadingKey("formulas");
        try { setExpressions(await fetchProgramExpressions(programId)); }
        catch (e) { setError(String(e)); }
        finally { setLoadingKey(null); }
      }
      setLevel({ type: "formulas" });
    } else if (key === "conditions") {
      if (!conditionals) {
        setLoadingKey("conditions");
        try { setConditionals(await fetchConditionalExpressions(programId)); }
        catch (e) { setError(String(e)); }
        finally { setLoadingKey(null); }
      }
      setLevel({ type: "conditions" });
    } else {
      if (!courses) {
        setLoadingKey("courses");
        try { setCourses(await fetchProgramCourses(programId)); }
        catch (e) { setError(String(e)); }
        finally { setLoadingKey(null); }
      }
      setLevel({ type: "courses-list" });
    }
  };

  const insertExpression = async (expr: ProgramExpression) => {
    const v: PlaceholderVariable = {
      id: `expr-${expr.id}`,
      label: expr.name,
      placeholder: `{{${expr.name}}}`,
      tag: { type: "expression", expressionId: expr.id, expressionName: expr.name },
    };
    try { setInserting(`expr-${expr.id}`); await insertVariableIntoWord(v); }
    finally { setInserting(null); }
  };

  const insertConditional = async (expr: ProgramConditionalExpression) => {
    const v: PlaceholderVariable = {
      id: `cond-${expr.id}`,
      label: expr.name,
      placeholder: `{{${expr.name}}}`,
      tag: { type: "conditional_expression", expressionId: expr.id, expressionName: expr.name },
    };
    try { setInserting(`cond-${expr.id}`); await insertVariableIntoWord(v); }
    finally { setInserting(null); }
  };

  const insertGradeColumn = async (course: CourseWithGrades, colId: number, colName: string, isComputed: boolean) => {
    if (!course.gradebookTemplateId) return;
    const key = `grade-${colId}-${isComputed}`;
    const v: PlaceholderVariable = {
      id: key,
      label: colName,
      placeholder: `{{${colName}}}`,
      tag: {
        type: "grade_value",
        gradeName: colName,
        gradebookTemplateId: course.gradebookTemplateId,
        gradebookTemplateColumnId: colId,
        programPageCourseId: course.id,
        isComputed,
      },
    };
    try { setInserting(key); await insertVariableIntoWord(v); }
    finally { setInserting(null); }
  };

  // ── Level 1 ───────────────────────────────────────────────────────────────
  if (!level) {
    return (
      <div style={{ display: "grid", gap: "8px" }}>
        {error && <p style={{ fontSize: "13px", color: "#c00", margin: 0 }}>{error}</p>}
        {LEVEL1_ITEMS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleLevel1Click(key)}
            disabled={loadingKey === key}
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
            <span style={{ fontSize: "12px", color: "#999" }}>
              {loadingKey === key ? "Loading…" : "›"}
            </span>
          </button>
        ))}
      </div>
    );
  }

  const BackButton = ({ title }: { title: string }) => (
    <button
      onClick={goBack}
      style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: "13px", color: "#7c3aed", padding: "0 0 10px 0",
        fontWeight: 600, display: "flex", alignItems: "center", gap: "4px",
      }}
    >
      ← {title}
    </button>
  );

  const SearchInput = () => (
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
  );

  const VarButton = ({ id, label, sublabel, onClick }: { id: string; label: string; sublabel?: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      disabled={inserting === id}
      style={{
        padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: "7px",
        background: inserting === id ? "#f3f0ff" : "#fff",
        cursor: "pointer", textAlign: "left", fontSize: "13px",
      }}
    >
      <div style={{ fontWeight: 600, color: "#1a1a1a" }}>{label}</div>
      {sublabel && <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{sublabel}</div>}
    </button>
  );

  // ── Level 2: Formulas ─────────────────────────────────────────────────────
  if (level.type === "formulas") {
    const items = (expressions ?? []).filter((e) =>
      !query || e.name.toLowerCase().includes(query.toLowerCase())
    );
    return (
      <div>
        <BackButton title="Formulas" />
        <SearchInput />
        <div style={{ display: "grid", gap: "6px" }}>
          {items.length === 0 && <p style={{ fontSize: "13px", color: "#999", margin: 0 }}>No formulas</p>}
          {items.map((e) => (
            <VarButton key={e.id} id={`expr-${e.id}`} label={e.name} onClick={() => insertExpression(e)} />
          ))}
        </div>
      </div>
    );
  }

  // ── Level 2: Conditions ───────────────────────────────────────────────────
  if (level.type === "conditions") {
    const items = (conditionals ?? []).filter((e) =>
      !query || e.name.toLowerCase().includes(query.toLowerCase())
    );
    return (
      <div>
        <BackButton title="Conditions" />
        <SearchInput />
        <div style={{ display: "grid", gap: "6px" }}>
          {items.length === 0 && <p style={{ fontSize: "13px", color: "#999", margin: 0 }}>No conditions</p>}
          {items.map((e) => (
            <VarButton key={e.id} id={`cond-${e.id}`} label={e.name} onClick={() => insertConditional(e)} />
          ))}
        </div>
      </div>
    );
  }

  // ── Level 2: Courses list ─────────────────────────────────────────────────
  if (level.type === "courses-list") {
    const items = (courses ?? []).filter((c) =>
      !query || c.courseTitle.toLowerCase().includes(query.toLowerCase())
    );
    return (
      <div>
        <BackButton title="Courses" />
        <SearchInput />
        <div style={{ display: "grid", gap: "6px" }}>
          {items.length === 0 && <p style={{ fontSize: "13px", color: "#999", margin: 0 }}>No courses</p>}
          {items.map((c) => (
            <button
              key={c.id}
              onClick={() => { setLevel({ type: "courses-detail", course: c }); setQuery(""); }}
              style={{
                padding: "10px 12px", border: "1px solid #e0e0e0", borderRadius: "8px",
                background: "#fff", cursor: "pointer", textAlign: "left",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "13px", color: "#1a1a1a" }}>{c.courseTitle}</span>
              <span style={{ fontSize: "12px", color: "#999" }}>{c.columns.length} cols ›</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Level 3: Course grade columns ─────────────────────────────────────────
  if (level.type === "courses-detail") {
    const { course } = level;
    const allCols = course.columns.filter((c) =>
      !query || c.name.toLowerCase().includes(query.toLowerCase())
    );
    const regular = allCols.filter((c) => !c.isComputed);
    const computed = allCols.filter((c) => c.isComputed);

    return (
      <div>
        <button
          onClick={() => { setLevel({ type: "courses-list" }); setQuery(""); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "13px", color: "#7c3aed", padding: "0 0 10px 0",
            fontWeight: 600, display: "flex", alignItems: "center", gap: "4px",
          }}
        >
          ← {course.courseTitle}
        </button>
        <SearchInput />

        {course.columns.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#999", margin: 0 }}>No gradebook columns for this course</p>
        ) : (
          <>
            {regular.length > 0 && (
              <ColSection title="Grades">
                {regular.map((c) => (
                  <VarButton
                    key={c.id}
                    id={`grade-${c.id}-false`}
                    label={c.name}
                    onClick={() => insertGradeColumn(course, c.id, c.name, false)}
                  />
                ))}
              </ColSection>
            )}
            {computed.length > 0 && (
              <ColSection title="Computed">
                {computed.map((c) => (
                  <VarButton
                    key={c.id}
                    id={`grade-${c.id}-true`}
                    label={c.name}
                    onClick={() => insertGradeColumn(course, c.id, c.name, true)}
                  />
                ))}
              </ColSection>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
};

const ColSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: "14px" }}>
    <div style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
      {title}
    </div>
    <div style={{ display: "grid", gap: "6px" }}>{children}</div>
  </div>
);

export default GradesTab;
