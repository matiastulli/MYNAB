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

  // Simplified theme state management
  const [isDarkMode, setIsDarkMode] = useState(isDarkModeActive);

  // Re-check when dialog opens
  useEffect(() => {
    if (open) {
      setIsDarkMode(isDarkModeActive());
    }
  }, [open]);

  // Listen for theme changes from other parts of the app
  useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkMode(isDarkModeActive());
    };

    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

  // Enhanced theme toggle handler
  const handleToggleTheme = () => {
    const newDarkMode = toggleTheme();
    setIsDarkMode(newDarkMode);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-[#1a1e24] border-0 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium dark:text-white">Your Profile</DialogTitle>
          <DialogDescription className="text-neutral-500 dark:text-neutral-400">
            {(!userData?.national_id || userData?.national_id === "") ? (
              <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-md">
                <AlertTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-400">CUIT Required</p>
                  <p className="text-sm text-amber-600 dark:text-amber-500">
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
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
              <CheckCircleIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Profile Updated</p>
          </div>
        ) : (
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                First Name
              </Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="last_name"
                className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Last Name
              </Label>
              <Input
                id="last_name"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="national_id"
                className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
              >
                CUIT
                {(!userData?.national_id || userData?.national_id === "") && (
                  <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
                )}
              </Label>
              <Input
                id="national_id"
                type="text" // Explicitly set type to text for better control
                value={profileForm.national_id}
                onChange={(e) => {
                  // Allow only numbers by removing non-numeric characters
                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                  setProfileForm({ ...profileForm, national_id: numericValue });
                }}
                className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
                placeholder="e.g. 20415436042"
                inputMode="numeric" // Hint for mobile devices to show numeric keyboard
                pattern="[0-9]*" // Another hint for browsers
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Used to automatically filter out personal transactions.
              </p>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto border-neutral-200 dark:border-neutral-700 dark:bg-[#2a303a] dark:hover:bg-[#353b47] dark:text-neutral-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
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
        <div className="pt-4 mt-6 border-t border-neutral-100 dark:border-neutral-800">
          <Button
            type="button"
            variant="ghost"
            onClick={handleToggleTheme}
            className="w-full flex items-center justify-center gap-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/30"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <SunIcon className="h-4 w-4 text-amber-400" />
            ) : (
              <MoonIcon className="h-4 w-4 text-indigo-500" />
            )}
            {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </Button>
        </div>

        <div className="pt-4 mt-6 border-t border-neutral-200 dark:border-neutral-700">
          <Button
            type="button"
            variant="ghost"
            onClick={handleLogout}
            className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 flex items-center justify-center gap-2"
          >
            <LogOutIcon className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}