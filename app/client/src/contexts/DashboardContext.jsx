import { createContext, useContext } from "react";

const DashboardContext = createContext(null);

export function DashboardProvider({ currency, dateRange, handleCurrencyChange, handleDateRangeChange, children }) {
  return (
    <DashboardContext.Provider value={{ currency, dateRange, handleCurrencyChange, handleDateRangeChange }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return ctx;
}
