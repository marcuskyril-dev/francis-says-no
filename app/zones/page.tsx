"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AddExpenseDialog, type AddExpenseValues } from "@/components/zones/add-expense-dialog";
import { EditExpenseDialog, type EditExpenseValues } from "@/components/zones/edit-expense-dialog";
import {
  AddWishlistItemDialog,
  type AddWishlistItemValues
} from "@/components/zones/add-wishlist-item-dialog";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateExpenseMutation,
  useCreateWishlistItemMutation,
  useCurrentBudgetRoleQuery,
  useDeleteExpenseMutation,
  useUpdateExpenseMutation,
  useZoneDetailQuery
} from "@/hooks/useProjectQueries";
import { authService } from "@/services/auth.service";
import type { PurchasedItemRecord } from "@/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

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

type SortKey =
  | "purchasedItemName"
  | "actualItemName"
  | "description"
  | "budget"
  | "amountSpent"
  | "difference"
  | "purchaseDate";
type SortDirection = "asc" | "desc";

const ZoneDetailContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const zoneId = useMemo(() => {
    const value = searchParams.get("zoneId");
    return value && value.length > 0 ? value : null;
  }, [searchParams]);
  const { user } = useAuth();
  const { data, isLoading, error } = useZoneDetailQuery(zoneId, Boolean(user));
  const createExpenseMutation = useCreateExpenseMutation(zoneId);
  const updateExpenseMutation = useUpdateExpenseMutation(zoneId);
  const deleteExpenseMutation = useDeleteExpenseMutation(zoneId);
  const createWishlistItemMutation = useCreateWishlistItemMutation(zoneId);
  const { data: currentBudgetRole } = useCurrentBudgetRoleQuery(
    data?.zone.budgetId ?? null,
    Boolean(user) && Boolean(data?.zone.budgetId)
  );
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("purchaseDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);
  const [isAddWishlistItemDialogOpen, setIsAddWishlistItemDialogOpen] = useState(false);
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false);
  const [selectedExpenseRecord, setSelectedExpenseRecord] = useState<PurchasedItemRecord | null>(null);

  const sortPurchasedRecords = (records: PurchasedItemRecord[]): PurchasedItemRecord[] =>
    [...records].sort((left, right) => {
      if (sortKey === "budget" || sortKey === "amountSpent" || sortKey === "difference") {
        return sortDirection === "asc"
          ? left[sortKey] - right[sortKey]
          : right[sortKey] - left[sortKey];
      }

      if (sortKey === "purchaseDate") {
        const leftDate = new Date(left.purchaseDate ?? 0).getTime();
        const rightDate = new Date(right.purchaseDate ?? 0).getTime();
        return sortDirection === "asc" ? leftDate - rightDate : rightDate - leftDate;
      }

      const comparison = left[sortKey].localeCompare(right[sortKey], "en", { sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const sortedPurchasedItemRecords = useMemo(
    () => sortPurchasedRecords(data?.purchasedItemRecords ?? []),
    [data?.purchasedItemRecords, sortDirection, sortKey]
  );
  const zoneAllocatedBudget = useMemo(
    () =>
      data
        ? [...data.purchasedItems, ...data.unpurchasedItems].reduce(
          (sum, item) => sum + item.allocatedBudget,
          0
        )
        : 0,
    [data]
  );
  const zoneAmountSpent = useMemo(
    () =>
      data
        ? [...data.purchasedItems, ...data.unpurchasedItems].reduce((sum, item) => sum + item.amountSpent, 0)
        : 0,
    [data]
  );
  const zoneBudgetLeft = zoneAllocatedBudget - zoneAmountSpent;
  const canEditBudget =
    currentBudgetRole === "owner" || currentBudgetRole === "admin" || currentBudgetRole === "maintainer";
  const canDeleteBudgetData = currentBudgetRole === "owner" || currentBudgetRole === "admin";
  const zoneItems = useMemo(
    () => (data ? [...data.unpurchasedItems, ...data.purchasedItems] : []),
    [data]
  );

  const handleSort = (nextKey: SortKey): void => {
    if (sortKey === nextKey) {
      setSortDirection((previousDirection) => (previousDirection === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "purchaseDate" ? "desc" : "asc");
  };

  const handleSignOut = async () => {
    setErrorMessage(null);
    setIsSigningOut(true);

    try {
      await authService.signOut();
      router.replace("/login");
    } catch (signOutError) {
      setErrorMessage(signOutError instanceof Error ? signOutError.message : "Unable to sign out.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleAddExpenseSubmit = async (values: AddExpenseValues) => {
    if (!canEditBudget) {
      throw new Error("You do not have permission to add expenses for this budget.");
    }

    await createExpenseMutation.mutateAsync({
      wishlistItemId: values.wishlistItemId,
      amount: values.amount,
      description: values.description,
      expenseDate: values.expenseDate
    });
  };

  const handleAddWishlistItemSubmit = async (values: AddWishlistItemValues) => {
    if (!canEditBudget) {
      throw new Error("You do not have permission to add wishlist items for this budget.");
    }

    await createWishlistItemMutation.mutateAsync({
      name: values.name,
      budget: values.budget
    });
  };

  const handleEditExpenseSubmit = async (values: EditExpenseValues) => {
    if (!canEditBudget) {
      throw new Error("You do not have permission to edit expenses for this budget.");
    }

    if (!selectedExpenseRecord) {
      return;
    }

    await updateExpenseMutation.mutateAsync({
      expenseId: selectedExpenseRecord.id,
      wishlistItemId: values.wishlistItemId,
      amount: values.amount,
      description: values.description,
      expenseDate: values.expenseDate
    });
    setIsEditExpenseDialogOpen(false);
    setSelectedExpenseRecord(null);
  };

  const handleDeleteExpenseSubmit = async () => {
    if (!canDeleteBudgetData) {
      throw new Error("You do not have permission to delete expenses for this budget.");
    }

    if (!selectedExpenseRecord) {
      return;
    }

    await deleteExpenseMutation.mutateAsync(selectedExpenseRecord.id);
    setIsEditExpenseDialogOpen(false);
    setSelectedExpenseRecord(null);
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-background text-foreground">
        <Navbar
          email={user?.email ?? "Signed in"}
          onLogout={handleSignOut}
          isLoggingOut={isSigningOut}
        />
        <section className="mx-auto max-w-7xl px-6 py-10">
          <header className="mb-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <Link
                  href="/"
                  className="text-xs text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
                >
                  Back to dashboard
                </Link>
                <h1 className="text-2xl tracking-tight">{data?.zone.name ?? "Zone detail"}</h1>
              </div>
              {currentBudgetRole ? (
                <p className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                  Role: {currentBudgetRole}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                {canEditBudget ? (
                  <AddWishlistItemDialog
                    open={isAddWishlistItemDialogOpen}
                    onOpenChange={(isOpen) => {
                      setIsAddWishlistItemDialogOpen(isOpen);
                      if (!isOpen) {
                        createWishlistItemMutation.reset();
                      }
                    }}
                    onSubmit={handleAddWishlistItemSubmit}
                    isSubmitting={createWishlistItemMutation.isPending}
                    errorMessage={createWishlistItemMutation.error?.message ?? null}
                  />
                ) : null}

                {canEditBudget ? (
                  <AddExpenseDialog
                    open={isAddExpenseDialogOpen}
                    onOpenChange={(isOpen) => {
                      setIsAddExpenseDialogOpen(isOpen);
                      if (!isOpen) {
                        createExpenseMutation.reset();
                      }
                    }}
                    onSubmit={handleAddExpenseSubmit}
                    isSubmitting={createExpenseMutation.isPending}
                    errorMessage={createExpenseMutation.error?.message ?? null}
                    items={zoneItems}
                  />
                ) : null}

                <EditExpenseDialog
                  open={isEditExpenseDialogOpen}
                  onOpenChange={(isOpen) => {
                    setIsEditExpenseDialogOpen(isOpen);
                    if (!isOpen) {
                      setSelectedExpenseRecord(null);
                      updateExpenseMutation.reset();
                      deleteExpenseMutation.reset();
                    }
                  }}
                  onUpdate={handleEditExpenseSubmit}
                  onDelete={handleDeleteExpenseSubmit}
                  isUpdating={updateExpenseMutation.isPending}
                  isDeleting={deleteExpenseMutation.isPending}
                  allowDelete={canDeleteBudgetData}
                  errorMessage={
                    updateExpenseMutation.error?.message ?? deleteExpenseMutation.error?.message ?? null
                  }
                  items={zoneItems}
                  initialValues={
                    selectedExpenseRecord
                      ? {
                        wishlistItemId: selectedExpenseRecord.wishlistItemId,
                        amount: selectedExpenseRecord.amountSpent,
                        description: selectedExpenseRecord.expenseDescription,
                        expenseDate: toDateInputValue(selectedExpenseRecord.purchaseDate)
                      }
                      : null
                  }
                />
              </div>
            </div>
            {errorMessage ? (
              <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{errorMessage}</p>
            ) : null}
            {error ? <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{error.message}</p> : null}
          </header>

          {isLoading ? (
            <Card className="max-w-xl">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading zone details...</p>
            </Card>
          ) : null}

          {!isLoading && !zoneId ? (
            <Card className="max-w-xl">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Missing zone id.</p>
            </Card>
          ) : null}

          {!isLoading && zoneId && !data ? (
            <Card className="max-w-xl">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Zone not found.</p>
            </Card>
          ) : null}

          {data ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                  <p className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                    Amount spent
                  </p>
                  <p className="mt-2 text-xl">{formatCurrency(zoneAmountSpent, data.zone.currency)}</p>
                </Card>
                <Card>
                  <p className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                    Allocated budget
                  </p>
                  <p className="mt-2 text-xl">{formatCurrency(zoneAllocatedBudget, data.zone.currency)}</p>
                </Card>
                <Card>
                  <p className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                    Budget left
                  </p>
                  <p className="mt-2 text-xl">
                    <span style={zoneBudgetLeft < 0 ? { color: "#CC1000" } : undefined}>
                      {zoneBudgetLeft < 0
                        ? `(${formatCurrency(Math.abs(zoneBudgetLeft), data.zone.currency)})`
                        : formatCurrency(zoneBudgetLeft, data.zone.currency)}
                    </span>
                  </p>
                </Card>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                  <h2 className="text-lg tracking-tight">Purchased items</h2>
                  {data.purchasedItems.length === 0 ? (
                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">No purchased items yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {data.purchasedItems.map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                          <span>{item.name}</span>
                          <span>{formatCurrency(item.amountSpent, data.zone.currency)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card>
                  <h2 className="text-lg tracking-tight">Items not purchased</h2>
                  {data.unpurchasedItems.length === 0 ? (
                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                      All items have purchase activity.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {data.unpurchasedItems.map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                          <span>{item.name}</span>
                          <span>{formatCurrency(item.allocatedBudget, data.zone.currency)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>

              <Card className="mt-6">
                <h2 className="text-lg tracking-tight">Purchased item records</h2>
                {sortedPurchasedItemRecords.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    No purchased item records yet.
                  </p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-2 py-2 text-left">
                            <button className="text-left" type="button" onClick={() => handleSort("purchasedItemName")}>
                              Item
                            </button>
                          </th>
                          <th className="px-2 py-2 text-left">
                            <button className="text-left" type="button" onClick={() => handleSort("description")}>
                              Description
                            </button>
                          </th>
                          <th className="px-2 py-2 text-left">
                            <button className="text-left" type="button" onClick={() => handleSort("budget")}>
                              Budget
                            </button>
                          </th>
                          <th className="px-2 py-2 text-left">
                            <button className="text-left" type="button" onClick={() => handleSort("amountSpent")}>
                              Amount spent
                            </button>
                          </th>
                          <th className="px-2 py-2 text-left">
                            <button className="text-left" type="button" onClick={() => handleSort("difference")}>
                              Difference
                            </button>
                          </th>
                          <th className="px-2 py-2 text-left">
                            <button className="text-left" type="button" onClick={() => handleSort("purchaseDate")}>
                              Purchase date
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPurchasedItemRecords.map((record, index) => (
                          <tr
                            key={record.id}
                            className={
                              index === sortedPurchasedItemRecords.length - 1
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
                              setSelectedExpenseRecord(record);
                              setIsEditExpenseDialogOpen(true);
                            }}
                          >
                            <td className="px-2 py-2">{record.purchasedItemName}</td>
                            <td className="px-2 py-2">{record.description}</td>
                            <td className="px-2 py-2">{formatCurrency(record.budget, data.zone.currency)}</td>
                            <td className="px-2 py-2">
                              {formatCurrency(record.amountSpent, data.zone.currency)}
                            </td>
                            <td className="px-2 py-2">
                              <span
                                style={record.difference < 0 ? { color: "#CC1000" } : undefined}
                              >
                                {record.difference < 0
                                  ? `(${formatCurrency(Math.abs(record.difference), data.zone.currency)})`
                                  : formatCurrency(record.difference, data.zone.currency)}
                              </span>
                            </td>
                            <td className="px-2 py-2">{formatDate(record.purchaseDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          ) : null}
        </section>
      </main>
    </AuthGuard>
  );
};

const ZoneDetailPage = () => (
  <Suspense
    fallback={
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-7xl px-6 py-10">
          <Card className="w-full max-w-xl">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading zone details...</p>
          </Card>
        </section>
      </main>
    }
  >
    <ZoneDetailContent />
  </Suspense>
);

export default ZoneDetailPage;
