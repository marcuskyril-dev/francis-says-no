"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

const formControlClassName =
  "h-10 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground";

export type EditWishlistItemValues = {
  name: string;
  budget: number;
  mustPurchaseBefore: string;
};

interface EditWishlistItemDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: EditWishlistItemValues) => Promise<void>;
  isSubmitting: boolean;
  errorMessage: string | null;
  initialValues: EditWishlistItemValues | null;
}

export const EditWishlistItemDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  errorMessage,
  initialValues
}: EditWishlistItemDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<EditWishlistItemValues>({
    defaultValues: {
      name: "",
      budget: 0,
      mustPurchaseBefore: ""
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

  const handleFormSubmit = async (values: EditWishlistItemValues): Promise<void> => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Edit wishlist item"
      description="Update item details and optional purchase deadline."
    >
      <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-2">
          <label htmlFor="edit-wishlist-item-name" className="text-sm">
            Item name
          </label>
          <input
            id="edit-wishlist-item-name"
            {...register("name", {
              required: "Item name is required."
            })}
            className={formControlClassName}
          />
          {errors.name ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.name.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-wishlist-item-budget" className="text-sm">
            Budget
          </label>
          <input
            id="edit-wishlist-item-budget"
            type="number"
            step="0.01"
            min="0"
            {...register("budget", {
              required: "Budget is required.",
              valueAsNumber: true,
              min: {
                value: 0,
                message: "Budget must be at least 0."
              }
            })}
            className={formControlClassName}
          />
          {errors.budget ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.budget.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-wishlist-item-must-purchase-before" className="text-sm">
            Must purchase before (optional)
          </label>
          <input
            id="edit-wishlist-item-must-purchase-before"
            type="date"
            {...register("mustPurchaseBefore")}
            className={formControlClassName}
          />
        </div>

        {errorMessage ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errorMessage}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
