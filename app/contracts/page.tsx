"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AuthGuard } from "@/components/auth/AuthGuard";
import {
  ContractExpenseDialog,
  type ContractExpenseFormValues
} from "@/components/contracts/contract-expense-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  useContractExpenseSummaryQuery,
  useContractExpensesQuery,
  useCreateContractExpenseMutation,
  useCurrentBudgetRoleQuery,
  useDeleteContractExpenseMutation,
  useProjectsQuery,
  useUpdateContractExpenseMutation
} from "@/hooks/useProjectQueries";
import { useProjectStore } from "@/hooks/useProjectStore";
import type { ContractExpense, ContractExpenseType } from "@/types";

const formatCurrency = (amount: number, currency: string): string =>
  new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(amount);

const formatDate = (value: string | null): string => {
  if (!value) {
    return "-";
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-SG", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(parsedDate);
};

const toDateInputValue = (value: string | null): string => {
  if (!value) {
    return "";
  }
  const datePrefixMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (datePrefixMatch) {
    return datePrefixMatch[1];
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }
  return parsedDate.toISOString().slice(0, 10);
};

const expenseTypeLabel = (value: ContractExpenseType): string => {
  if (value === "renovation_cost") {
    return "Renovation";
  }
  if (value === "variation_order") {
    return "VO";
  }
  return "External service";
};

const ContractsPage = () => {
  const { user } = useAuth();
  const { selectedProjectId, setSelectedProjectId } = useProjectStore();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjectsQuery(Boolean(user));
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );
  const { data: currentBudgetRole } = useCurrentBudgetRoleQuery(selectedProjectId, Boolean(user));
  const canEditBudget = currentBudgetRole === "owner" || currentBudgetRole === "admin" || currentBudgetRole === "maintainer";
  const canDeleteBudgetData = currentBudgetRole === "owner" || currentBudgetRole === "admin";

  const {
    data: contractExpenses = [],
    isLoading: isContractExpensesLoading,
    error: contractExpensesError
  } = useContractExpensesQuery(selectedProjectId, Boolean(user));
  const { data: contractSummary } = useContractExpenseSummaryQuery(selectedProjectId, Boolean(user));
  const createContractExpenseMutation = useCreateContractExpenseMutation(selectedProjectId);
  const updateContractExpenseMutation = useUpdateContractExpenseMutation(selectedProjectId);
  const deleteContractExpenseMutation = useDeleteContractExpenseMutation(selectedProjectId);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedContractExpense, setSelectedContractExpense] = useState<ContractExpense | null>(null);

  useEffect(() => {
    if (projects.length === 0) {
      return;
    }
    const hasSelectedProject = projects.some((project) => project.id === selectedProjectId);
    if (!hasSelectedProject) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId, setSelectedProjectId]);

  const parseOptionalAmount = (value: string): number | undefined => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  };

  const toPaymentInput = (values: ContractExpenseFormValues["payments"]) =>
    values
      .map((payment) => ({
        amount: parseOptionalAmount(payment.amount),
        paidAt: payment.paidAt,
        notes: payment.notes
      }))
      .filter((payment) => payment.amount !== undefined && payment.paidAt.trim().length > 0)
      .map((payment) => ({
        amount: payment.amount as number,
        paidAt: payment.paidAt,
        notes: payment.notes
      }));

  const handleCreateContractExpense = async (values: ContractExpenseFormValues): Promise<void> => {
    if (!canEditBudget) {
      throw new Error("You do not have permission to add contract expenses for this budget.");
    }
    await createContractExpenseMutation.mutateAsync({
      expenseType: values.expenseType,
      expenseName: values.expenseName,
      notes: values.notes,
      vendorName: values.vendorName,
      contractTotalAmount: parseOptionalAmount(values.contractTotalAmount),
      payments: toPaymentInput(values.payments)
    });
  };

  const handleUpdateContractExpense = async (values: ContractExpenseFormValues): Promise<void> => {
    if (!canEditBudget) {
      throw new Error("You do not have permission to edit contract expenses for this budget.");
    }
    if (!selectedContractExpense) {
      return;
    }
    await updateContractExpenseMutation.mutateAsync({
      contractExpenseId: selectedContractExpense.id,
      expenseType: values.expenseType,
      expenseName: values.expenseName,
      notes: values.notes,
      vendorName: values.vendorName,
      contractTotalAmount: parseOptionalAmount(values.contractTotalAmount),
      payments: toPaymentInput(values.payments)
    });
    setIsEditDialogOpen(false);
    setSelectedContractExpense(null);
  };

  const handleDeleteContractExpense = async (): Promise<void> => {
    if (!canDeleteBudgetData) {
      throw new Error("You do not have permission to delete contract expenses for this budget.");
    }
    if (!selectedContractExpense) {
      return;
    }
    await deleteContractExpenseMutation.mutateAsync(selectedContractExpense.id);
    setIsEditDialogOpen(false);
    setSelectedContractExpense(null);
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <header className="mb-6">
            <Link href="/" className="text-xs text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400">
              Back to dashboard
            </Link>
            <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl tracking-tight">Contract expenses</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {selectedProject?.name ?? "No budget selected"}
                </p>
              </div>
              {canEditBudget ? (
                <Button onClick={() => setIsCreateDialogOpen(true)}>Add contract expense</Button>
              ) : null}
            </div>
          </header>

          {isProjectsLoading || isContractExpensesLoading ? (
            <p className="text-sm text-center text-zinc-600 dark:text-zinc-400">Loading contract expenses...</p>
          ) : null}

          {!isProjectsLoading && projects.length === 0 ? (
            <Card className="w-full text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">No budget found for this account yet.</p>
            </Card>
          ) : null}

          {contractSummary ? (
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card>
                <p className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Total contracts</p>
                <p className="mt-2 text-xl">{contractSummary.expensesCount}</p>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Contract total</p>
                <p className="mt-2 text-xl">
                  {formatCurrency(contractSummary.totalContractCost, selectedProject?.currency ?? "SGD")}
                </p>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Paid to date</p>
                <p className="mt-2 text-xl">
                  {formatCurrency(contractSummary.paidToDate, selectedProject?.currency ?? "SGD")}
                </p>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Remaining</p>
                <p className="mt-2 text-xl">
                  {formatCurrency(contractSummary.remainingBalance, selectedProject?.currency ?? "SGD")}
                </p>
              </Card>
            </div>
          ) : null}

          <Card>
            <h2 className="text-lg tracking-tight">All contract expenses</h2>
            {contractExpensesError ? (
              <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{contractExpensesError.message}</p>
            ) : null}
            {contractExpenses.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">No contract expenses yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-2 py-2">Type</th>
                      <th className="px-2 py-2">Expense</th>
                      <th className="px-2 py-2">Vendor</th>
                      <th className="px-2 py-2">Date</th>
                      <th className="px-2 py-2">Total</th>
                      <th className="px-2 py-2">Paid to date</th>
                      <th className="px-2 py-2">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractExpenses.map((expense, index) => (
                      <tr
                        key={expense.id}
                        className={
                          index === contractExpenses.length - 1
                            ? canEditBudget
                              ? "cursor-pointer hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60"
                              : ""
                            : canEditBudget
                              ? "cursor-pointer border-b border-border/60 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60"
                              : "border-b border-border/60"
                        }
                        onClick={() => {
                          if (!canEditBudget) {
                            return;
                          }
                          setSelectedContractExpense(expense);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <td className="px-2 py-2">{expenseTypeLabel(expense.expenseType)}</td>
                        <td className="px-2 py-2">{expense.expenseName}</td>
                        <td className="px-2 py-2">{expense.vendorName}</td>
                        <td className="px-2 py-2">{formatDate(expense.expenseDate)}</td>
                        <td className="px-2 py-2">
                          {formatCurrency(expense.totalContractCost, selectedProject?.currency ?? "SGD")}
                        </td>
                        <td className="px-2 py-2">
                          {formatCurrency(expense.paidToDate, selectedProject?.currency ?? "SGD")}
                        </td>
                        <td className="px-2 py-2">
                          {formatCurrency(expense.remainingBalance, selectedProject?.currency ?? "SGD")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <ContractExpenseDialog
            open={isCreateDialogOpen}
            onOpenChange={(isOpen) => {
              setIsCreateDialogOpen(isOpen);
              if (!isOpen) {
                createContractExpenseMutation.reset();
              }
            }}
            onSubmit={handleCreateContractExpense}
            isSubmitting={createContractExpenseMutation.isPending}
            errorMessage={createContractExpenseMutation.error?.message ?? null}
            title="Add contract expense"
            submitLabel="Save contract expense"
            initialValues={null}
          />

          <ContractExpenseDialog
            open={isEditDialogOpen}
            onOpenChange={(isOpen) => {
              setIsEditDialogOpen(isOpen);
              if (!isOpen) {
                setSelectedContractExpense(null);
                updateContractExpenseMutation.reset();
                deleteContractExpenseMutation.reset();
              }
            }}
            onSubmit={handleUpdateContractExpense}
            onDelete={handleDeleteContractExpense}
            isSubmitting={updateContractExpenseMutation.isPending}
            isDeleting={deleteContractExpenseMutation.isPending}
            allowDelete={canDeleteBudgetData}
            errorMessage={
              updateContractExpenseMutation.error?.message ?? deleteContractExpenseMutation.error?.message ?? null
            }
            title="Edit contract expense"
            submitLabel="Update contract expense"
            initialValues={
              selectedContractExpense
                ? {
                    expenseType: selectedContractExpense.expenseType,
                    expenseName: selectedContractExpense.expenseName,
                    notes: selectedContractExpense.notes,
                    vendorName: selectedContractExpense.vendorName,
                    contractTotalAmount: selectedContractExpense.contractTotalAmount?.toString() ?? "",
                    payments:
                      selectedContractExpense.payments.length > 0
                        ? selectedContractExpense.payments.map((payment) => ({
                            amount: payment.amount.toString(),
                            paidAt: toDateInputValue(payment.paidAt),
                            notes: payment.notes ?? ""
                          }))
                        : [{ amount: "", paidAt: "", notes: "" }]
                  }
                : null
            }
          />
        </section>
      </main>
    </AuthGuard>
  );
};

export default ContractsPage;
