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
      const token = await api.sessionToken.get();
      const addr = extractAddressFromApi(api) || {};
      const res = await fetch("/api/validate-address", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          context: { source: "thank_you", shopDomain: api.shopOrigin || "unknown" },
          address: addr,
        }),
      });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("[thank-you] fetch error", e);
    }
  })();
}, []);

function extractAddressFromApi(api) {
  try {
    const s = api?.order?.shippingAddress || api?.purchase?.shippingAddress || api?.initialPurchase?.shippingAddress || null;
    if (!s) return null;
    return {
      address1: s.address1 || s.addressLine1 || "",
      address2: s.address2 || s.addressLine2 || "",
      city: s.city || s.locality || "",
      province: s.provinceCode || s.region || s.administrativeArea || "",
      zip: s.postalCode || s.zip || "",
      country: s.countryCode || s.country || "US",
    };
  } catch {
    return null;
  }
}

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
