import { Banner } from "@shopify/polaris";
import { DOCS_URL, PAID_APP_URL } from "../lib/constants";

export default function UpsellBanner({ title, children, action }) {
  return (
    <Banner
      title={title || "Upgrade for More Features"}
      action={action || { content: "Upgrade", url: PAID_APP_URL, target: "_blank" }}
      tone="info"
    >
      {children || <p>Unlock more features by upgrading to our paid plan.</p>}
    </Banner>
  );
}
