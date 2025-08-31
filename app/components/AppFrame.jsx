import { Frame, TopBar, Navigation } from "@shopify/polaris";
import { useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "@remix-run/react";
import { t } from "../lib/i18n.js";

export default function AppFrame({ children }) {
  const [searchActive, setSearchActive] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSearchActive = useCallback(() => setSearchActive((v) => !v), []);
  const handleSearchChange = useCallback((v) => setSearchValue(v), []);
  const handleSearchResultsDismiss = useCallback(() => {
    setSearchActive(false);
    setSearchValue("");
  }, []);

  const topBarMarkup = (
    <TopBar
      showNavigationToggle={false}
      searchField={
        <TopBar.SearchField
          onChange={handleSearchChange}
          value={searchValue}
          placeholder={t("search.placeholder")}
        />
      }
      searchResultsVisible={searchActive}
      onSearchResultsDismiss={handleSearchResultsDismiss}
      onNavigationToggle={() => {}}
    />
  );

  const navItems = useMemo(() => ([
    {
      label: t("nav.dashboard"),
      destination: "/index",
      selected: location.pathname === "/" || location.pathname.startsWith("/index")
    },
    {
      label: t("nav.settings"),
      destination: "/settings",
      selected: location.pathname.startsWith("/settings")
    },
    {
      label: t("nav.pickups"),
      destination: "/pickups",
      selected: location.pathname.startsWith("/pickups")
    },
    {
      label: t("nav.analytics"),
      destination: "/analytics",
      selected: location.pathname.startsWith("/analytics")
    }
  ]), [location.pathname]);

  const navigationMarkup = (
    <Navigation location={location.pathname}>
      {navItems.map((item) => (
        <Navigation.Item
          key={item.destination}
          label={item.label}
          selected={item.selected}
          onClick={() => navigate(item.destination)}
        />
      ))}
    </Navigation>
  );

  return (
    <Frame topBar={topBarMarkup} navigation={navigationMarkup}>
      <div style={{ padding: 16 }}>{children}</div>
    </Frame>
  );
}
