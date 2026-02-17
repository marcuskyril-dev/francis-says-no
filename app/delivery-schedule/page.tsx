"use client";

import { useEffect } from "react";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { EditExpenseDialog, type EditExpenseValues } from "@/components/zones/edit-expense-dialog";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  queryKeys,
  useDeleteExpenseMutation,
  useDeliveryScheduleQuery,
  useProjectExpensesQuery,
  useProjectsQuery,
  useSetWishlistItemScheduleDatesMutation,
  useUpdateExpenseMutation
} from "@/hooks/useProjectQueries";
import { useProjectStore } from "@/hooks/useProjectStore";
import type { DeliveryScheduleItem, ZoneDetailItem } from "@/types";

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

type SortKey =
  | "item"
  | "zone"
  | "deliveryDate"
  | "installationDate"
  | "deliveryScheduled"
  | "contactPersonName"
  | "contactPersonEmail"
  | "contactPersonMobile"
  | "companyBrandName";
type SortDirection = "asc" | "desc";

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

const DeliverySchedulePage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedProjectId, setSelectedProjectId } = useProjectStore();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjectsQuery(Boolean(user));
  const { data: expenses = [] } = useProjectExpensesQuery(selectedProjectId, Boolean(user));
  const {
    data: scheduleItems = [],
    isLoading: isScheduleLoading,
    error: scheduleError
  } = useDeliveryScheduleQuery(selectedProjectId, Boolean(user));
  const updateExpenseMutation = useUpdateExpenseMutation(null);
  const deleteExpenseMutation = useDeleteExpenseMutation(null);
  const setWishlistItemScheduleDatesMutation = useSetWishlistItemScheduleDatesMutation(null);
  const [sortKey, setSortKey] = useState<SortKey>("deliveryDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<DeliveryScheduleItem | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [pageErrorMessage, setPageErrorMessage] = useState<string | null>(null);

  const sortedScheduleItems = useMemo(() => {
    const compareNullableDate = (left: string | null, right: string | null): number => {
      const leftTime = left ? new Date(left).getTime() : Number.POSITIVE_INFINITY;
      const rightTime = right ? new Date(right).getTime() : Number.POSITIVE_INFINITY;
      return leftTime - rightTime;
    };

    return [...scheduleItems].sort((left, right) => {
      let comparison = 0;

      if (sortKey === "item") {
        comparison = left.wishlistItemName.localeCompare(right.wishlistItemName, "en", {
          sensitivity: "base"
        });
      } else if (sortKey === "zone") {
        comparison = left.zoneName.localeCompare(right.zoneName, "en", {
          sensitivity: "base"
        });
      } else if (sortKey === "deliveryScheduled") {
        comparison = Number(left.deliveryScheduled) - Number(right.deliveryScheduled);
      } else if (sortKey === "contactPersonName") {
        comparison = (left.contactPersonName ?? "").localeCompare(right.contactPersonName ?? "", "en", {
          sensitivity: "base"
        });
      } else if (sortKey === "contactPersonEmail") {
        comparison = (left.contactPersonEmail ?? "").localeCompare(right.contactPersonEmail ?? "", "en", {
          sensitivity: "base"
        });
      } else if (sortKey === "contactPersonMobile") {
        comparison = (left.contactPersonMobile ?? "").localeCompare(right.contactPersonMobile ?? "", "en", {
          sensitivity: "base"
        });
      } else if (sortKey === "companyBrandName") {
        comparison = (left.companyBrandName ?? "").localeCompare(right.companyBrandName ?? "", "en", {
          sensitivity: "base"
        });
      } else if (sortKey === "deliveryDate") {
        comparison = compareNullableDate(left.deliveryDate, right.deliveryDate);
      } else {
        comparison = compareNullableDate(left.installationDate, right.installationDate);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [scheduleItems, sortDirection, sortKey]);

  const handleSort = (nextKey: SortKey): void => {
    if (sortKey === nextKey) {
      setSortDirection((previous) => (previous === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  };

  const editableItems = useMemo<ZoneDetailItem[]>(
    () =>
      scheduleItems.map((item) => ({
        id: item.wishlistItemId,
        name: item.wishlistItemName,
        allocatedBudget: 0,
        amountSpent: 0,
        mustPurchaseBefore: null
      })),
    [scheduleItems]
  );

  const latestExpenseByWishlistItemId = useMemo(() => {
    const map = new Map<string, (typeof expenses)[number]>();
    for (const expense of expenses) {
      const existingExpense = map.get(expense.wishlistItemId);
      if (!existingExpense) {
        map.set(expense.wishlistItemId, expense);
        continue;
      }

      const existingCreatedAt = new Date(existingExpense.createdAt).getTime();
      const nextCreatedAt = new Date(expense.createdAt).getTime();
      if (nextCreatedAt > existingCreatedAt) {
        map.set(expense.wishlistItemId, expense);
      }
    }

    return map;
  }, [expenses]);

  useEffect(() => {
    if (projects.length === 0) {
      return;
    }

    const hasSelectedProject = projects.some((project) => project.id === selectedProjectId);
    if (!hasSelectedProject) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId, setSelectedProjectId]);

  const handleEditExpenseSubmit = async (values: EditExpenseValues): Promise<void> => {
    if (!selectedExpenseId) {
      throw new Error("Expense id is required.");
    }

    await updateExpenseMutation.mutateAsync({
      expenseId: selectedExpenseId,
      wishlistItemId: values.wishlistItemId,
      amount: values.amount,
      description: values.description,
      expenseDate: values.expenseDate
    });

    await setWishlistItemScheduleDatesMutation.mutateAsync({
      wishlistItemId: values.wishlistItemId,
      deliveryDate: values.deliveryDate,
      installationDate: values.installationDate,
      deliveryScheduled: values.deliveryScheduled,
      contactPersonName: values.contactPersonName,
      contactPersonEmail: values.contactPersonEmail,
      contactPersonMobile: values.contactPersonMobile,
      companyBrandName: values.companyBrandName
    });

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.deliverySchedule(selectedProjectId ?? "none")
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectExpenses(selectedProjectId ?? "none")
      })
    ]);

    setIsEditExpenseDialogOpen(false);
    setSelectedExpenseId(null);
    setSelectedScheduleItem(null);
  };

  const handleDeleteExpense = async (): Promise<void> => {
    if (!selectedExpenseId) {
      throw new Error("Expense id is required.");
    }

    await deleteExpenseMutation.mutateAsync(selectedExpenseId);
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.deliverySchedule(selectedProjectId ?? "none")
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectExpenses(selectedProjectId ?? "none")
      })
    ]);

    setIsEditExpenseDialogOpen(false);
    setSelectedExpenseId(null);
    setSelectedScheduleItem(null);
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <header className="mb-6">
            <h1 className="text-2xl tracking-tight">Delivery schedule</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Items with scheduled delivery or installation dates.
            </p>
            {scheduleError ? <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{scheduleError.message}</p> : null}
            {pageErrorMessage ? <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{pageErrorMessage}</p> : null}
          </header>

          {isProjectsLoading || isScheduleLoading ? (
            <p className="text-sm text-center text-zinc-600 dark:text-zinc-400">Loading delivery schedule...</p>
          ) : null}

          {!isProjectsLoading && projects.length === 0 ? (
            <Card className="w-full text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">No budget found for this account yet.</p>
            </Card>
          ) : null}

          {!isScheduleLoading && projects.length > 0 && scheduleItems.length === 0 ? (
            <Card className="w-full text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No delivery or installation schedules yet.
              </p>
            </Card>
          ) : null}

          {!isScheduleLoading && scheduleItems.length > 0 ? (
            <Card>
              <h2 className="text-lg tracking-tight">Scheduled items</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-2 py-2">
                        <button type="button" className="text-left" onClick={() => handleSort("item")}>
                          Item
                        </button>
                      </th>
                      <th className="px-2 py-2">
                        <button type="button" className="text-left" onClick={() => handleSort("zone")}>
                          Zone
                        </button>
                      </th>
                      <th className="px-2 py-2">
                        <button type="button" className="text-left" onClick={() => handleSort("deliveryDate")}>
                          Delivery date
                        </button>
                      </th>
                      <th className="px-2 py-2">
                        <button type="button" className="text-left" onClick={() => handleSort("installationDate")}>
                          Installation date
                        </button>
                      </th>
                      <th className="px-2 py-2">
                        <button type="button" className="text-left" onClick={() => handleSort("deliveryScheduled")}>
                          Delivery scheduled
                        </button>
                      </th>
                      <th className="px-2 py-2">
                        <button type="button" className="text-left" onClick={() => handleSort("contactPersonName")}>
                          Contact person
                        </button>
                      </th>
                      <th className="px-2 py-2">
                        <button type="button" className="text-left" onClick={() => handleSort("contactPersonEmail")}>
                          Contact email
                        </button>
                      </th>
                      <th className="px-2 py-2">
                        <button type="button" className="text-left" onClick={() => handleSort("contactPersonMobile")}>
                          Contact mobile
                        </button>
                      </th>
                      <th className="px-2 py-2">
                        <button type="button" className="text-left" onClick={() => handleSort("companyBrandName")}>
                          Company / brand
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedScheduleItems.map((item, index) => (
                      <tr
                        key={`${item.wishlistItemId}-${item.zoneId}`}
                        className={
                          index === sortedScheduleItems.length - 1
                            ? "cursor-pointer hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60"
                            : "cursor-pointer border-b border-border/60 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60"
                        }
                        onClick={() => {
                          const latestExpense = latestExpenseByWishlistItemId.get(item.wishlistItemId);
                          if (!latestExpense) {
                            setPageErrorMessage("No expense found for this scheduled item yet.");
                            return;
                          }

                          setPageErrorMessage(null);
                          setSelectedScheduleItem(item);
                          setSelectedExpenseId(latestExpense.id);
                          setIsEditExpenseDialogOpen(true);
                        }}
                      >
                        <td className="px-2 py-2">{item.wishlistItemName}</td>
                        <td className="px-2 py-2">{item.zoneName}</td>
                        <td className="px-2 py-2">{formatDate(item.deliveryDate)}</td>
                        <td className="px-2 py-2">{formatDate(item.installationDate)}</td>
                        <td className="px-2 py-2">
                          {item.deliveryScheduled ? "Yes" : "No"}
                        </td>
                        <td className="px-2 py-2">{item.contactPersonName ?? "-"}</td>
                        <td className="px-2 py-2">{item.contactPersonEmail ?? "-"}</td>
                        <td className="px-2 py-2">{item.contactPersonMobile ?? "-"}</td>
                        <td className="px-2 py-2">{item.companyBrandName ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
          <EditExpenseDialog
            open={isEditExpenseDialogOpen}
            onOpenChange={(isOpen) => {
              setIsEditExpenseDialogOpen(isOpen);
              if (!isOpen) {
                setSelectedExpenseId(null);
                setSelectedScheduleItem(null);
                updateExpenseMutation.reset();
                deleteExpenseMutation.reset();
                setWishlistItemScheduleDatesMutation.reset();
              }
            }}
            onUpdate={handleEditExpenseSubmit}
            onDelete={handleDeleteExpense}
            isUpdating={updateExpenseMutation.isPending || setWishlistItemScheduleDatesMutation.isPending}
            isDeleting={deleteExpenseMutation.isPending}
            allowDelete
            errorMessage={
              updateExpenseMutation.error?.message ??
              deleteExpenseMutation.error?.message ??
              setWishlistItemScheduleDatesMutation.error?.message ??
              null
            }
            items={editableItems}
            initialValues={
              selectedScheduleItem
                ? {
                  wishlistItemId: selectedScheduleItem.wishlistItemId,
                  amount: latestExpenseByWishlistItemId.get(selectedScheduleItem.wishlistItemId)?.amount ?? 0,
                  description:
                    latestExpenseByWishlistItemId.get(selectedScheduleItem.wishlistItemId)?.description ?? "",
                  expenseDate: toDateInputValue(
                    latestExpenseByWishlistItemId.get(selectedScheduleItem.wishlistItemId)?.expenseDate ?? null
                  ),
                  deliveryDate: toDateInputValue(selectedScheduleItem.deliveryDate),
                  installationDate: toDateInputValue(selectedScheduleItem.installationDate),
                  deliveryScheduled: selectedScheduleItem.deliveryScheduled,
                  contactPersonName: selectedScheduleItem.contactPersonName ?? "",
                  contactPersonEmail: selectedScheduleItem.contactPersonEmail ?? "",
                  contactPersonMobile: selectedScheduleItem.contactPersonMobile ?? "",
                  companyBrandName: selectedScheduleItem.companyBrandName ?? ""
                }
                : null
            }
          />
        </section>
      </main>
    </AuthGuard>
  );
};

export default DeliverySchedulePage;
