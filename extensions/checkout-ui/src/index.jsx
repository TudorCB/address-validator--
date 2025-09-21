import {
  reactExtension,
  Banner,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Divider,
  Spinner,
  useApi,
  useBuyerJourneyIntercept,
  useShippingAddress,
  useApplyShippingAddressChange,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useMemo, useRef, useState } from "react";

function useDebounced(value, delay = 700) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function isBlockingAction(action) {
  return action && String(action).startsWith("BLOCK_");
}

function View({ state, onAcceptSuggestion }) {
  if (state.loading) {
    return (
      <InlineStack alignment="center" blockAlignment="center">
        <Spinner /> <Text>Validating address…</Text>
      </InlineStack>
    );
  }

  if (!state.response) return null;

  const { action, message, correctedAddress } = state.response;

  const level =
    action === "OK" ? "success"
    : action === "CORRECTED" || action === "SUGGEST_PICKUP" || action === "NEED_CONFIRM_ROOFTOP" ? "warning"
    : isBlockingAction(action) ? "critical"
    : "info";

  return (
    <BlockStack spacing="tight">
      <Banner status={level} title={action || "Address check"}>
        <Text>{message || "Address check result"}</Text>
        {correctedAddress ? (
          <BlockStack spacing="tight">
            <Divider />
            <Text emphasis="bold">Suggested:</Text>
            <Text>
              {correctedAddress.address1}
              {correctedAddress.address2 ? `, ${correctedAddress.address2}` : ""}, {correctedAddress.city} {correctedAddress.zip}
            </Text>
            <InlineStack spacing="tight">
              <Button onPress={onAcceptSuggestion}>Use suggested address</Button>
            </InlineStack>
          </BlockStack>
        ) : null}
      </Banner>
      {state.writebackError ? (
        <Banner status="warning" title="Manual update required">
          <Text>{state.writebackError}</Text>
        </Banner>
      ) : null}
    </BlockStack>
  );
}

function CheckoutAddressValidator() {
  const api = useApi();
  const shipping = useShippingAddress();
  const applyShippingAddressChange = useApplyShippingAddressChange();

  const [settings, setSettings] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [writebackError, setWritebackError] = useState(null);
  const mounted = useRef(true);

  const addr = useMemo(() => ({
    address1: shipping?.address1 || "",
    address2: shipping?.address2 || "",
    city: shipping?.city || "",
    province: shipping?.provinceCode || shipping?.province || "",
    zip: shipping?.zip || "",
    country: shipping?.countryCode || shipping?.country || "US",
  }), [
    shipping?.address1, shipping?.address2, shipping?.city,
    shipping?.province, shipping?.provinceCode, shipping?.zip,
    shipping?.country, shipping?.countryCode
  ]);

  const debounced = useDebounced(addr, 700);

  // Fetch settings once
  useEffect(() => {
    (async () => {
      try {
        const token = await api.sessionToken.get();
        const res = await fetch("/api/settings", { headers: { authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (!mounted.current) return;
        setSettings(json?.settings || {});
      } catch (e) {
        console.error("[checkout-ui] settings fetch failed", e);
      }
    })();
    return () => { mounted.current = false; };
  }, []);

  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    if (!response) return;
    const serverThinksBlock = isBlockingAction(response.action);
    const soft = !!settings?.softMode;
    const shouldBlock = serverThinksBlock && !soft;
    if (shouldBlock && canBlockProgress) {
      return {
        behavior: "block",
        reason: response.message || "Address issue",
        perform: () => {},
      };
    }
    return;
  });

  async function validateNow() {
    try {
      setLoading(true);
      // Clear prior writeback error before a new validation cycle
      setWritebackError(null);
      const token = await api.sessionToken.get();
      const res = await fetch("/api/validate-address", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          context: { source: "checkout", shopDomain: api.shopOrigin || "unknown" },
          address: debounced,
          options: { allowPickupFallback: true },
        }),
      });
      const json = await res.json();
      if (!mounted.current) return;
      setResponse(json);

      // Auto-apply correction (server-authoritative) if enabled
      const autoApply = (json?.settings?.autoApplyCorrections ?? settings?.autoApplyCorrections) === true;
      if (autoApply && json?.action === "CORRECTED" && json?.correctedAddress) {
        try {
          if (!applyShippingAddressChange) throw new Error("applyShippingAddressChange unavailable");
          await applyShippingAddressChange({
            type: "updateShippingAddress",
            address: {
              address1: json.correctedAddress.address1 || undefined,
              address2: json.correctedAddress.address2 || undefined,
              city: json.correctedAddress.city || undefined,
              provinceCode: json.correctedAddress.province || json.correctedAddress.provinceCode || undefined,
              postalCode: json.correctedAddress.zip || undefined,
              countryCode: json.correctedAddress.country || undefined,
            },
          });
        } catch (e) {
          console.warn("[checkout-ui] auto-apply failed", e);
          setWritebackError(
            "We couldn’t apply the suggestion automatically in this checkout (e.g., wallet or restricted fields). Please update the address fields manually."
          );
        }
      }
    } catch (e) {
      console.error("[checkout-ui] validate error", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    validateNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced.address1, debounced.city, debounced.zip, debounced.country]);

  // Clear writeback error when user edits address fields
  useEffect(() => {
    setWritebackError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debounced.address1,
    debounced.address2,
    debounced.city,
    debounced.province,
    debounced.zip,
    debounced.country,
  ]);

  async function acceptSuggestion() {
    try {
      const corrected = response?.correctedAddress;
      if (!corrected) return;
      if (!applyShippingAddressChange) throw new Error("applyShippingAddressChange unavailable");
      await applyShippingAddressChange({
        type: "updateShippingAddress",
        address: {
          address1: corrected.address1 || undefined,
          address2: corrected.address2 || undefined,
          city: corrected.city || undefined,
          provinceCode: corrected.province || corrected.provinceCode || undefined,
          postalCode: corrected.zip || undefined,
          countryCode: corrected.country || undefined,
        },
      });
      // Clear error if a manual accept succeeded
      setWritebackError(null);
      await validateNow();
    } catch (e) {
      console.error("[checkout-ui] applyShippingAddressChange failed", e);
      setWritebackError(
        "We couldn’t apply the suggestion automatically in this checkout (e.g., wallet or restricted fields). Please update the address fields manually."
      );
    }
  }

  return <View state={{ response, loading, writebackError }} onAcceptSuggestion={acceptSuggestion} />;
}

export default reactExtension(
  "purchase.checkout.delivery-address.render-after",
  () => <CheckoutAddressValidator />
);
