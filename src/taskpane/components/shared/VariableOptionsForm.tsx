import * as React from "react";
import type { DocumentVariable } from "../../types/variable";
import { getVariableOptionKind } from "../../types/variable";

// ── Option types (internal UI state) ─────────────────────────────────────────

export type DateFormat = "PPP" | "dd/MM/yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd" | "MMMM yyyy";
export type DurationUnit = "years" | "months" | "weeks" | "days" | "hours" | "minutes" | "seconds";
export type ModulePageType = "any" | "year" | "semester" | "module";

export type VariableOptions =
  | { kind: "date"; formatString: DateFormat }
  | { kind: "duration"; units: DurationUnit[] }
  | { kind: "module"; type: ModulePageType; order: number }
  | { kind: "module_class"; type: ModulePageType; order: number; classOrder: number };

// ── InitialValues — used when pre-filling the form from existing tag metadata ─

export type InitialValues = {
  dateFormat?: DateFormat;
  durationUnits?: Set<DurationUnit>;
  moduleType?: ModulePageType;
  moduleOrder?: number;
  classOrder?: number;
};

// ── Convert VariableOptions → flat metadata Record<string,string> ─────────────

export function optionsToMetadata(opts: VariableOptions): Record<string, string> {
  if (opts.kind === "date") {
    return { formatString: opts.formatString };
  }
  if (opts.kind === "duration") {
    return { formatString: opts.units.join(", ") };
  }
  if (opts.kind === "module") {
    return { type: opts.type, order: String(opts.order) };
  }
  // module_class
  return { type: opts.type, order: String(opts.order), "class-order": String(opts.classOrder) };
}

// ── Convert flat metadata → InitialValues (for pre-filling from existing tag) ─

export function metadataToInitialValues(
  kind: NonNullable<ReturnType<typeof getVariableOptionKind>>,
  metadata: Record<string, unknown>
): InitialValues {
  if (kind === "date") {
    const fmt = metadata.formatString as DateFormat | undefined;
    const validFormats: DateFormat[] = ["PPP", "dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "MMMM yyyy"];
    return { dateFormat: validFormats.includes(fmt as DateFormat) ? fmt : "PPP" };
  }
  if (kind === "duration") {
    const raw = typeof metadata.formatString === "string" ? metadata.formatString : "";
    const validUnits: DurationUnit[] = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"];
    const parsed = raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s): s is DurationUnit => validUnits.includes(s as DurationUnit));
    return { durationUnits: new Set(parsed.length > 0 ? parsed : ["hours"]) };
  }
  // module or module_class
  const validTypes: ModulePageType[] = ["any", "year", "semester", "module"];
  const rawType = metadata.type as ModulePageType | undefined;
  const moduleType: ModulePageType = validTypes.includes(rawType as ModulePageType) ? (rawType as ModulePageType) : "any";
  const order = Math.max(0, Number(metadata.order) || 0);
  if (kind === "module_class") {
    const classOrder = Math.max(0, Number(metadata["class-order"]) || 0);
    return { moduleType, moduleOrder: order, classOrder };
  }
  return { moduleType, moduleOrder: order };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DATE_FORMATS: { value: DateFormat; label: string }[] = [
  { value: "PPP",        label: "Long (e.g. December 25, 2023)" },
  { value: "dd/MM/yyyy", label: "dd/MM/yyyy" },
  { value: "MM/dd/yyyy", label: "MM/dd/yyyy" },
  { value: "yyyy-MM-dd", label: "yyyy-MM-dd" },
  { value: "MMMM yyyy",  label: "MMMM yyyy" },
];

const DURATION_UNITS: DurationUnit[] = [
  "years", "months", "weeks", "days", "hours", "minutes", "seconds",
];

const MODULE_PAGE_TYPES: { value: ModulePageType; label: string }[] = [
  { value: "any",      label: "Any" },
  { value: "year",     label: "Year" },
  { value: "semester", label: "Semester" },
  { value: "module",   label: "Module" },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  variable: DocumentVariable;
  onBack: () => void;
  onInsert: (variable: DocumentVariable, options: VariableOptions) => void;
  inserting: boolean;
  mode?: "insert" | "update";
  initialValues?: InitialValues;
}

const VariableOptionsForm: React.FC<Props> = ({
  variable,
  onBack,
  onInsert,
  inserting,
  mode = "insert",
  initialValues = {},
}) => {
  const kind = getVariableOptionKind(variable);

  const [dateFormat, setDateFormat] = React.useState<DateFormat>(initialValues.dateFormat ?? "PPP");
  const [durationUnits, setDurationUnits] = React.useState<Set<DurationUnit>>(
    initialValues.durationUnits ?? new Set(["hours"])
  );
  const [moduleType, setModuleType] = React.useState<ModulePageType>(initialValues.moduleType ?? "any");
  const [moduleOrder, setModuleOrder] = React.useState(initialValues.moduleOrder ?? 1);
  const [classOrder, setClassOrder] = React.useState(initialValues.classOrder ?? 1);

  const toggleUnit = (unit: DurationUnit) => {
    setDurationUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unit)) { next.delete(unit); } else { next.add(unit); }
      return next;
    });
  };

  const handleInsert = () => {
    let options: VariableOptions;
    if (kind === "date") {
      options = { kind: "date", formatString: dateFormat };
    } else if (kind === "duration") {
      options = { kind: "duration", units: DURATION_UNITS.filter((u) => durationUnits.has(u)) };
    } else if (kind === "module_class") {
      options = { kind: "module_class", type: moduleType, order: moduleOrder, classOrder };
    } else {
      options = { kind: "module", type: moduleType, order: moduleOrder };
    }
    onInsert(variable, options);
  };

  const canInsert = !inserting && !(kind === "duration" && durationUnits.size === 0);
  const buttonLabel = mode === "update" ? (inserting ? "Updating…" : "Update") : (inserting ? "Inserting…" : "Insert");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <button
        onClick={onBack}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: "13px", color: "#7c3aed", padding: "0 0 12px 0",
          fontWeight: 600, display: "flex", alignItems: "center", gap: "4px",
          flexShrink: 0,
        }}
      >
        ← {variable.label_en}
      </button>

      <div style={{ fontSize: "11px", color: "#888", marginBottom: "16px" }}>
        {`{{${variable.name}}}`}
      </div>

      <div style={{ flex: 1 }}>
        {kind === "date" && (
          <div>
            <label style={labelStyle}>Date format</label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value as DateFormat)}
              style={selectStyle}
            >
              {DATE_FORMATS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {kind === "duration" && (
          <div>
            <label style={labelStyle}>Units (select at least one)</label>
            <div style={{ display: "grid", gap: "8px" }}>
              {DURATION_UNITS.map((unit) => (
                <label key={unit} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={durationUnits.has(unit)}
                    onChange={() => toggleUnit(unit)}
                    style={{ width: "15px", height: "15px" }}
                  />
                  {unit.charAt(0).toUpperCase() + unit.slice(1)}
                </label>
              ))}
            </div>
          </div>
        )}

        {(kind === "module" || kind === "module_class") && (
          <div style={{ display: "grid", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Page type</label>
              <select
                value={moduleType}
                onChange={(e) => setModuleType(e.target.value as ModulePageType)}
                style={selectStyle}
              >
                {MODULE_PAGE_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Order (0 = most recent)</label>
              <input
                type="number"
                min={0}
                value={moduleOrder}
                onChange={(e) => setModuleOrder(Math.max(0, Number(e.target.value)))}
                style={inputStyle}
              />
            </div>
            {kind === "module_class" && (
              <div>
                <label style={labelStyle}>Class order (0 = most recent)</label>
                <input
                  type="number"
                  min={0}
                  value={classOrder}
                  onChange={(e) => setClassOrder(Math.max(0, Number(e.target.value)))}
                  style={inputStyle}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleInsert}
        disabled={!canInsert}
        style={{
          marginTop: "20px",
          padding: "10px",
          background: canInsert ? "#7c3aed" : "#c4b5fd",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: canInsert ? "pointer" : "not-allowed",
          width: "100%",
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#555",
  marginBottom: "6px",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  border: "1px solid #ddd",
  borderRadius: "6px",
  fontSize: "13px",
  background: "#fff",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  border: "1px solid #ddd",
  borderRadius: "6px",
  fontSize: "13px",
  boxSizing: "border-box",
};

export default VariableOptionsForm;
