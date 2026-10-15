// Banks the service can parse (bank_name sent to /budget/import-file), with the
// file each one exports and the currencies it is used for.
export const BANK_FORMATS = {
  santander_rio: { format: ".xlsx", supportedCurrencies: ["ARS", "USD"], description: "Excel export from online banking" },
  ICBC: { format: ".csv", supportedCurrencies: ["ARS", "USD"], description: "CSV export from the ICBC portal" },
  mercado_pago: { format: ".pdf", supportedCurrencies: ["ARS"], description: "PDF account statement" },
  bbva: { format: ".xls", supportedCurrencies: ["ARS"], description: "Excel export from BBVA" },
  comm_bank: { format: ".csv", supportedCurrencies: ["AUD"], description: "CSV export from NetBank" },
  revolut: { format: ".csv", supportedCurrencies: ["AUD", "USD", "GBP"], description: "CSV statement from the app" },
};

export const BANK_LABELS = {
  santander_rio: "Santander Rio",
  ICBC: "ICBC",
  mercado_pago: "Mercado Pago",
  bbva: "BBVA",
  comm_bank: "CommBank",
  revolut: "Revolut",
};

export const bankMonogram = (label) => {
  const words = label.split(" ");
  return words.length > 1 ? words.map((w) => w[0]).join("").slice(0, 2) : label.slice(0, 2);
};

export const banksForCurrency = (currency) =>
  Object.keys(BANK_FORMATS).filter((key) => BANK_FORMATS[key].supportedCurrencies.includes(currency));
