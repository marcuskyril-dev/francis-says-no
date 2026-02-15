import { HTMLAttributes } from "react";
import clsx from "clsx";

type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: CardProps) => (
  <div
    className={clsx("border border-border bg-background p-6 text-foreground duration-200", className)}
    {...props}
  />
);
