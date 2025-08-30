export default function AdminLogsTable({ logs = [] }) {
  if (!Array.isArray(logs) || logs.length === 0) {
    return <div style={{padding: 8}}>No logs yet.</div>;
  }
  return (
    <div style={{overflowX: "auto", padding: 8}}>
      <table style={{borderCollapse: "collapse", width: "100%"}}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Customer</th>
            <th style={th}>Address</th>
            <th style={th}>Status</th>
            <th style={th}>Reason</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((row) => (
            <tr key={row.id}>
              <td style={td}>{row.id}</td>
              <td style={td}>{row.customer || "-"}</td>
              <td style={td}>{row.address || "-"}</td>
              <td style={td}>{row.status || "-"}</td>
              <td style={td}>{row.reason || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = { textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" };
const td = { borderBottom: "1px solid #eee", padding: "8px", verticalAlign: "top" };

