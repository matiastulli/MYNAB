import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isDarkModeActive, toggleTheme } from "@/lib/themeUtils";
import { api } from "@/services/api";
import { AlertTriangleIcon, CheckCircleIcon, LogOutIcon, MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProfileUpdateDialog({
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
      <DialogContent className="bg-card text-card-foreground border-border shadow-lg dialog-content-solid">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-foreground">Your Profile</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {(!userData?.national_id || userData?.national_id === "") ? (
              <div className="flex items-start gap-2 mt-2 p-2 bg-warning-bg text-warning-fg border border-warning-fg/30 rounded-md">
                <AlertTriangleIcon className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-medium">CUIT Required</p>
                  <p className="text-sm opacity-90">
                    Adding your CUIT helps filter out personal transactions that shouldn't be counted in your budget.
                  </p>
                </div>
              </div>
            ) : (
              "Update your personal information below."
            )}
          </DialogDescription>
        </DialogHeader>

        {updateSuccess ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="p-3 bg-success-bg text-success-fg rounded-full">
              <CheckCircleIcon className="h-8 w-8" />
            </div>
            <p className="text-lg font-medium text-foreground">Profile Updated</p>
          </div>
        ) : (
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-foreground"
              >
                First Name
              </Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="border-0 bg-muted focus:bg-background text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="last_name"
                className="text-sm font-medium text-foreground"
              >
                Last Name
              </Label>
              <Input
                id="last_name"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                className="border-0 bg-muted focus:bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="national_id"
                className="text-sm font-medium text-foreground flex items-center gap-1"
              >
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
                className="border-0 bg-muted focus:bg-background text-foreground placeholder:text-muted-foreground"
                placeholder="e.g. 20415436042"
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <p className="text-xs text-muted-foreground">
                Used to automatically filter out personal transactions.
              </p>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 mt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="success"
                disabled={isUpdating}
                className="w-full sm:w-auto"
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
        <div className="pt-4 mt-6 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={handleToggleTheme}
            className="w-full flex items-center justify-center gap-2 text-foreground hover:bg-accent/10"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <SunIcon className="h-4 w-4 text-warning-fg" />
            ) : (
              <MoonIcon className="h-4 w-4 text-info-fg" />
            )}
            {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </Button>
        </div>

        <div className="pt-4 mt-6 border-t border-border">
          <Button
            type="button"
            variant="destructive"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2"
          >
            <LogOutIcon className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}