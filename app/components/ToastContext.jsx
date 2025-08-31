import React from "react";
import { Toast } from "@shopify/polaris";

export const ToastContext = React.createContext({ show: () => {} });

export function ToastProvider({ children }) {
  const [toast, setToast] = React.useState(null); // { content, tone }
  const show = React.useCallback((content, { tone = "success", duration = 3000 } = {}) => {
    setToast({ content, tone, duration });
  }, []);
  const handleDismiss = React.useCallback(() => setToast(null), []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 1000 }}>
          <Toast content={toast.content} onDismiss={handleDismiss} duration={toast.duration} />
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

