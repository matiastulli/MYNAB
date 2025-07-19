import { CircleDollarSignIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function CurrencyNotification({ 
  currency, 
  isVisible = false,
  onClose 
}) {
  const [show, setShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
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
        className="rounded-lg shadow-xl border p-4 flex items-start gap-3 w-full sm:w-auto max-w-md"
        style={{
          backgroundColor: 'hsl(var(--card))',
          borderColor: 'hsl(var(--border))',
          color: 'hsl(var(--card-foreground))'
        }}
      >
        <div 
          className="p-2 rounded-full"
          style={{
            backgroundColor: 'hsl(var(--info-bg))',
            color: 'hsl(var(--info-fg))'
          }}
        >
          <CircleDollarSignIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h4 
            className="font-medium"
            style={{ color: 'hsl(var(--card-foreground))' }}
          >
            Currency Changed to {currency}
          </h4>
          <p 
            className="text-sm mt-1"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            You're now viewing {currency} transactions.
            {currency === "ARS" && " (Argentine Peso)"}
            {currency === "USD" && " (US Dollar)"}
            {currency === "EUR" && " (Euro)"}
            {currency === "BRL" && " (Brazilian Real)"}
          </p>
        </div>
        <button 
          onClick={handleClose}
          className="p-1 rounded-full focus:outline-none focus:ring-2 transition-colors"
          style={{
            color: 'hsl(var(--muted-foreground))',
            focusRingColor: 'hsl(var(--ring))'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = 'hsl(var(--foreground))';
            e.target.style.backgroundColor = 'hsl(var(--muted))';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = 'hsl(var(--muted-foreground))';
            e.target.style.backgroundColor = 'transparent';
          }}
          aria-label="Close notification"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}