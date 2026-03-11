import EventHeader from "./EventHeader";
import IntelGrid from "./IntelGrid";
import InfraExposure from "./InfraExposure";
import AIBriefPanel from "./AIBriefPanel";
import ExportReport from "../Export/ExportReport";

export default function DetailPanel({ event }) {
  if (!event) return null;
  return (
    <div className="detail-panel" style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <EventHeader event={event} />
        </div>
        <ExportReport event={event} />
      </div>
      <IntelGrid event={event} />
      <InfraExposure infra={event.nearby_infra} />
      <AIBriefPanel event={event} />
    </div>
  );
}
