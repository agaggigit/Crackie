import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const VARIANTS = {
  primary: "bg-orange text-white hover:bg-ember",
  dark: "bg-navy text-white hover:bg-[#1a2a55]",
  light: "bg-white text-navy hover:bg-cream",
  soft: "bg-field text-navy hover:bg-[#ECE6DC]",
  outline: "border-[1.5px] border-navy text-navy hover:bg-navy hover:text-white",
  ghostLight: "border-[1.5px] border-white/30 text-white hover:bg-white/10",
} as const;

type Variant = keyof typeof VARIANTS;

const base =
  "inline-flex items-center gap-3 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange";

const sizes = { md: "h-12 px-6 text-[15px]", sm: "h-10 px-4 text-sm" } as const;

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: keyof typeof sizes }) {
  return <button type="button" className={`${base} justify-center ${sizes[size]} ${VARIANTS[variant]} ${className}`} {...props} />;
}

// Tombol pill dengan bulatan panah di kanan (pola dari desain).
export function ArrowButton({
  children,
  variant = "primary",
  href,
  icon = "→",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; href?: string; icon?: ReactNode }) {
  const dot = variant === "primary" || variant === "dark" ? "bg-white text-navy" : "bg-navy text-white";
  const inner = (
    <>
      <span>{children}</span>
      <span aria-hidden className={`grid size-9 place-items-center rounded-full text-base ${dot}`}>
        {icon}
      </span>
    </>
  );
  const cls = `${base} h-12 justify-between pl-6 pr-1.5 text-[15px] ${VARIANTS[variant]} ${className}`;
  if (href) {
    const external = href.startsWith("http");
    return (
      <Link href={href} className={cls} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...props}>
      {inner}
    </button>
  );
}
