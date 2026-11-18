"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export type JoyaSegmentedOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type JoyaSegmentedProps<T extends string> = {
  options: ReadonlyArray<JoyaSegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
  className?: string;
};

/**
 * Pill segmented control (period pickers, view toggles).
 * Radio-group semantics with arrow-key navigation.
 */
export function JoyaSegmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "md",
  className,
}: JoyaSegmentedProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const dir = event.key === "ArrowRight" ? 1 : -1;
    for (let step = 1; step <= options.length; step += 1) {
      const next = (index + dir * step + options.length) % options.length;
      if (!options[next].disabled) {
        onChange(options[next].value);
        refs.current[next]?.focus();
        break;
      }
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-pill border border-line bg-slate-50 p-0.5 [scrollbar-width:none]",
        className,
      )}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-pill font-semibold transition-[color,background-color,box-shadow] duration-base ease-joya",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral",
              "disabled:cursor-not-allowed disabled:opacity-40",
              size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-8 px-3.5 text-[13px]",
              active
                ? "bg-white text-navy shadow-joya-xs"
                : "text-slate-500 hover:text-navy",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
