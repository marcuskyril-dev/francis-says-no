"use client";

import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

const formControlClassName =
  "h-10 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground";

export type AddWishlistItemValues = {
  name: string;
  budget: number;
};

interface AddWishlistItemDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: AddWishlistItemValues) => Promise<void>;
  isSubmitting: boolean;
  errorMessage: string | null;
}

export const AddWishlistItemDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  errorMessage
}: AddWishlistItemDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<AddWishlistItemValues>({
    defaultValues: {
      name: "",
      budget: 0
    }
  });

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

  const handleFormSubmit = async (values: AddWishlistItemValues): Promise<void> => {
    await onSubmit(values);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Add wishlist item"
      description="Create a wishlist item in this zone."
      trigger={<Button variant="secondary">Add wishlist item</Button>}
    >
      <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-2">
          <label htmlFor="wishlist-item-name" className="text-sm">
            Item name
          </label>
          <input
            id="wishlist-item-name"
            {...register("name", {
              required: "Item name is required."
            })}
            className={formControlClassName}
          />
          {errors.name ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.name.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="wishlist-item-budget" className="text-sm">
            Budget
          </label>
          <input
            id="wishlist-item-budget"
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
          {errors.budget ? (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.budget.message}</p>
          ) : null}
        </div>

        {errorMessage ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errorMessage}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save item"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
