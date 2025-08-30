import { useEffect, useMemo, useRef, useState } from "react";
import { Placeholder } from "./ui.jsx";
import { getSessionTokenStub } from "./token.js";

function useDebouncedValue(value, delay = 700) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function CheckoutExtensionStub() {
  const [address, setAddress] = useState({
    address1: "",
    address2: "",
    city: "",
    province: "",
    zip: "",
    country: "US",
  });
  const [response, setResponse] = useState(null);
  const debouncedAddress = useDebouncedValue(address, 700);
  const mounted = useRef(true);

  async function callValidate() {
    try {
      const token = await getSessionTokenStub();
      const res = await fetch("/api/validate-address", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          context: { source: "checkout", shopDomain: "dev-shop.myshopify.com" },
          address: debouncedAddress,
          options: { allowPickupFallback: true },
        }),
      });
      const json = await res.json();
      if (!mounted.current) return;
      setResponse(json);
    } catch (e) {
      console.error("validate call failed", e);
    }
  }

  useEffect(() => {
    callValidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAddress.address1, debouncedAddress.city, debouncedAddress.zip, debouncedAddress.country]);

  return (
    <div style={{ padding: 12, border: "1px dashed #bbb", borderRadius: 6 }}>
      <h4>Address Validator++ (demo)</h4>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
        <input placeholder="Address 1" value={address.address1} onChange={(e) => setAddress(a => ({ ...a, address1: e.target.value }))} />
        <input placeholder="Address 2" value={address.address2} onChange={(e) => setAddress(a => ({ ...a, address2: e.target.value }))} />
        <input placeholder="City" value={address.city} onChange={(e) => setAddress(a => ({ ...a, city: e.target.value }))} />
        <input placeholder="Province/State" value={address.province} onChange={(e) => setAddress(a => ({ ...a, province: e.target.value }))} />
        <input placeholder="ZIP/Postal" value={address.zip} onChange={(e) => setAddress(a => ({ ...a, zip: e.target.value }))} />
        <input placeholder="Country (US)" value={address.country} onChange={(e) => setAddress(a => ({ ...a, country: e.target.value }))} />
      </div>

      <div style={{ marginTop: 12 }}>
        <Placeholder response={response} />
      </div>
    </div>
  );
}
