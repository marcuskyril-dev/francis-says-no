"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ReactNode } from "react";
import clsx from "clsx";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: "md" | "2xl";
  scrollable?: boolean;
}

export const Dialog = ({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  maxWidth = "md",
  scrollable = false
}: DialogProps) => (
  <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40 z-50" />
      <DialogPrimitive.Content
        className={clsx(
          "fixed inset-0 h-screen w-screen overflow-y-auto z-[51]",
          "md:inset-auto md:left-1/2 md:top-1/2 md:w-[92vw] md:h-auto md:-translate-x-1/2 md:-translate-y-1/2",
          maxWidth === "2xl" ? "md:max-w-2xl" : "md:max-w-md",
          scrollable && "md:max-h-[90vh]",
          "border border-border bg-background p-6 text-foreground shadow-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
        )}
      >
        <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {description}
          </DialogPrimitive.Description>
        ) : null}
        <div className="mt-4">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
);
