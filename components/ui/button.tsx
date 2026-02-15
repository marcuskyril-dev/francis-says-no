import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-black text-white hover:bg-zinc-800",
  secondary: "bg-zinc-200 text-black hover:bg-zinc-300",
  ghost: "bg-transparent text-black hover:bg-zinc-100 dark:text-white dark:hover:bg-zinc-900"
};

export const Button = ({ variant = "primary", className, type = "button", ...props }: ButtonProps) => (
  <button
    type={type}
    className={clsx(
      "inline-flex h-10 items-center justify-center border border-border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-50",
      variantClasses[variant],
      className
    )}
    {...props}
  />
);
