"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

const formControlClassName =
  "h-10 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground";

type EditZoneValues = {
  name: string;
};

interface EditZoneDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (zoneName: string) => Promise<void>;
  isSubmitting: boolean;
  errorMessage: string | null;
  initialName: string | null;
}

export const EditZoneDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  errorMessage,
  initialName
}: EditZoneDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<EditZoneValues>({
    defaultValues: {
      name: ""
    }
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({ name: initialName ?? "" });
  }, [initialName, open, reset]);

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

  const handleFormSubmit = async (values: EditZoneValues): Promise<void> => {
    await onSubmit(values.name);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Edit zone"
      description="Update the name of this zone."
    >
      <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-2">
          <label htmlFor="edit-zone-name" className="text-sm">
            Zone name
          </label>
          <input
            id="edit-zone-name"
            {...register("name", {
              required: "Zone name is required."
            })}
            className={formControlClassName}
          />
          {errors.name ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.name.message}</p> : null}
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
