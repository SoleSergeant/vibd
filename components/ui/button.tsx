import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost" | "outline";
  size?: "sm" | "default" | "lg";
};

const buttonStyles = {
  default: "bg-[color:hsl(var(--brand-blue))] text-white hover:opacity-90 shadow-soft",
  secondary: "bg-[color:rgba(21,228,2,0.12)] text-slate-900 hover:bg-[color:rgba(21,228,2,0.18)]",
  ghost: "hover:bg-slate-100 text-slate-900",
  outline: "border border-slate-300 bg-white hover:bg-slate-50 text-slate-900"
};

const sizeStyles = {
  sm: "h-8 px-3 text-sm",
  default: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:hsl(var(--brand-blue))] disabled:pointer-events-none disabled:opacity-50",
          buttonStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: "default" | "secondary" | "ghost" | "outline";
  size?: "sm" | "default" | "lg";
  className?: string;
};

export function ButtonLink({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:hsl(var(--brand-blue))]",
        buttonStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
}
