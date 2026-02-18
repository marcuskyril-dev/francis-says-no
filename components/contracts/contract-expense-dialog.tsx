"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { ContractExpenseType } from "@/types";

const formControlClassName =
  "h-10 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground";

export type ContractExpenseFormValues = {
  expenseType: ContractExpenseType;
  expenseName: string;
  notes: string;
  vendorName: string;
  contractTotalAmount: string;
  payments: Array<{
    amount: string;
    paidAt: string;
    notes: string;
  }>;
};

interface ContractExpenseDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: ContractExpenseFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  isSubmitting: boolean;
  isDeleting?: boolean;
  allowDelete?: boolean;
  errorMessage: string | null;
  title: string;
  submitLabel: string;
  initialValues: ContractExpenseFormValues | null;
}

export const ContractExpenseDialog = ({
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  isSubmitting,
  isDeleting = false,
  allowDelete = false,
  errorMessage,
  title,
  submitLabel,
  initialValues
}: ContractExpenseDialogProps) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContractExpenseFormValues>({
    defaultValues: {
      expenseType: "renovation_cost",
      expenseName: "",
      notes: "",
      vendorName: "",
      contractTotalAmount: "",
      payments: [{ amount: "", paidAt: "", notes: "" }]
    }
  });
  const [paymentsValidationMessage, setPaymentsValidationMessage] = useState<string | null>(null);
  const {
    fields: paymentFields,
    append: appendPayment,
    remove: removePayment
  } = useFieldArray({ control, name: "payments", keyName: "fieldId" });

  useEffect(() => {
    if (!open || !initialValues) {
      return;
    }
    reset(initialValues);
    setPaymentsValidationMessage(null);
  }, [initialValues, open, reset]);

  const handleCancel = (): void => {
    onOpenChange(false);
    reset();
    setPaymentsValidationMessage(null);
  };

  const handleDelete = async (): Promise<void> => {
    if (!allowDelete || !onDelete) {
      return;
    }
    if (!window.confirm("Delete this contract expense? This action cannot be undone.")) {
      return;
    }
    await onDelete();
  };

  const handleFormSubmit = async (values: ContractExpenseFormValues): Promise<void> => {
    const hasAtLeastOnePayment = values.payments.some((payment) => {
      const amount = Number(payment.amount);
      return Number.isFinite(amount) && amount > 0 && payment.paidAt.trim().length > 0;
    });
    if (!hasAtLeastOnePayment) {
      setPaymentsValidationMessage("At least one actual payment is required before saving.");
      return;
    }
    setPaymentsValidationMessage(null);
    await onSubmit(values);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      maxWidth="2xl"
      scrollable={true}
    >
      {allowDelete ? (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isSubmitting}
            className="text-xs text-[#CC1000] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="contract-expense-type" className="text-sm">
              Expense type
            </label>
            <select id="contract-expense-type" {...register("expenseType")} className={formControlClassName}>
              <option value="renovation_cost">Renovation cost</option>
              <option value="variation_order">Variation order (VO)</option>
              <option value="external_service">External service</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="contract-expense-name" className="text-sm">
            Name of expense
          </label>
          <input
            id="contract-expense-name"
            {...register("expenseName", { required: "Expense name is required." })}
            className={formControlClassName}
          />
          {errors.expenseName ? (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.expenseName.message}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="contract-expense-vendor-name" className="text-sm">
              Vendor name
            </label>
            <input
              id="contract-expense-vendor-name"
              {...register("vendorName", { required: "Vendor name is required." })}
              className={formControlClassName}
            />
            {errors.vendorName ? (
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.vendorName.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label htmlFor="contract-total-amount" className="text-sm">
              Total contract cost (optional)
            </label>
            <input
              id="contract-total-amount"
              type="number"
              step="0.01"
              min="0"
              {...register("contractTotalAmount")}
              className={formControlClassName}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="contract-notes" className="text-sm">
            Notes
          </label>
          <textarea
            id="contract-notes"
            {...register("notes")}
            className="min-h-24 w-full border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          />
        </div>

        <div className="space-y-3 border border-border p-3">
          <p className="text-sm">Actual payments</p>
          {paymentFields.map((field, index) => (
            <div key={field.fieldId} className="grid grid-cols-1 gap-2 border border-border p-2 md:grid-cols-3">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount"
                {...register(`payments.${index}.amount` as const)}
                className={formControlClassName}
              />
              <input
                type="date"
                {...register(`payments.${index}.paidAt` as const)}
                className={formControlClassName}
              />
              <input
                placeholder="Payment notes"
                {...register(`payments.${index}.notes` as const)}
                className={formControlClassName}
              />
              <button type="button" className="text-left text-xs underline" onClick={() => removePayment(index)}>
                Remove payment
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-xs underline"
            onClick={() => appendPayment({ amount: "", paidAt: "", notes: "" })}
          >
            + Add payment
          </button>
          {paymentsValidationMessage ? (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{paymentsValidationMessage}</p>
          ) : null}
        </div>

        {errorMessage ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errorMessage}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isDeleting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
