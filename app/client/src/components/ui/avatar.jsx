import { cn } from "@/lib/utils"
import { useState } from "react"

// Google profile picture when available, otherwise a monogram from the user's name.
export function Avatar({ user, className, ring = false }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const url = user?.avatar_url
  const showPhoto = url && url !== failedUrl

  const initials = [user?.name, user?.last_name]
    .filter(Boolean)
    .map((part) => part.trim()[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={cn(
        "relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary text-[11px] font-semibold tracking-wide text-foreground",
        ring && "ring-2 ring-card ring-offset-2 ring-offset-accent/40",
        className
      )}
    >
      {showPhoto ? (
        <img
          src={url}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(url)}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials || "M"}</span>
      )}
    </div>
  )
}
