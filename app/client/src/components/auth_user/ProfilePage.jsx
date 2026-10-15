import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, FieldHint, Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { fadeUp } from "@/lib/motion";
import { getCurrentTheme, setTheme } from "@/lib/themeUtils";
import { CheckIcon, DesktopIcon, MoonIcon, SignOutIcon, SunIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const CARD = "rounded-[1.75rem] border border-border/70 bg-card shadow-[var(--shadow-diffuse)]";

function ProfileForm({ userData, focusNationalId }) {
  // Initialized once: a background refetch of ["profile"] must not overwrite what the user is typing
  const [form, setForm] = useState(() => ({
    name: userData.name || "",
    last_name: userData.last_name || "",
    national_id: userData.national_id || "",
  }));
  const updateProfile = useUpdateProfile();

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (updateProfile.isSuccess) updateProfile.reset();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile.mutate({ ...form, national_id: form.national_id || null });
  };

  const missingCuit = !userData.national_id;

  return (
    <form onSubmit={handleSubmit} className={`${CARD} flex flex-col gap-5 p-6`}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">First name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Valentina"
            autoComplete="given-name"
            required
            minLength={2}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="last_name">Last name</Label>
          <Input
            id="last_name"
            value={form.last_name}
            onChange={(e) => setField("last_name", e.target.value)}
            placeholder="Echeverría"
            autoComplete="family-name"
            required
            minLength={2}
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
          value={form.national_id}
          onChange={(e) => setField("national_id", e.target.value.replace(/[^0-9]/g, ""))}
          className="figure"
          placeholder="20304917286"
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus={focusNationalId}
        />
        <FieldHint className={missingCuit ? "text-warning" : undefined}>
          Statement lines that mention your CUIT (transfers between your own accounts) are skipped on import.
        </FieldHint>
      </div>

      <FieldError>{updateProfile.isError && "Your changes could not be saved. Try again."}</FieldError>

      <div className="flex flex-col gap-3">
        <Button type="submit" size="lg" className="w-full" loading={updateProfile.isPending} loadingText="Saving">
          Save changes
        </Button>
        <AnimatePresence initial={false}>
          {updateProfile.isSuccess && (
            <motion.p
              {...fadeUp}
              role="status"
              className="flex items-center justify-center gap-2 text-sm font-medium text-accent"
            >
              <CheckIcon className="size-4" weight="bold" />
              Profile saved
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}

export default function ProfilePage({ onLogout }) {
  const location = useLocation();
  const { data: userData, isError, refetch } = useProfile();
  const [theme, setThemeState] = useState(getCurrentTheme);
  const [signingOut, setSigningOut] = useState(false);

  // The shell stays mounted, so the window keeps the dashboard's scroll position otherwise
  // Braces matter: newer browsers return a Promise from scrollTo, and React would call it as the cleanup
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const update = () => setThemeState(getCurrentTheme());
    window.addEventListener("themechange", update);
    return () => window.removeEventListener("themechange", update);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await onLogout();
  };

  const displayName = [userData?.name, userData?.last_name].filter(Boolean).join(" ") || "Your profile";

  return (
    <>
      <header className="mb-6 flex flex-col gap-2 md:mb-10">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Account</div>
        <h1 className="text-[1.75rem] font-semibold leading-none tracking-tighter md:text-[2.5rem]">Profile</h1>
      </header>

      <div className="flex w-full max-w-xl flex-col gap-6">
        {userData ? (
          <motion.div {...fadeUp} className="flex flex-col gap-6">
            <div className="flex items-center gap-4 px-1">
              <Avatar user={userData} className="size-16 text-lg" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-tight">{displayName}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">{userData.email || "Profile settings"}</p>
              </div>
            </div>

            <ProfileForm
              key={userData.id}
              userData={userData}
              focusNationalId={location.state?.focus === "national_id"}
            />
          </motion.div>
        ) : isError ? (
          <div className={`${CARD} flex flex-col items-start gap-3 p-6`}>
            <FieldError>Your profile could not be loaded.</FieldError>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading profile">
            <div className="flex items-center gap-4 px-1">
              <Skeleton className="size-16 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-52" />
              </div>
            </div>
            <Skeleton className="h-80 rounded-[1.75rem]" />
          </div>
        )}

        <div className={`${CARD} flex flex-col gap-4 p-6`}>
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
          <Button
            variant="destructive-ghost"
            className="w-full justify-center border border-border bg-card"
            onClick={handleSignOut}
            loading={signingOut}
            loadingText="Signing out"
          >
            <SignOutIcon />
            Sign out
          </Button>
        </div>
      </div>
    </>
  );
}
