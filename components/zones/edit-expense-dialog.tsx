"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import clsx from "clsx";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import type { ZoneDetailItem } from "@/types";

const formControlClassName =
  "h-10 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground";

export type EditExpenseValues = {
  wishlistItemId: string;
  amount: number;
  description: string;
  expenseDate: string;
};

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdate: (values: EditExpenseValues) => Promise<void>;
  onDelete: () => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
  allowDelete: boolean;
  errorMessage: string | null;
  items: ZoneDetailItem[];
  initialValues: EditExpenseValues | null;
}

export const EditExpenseDialog = ({
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
  allowDelete,
  errorMessage,
  items,
  initialValues
}: EditExpenseDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<EditExpenseValues>({
    defaultValues: {
      wishlistItemId: "",
      amount: 0,
      description: "",
      expenseDate: ""
    }
  });

  useEffect(() => {
    if (!open || !initialValues) {
      return;
    }

    reset(initialValues);
  }, [initialValues, open, reset]);

  const handleOpenChange = (isOpen: boolean): void => {
    onOpenChange(isOpen);
    if (!isOpen) {
      reset();
    }
  };

  const handleCancel = (): void => {
    onOpenChange(false);
    reset();
  };

  const handleDelete = async (): Promise<void> => {
    if (!allowDelete) {
      return;
    }

    if (!window.confirm("Delete this expense? This action cannot be undone.")) {
      return;
    }

    await onDelete();
  };

  const handleFormSubmit = async (values: EditExpenseValues): Promise<void> => {
    await onUpdate(values);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40" />
        <DialogPrimitive.Content
          className={clsx(
            "fixed left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2",
            "border border-border bg-background p-6 text-foreground shadow-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <DialogPrimitive.Title className="text-lg font-semibold">Edit expense</DialogPrimitive.Title>
            {allowDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isUpdating}
                className="text-xs text-[#CC1000] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400"
              >
                {isDeleting ? "Deleting..." : "Delete expense"}
              </button>
            ) : null}
          </div>
          <div className="mt-4">
            <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
              <div className="space-y-2">
                <label htmlFor="edit-wishlist-item-id" className="text-sm">
                  Item
                </label>
                <select
                  id="edit-wishlist-item-id"
                  {...register("wishlistItemId", {
                    required: "Item is required."
                  })}
                  className={formControlClassName}
                >
                  <option value="">Select item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {errors.wishlistItemId ? (
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.wishlistItemId.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-expense-amount" className="text-sm">
                  Amount
                </label>
                <input
                  id="edit-expense-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("amount", {
                    required: "Amount is required.",
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: "Amount must be at least 0."
                    }
                  })}
                  className={formControlClassName}
                />
                {errors.amount ? (
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.amount.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-expense-description" className="text-sm">
                  Description
                </label>
                <input
                  id="edit-expense-description"
                  {...register("description", {
                    required: "Description is required."
                  })}
                  className={formControlClassName}
                />
                {errors.description ? (
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.description.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-expense-date" className="text-sm">
                  Expense date
                </label>
                <input
                  id="edit-expense-date"
                  type="date"
                  {...register("expenseDate", {
                    required: "Expense date is required."
                  })}
                  className={formControlClassName}
                />
                {errors.expenseDate ? (
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.expenseDate.message}</p>
                ) : null}
              </div>

              {errorMessage ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errorMessage}</p> : null}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating || isDeleting}>
                  {isUpdating ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
