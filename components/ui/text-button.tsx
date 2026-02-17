import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type TextButtonVariant = "default" | "danger";

interface TextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TextButtonVariant;
}

const variantClasses: Record<TextButtonVariant, string> = {
  default: "text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white",
  danger: "text-[#CC1000] hover:text-[#B50E00]"
};

export const TextButton = ({
  variant = "default",
  type = "button",
  className,
  ...props
}: TextButtonProps) => (
  <button
    type={type}
    className={clsx(
      "text-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-50",
      variantClasses[variant],
      className
    )}
    {...props}
  />
);
