import Image from "next/image";
import { cn } from "@/lib/utils";

type JoyaLogoProps = {
  /** `full` = mark + wordmark (landing navbar asset), `mark` = coral app tile. */
  variant?: "full" | "mark";
  className?: string;
  /** Rendered height in px (width follows the asset ratio). */
  height?: number;
  priority?: boolean;
};

const FULL_RATIO = 288 / 122;

/** Official Joya Energy logo — same asset as joya-energy.com. */
export function JoyaLogo({
  variant = "full",
  className,
  height = 32,
  priority = false,
}: JoyaLogoProps) {
  if (variant === "mark") {
    return (
      <Image
        src="/brand/apple-touch-icon.png"
        alt="Joya Energy"
        width={height}
        height={height}
        priority={priority}
        className={cn("shrink-0 rounded-[28%]", className)}
      />
    );
  }

  return (
    <Image
      src="/brand/joya-energy-logo.png"
      alt="Joya Energy"
      width={Math.round(height * FULL_RATIO)}
      height={height}
      priority={priority}
      className={cn("h-auto shrink-0", className)}
      style={{ height, width: "auto" }}
    />
  );
}
