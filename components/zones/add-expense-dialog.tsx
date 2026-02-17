"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { WishlistItemStatus, ZoneDetailItem } from "@/types";

const formControlClassName =
  "h-10 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground";

export type AddExpenseValues = {
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
  const [isSameAsDeliveryDate, setIsSameAsDeliveryDate] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<AddExpenseValues>({
    defaultValues: {
      wishlistItemId: "",
      status: "in_progress",
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

  const handleFormSubmit = async (values: AddExpenseValues): Promise<void> => {
    await onSubmit(values);
    reset();
    setIsSameAsDeliveryDate(false);
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
          <label htmlFor="expense-status" className="text-sm">
            Purchase status
          </label>
          <select
            id="expense-status"
            {...register("status")}
            className={formControlClassName}
          >
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
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

        <div className="space-y-2">
          <label htmlFor="expense-delivery-date" className="text-sm">
            Delivery date (optional)
          </label>
          <input
            id="expense-delivery-date"
            type="date"
            {...register("deliveryDate")}
            className={formControlClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="expense-installation-date" className="text-sm">
            Installation date (optional)
          </label>
          <input
            id="expense-installation-date"
            type="date"
            {...register("installationDate")}
            className={formControlClassName}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="add-same-as-delivery-date"
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
          <label htmlFor="add-same-as-delivery-date" className="text-sm">
            Same as delivery date
          </label>
        </div>

        <div className="space-y-2">
          <label htmlFor="expense-contact-person-name" className="text-sm">
            Contact person name (optional)
          </label>
          <input
            id="expense-contact-person-name"
            {...register("contactPersonName")}
            className={formControlClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="expense-contact-person-email" className="text-sm">
            Contact person email (optional)
          </label>
          <input
            id="expense-contact-person-email"
            type="email"
            {...register("contactPersonEmail")}
            className={formControlClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="expense-contact-person-mobile" className="text-sm">
            Contact person mobile (optional)
          </label>
          <input
            id="expense-contact-person-mobile"
            {...register("contactPersonMobile")}
            className={formControlClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="expense-company-brand-name" className="text-sm">
            Company / brand name (optional)
          </label>
          <input
            id="expense-company-brand-name"
            {...register("companyBrandName")}
            className={formControlClassName}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="add-delivery-scheduled"
            type="checkbox"
            {...register("deliveryScheduled")}
            className="h-4 w-4 appearance-none border border-border bg-background checked:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          />
          <label htmlFor="add-delivery-scheduled" className="text-sm">
            Delivery scheduled
          </label>
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
