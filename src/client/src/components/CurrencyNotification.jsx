import { useEffect, useState } from "react";
import { CircleDollarSignIcon, XIcon } from "lucide-react";

export default function CurrencyNotification({ 
  currency, 
  isVisible = false,
  onClose 
}) {
  const [show, setShow] = useState(false);
  
  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      setShow(true);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShow(false);
        if (onClose) onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isVisible, onClose]);
  
  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full transform transition-all duration-300 ease-in-out">
      <div className="bg-white dark:bg-[#1e232a] rounded-lg shadow-lg border border-emerald-100 dark:border-emerald-800/30 p-4 flex items-start gap-3">
        <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30">
          <CircleDollarSignIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
            Currency Changed to {currency}
          </h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
            You're now viewing {currency} transactions. Some transactions may not appear if they're in a different currency.
          </p>
        </div>
        <button 
          onClick={() => {
            setShow(false);
            if (onClose) onClose();
          }}
          className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
          aria-label="Close notification"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
