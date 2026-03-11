import { COUNTRIES } from "../../data/events";
import { useTheme } from "../../context/ThemeContext";
import SearchInput from "./SearchInput";
import FilterBar from "./FilterBar";
import EventCard from "./EventCard";
import EventGroup from "./EventGroup";

export default function Sidebar({ events, selected, onSelect, filter, setFilter, search, setSearch, groupBy, setGroupBy, isOpen, onClose, countries, onCountryChange }) {
  const { theme } = useTheme();

  const groupOptions = [
    { value: "none", label: "LIST" },
    { value: "region", label: "REGION" },
    { value: "sector", label: "SECTOR" },
  ];

  const btnStyle = (active) => ({
    padding: "3px 8px", borderRadius: 3, cursor: "pointer",
    fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.08em",
    border: active ? "1px solid #3b82f6" : `1px solid ${theme.border}`,
    background: active ? "rgba(59,130,246,0.2)" : "transparent",
    color: active ? "#60a5fa" : theme.textMuted,
    transition: "all 0.1s",
  });

  const isFiltered = !countries.includes("ALL");

  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
      <div className={`atlas-sidebar ${isOpen ? "open" : ""}`} style={{
        width: 300, borderRight: `1px solid ${theme.border}`,
        display: "flex", flexDirection: "column", flexShrink: 0,
        background: theme.bg,
      }}>
        {/* Mobile country selector — visible only on mobile */}
        <div className="sidebar-country-selector" style={{ display: "none" }}>
          <div style={{
            padding: "10px 14px", borderBottom: `1px solid ${theme.border}`,
            background: isFiltered ? "rgba(59,130,246,0.08)" : "transparent",
          }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: theme.textDim, letterSpacing: "0.12em", marginBottom: 6 }}>
              COMMAND VIEW
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {Object.entries(COUNTRIES).map(([code, c]) => {
                const isActive = countries.includes(code);
                return (
                  <button
                    key={code}
                    onClick={() => onCountryChange(code)}
                    style={{
                      padding: "4px 8px", borderRadius: 4, cursor: "pointer",
                      fontFamily: "'Space Mono', monospace", fontSize: 10,
                      border: isActive ? "1px solid #3b82f6" : `1px solid ${theme.border}`,
                      background: isActive ? "rgba(59,130,246,0.2)" : "transparent",
                      color: isActive ? "#60a5fa" : theme.textMuted,
                      transition: "all 0.1s",
                    }}
                  >
                    {c.flag} {code === "ALL" ? "ALL" : code}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ marginBottom: 10 }}>
            <SearchInput value={search} onChange={setSearch} />
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: theme.textDim, letterSpacing: "0.12em", marginBottom: 6 }}>
            FILTER BY RISK LEVEL
          </div>
          <FilterBar filter={filter} setFilter={setFilter} />
          <div style={{ marginTop: 10 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: theme.textDim, letterSpacing: "0.12em", marginBottom: 6 }}>
              GROUP BY
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {groupOptions.map(g => (
                <button key={g.value} onClick={() => setGroupBy(g.value)} style={btnStyle(groupBy === g.value)}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {groupBy === "none" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: theme.textDim, letterSpacing: "0.12em", marginBottom: 10 }}>
              ACTIVE EVENTS ({events.length})
            </div>
            {events.length === 0 && (
              <div style={{ fontSize: 12, color: theme.textFaint, fontStyle: "italic", padding: "20px 0" }}>
                No events match your filters.
              </div>
            )}
            {events.map(ev => (
              <EventCard key={ev.id} event={ev} selected={selected?.id === ev.id} onClick={() => { onSelect(ev); onClose(); }} />
            ))}
          </div>
        ) : (
          <EventGroup events={events} selected={selected} onSelect={(ev) => { onSelect(ev); onClose(); }} groupBy={groupBy} />
        )}
      </div>
    </>
  );
}
