import {
reactExtension,
Banner,
BlockStack,
Text,
useApi,
} from "@shopify/ui-extensions-react/customer-account";
import { useEffect, useState } from "react";

function CustomerAddressHygiene() {
const api = useApi();
const [data, setData] = useState(null);

useEffect(() => {
  (async () => {
    try {
      const token = await api.sessionToken.get();
      const addr = extractCustomerAddressFromApi(api) || {};
      const res = await fetch("/api/validate-address", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          context: { source: "customer_account", shopDomain: api.shopOrigin || "unknown" },
          address: addr,
        }),
      });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("[customer-address] fetch error", e);
    }
  })();
}, []);

function extractCustomerAddressFromApi(api) {
  try {
    const s = api?.customer?.defaultAddress || api?.buyerIdentity?.customer?.defaultAddress || null;
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
<Banner status={level} title="Address hygiene">
<Text>{data.message || "Address suggestions may be available."}</Text>
</Banner>
</BlockStack>
);
}

export default reactExtension("customer-account.profile.addresses.render-after", () => <CustomerAddressHygiene />);
