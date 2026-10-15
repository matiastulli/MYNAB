import { cn } from "@/lib/utils"

// Photo when the user uploaded one, otherwise a monogram from their name.
export function Avatar({ user, className, ring = false }) {
  const initials = [user?.name, user?.last_name]
    .filter(Boolean)
    .map((part) => part.trim()[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={cn(
        "relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-[11px] font-semibold tracking-wide text-zinc-100 dark:from-zinc-200 dark:to-zinc-400 dark:text-zinc-900",
        ring && "ring-2 ring-card ring-offset-2 ring-offset-accent/40",
        className
      )}
    >
      {user?.avatar_data ? (
        <img
          src={`data:image/jpeg;base64,${user.avatar_data}`}
          alt=""
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials || "M"}</span>
      )}
    </div>
  )
}
