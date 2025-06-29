import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon, CircleDollarSignIcon } from "lucide-react";
import { useState } from "react";

export default function CurrencyFilter({ selectedCurrency, onCurrencyChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currencies = [
    { code: "ARS", name: "Argentine Peso", symbol: "$" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  ];
  
  const selectedCurrencyInfo = currencies.find(c => c.code === selectedCurrency) || currencies[0];
  
  const handleSelect = (currency) => {
    onCurrencyChange(currency);
    setIsOpen(false);
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 bg-white/70 dark:bg-[#1e232a]/70 hover:bg-white dark:hover:bg-[#252b36] gap-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
        >
          <CircleDollarSignIcon className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 mr-1" />
          <span className="font-medium">{selectedCurrencyInfo.code}</span>
          <span className="hidden sm:inline text-neutral-400 dark:text-neutral-500">currency</span>
          <ChevronDownIcon className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1 border-0 bg-white dark:bg-[#1e232a] shadow-lg">
        <div className="space-y-0.5">
          {currencies.map((currency) => (
            <button
              key={currency.code}
              onClick={() => handleSelect(currency.code)}
              className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                currency.code === selectedCurrency
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                  : "hover:bg-neutral-100 dark:hover:bg-[#252a34] text-neutral-700 dark:text-neutral-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currency.code}</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {currency.name}
                  </span>
                </div>
                <span>{currency.symbol}</span>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
