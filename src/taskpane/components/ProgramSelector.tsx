import * as React from "react";
import type { Program } from "../types/variable";

interface Props {
  programs: Program[];
  selected: Program | null;
  onSelect: (p: Program | null) => void;
  loading: boolean;
}

const ProgramSelector: React.FC<Props> = ({ programs, selected, onSelect, loading }) => {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const filtered = query
    ? programs.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : programs;

  // Close dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (p: Program) => {
    onSelect(p);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: "12px" }}>
      <label style={{ fontSize: "11px", fontWeight: 600, color: "#666", display: "block", marginBottom: "4px" }}>
        PROGRAM
      </label>
      <div
        onClick={() => !loading && setOpen((o) => !o)}
        style={{
          padding: "8px 10px",
          border: "1px solid #ccc",
          borderRadius: "7px",
          fontSize: "13px",
          background: "#fff",
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: selected ? "#1a1a1a" : "#999",
        }}
      >
        <span>{loading ? "Loading programs…" : selected ? selected.name : "Select a program…"}</span>
        <span style={{ fontSize: "10px", color: "#999" }}>▼</span>
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "7px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 100,
            maxHeight: "220px",
            overflowY: "auto",
            marginTop: "2px",
          }}
        >
          <div style={{ padding: "6px" }}>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search programs…"
              style={{
                width: "100%",
                padding: "6px 8px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                fontSize: "13px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => handleSelect(p)}
              style={{
                padding: "8px 12px",
                fontSize: "13px",
                cursor: "pointer",
                background: selected?.id === p.id ? "#f3f0ff" : "transparent",
                color: "#1a1a1a",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = selected?.id === p.id ? "#f3f0ff" : "transparent")
              }
            >
              {p.name}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: "8px 12px", fontSize: "13px", color: "#999" }}>No programs found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgramSelector;
