import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isDarkModeActive, toggleTheme } from "@/lib/themeUtils";
import { api } from "@/services/api";
import { AlertTriangleIcon, CheckCircleIcon, IdCardIcon, LogOutIcon, MoonIcon, SunIcon, UserIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProfileDialog({
  open,
  onOpenChange,
  userData,
  onProfileUpdated,
  onLogout
}) {
  const [profileForm, setProfileForm] = useState({
    name: userData?.name || "",
    last_name: userData?.last_name || "",
    national_id: userData?.national_id || ""
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Update form data when userData changes
  useEffect(() => {
    if (userData) {
      setProfileForm({
        name: userData.name || "",
        last_name: userData.last_name || "",
        national_id: userData.national_id || ""
      });
    }
  }, [userData]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const response = await api.put("/auth/profile", profileForm);
      if (!response.error) {
        setUpdateSuccess(true);
        if (onProfileUpdated) {
          onProfileUpdated();
        }
        setTimeout(() => {
          onOpenChange(false);
          setUpdateSuccess(false);
        }, 1500);
      } else {
        console.error("Failed to update profile:", response.error);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    onOpenChange(false);
    setTimeout(() => {
      onLogout();
    }, 300); // Small delay to allow the dialog to close smoothly
  };

  // Simple theme state - just track current state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Update theme state when dialog opens or theme changes
  useEffect(() => {
    const updateThemeState = () => setIsDarkMode(isDarkModeActive());
    
    updateThemeState(); // Initial check
    
    const handleThemeChange = () => updateThemeState();
    window.addEventListener('themechange', handleThemeChange);
    
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

  const handleToggleTheme = () => {
    toggleTheme();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-card-foreground border-2 border-border shadow-xl max-w-md">
        <DialogHeader className="pb-2">
          <DialogTitle className="sr-only">Profile Settings</DialogTitle>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-accent/10 border border-accent/20">
              <UserIcon className="h-5 w-5 text-accent" />
              </span>
             <span className="text-lg font-bold tracking-wider text-foreground">MYNAB</span>
            </div>
          </div>
          <DialogDescription className="text-muted-foreground">
            {(!userData?.national_id || userData?.national_id === "") ? (
              <div className="flex items-start gap-3 mt-3 p-4 bg-[hsl(var(--warning-bg))] border-2 border-[hsl(var(--warning-fg)/0.2)] rounded-lg">
                <AlertTriangleIcon className="h-5 w-5 text-[hsl(var(--warning-fg))] mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-[hsl(var(--warning-fg))]">CUIT Required</p>
                  <p className="text-sm text-[hsl(var(--warning-fg)/0.85)]">
                    Adding your CUIT helps filter out personal transactions that shouldn't be counted in your budget.
                  </p>
                </div>
              </div>
            ) : (
              "Update your personal information and preferences below."
            )}
          </DialogDescription>
        </DialogHeader>

        {updateSuccess ? (
          <div className="flex flex-col items-center py-12 gap-4">
            <div className="p-4 bg-green-100 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-full">
              <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">Profile Updated!</p>
              <p className="text-sm text-muted-foreground">Your changes have been saved successfully.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProfileUpdate} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                First Name
              </Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="h-12 border-2 border-border bg-background focus:border-accent transition-all duration-200"
                placeholder="Enter your first name"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="last_name" className="text-sm font-semibold text-foreground">
                Last Name
              </Label>
              <Input
                id="last_name"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                className="h-12 border-2 border-border bg-background focus:border-accent transition-all duration-200"
                placeholder="Enter your last name"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="national_id" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <IdCardIcon className="h-4 w-4" />
                CUIT
                {(!userData?.national_id || userData?.national_id === "") && (
                  <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
                )}
              </Label>
              <Input
                id="national_id"
                type="text"
                value={profileForm.national_id}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                  setProfileForm({ ...profileForm, national_id: numericValue });
                }}
                className="h-12 border-2 border-border bg-background focus:border-accent transition-all duration-200"
                placeholder="e.g. 20415436042"
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <p className="text-xs text-muted-foreground">
                Used to automatically filter out personal transactions from your budget analysis.
              </p>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="w-full sm:w-auto h-10 transition-all duration-200"
                style={{
                  backgroundColor: "hsl(var(--accent))",
                  color: "hsl(var(--accent-foreground))"
                }}
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Theme toggle section */}
        <div className="pt-4 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={handleToggleTheme}
            className="w-full flex items-center justify-center gap-2 text-foreground hover:bg-accent/10 h-12"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <SunIcon className="h-5 w-5 text-yellow-500" />
            ) : (
              <MoonIcon className="h-5 w-5 text-blue-500" />
            )}
            <span className="font-medium">
              {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            </span>
          </Button>
        </div>

        <div className="pt-4 border-t border-border">
          <Button
            type="button"
            variant="destructive"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 h-12 font-semibold"
          >
            <LogOutIcon className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}