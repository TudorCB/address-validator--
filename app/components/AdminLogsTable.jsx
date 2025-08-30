export default function AdminLogsTable({ logs = [] }) {
  if (!Array.isArray(logs) || logs.length === 0) {
    return <div style={{padding: 8}}>No logs yet.</div>;
  }
  const th = { textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" };
  const td = { borderBottom: "1px solid #eee", padding: "8px", verticalAlign: "top" };
  return (
    <div style={{overflowX: "auto"}}>
      <table style={{borderCollapse: "collapse", width: "100%"}}>
        <thead>
          <tr>
            <th style={th}>Time</th>
            <th style={th}>Route</th>
            <th style={th}>Action</th>
            <th style={th}>Message</th>
            <th style={th}>Shop</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((row) => (
            <tr key={row.id}>
              <td style={td}>{new Date(row.ts).toLocaleString()}</td>
              <td style={td}>{row.route}</td>
              <td style={td}>{row.action || row.status}</td>
              <td style={td}>{row.message || row.reason || "-"}</td>
              <td style={td}>{row.shopDomain || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
