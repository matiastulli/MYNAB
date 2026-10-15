import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FieldError, FieldHint, Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { fadeUp } from "@/lib/motion";
import { getCurrentTheme, setTheme } from "@/lib/themeUtils";
import { api } from "@/services/api";
import { CameraIcon, CheckIcon, DesktopIcon, MoonIcon, SignOutIcon, SunIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
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
  const [updateError, setUpdateError] = useState(null);
  const [theme, setThemeState] = useState("system");
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
    const update = () => setThemeState(getCurrentTheme());
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
    setUpdateError(null);
    try {
      if (avatarPreview) {
        setIsUploadingAvatar(true);
        const avatarRes = await api.put('/auth/avatar', { avatar_data: avatarPreview });
        setIsUploadingAvatar(false);
        if (avatarRes.error) {
          console.error('Avatar upload failed:', avatarRes.error);
          setUpdateError('The photo could not be uploaded. Try a smaller image.');
          return;
        }
      }
      const response = await api.put('/auth/profile', profileForm);
      if (!response.error) {
        setUpdateSuccess(true);
        if (onProfileUpdated) onProfileUpdated();
        setTimeout(() => { onOpenChange(false); setUpdateSuccess(false); }, 1500);
      } else {
        setUpdateError('Your changes could not be saved. Try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateError('Your changes could not be saved. Try again.');
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
  const displayName = [userData?.name, userData?.last_name].filter(Boolean).join(" ") || "Your profile";
  const avatarUser = avatarPreview ? { ...userData, avatar_data: avatarPreview } : userData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <XIcon className="size-4" />
        </button>

        {/* Identity */}
        <div className="flex items-center gap-4 border-b border-border/70 px-6 pb-6 pt-7">
          <input type="file" accept="image/*" className="sr-only" id="avatar-upload" onChange={handleAvatarSelect} />
          <label htmlFor="avatar-upload" className="group/avatar relative shrink-0 cursor-pointer rounded-full" aria-label="Change profile photo">
            <Avatar user={avatarUser} className="size-16 text-lg" />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-zinc-950/45 opacity-0 transition-opacity duration-200 group-hover/avatar:opacity-100">
              <CameraIcon className="size-5 text-white" />
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full border-2 border-card bg-foreground text-background">
              <CameraIcon className="size-3" weight="bold" />
            </span>
          </label>
          <div className="min-w-0 pr-8">
            <DialogTitle className="truncate text-lg">{displayName}</DialogTitle>
            <DialogDescription className="mt-1 truncate">{userData?.email || "Profile settings"}</DialogDescription>
            <FieldError className="mt-1.5">{avatarError}</FieldError>
          </div>
        </div>

        <div className="px-6 py-6">
          <AnimatePresence mode="wait" initial={false}>
            {updateSuccess ? (
              <motion.div key="ok" {...fadeUp} className="flex items-center gap-4 py-10">
                <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
                  <CheckIcon className="size-5" weight="bold" />
                </span>
                <div>
                  <p className="font-semibold tracking-tight">Profile saved</p>
                  <p className="text-sm text-muted-foreground">Your changes are live.</p>
                </div>
              </motion.div>
            ) : (
              <motion.form key="form" {...fadeUp} onSubmit={handleProfileUpdate} className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">First name</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Valentina"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="last_name">Last name</Label>
                    <Input
                      id="last_name"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      placeholder="Echeverría"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="national_id">
                    CUIT
                    {missingCuit && <WarningCircleIcon className="size-3.5 text-warning" weight="fill" />}
                  </Label>
                  <Input
                    id="national_id"
                    type="text"
                    value={profileForm.national_id}
                    onChange={(e) => setProfileForm({ ...profileForm, national_id: e.target.value.replace(/[^0-9]/g, '') })}
                    className="figure"
                    placeholder="20304917286"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  <FieldHint className={missingCuit ? "text-warning" : undefined}>
                    Statement lines that mention your CUIT (transfers between your own accounts) are skipped on import.
                  </FieldHint>
                </div>

                <FieldError>{updateError}</FieldError>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={isUpdating}
                  loadingText={isUploadingAvatar ? "Uploading photo" : "Saving"}
                >
                  Save changes
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Appearance + sign out */}
        <div className="flex flex-col gap-4 border-t border-border/70 bg-muted/40 px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium">Appearance</span>
            <Segmented
              size="sm"
              ariaLabel="Theme"
              value={theme}
              onChange={(v) => setTheme(v)}
              options={[
                { value: "light", label: "Light", icon: SunIcon },
                { value: "dark", label: "Dark", icon: MoonIcon },
                { value: "system", label: "Auto", icon: DesktopIcon },
              ]}
            />
          </div>
          <Button variant="destructive-ghost" className="w-full justify-center border border-border bg-card" onClick={handleLogout}>
            <SignOutIcon />
            Sign out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
