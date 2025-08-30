import {
reactExtension,
Banner,
BlockStack,
Text,
useApi,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useState } from "react";

function ThankYouSummary() {
const api = useApi();
const [data, setData] = useState(null);

useEffect(() => {
(async () => {
try {
// Optional: call backend with session token to fetch order/checkout-specific validation
const token = await api.sessionToken.get();
const res = await fetch("/api/validate-address", {
method: "POST",
headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
body: JSON.stringify({
context: { source: "thank_you", shopDomain: api.shopOrigin || "unknown" },
// minimal body; backend could lookup by checkout/order token if needed
address: {},
}),
});
const json = await res.json();
setData(json);
} catch (e) {
console.error("[thank-you] fetch error", e);
}
})();
}, []);

if (!data) return null;

const level =
data.action === "OK" ? "success"
: data.action && String(data.action).startsWith("BLOCK_") ? "critical"
: "warning";

return (
<BlockStack spacing="tight">
<Banner status={level} title="Shipping address status">
<Text>{data.message || "Validation summary."}</Text>
</Banner>
</BlockStack>
);
}

export default reactExtension("purchase.thank-you.block.render", () => <ThankYouSummary />);
