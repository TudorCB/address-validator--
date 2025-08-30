// Minimal placeholder UI for the checkout extension demo
// Not using @shopify/checkout-ui-extensions-react in this step.

export function Placeholder({ response }) {
  return (
    <div style={{
      border: "1px solid #e5e5e5",
      borderRadius: 6,
      padding: 10,
      background: "#fafafa",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span role="img" aria-label="Shopify bag">🛍️</span>
        <strong>Shopify Address Validation</strong>
      </div>
      <div style={{ fontSize: 12, color: "#333" }}>
        {response == null ? (
          <em>Waiting for validation response…</em>
        ) : (
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

