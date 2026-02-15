"use client";

import { useForm } from "react-hook-form";

import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type AddZoneFormValues = {
  name: string;
};

interface AddZoneDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (zoneName: string) => Promise<void>;
  isSubmitting: boolean;
  errorMessage: string | null;
}

export const AddZoneDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  errorMessage
}: AddZoneDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<AddZoneFormValues>({
    defaultValues: {
      name: ""
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

  const handleFormSubmit = async (values: AddZoneFormValues): Promise<void> => {
    await onSubmit(values.name);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Add zone"
      description="Create a new renovation zone in this budget."
      trigger={
        <button type="button" className="block h-full w-full text-left">
          <Card className="flex h-full min-h-52 flex-col items-center justify-center text-center">
            <p className="text-4xl leading-none text-border">+</p>
            <h2 className="text-lg font-semibold tracking-tight">Add zone</h2>
          </Card>
        </button>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-2">
          <label htmlFor="zone-name" className="text-sm">
            Zone name
          </label>
          <input
            id="zone-name"
            {...register("name", {
              required: "Zone name is required."
            })}
            placeholder="e.g. Kitchen"
            className="h-10 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          />
          {errors.name ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.name.message}</p> : null}
          {errorMessage ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errorMessage}</p> : null}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add zone"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
