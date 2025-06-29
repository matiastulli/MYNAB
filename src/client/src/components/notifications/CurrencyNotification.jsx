import { CircleDollarSignIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

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
    <div className="fixed top-6 inset-x-4 sm:inset-x-auto sm:right-6 sm:left-auto z-50 sm:max-w-md mx-auto sm:mx-0 transform transition-all duration-300 ease-in-out flex justify-center sm:justify-end">
      <div className="bg-card rounded-lg shadow-lg border border-accent/30 p-4 flex items-start gap-3 w-full sm:w-auto max-w-md">
        <div className="p-2 rounded-full bg-accent/20">
          <CircleDollarSignIcon className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-foreground">
            Currency Changed to {currency}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            You're now viewing {currency} transactions.
          </p>
        </div>
        <button 
          onClick={() => {
            setShow(false);
            if (onClose) onClose();
          }}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close notification"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
