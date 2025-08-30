import AdminLogsTable from "../components/AdminLogsTable.jsx";

export default function Index() {
  const sample = [
    { id: "1", customer: "Annie Case", address: "123 Main St, Atlanta, GA 30303", status: "OK", reason: "deliverable" },
    { id: "2", customer: "John Smith", address: "45 Oak Ave, Apt B", status: "BLOCK_MISSING_UNIT", reason: "unit required" }
  ];

  return (
    <div style={{padding: 16}}>
      <h2>Admin Logs (sample)</h2>
      <AdminLogsTable logs={sample} />
    </div>
  );
}

