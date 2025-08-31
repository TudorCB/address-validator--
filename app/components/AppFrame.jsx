import { Frame, TopBar, Navigation } from "@shopify/polaris";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "@remix-run/react";
import { t, getLocale, setLocale, initI18n, availableLocales } from "../lib/i18n.js";

export default function AppFrame({ children }) {
  const [searchActive, setSearchActive] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [locale, setLocaleState] = useState("en");
  const location = useLocation();
  const navigate = useNavigate();

  // initialize locale from storage on mount and listen for changes
  useEffect(() => {
    try {
      const lc = initI18n();
      setLocaleState(lc || getLocale());
    } catch {}
    const onLocale = (e) => setLocaleState(e?.detail?.locale || getLocale());
    if (typeof window !== "undefined") window.addEventListener("i18n:locale", onLocale);
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("i18n:locale", onLocale);
    };
  }, []);

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
      <div style={{ padding: 12 }}>
        <label htmlFor="locale-select" style={{ display: "block", fontSize: 12, color: "#616161", marginBottom: 4 }}>Language</label>
        <select
          id="locale-select"
          value={locale}
          aria-label="Language"
          onChange={(e) => {
            const next = e.target.value;
            setLocale(next);
            setLocaleState(next);
          }}
          style={{ width: "100%", padding: 6 }}
        >
          {availableLocales.map((lc) => (
            <option key={lc} value={lc}>{lc === "en" ? "English" : lc}</option>
          ))}
        </select>
      </div>
    </Navigation>
  );

  return (
    <Frame topBar={topBarMarkup} navigation={navigationMarkup}>
      <div style={{ padding: 16 }}>{children}</div>
    </Frame>
  );
}
