"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { getRoleLabel } from "@/lib/auth/roles";
import { useResolvedAvatarUrl } from "@/hooks/use-resolved-avatar-url";

type ProfileHeaderProps = {
  /** Account profile route. Defaults to the client profile page. */
  href?: string;
};

export default function ProfileHeader({
  href = "/client/profile",
}: ProfileHeaderProps) {
  const { user } = useAuth();
  const { src: avatarSrc, failed, setFailed } = useResolvedAvatarUrl(user?.avatar);
  const initials =
    (user?.full_name ?? "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "J";

  return (
    <Link
      href={href}
      aria-label="Mon profil"
      className="group/profile flex items-center gap-3 rounded-pill p-1 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral sm:pl-1 sm:pr-1"
    >
      <span className="hidden min-w-0 text-right sm:block">
        <span className="block max-w-[11rem] truncate text-sm font-semibold leading-tight text-navy">
          {user?.full_name}
        </span>
        <span className="block font-data text-[10.5px] uppercase tracking-[0.08em] text-slate-400">
          {getRoleLabel(user?.role)}
        </span>
      </span>
      <Avatar className="h-9 w-9 ring-2 ring-white transition-transform duration-base ease-joya group-hover/profile:scale-105">
        {avatarSrc && !failed ? (
          <AvatarImage
            key={avatarSrc}
            src={avatarSrc}
            alt={user?.full_name ?? ""}
            onError={() => setFailed(true)}
          />
        ) : (
          <AvatarFallback>{initials}</AvatarFallback>
        )}
      </Avatar>
    </Link>
  );
}
