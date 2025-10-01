import { Card, Select, InlineStack, Box } from "@shopify/polaris";
import React from "react";

export default function FilterBar({ range, setRange, segment, setSegment }) {
  return (
    <Card>
      <Box padding="300">
        <InlineStack gap="400" wrap={false}>
          <Select
            label="Range"
            options={[
              {label:"7 days",value:"7d"},
              {label:"14 days",value:"14d"},
              {label:"30 days",value:"30d"}
            ]}
            value={range}
            onChange={setRange}
          />
          <Select
            label="Segment"
            options={[
              {label:"All",value:"all"},
              {label:"Checkout",value:"checkout"},
              {label:"Thank-you",value:"thank_you"},
              {label:"Customer",value:"customer_account"}
            ]}
            value={segment}
            onChange={setSegment}
          />
        </InlineStack>
      </Box>
    </Card>
  );
}
