import type { Expense } from "@/types";
import { supabase, toServiceError } from "@/services/supabase";

interface WishlistIdRow {
  id: string;
}

interface ExpenseRow {
  id: string;
  wishlist_item_id: string;
  amount: number;
  description: string | null;
  expense_date: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateExpenseInput {
  wishlistItemId: string;
  amount: number;
  description?: string;
  expenseDate?: string;
}

interface UpdateExpenseInput {
  expenseId: string;
  wishlistItemId: string;
  amount: number;
  description?: string;
  expenseDate?: string;
}

const mapExpenseRow = (row: ExpenseRow): Expense => ({
  id: row.id,
  wishlistItemId: row.wishlist_item_id,
  amount: Number(row.amount),
  description: row.description,
  expenseDate: row.expense_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const expenseService = {
  listByProjectId: async (projectId: string): Promise<Expense[]> => {
    const { data: wishlistItems, error: wishlistError } = await supabase
      .from("wishlist_items")
      .select("id, zones!inner(budget_id)")
      .eq("zones.budget_id", projectId);

    if (wishlistError) {
      throw toServiceError("Failed to resolve project wishlist items", wishlistError);
    }

    const wishlistIds = (wishlistItems ?? []).map((row) => (row as WishlistIdRow).id);
    if (wishlistIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("expenses")
      .select("id, wishlist_item_id, amount, description, expense_date, created_at, updated_at")
      .in("wishlist_item_id", wishlistIds)
      .order("created_at", { ascending: false });

    if (error) {
      throw toServiceError("Failed to list project expenses", error);
    }

    return (data ?? []).map((row) => mapExpenseRow(row as ExpenseRow));
  },

  create: async (input: CreateExpenseInput): Promise<Expense> => {
    const description = input.description?.trim();
    const expenseDate = input.expenseDate?.trim();
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        wishlist_item_id: input.wishlistItemId,
        amount: input.amount,
        description: description && description.length > 0 ? description : null,
        expense_date: expenseDate && expenseDate.length > 0 ? expenseDate : null
      })
      .select("id, wishlist_item_id, amount, description, expense_date, created_at, updated_at")
      .single();

    if (error) {
      throw toServiceError("Failed to create expense", error);
    }

    return mapExpenseRow(data as ExpenseRow);
  },

  update: async (input: UpdateExpenseInput): Promise<Expense> => {
    const description = input.description?.trim();
    const expenseDate = input.expenseDate?.trim();
    const { data, error } = await supabase
      .from("expenses")
      .update({
        wishlist_item_id: input.wishlistItemId,
        amount: input.amount,
        description: description && description.length > 0 ? description : null,
        expense_date: expenseDate && expenseDate.length > 0 ? expenseDate : null
      })
      .eq("id", input.expenseId)
      .select("id, wishlist_item_id, amount, description, expense_date, created_at, updated_at")
      .single();

    if (error) {
      throw toServiceError("Failed to update expense", error);
    }

    return mapExpenseRow(data as ExpenseRow);
  },

  remove: async (expenseId: string): Promise<void> => {
    const { error } = await supabase.from("expenses").delete().eq("id", expenseId);

    if (error) {
      throw toServiceError("Failed to delete expense", error);
    }
  }
};
