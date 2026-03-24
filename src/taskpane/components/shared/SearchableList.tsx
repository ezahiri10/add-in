import * as React from "react";

export type ListItem = {
  id: string | number;
  label: string;
  sublabel?: string;
};

interface Props {
  items: ListItem[];
  onSelect: (item: ListItem) => void;
  placeholder?: string;
  inserting?: string | number | null;
}

const SearchableList: React.FC<Props> = ({ items, onSelect, placeholder = "Search…", inserting }) => {
  const [query, setQuery] = React.useState("");

  const filtered = query
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "7px 10px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          fontSize: "13px",
          boxSizing: "border-box",
          marginBottom: "8px",
          outline: "none",
        }}
      />
      <div style={{ display: "grid", gap: "6px" }}>
        {filtered.length === 0 && (
          <p style={{ fontSize: "13px", color: "#999", margin: 0 }}>No results</p>
        )}
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            disabled={inserting === item.id}
            style={{
              padding: "8px 10px",
              border: "1px solid #e0e0e0",
              borderRadius: "7px",
              background: inserting === item.id ? "#f3f0ff" : "#fff",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "13px",
              transition: "background 0.15s",
            }}
          >
            <div style={{ fontWeight: 600, color: "#1a1a1a" }}>{item.label}</div>
            {item.sublabel && (
              <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                {item.sublabel}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchableList;
