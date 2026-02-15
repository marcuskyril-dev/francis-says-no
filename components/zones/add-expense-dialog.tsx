"use client";

import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { ZoneDetailItem } from "@/types";

const formControlClassName =
  "h-10 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground";

export type AddExpenseValues = {
  wishlistItemId: string;
  amount: number;
  description: string;
  expenseDate: string;
};

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: AddExpenseValues) => Promise<void>;
  isSubmitting: boolean;
  errorMessage: string | null;
  items: ZoneDetailItem[];
}

export const AddExpenseDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  errorMessage,
  items
}: AddExpenseDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<AddExpenseValues>({
    defaultValues: {
      wishlistItemId: "",
      amount: 0,
      description: "",
      expenseDate: ""
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

  const handleFormSubmit = async (values: AddExpenseValues): Promise<void> => {
    await onSubmit(values);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Add expense"
      description="Record a purchase against a zone item."
      trigger={
        <Button variant="primary" disabled={items.length === 0}>
          Add expense
        </Button>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-2">
          <label htmlFor="wishlist-item-id" className="text-sm">
            Item
          </label>
          <select
            id="wishlist-item-id"
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
          <label htmlFor="expense-amount" className="text-sm">
            Amount
          </label>
          <input
            id="expense-amount"
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
          {errors.amount ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.amount.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="expense-description" className="text-sm">
            Description
          </label>
          <input id="expense-description" {...register("description", { required: "Description is required." })} className={formControlClassName} />
          {errors.description ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.description.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="expense-date" className="text-sm">
            Expense date
          </label>
          <input id="expense-date" type="date" {...register("expenseDate", { required: "Expense date is required." })} className={formControlClassName} />
          {errors.expenseDate ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.expenseDate.message}</p> : null}
        </div>

        {errorMessage ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errorMessage}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save expense"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
