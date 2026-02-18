"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { WishlistItemStatus, ZoneDetailItem } from "@/types";

const formControlClassName =
  "h-10 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground";

export type EditExpenseValues = {
  wishlistItemId: string;
  status: WishlistItemStatus;
  amount: number;
  description: string;
  expenseDate: string;
  deliveryDate: string;
  installationDate: string;
  deliveryScheduled: boolean;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonMobile: string;
  companyBrandName: string;
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
  const [isSameAsDeliveryDate, setIsSameAsDeliveryDate] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<EditExpenseValues>({
    defaultValues: {
      wishlistItemId: "",
      status: "not_started",
      amount: 0,
      description: "",
      expenseDate: "",
      deliveryDate: "",
      installationDate: "",
      deliveryScheduled: false,
      contactPersonName: "",
      contactPersonEmail: "",
      contactPersonMobile: "",
      companyBrandName: ""
    }
  });
  const deliveryDate = watch("deliveryDate");
  const installationDate = watch("installationDate");

  useEffect(() => {
    if (!open || !initialValues) {
      return;
    }

    reset(initialValues);
    setIsSameAsDeliveryDate(false);
  }, [initialValues, open, reset]);

  useEffect(() => {
    if (!isSameAsDeliveryDate) {
      return;
    }

    if ((deliveryDate ?? "") !== (installationDate ?? "")) {
      setIsSameAsDeliveryDate(false);
    }
  }, [deliveryDate, installationDate, isSameAsDeliveryDate]);

  const handleOpenChange = (isOpen: boolean): void => {
    onOpenChange(isOpen);
    if (!isOpen) {
      reset();
      setIsSameAsDeliveryDate(false);
    }
  };

  const handleCancel = (): void => {
    onOpenChange(false);
    reset();
    setIsSameAsDeliveryDate(false);
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
    <Dialog open={open} onOpenChange={handleOpenChange} title="Edit expense">
      {allowDelete ? (
        <div className="mb-4 flex">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isUpdating}
            className="text-xs text-[#CC1000] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400"
          >
            {isDeleting ? "Deleting..." : "Delete expense"}
          </button>
        </div>
      ) : null}
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
          <label htmlFor="edit-expense-status" className="text-sm">
            Purchase status
          </label>
          <select
            id="edit-expense-status"
            {...register("status")}
            className={formControlClassName}
          >
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
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

        <div className="space-y-2">
          <label htmlFor="edit-expense-delivery-date" className="text-sm">
            Delivery date (optional)
          </label>
          <input
            id="edit-expense-delivery-date"
            type="date"
            {...register("deliveryDate")}
            className={formControlClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-expense-installation-date" className="text-sm">
            Installation date (optional)
          </label>
          <input
            id="edit-expense-installation-date"
            type="date"
            {...register("installationDate")}
            className={formControlClassName}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="same-as-delivery-date"
            type="checkbox"
            checked={isSameAsDeliveryDate}
            onChange={(event) => {
              const isChecked = event.currentTarget.checked;
              setIsSameAsDeliveryDate(isChecked);
              if (isChecked) {
                setValue("installationDate", deliveryDate ?? "", { shouldDirty: true });
              }
            }}
            className="h-4 w-4 appearance-none border border-border bg-background checked:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          />
          <label htmlFor="same-as-delivery-date" className="text-sm">
            Same as delivery date
          </label>
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-expense-contact-person-name" className="text-sm">
            Contact person name (optional)
          </label>
          <input
            id="edit-expense-contact-person-name"
            {...register("contactPersonName")}
            className={formControlClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-expense-contact-person-email" className="text-sm">
            Contact person email (optional)
          </label>
          <input
            id="edit-expense-contact-person-email"
            type="email"
            {...register("contactPersonEmail")}
            className={formControlClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-expense-contact-person-mobile" className="text-sm">
            Contact person mobile (optional)
          </label>
          <input
            id="edit-expense-contact-person-mobile"
            {...register("contactPersonMobile")}
            className={formControlClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-expense-company-brand-name" className="text-sm">
            Company / brand name (optional)
          </label>
          <input
            id="edit-expense-company-brand-name"
            {...register("companyBrandName")}
            className={formControlClassName}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="edit-delivery-scheduled"
            type="checkbox"
            {...register("deliveryScheduled")}
            className="h-4 w-4 appearance-none border border-border bg-background checked:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          />
          <label htmlFor="edit-delivery-scheduled" className="text-sm">
            Delivery scheduled
          </label>
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
    </Dialog>
  );
};
