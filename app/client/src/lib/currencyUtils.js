/**
 * Currency utility functions and constants
 */

// Currency symbols mapping
export const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  BRL: "R$",
  ARS: "$",
  AUD: "A$",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  MXN: "$",
  CAD: "$"
};

// Currency names mapping
export const CURRENCY_NAMES = {
  USD: "US Dollar",
  EUR: "Euro", 
  GBP: "British Pound",
  BRL: "Brazilian Real",
  ARS: "Argentine Peso",
  AUD: "Australian Dollar",
  JPY: "Japanese Yen",
  CNY: "Chinese Yuan",
  INR: "Indian Rupee",
  MXN: "Mexican Peso",
  CAD: "Canadian Dollar"
};

/**
 * Get currency symbol for a given currency code
 * @param {string} currencyCode - The currency code (e.g., 'USD', 'EUR')
 * @returns {string} The currency symbol (e.g., '$', '€')
 */
export const getCurrencySymbol = (currencyCode) => {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
};

/**
 * Get currency name for a given currency code
 * @param {string} currencyCode - The currency code (e.g., 'USD', 'EUR')
 * @returns {string} The currency name (e.g., 'US Dollar', 'Euro')
 */
export const getCurrencyName = (currencyCode) => {
  return CURRENCY_NAMES[currencyCode] || currencyCode;
};

/**
 * Get all supported currencies
 * @returns {Array} Array of currency objects with code, name, and symbol
 */
export const getSupportedCurrencies = () => {
  return Object.keys(CURRENCY_SYMBOLS).map(code => ({
    code,
    name: CURRENCY_NAMES[code],
    symbol: CURRENCY_SYMBOLS[code]
  }));
};
