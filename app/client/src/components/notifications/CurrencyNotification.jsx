import { CircleDollarSignIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function CurrencyNotification({ 
  currency, 
  isVisible = false,
  onClose 
}) {
  const [show, setShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Handle visibility changes with animation
  useEffect(() => {
    if (isVisible) {
      setShow(true);
      setIsExiting(false);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible]);
  
  const handleClose = () => {
    setIsExiting(true);
    
    // Wait for exit animation to complete before fully removing
    setTimeout(() => {
      setShow(false);
      if (onClose) onClose();
    }, 300);
  };
  
  if (!show) return null;

  return (
    <div 
      className={`fixed top-6 inset-x-4 sm:inset-x-auto sm:right-6 sm:left-auto z-50 sm:max-w-md mx-auto sm:mx-0 transform transition-all duration-300 ease-in-out flex justify-center sm:justify-end ${
        isExiting 
          ? 'translate-y-[-20px] opacity-0'
          : 'translate-y-0 opacity-100'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div 
        className="bg-card dialog-content-solid rounded-lg shadow-lg border-2 border-border p-4 flex items-start gap-3 w-full sm:w-auto max-w-md"
      >
        <div className="p-2 rounded-full bg-accent/20 text-accent">
          <CircleDollarSignIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-foreground">
            Currency Changed to {currency}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            You're now viewing {currency} transactions.
            {currency === "ARS" && " (Argentine Peso)"}
            {currency === "USD" && " (US Dollar)"}
            {currency === "EUR" && " (Euro)"}
            {currency === "BRL" && " (Brazilian Real)"}
          </p>
        </div>
        <button 
          onClick={handleClose}
          className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/30"
          aria-label="Close notification"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}