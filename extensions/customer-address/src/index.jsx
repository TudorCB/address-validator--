import {
reactExtension,
Banner,
BlockStack,
Text,
useApi,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useState } from "react";

function CustomerAddressHygiene() {
const api = useApi();
const [data, setData] = useState(null);

useEffect(() => {
(async () => {
try {
const token = await api.sessionToken.get();
const res = await fetch("/api/validate-address", {
method: "POST",
headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
body: JSON.stringify({
context: { source: "customer_account", shopDomain: api.shopOrigin || "unknown" },
address: {}, // Extension could collect current profile address fields and pass them here
}),
});
const json = await res.json();
setData(json);
} catch (e) {
console.error("[customer-address] fetch error", e);
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
<Banner status={level} title="Address hygiene">
<Text>{data.message || "Address suggestions may be available."}</Text>
</Banner>
</BlockStack>
);
}

export default reactExtension("customer-account.profile.addresses.render-after", () => <CustomerAddressHygiene />);
