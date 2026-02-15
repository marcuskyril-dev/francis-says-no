"use client";

import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

type CreateBudgetFormValues = {
  name: string;
  totalBudget: string;
};

interface CreateBudgetDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: { name: string; totalBudget: number }) => Promise<void>;
  isSubmitting: boolean;
  errorMessage: string | null;
}

const formControlClassName =
  "h-10 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground";

export const CreateBudgetDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  errorMessage
}: CreateBudgetDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateBudgetFormValues>({
    defaultValues: {
      name: "",
      totalBudget: ""
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

  const handleFormSubmit = async (values: CreateBudgetFormValues): Promise<void> => {
    await onSubmit({
      name: values.name,
      totalBudget: Number(values.totalBudget)
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Create budget"
      description="Set up your first renovation budget."
    >
      <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-2">
          <label htmlFor="budget-name" className="text-sm">
            Budget name
          </label>
          <input
            id="budget-name"
            {...register("name", {
              required: "Budget name is required."
            })}
            placeholder="e.g. 4-room resale renovation"
            className={formControlClassName}
          />
          {errors.name ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.name.message}</p> : null}
        </div>

        {errorMessage ? <p className="text-sm text-[#CC1000] dark:text-zinc-300">{errorMessage}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create budget"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
