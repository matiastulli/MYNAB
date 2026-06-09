import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isDarkModeActive, toggleTheme } from "@/lib/themeUtils";
import { api } from "@/services/api";
import { AlertTriangleIcon, CameraIcon, CheckCircleIcon, IdCardIcon, LogOutIcon, MoonIcon, SunIcon, UserIcon, XIcon } from "lucide-react";
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (userData) {
      setProfileForm({
        name: userData.name || "",
        last_name: userData.last_name || "",
        national_id: userData.national_id || ""
      });
      setAvatarPreview(null);
      setAvatarError(null);
    }
  }, [userData]);

  useEffect(() => {
    const update = () => setIsDarkMode(isDarkModeActive());
    update();
    window.addEventListener('themechange', update);
    return () => window.removeEventListener('themechange', update);
  }, []);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);

    if (file.size > 10485760) {
      setAvatarError('Image must be under 10 MB');
      return;
    }

    const canvas = document.createElement('canvas');
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const MAX = 512;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64 = dataUrl.split(',')[1];
      setAvatarPreview(base64);
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      if (avatarPreview) {
        setIsUploadingAvatar(true);
        const avatarRes = await api.put('/auth/avatar', { avatar_data: avatarPreview });
        setIsUploadingAvatar(false);
        if (avatarRes.error) {
          console.error('Avatar upload failed:', avatarRes.error);
          return;
        }
      }
      const response = await api.put('/auth/profile', profileForm);
      if (!response.error) {
        setUpdateSuccess(true);
        if (onProfileUpdated) onProfileUpdated();
        setTimeout(() => { onOpenChange(false); setUpdateSuccess(false); }, 1500);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdating(false);
      setIsUploadingAvatar(false);
    }
  };

  const handleLogout = () => {
    onOpenChange(false);
    setTimeout(() => onLogout(), 300);
  };

  const missingCuit = !userData?.national_id || userData?.national_id === "";
  const displayName = [userData?.name, userData?.last_name].filter(Boolean).join(" ") || "Your Profile";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[var(--glass-bg-heavy)] backdrop-blur-2xl border border-[var(--glass-border)] shadow-[var(--glass-shadow-heavy)] rounded-[var(--glass-radius)] max-w-md p-0 gap-0 overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Profile Settings</DialogTitle>

        {/* Close */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors z-10"
          aria-label="Close"
        >
          <XIcon className="h-4 w-4" />
        </button>

        {/* Avatar + identity */}
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6 bg-gradient-to-b from-[hsl(var(--accent)/0.08)] to-transparent border-b border-[var(--glass-border)]">
          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="avatar-upload"
            onChange={handleAvatarSelect}
          />

          {/* Clickable avatar */}
          <label
            htmlFor="avatar-upload"
            className="group/avatar relative w-16 h-16 rounded-full cursor-pointer"
          >
            {(avatarPreview || userData?.avatar_data) ? (
              <img
                src={`data:image/jpeg;base64,${avatarPreview || userData.avatar_data}`}
                alt="avatar"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-[hsl(var(--accent)/0.25)] ring-offset-2 ring-offset-transparent"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--chart-3))] flex items-center justify-center shadow-lg ring-2 ring-[hsl(var(--accent)/0.25)] ring-offset-2 ring-offset-transparent">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
            )}
            {/* Camera overlay on hover */}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
              <CameraIcon className="h-5 w-5 text-white" />
            </div>
          </label>

          {avatarError && (
            <p className="text-xs text-[hsl(var(--destructive))] mt-1">{avatarError}</p>
          )}

          <div className="text-center">
            <p className="font-semibold text-[hsl(var(--foreground))]">{displayName}</p>
            {userData?.email && (
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{userData.email}</p>
            )}
          </div>
          {missingCuit && (
            <div className="flex items-start gap-2.5 w-full mt-1 px-3 py-2.5 bg-[hsl(var(--warning-bg)/0.5)] border border-[hsl(var(--warning-fg)/0.25)] rounded-[var(--glass-radius-sm)]">
              <AlertTriangleIcon className="h-4 w-4 text-[hsl(var(--warning-fg))] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[hsl(var(--warning-fg))]">CUIT required</p>
                <p className="text-xs text-[hsl(var(--warning-fg)/0.8)] leading-snug">
                  Needed to filter out personal transactions from your budget.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="px-6 py-5">
          {updateSuccess ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="p-4 bg-[hsl(var(--positive)/0.1)] border border-[hsl(var(--positive)/0.2)] rounded-full">
                <CheckCircleIcon className="h-8 w-8 text-[hsl(var(--positive))]" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-[hsl(var(--foreground))]">Profile updated!</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Your changes have been saved.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              {/* Fields grouped in glass card */}
              <div className="rounded-[var(--glass-radius-sm)] border border-[var(--glass-border)] bg-[hsl(var(--background)/0.4)] divide-y divide-[var(--glass-border)]">
                {/* First name */}
                <div className="px-4 py-3 space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    First Name
                  </Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="h-9 border-0 bg-transparent px-0 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Enter your first name"
                    required
                  />
                </div>

                {/* Last name */}
                <div className="px-4 py-3 space-y-1.5">
                  <Label htmlFor="last_name" className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                    className="h-9 border-0 bg-transparent px-0 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Enter your last name"
                  />
                </div>

                {/* CUIT */}
                <div className="px-4 py-3 space-y-1.5">
                  <Label htmlFor="national_id" className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider flex items-center gap-1.5">
                    <IdCardIcon className="h-3.5 w-3.5" />
                    CUIT
                    {missingCuit && <AlertTriangleIcon className="h-3.5 w-3.5 text-[hsl(var(--warning-fg))]" />}
                  </Label>
                  <Input
                    id="national_id"
                    type="text"
                    value={profileForm.national_id}
                    onChange={(e) => setProfileForm({ ...profileForm, national_id: e.target.value.replace(/[^0-9]/g, '') })}
                    className="h-9 border-0 bg-transparent px-0 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="e.g. 20415436042"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isUpdating}
                className="w-full h-10 text-sm font-semibold rounded-[var(--glass-radius-sm)] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent)/0.9)] transition-all duration-150"
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                    {isUploadingAvatar ? 'Uploading…' : 'Saving…'}
                  </div>
                ) : 'Save Changes'}
              </Button>
            </form>
          )}
        </div>

        {/* Theme + Logout */}
        <div className="flex gap-2 px-6 pb-6 border-t border-[var(--glass-border)] pt-4">
          <button
            type="button"
            onClick={() => toggleTheme()}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-[var(--glass-radius-sm)] bg-[hsl(var(--muted)/0.5)] hover:bg-[hsl(var(--muted))] border border-[var(--glass-border)] text-sm font-medium text-[hsl(var(--foreground))] transition-colors"
          >
            {isDarkMode
              ? <><SunIcon className="h-4 w-4 text-[hsl(48,95%,50%)]" /><span>Light</span></>
              : <><MoonIcon className="h-4 w-4 text-[hsl(217,91%,60%)]" /><span>Dark</span></>
            }
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-[var(--glass-radius-sm)] bg-[hsl(var(--destructive)/0.1)] hover:bg-[hsl(var(--destructive)/0.2)] border border-[hsl(var(--destructive)/0.2)] text-sm font-medium text-[hsl(var(--destructive))] transition-colors"
          >
            <LogOutIcon className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
