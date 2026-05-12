import AnalysisV10 from "./dashboard";
import useSheetData from "./useSheetData";

export default function App() {
  const sheet = useSheetData();

  if (!sheet.isConnected) {
    return <AnalysisV10 />;
  }

  if (sheet.stage === "l1" || (sheet.stage === "idle" && !sheet.articles)) {
    return (
      <div style={loadStyles.wrap}>
        <div style={loadStyles.spinner} />
        <p style={loadStyles.text}>Loading...</p>
      </div>
    );
  }

  if (sheet.stage === "error") {
    return (
      <div style={loadStyles.wrap}>
        <p style={loadStyles.errText}>Failed to load data</p>
        <p style={loadStyles.errDetail}>{sheet.error}</p>
        <button onClick={sheet.retry} style={loadStyles.retryBtn}>Retry</button>
      </div>
    );
  }

  return <AnalysisV10 />;
}

const loadStyles = {
  wrap: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: "100vh", gap: 16,
    fontFamily: "Noto Sans JP, system-ui, sans-serif",
  },
  spinner: {
    width: 32, height: 32, border: "3px solid #e2e8f0",
    borderTopColor: "#3b82f6", borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  text: { fontSize: 14, color: "#64748b" },
  errText: { fontSize: 15, color: "#dc2626", fontWeight: 600 },
  errDetail: { fontSize: 13, color: "#94a3b8", maxWidth: 400, textAlign: "center" },
  retryBtn: {
    padding: "8px 20px", borderRadius: 8, border: "1px solid #d1d5db",
    background: "#fff", cursor: "pointer", fontSize: 13, color: "#374151",
  },
};
