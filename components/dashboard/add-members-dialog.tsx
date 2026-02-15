"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useInviteBudgetMemberMutation } from "@/hooks/useProjectQueries";
import type { BudgetRole } from "@/types";

interface AddMembersDialogProps {
  projectId: string | null;
  disabled?: boolean;
}

type AddMemberFormValues = {
  email: string;
  role: BudgetRole;
};

const formControlClassName =
  "h-10 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground";

export const AddMembersDialog = ({ projectId, disabled = false }: AddMembersDialogProps) => {
  const [open, setOpen] = useState(false);
  const inviteBudgetMemberMutation = useInviteBudgetMemberMutation(projectId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<AddMemberFormValues>({
    defaultValues: {
      email: "",
      role: "guest"
    }
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      reset();
      inviteBudgetMemberMutation.reset();
    }
  };

  const handleCancel = () => {
    setOpen(false);
    reset();
    inviteBudgetMemberMutation.reset();
  };

  const handleAddMemberSubmit = async (values: AddMemberFormValues): Promise<void> => {
    await inviteBudgetMemberMutation.mutateAsync({
      email: values.email,
      role: values.role
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Add members"
      description="Invite people to collaborate on this budget."
      trigger={
        <button
          type="button"
          disabled={disabled}
          className="text-sm underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add members
        </button>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(handleAddMemberSubmit)}>
        <div className="space-y-2">
          <label htmlFor="member-email" className="text-sm">
            Email
          </label>
          <input
            id="member-email"
            type="email"
            placeholder="name@example.com"
            {...register("email", {
              required: "Email is required."
            })}
            className={formControlClassName}
          />
          {errors.email ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="member-role" className="text-sm">
            Role
          </label>
          <select
            id="member-role"
            {...register("role", {
              required: "Role is required."
            })}
            className={formControlClassName}
          >
            <option value="guest">Guest</option>
            <option value="maintainer">Maintainer</option>
            <option value="admin">Admin</option>
          </select>
          {errors.role ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{errors.role.message}</p> : null}
        </div>

        {inviteBudgetMemberMutation.error ? (
          <p className="text-sm text-[#CC1000] dark:text-zinc-300">
            {inviteBudgetMemberMutation.error.message}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={inviteBudgetMemberMutation.isPending}>
            {inviteBudgetMemberMutation.isPending ? "Adding..." : "Add member"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
