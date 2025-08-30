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
    </BlockStack>
  );
}

function CheckoutAddressValidator() {
  const api = useApi();
  const shipping = useShippingAddress();
  const applyShippingAddressChange = useApplyShippingAddressChange();

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
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

  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    if (!response) return;
    const shouldBlock = isBlockingAction(response.action);
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
      const token = await api.sessionToken.get();
      const res = await fetch("/api/validate-address", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          context: { source: "checkout", shopDomain: api.shopOrigin || "unknown" },
          address: debounced,
          options: { allowPickupFallback: true },
        }),
      });
      const json = await res.json();
      if (!mounted.current) return;
      setResponse(json);
    } catch (e) {
      console.error("[checkout-ui] validate error", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    validateNow();
    return () => { mounted.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced.address1, debounced.city, debounced.zip, debounced.country]);

  async function acceptSuggestion() {
    try {
      const corrected = response?.correctedAddress;
      if (!corrected || !applyShippingAddressChange) return;

      // Attempt to write the corrected fields into Shopify’s shipping form.
      // NOTE: This overwrites current values; provide only fields you want changed.
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

      // Re-validate after writeback to refresh UI
      await validateNow();
    } catch (e) {
      // Wallet flows and permission issues can throw.
      console.error("[checkout-ui] applyShippingAddressChange failed", e);
    }
  }

  return <View state={{ response, loading }} onAcceptSuggestion={acceptSuggestion} />;
}

export default reactExtension(
  "purchase.checkout.delivery-address.render",
  () => <CheckoutAddressValidator />
);

