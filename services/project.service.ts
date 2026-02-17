import type {
  BudgetMember,
  BudgetMemberIdentity,
  BudgetRole,
  ContractExpenseSummary,
  DeliveryScheduleItem,
  Project,
  ProjectDashboardData,
  WishlistItemStatus,
  ZoneDetailData
} from "@/types";
import { supabase, toServiceError } from "@/services/supabase";

interface BudgetRow {
  id: string;
  name: string;
  total_budget: number;
  currency: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ZoneRow {
  id: string;
  name: string | null;
  budget_id?: string;
  allocated_budget?: number | string | null;
  allocatedBudget?: number | string | null;
  budgets?: Array<{
    currency: string | null;
  }> | null;
}

interface WishlistItemRow {
  id: string;
  zone_id: string;
  budget?: number | string | null;
  must_purchase_before?: string | null;
  status: WishlistItemStatus;
}

interface WishlistItemDetailRow {
  id: string;
  zone_id: string;
  name: string | null;
  budget: number | string | null;
  must_purchase_before: string | null;
  status: WishlistItemStatus;
}

interface ExpenseSummaryRow {
  wishlist_item_id: string;
  amount: number | string;
}

interface ExpenseDetailRow {
  id: string;
  wishlist_item_id: string;
  amount: number | string;
  description: string | null;
  expense_date: string | null;
}

interface WishlistItemEventRow {
  wishlist_item_id: string;
  event_type: "delivery" | "installation";
  scheduled_at: string;
  delivery_scheduled: boolean;
  contact_person_name: string | null;
  contact_person_email: string | null;
  contact_person_mobile: string | null;
  company_brand_name: string | null;
}

interface DeliveryScheduleRow {
  id: string;
  name: string | null;
  zone_id: string;
  status: WishlistItemStatus;
  zones:
    | {
      id: string;
      name: string | null;
      budget_id: string;
    }
    | Array<{
      id: string;
      name: string | null;
      budget_id: string;
    }>
    | null;
  wishlist_item_events:
    | Array<{
      event_type: "delivery" | "installation";
      scheduled_at: string;
      delivery_scheduled: boolean;
      contact_person_name: string | null;
      contact_person_email: string | null;
      contact_person_mobile: string | null;
      company_brand_name: string | null;
    }>
    | null;
}

interface BudgetMemberRow {
  budget_id: string;
  user_id: string;
  role: BudgetRole;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}

interface BudgetMemberIdentityRow {
  user_id: string;
  role: BudgetRole;
  email: string | null;
  first_name: string | null;
}

interface InviteBudgetMemberRow {
  member_user_id: string;
  member_role: BudgetRole;
  member_email: string | null;
  member_first_name: string | null;
}

const MISSING_USER_MESSAGE = "No user found for this email.";

const isMissingUserInviteError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.toLowerCase().includes(MISSING_USER_MESSAGE.toLowerCase());
};

const inviteAuthUserByEmail = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.admin.inviteUserByEmail(email);
  if (error) {
    throw toServiceError("Failed to invite auth user", error);
  }
};

const mapBudgetRowToProject = (row: BudgetRow): Project => ({
  id: row.id,
  name: row.name,
  totalBudget: Number(row.total_budget),
  currency: row.currency ?? "SGD",
  userId: row.user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapBudgetMemberRow = (row: BudgetMemberRow): BudgetMember => ({
  budgetId: row.budget_id,
  userId: row.user_id,
  role: row.role,
  invitedBy: row.invited_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapBudgetMemberIdentityRow = (row: BudgetMemberIdentityRow): BudgetMemberIdentity => ({
  userId: row.user_id,
  role: row.role,
  email: row.email,
  firstName: row.first_name
});

const getCurrentUserId = async (): Promise<string | null> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw toServiceError("Failed to resolve current user", error);
  }

  return data.user?.id ?? null;
};

const toNumber = (value: number | string | null | undefined): number => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
};

const sanitizeOptionalDate = (value: string | undefined): string | null => {
  const sanitizedValue = value?.trim();
  if (!sanitizedValue || sanitizedValue.length === 0) {
    return null;
  }

  return sanitizedValue;
};

const sanitizeOptionalText = (value: string | undefined): string | null => {
  const sanitizedValue = value?.trim();
  if (!sanitizedValue || sanitizedValue.length === 0) {
    return null;
  }

  return sanitizedValue;
};

const zeroContractExpenseSummary = (): ContractExpenseSummary => ({
  totalContractCost: 0,
  paidToDate: 0,
  remainingBalance: 0,
  expensesCount: 0
});

const buildContractExpenseSummary = async (budgetId: string): Promise<ContractExpenseSummary> => {
  const { data, error } = await supabase
    .from("project_contract_expense_summaries_v")
    .select("total_contract_cost, paid_to_date, remaining_balance")
    .eq("budget_id", budgetId);

  if (error) {
    throw toServiceError("Failed to build contract expense summary", error);
  }

  const rows = (data ?? []) as Array<{
    total_contract_cost: number | string;
    paid_to_date: number | string;
    remaining_balance: number | string;
  }>;

  return rows.reduce(
    (summary, row) => ({
      totalContractCost: summary.totalContractCost + toNumber(row.total_contract_cost),
      paidToDate: summary.paidToDate + toNumber(row.paid_to_date),
      remainingBalance: summary.remainingBalance + toNumber(row.remaining_balance),
      expensesCount: summary.expensesCount + 1
    }),
    zeroContractExpenseSummary()
  );
};

const buildDashboardData = async (budgetRow: BudgetRow): Promise<ProjectDashboardData> => {
  const { data: zoneData, error: zoneError } = await supabase
    .from("zones")
    .select("*")
    .eq("budget_id", budgetRow.id);

  if (zoneError) {
    throw toServiceError("Failed to list zones for budget", zoneError);
  }

  const zones = (zoneData ?? []) as ZoneRow[];
  if (zones.length === 0) {
    return {
      budget: {
        id: budgetRow.id,
        name: budgetRow.name,
        totalBudget: Number(budgetRow.total_budget),
        currency: budgetRow.currency ?? "SGD"
      },
      zones: [],
      unbudgetedItems: 0,
      contractExpenseSummary: await buildContractExpenseSummary(budgetRow.id)
    };
  }

  const zoneIds = zones.map((zone) => zone.id);
  const { data: wishlistData, error: wishlistError } = await supabase
    .from("wishlist_items")
    .select("id, zone_id, budget, status")
    .in("zone_id", zoneIds);

  if (wishlistError) {
    throw toServiceError("Failed to list zone wishlist items", wishlistError);
  }

  const wishlistItems = (wishlistData ?? []) as WishlistItemRow[];
  const wishlistIds = wishlistItems.map((wishlistItem) => wishlistItem.id);

  const expenseTotalsByWishlistItem = new Map<string, number>();
  if (wishlistIds.length > 0) {
    const { data: expenseData, error: expenseError } = await supabase
      .from("expenses")
      .select("wishlist_item_id, amount")
      .in("wishlist_item_id", wishlistIds);

    if (expenseError) {
      throw toServiceError("Failed to list expenses for wishlist items", expenseError);
    }

    for (const expense of (expenseData ?? []) as ExpenseSummaryRow[]) {
      const existingAmount = expenseTotalsByWishlistItem.get(expense.wishlist_item_id) ?? 0;
      expenseTotalsByWishlistItem.set(
        expense.wishlist_item_id,
        existingAmount + toNumber(expense.amount)
      );
    }
  }

  const wishlistIdsByZone = new Map<string, string[]>();
  const allocatedBudgetByZone = new Map<string, number>();
  for (const item of wishlistItems) {
    const existingItems = wishlistIdsByZone.get(item.zone_id) ?? [];
    existingItems.push(item.id);
    wishlistIdsByZone.set(item.zone_id, existingItems);

    const existingAllocatedBudget = allocatedBudgetByZone.get(item.zone_id) ?? 0;
    allocatedBudgetByZone.set(item.zone_id, existingAllocatedBudget + toNumber(item.budget));
  }

  const zoneMetrics = zones.map((zone) => {
    const zoneWishlistIds = wishlistIdsByZone.get(zone.id) ?? [];
    const itemsPurchased = zoneWishlistIds.filter((wishlistId) => {
      const wishlistItem = wishlistItems.find((item) => item.id === wishlistId);
      return wishlistItem ? wishlistItem.status !== "not_started" : false;
    }).length;
    const amountSpent = zoneWishlistIds.reduce(
      (sum, wishlistId) => sum + (expenseTotalsByWishlistItem.get(wishlistId) ?? 0),
      0
    );

    return {
      id: zone.id,
      name: zone.name ?? "Untitled zone",
      allocatedBudget: allocatedBudgetByZone.get(zone.id) ?? 0,
      amountSpent,
      itemsPurchased,
      itemsLeftToPurchase: Math.max(zoneWishlistIds.length - itemsPurchased, 0)
    };
  });
  const unbudgetedItems = wishlistItems.filter(
    (item) => item.status === "not_started" && toNumber(item.budget) === 0
  ).length;

  return {
    budget: {
      id: budgetRow.id,
      name: budgetRow.name,
      totalBudget: Number(budgetRow.total_budget),
      currency: budgetRow.currency ?? "SGD"
    },
    zones: zoneMetrics,
    unbudgetedItems,
    contractExpenseSummary: await buildContractExpenseSummary(budgetRow.id)
  };
};

export const projectService = {
  list: async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from("budgets")
      .select("id, name, total_budget, currency, user_id, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw toServiceError("Failed to list projects", error);
    }

    return (data ?? []).map((row) => mapBudgetRowToProject(row as BudgetRow));
  },

  getById: async (projectId: string): Promise<Project> => {
    const { data, error } = await supabase
      .from("budgets")
      .select("id, name, total_budget, currency, user_id, created_at, updated_at")
      .eq("id", projectId)
      .single();

    if (error) {
      throw toServiceError("Failed to get project", error);
    }

    return mapBudgetRowToProject(data as BudgetRow);
  },

  getLatestDashboardData: async (): Promise<ProjectDashboardData | null> => {
    const { data: budgetData, error: budgetError } = await supabase
      .from("budgets")
      .select("id, name, total_budget, currency, user_id, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (budgetError) {
      throw toServiceError("Failed to get latest budget", budgetError);
    }

    if (!budgetData) {
      return null;
    }

    return buildDashboardData(budgetData as BudgetRow);
  },

  getDashboardDataByBudgetId: async (budgetId: string): Promise<ProjectDashboardData | null> => {
    const { data: budgetData, error: budgetError } = await supabase
      .from("budgets")
      .select("id, name, total_budget, currency, user_id, created_at, updated_at")
      .eq("id", budgetId)
      .maybeSingle();

    if (budgetError) {
      throw toServiceError("Failed to get budget", budgetError);
    }

    if (!budgetData) {
      return null;
    }

    return buildDashboardData(budgetData as BudgetRow);
  },

  createBudget: async (name: string, totalBudget: number): Promise<Project> => {
    const sanitizedName = name.trim();
    if (!sanitizedName) {
      throw new Error("Budget name is required.");
    }

    if (!Number.isFinite(totalBudget) || totalBudget < 0) {
      throw new Error("Total budget must be at least 0.");
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error("You must be signed in to create a budget.");
    }

    const { data, error } = await supabase
      .from("budgets")
      .insert({
        name: sanitizedName,
        total_budget: totalBudget,
        currency: "SGD",
        user_id: userId
      })
      .select("id, name, total_budget, currency, user_id, created_at, updated_at")
      .single();

    if (error) {
      throw toServiceError("Failed to create budget", error);
    }

    return mapBudgetRowToProject(data as BudgetRow);
  },

  createZone: async (budgetId: string, name: string): Promise<{ id: string }> => {
    const sanitizedName = name.trim();
    if (!sanitizedName) {
      throw new Error("Zone name is required.");
    }

    const { data, error } = await supabase
      .from("zones")
      .insert({ budget_id: budgetId, name: sanitizedName })
      .select("id")
      .single();

    if (error) {
      throw toServiceError("Failed to create zone", error);
    }

    return { id: data.id as string };
  },

  updateZoneName: async (zoneId: string, name: string): Promise<void> => {
    const sanitizedName = name.trim();
    if (!sanitizedName) {
      throw new Error("Zone name is required.");
    }

    const { error } = await supabase.from("zones").update({ name: sanitizedName }).eq("id", zoneId);

    if (error) {
      throw toServiceError("Failed to update zone", error);
    }
  },

  deleteZone: async (zoneId: string): Promise<void> => {
    const { error } = await supabase.from("zones").delete().eq("id", zoneId);

    if (error) {
      throw toServiceError("Failed to delete zone", error);
    }
  },

  createWishlistItem: async (
    zoneId: string,
    name: string,
    budget: number,
    dates?: {
      mustPurchaseBefore?: string;
    }
  ): Promise<{ id: string }> => {
    const sanitizedName = name.trim();
    if (!sanitizedName) {
      throw new Error("Wishlist item name is required.");
    }

    if (!Number.isFinite(budget) || budget < 0) {
      throw new Error("Wishlist item budget must be at least 0.");
    }

    const { data, error } = await supabase
      .from("wishlist_items")
      .insert({
        zone_id: zoneId,
        name: sanitizedName,
        budget,
        must_purchase_before: sanitizeOptionalDate(dates?.mustPurchaseBefore)
      })
      .select("id")
      .single();

    if (error) {
      throw toServiceError("Failed to create wishlist item", error);
    }

    return { id: data.id as string };
  },

  updateWishlistItem: async (
    wishlistItemId: string,
    input: {
      name: string;
      budget: number;
      mustPurchaseBefore?: string;
    }
  ): Promise<void> => {
    const sanitizedName = input.name.trim();
    if (!sanitizedName) {
      throw new Error("Wishlist item name is required.");
    }

    if (!Number.isFinite(input.budget) || input.budget < 0) {
      throw new Error("Wishlist item budget must be at least 0.");
    }

    const { error } = await supabase
      .from("wishlist_items")
      .update({
        name: sanitizedName,
        budget: input.budget,
        must_purchase_before: sanitizeOptionalDate(input.mustPurchaseBefore)
      })
      .eq("id", wishlistItemId);

    if (error) {
      throw toServiceError("Failed to update wishlist item", error);
    }
  },

  updateWishlistItemStatus: async (
    wishlistItemId: string,
    status: WishlistItemStatus
  ): Promise<void> => {
    const { error } = await supabase
      .from("wishlist_items")
      .update({
        status
      })
      .eq("id", wishlistItemId);

    if (error) {
      throw toServiceError("Failed to update wishlist item status", error);
    }
  },

  resetWishlistItemStatusIfNoExpenses: async (wishlistItemId: string): Promise<void> => {
    const { count, error: countError } = await supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("wishlist_item_id", wishlistItemId);

    if (countError) {
      throw toServiceError("Failed to count wishlist item expenses", countError);
    }

    if ((count ?? 0) > 0) {
      return;
    }

    const { error } = await supabase
      .from("wishlist_items")
      .update({
        status: "not_started" as WishlistItemStatus
      })
      .eq("id", wishlistItemId);

    if (error) {
      throw toServiceError("Failed to reset wishlist item status", error);
    }
  },

  setWishlistItemScheduleDates: async (
    wishlistItemId: string,
    dates: {
      deliveryDate?: string;
      installationDate?: string;
      deliveryScheduled?: boolean;
      contactPersonName?: string;
      contactPersonEmail?: string;
      contactPersonMobile?: string;
      companyBrandName?: string;
    }
  ): Promise<void> => {
    const deliveryDate = sanitizeOptionalDate(dates.deliveryDate);
    const installationDate = sanitizeOptionalDate(dates.installationDate);
    const deliveryScheduled = dates.deliveryScheduled ?? false;
    const contactPersonName = sanitizeOptionalText(dates.contactPersonName);
    const contactPersonEmail = sanitizeOptionalText(dates.contactPersonEmail);
    const contactPersonMobile = sanitizeOptionalText(dates.contactPersonMobile);
    const companyBrandName = sanitizeOptionalText(dates.companyBrandName);

    const writeEvent = async (
      eventType: "delivery" | "installation",
      scheduledAt: string | null
    ): Promise<void> => {
      if (!scheduledAt) {
        const { error } = await supabase
          .from("wishlist_item_events")
          .delete()
          .eq("wishlist_item_id", wishlistItemId)
          .eq("event_type", eventType);

        if (error) {
          throw toServiceError(`Failed to delete ${eventType} event`, error);
        }
        return;
      }

      const { error } = await supabase.from("wishlist_item_events").upsert(
        {
          wishlist_item_id: wishlistItemId,
          event_type: eventType,
          scheduled_at: scheduledAt,
          delivery_scheduled: eventType === "delivery" ? deliveryScheduled : false,
          completed_at: null,
          contact_person_name: contactPersonName,
          contact_person_email: contactPersonEmail,
          contact_person_mobile: contactPersonMobile,
          company_brand_name: companyBrandName
        },
        { onConflict: "wishlist_item_id,event_type" }
      );

      if (error) {
        throw toServiceError(`Failed to upsert ${eventType} event`, error);
      }
    };

    await Promise.all([
      writeEvent("delivery", deliveryDate),
      writeEvent("installation", installationDate)
    ]);
  },

  getZoneDetailById: async (zoneId: string): Promise<ZoneDetailData | null> => {
    const { data: zoneData, error: zoneError } = await supabase
      .from("zones")
      .select("id, name, budget_id, budgets(currency)")
      .eq("id", zoneId)
      .maybeSingle();

    if (zoneError) {
      throw toServiceError("Failed to get zone", zoneError);
    }

    if (!zoneData) {
      return null;
    }

    const zone = zoneData as ZoneRow;
    const { data: wishlistData, error: wishlistError } = await supabase
      .from("wishlist_items")
      .select("id, zone_id, name, budget, must_purchase_before, status")
      .eq("zone_id", zoneId)
      .order("created_at", { ascending: true });

    if (wishlistError) {
      throw toServiceError("Failed to list zone wishlist items", wishlistError);
    }

    const wishlistItems = (wishlistData ?? []) as WishlistItemDetailRow[];
    const wishlistIds = wishlistItems.map((item) => item.id);

    const expenseTotalsByWishlistItem = new Map<string, number>();
    const expensesByWishlistItem = new Map<string, ExpenseDetailRow[]>();
    if (wishlistIds.length > 0) {
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .select("id, wishlist_item_id, amount, description, expense_date")
        .in("wishlist_item_id", wishlistIds);

      if (expenseError) {
        throw toServiceError("Failed to list zone expenses", expenseError);
      }

      for (const expense of (expenseData ?? []) as ExpenseDetailRow[]) {
        const existingAmount = expenseTotalsByWishlistItem.get(expense.wishlist_item_id) ?? 0;
        expenseTotalsByWishlistItem.set(
          expense.wishlist_item_id,
          existingAmount + toNumber(expense.amount)
        );

        const existingExpenses = expensesByWishlistItem.get(expense.wishlist_item_id) ?? [];
        existingExpenses.push(expense);
        expensesByWishlistItem.set(expense.wishlist_item_id, existingExpenses);
      }
    }

    const eventByWishlistItemId = new Map<
      string,
      {
        deliveryDate: string | null;
        installationDate: string | null;
        deliveryScheduled: boolean;
        contactPersonName: string | null;
        contactPersonEmail: string | null;
        contactPersonMobile: string | null;
        companyBrandName: string | null;
      }
    >();
    if (wishlistIds.length > 0) {
      const { data: eventData, error: eventError } = await supabase
        .from("wishlist_item_events")
        .select(
          "wishlist_item_id, event_type, scheduled_at, delivery_scheduled, contact_person_name, contact_person_email, contact_person_mobile, company_brand_name"
        )
        .in("wishlist_item_id", wishlistIds);

      if (eventError) {
        throw toServiceError("Failed to list wishlist item events", eventError);
      }

      for (const event of (eventData ?? []) as WishlistItemEventRow[]) {
        const existingEntry = eventByWishlistItemId.get(event.wishlist_item_id) ?? {
          deliveryDate: null,
          installationDate: null,
          deliveryScheduled: false,
          contactPersonName: null,
          contactPersonEmail: null,
          contactPersonMobile: null,
          companyBrandName: null
        };

        if (event.event_type === "delivery") {
          existingEntry.deliveryDate = event.scheduled_at;
          existingEntry.deliveryScheduled = event.delivery_scheduled;
        }
        if (event.event_type === "installation") {
          existingEntry.installationDate = event.scheduled_at;
        }
        existingEntry.contactPersonName = event.contact_person_name ?? existingEntry.contactPersonName;
        existingEntry.contactPersonEmail = event.contact_person_email ?? existingEntry.contactPersonEmail;
        existingEntry.contactPersonMobile = event.contact_person_mobile ?? existingEntry.contactPersonMobile;
        existingEntry.companyBrandName = event.company_brand_name ?? existingEntry.companyBrandName;

        eventByWishlistItemId.set(event.wishlist_item_id, existingEntry);
      }
    }

    const zoneItems = wishlistItems.map((item) => ({
      id: item.id,
      name: item.name ?? "Untitled item",
      allocatedBudget: toNumber(item.budget),
      amountSpent: expenseTotalsByWishlistItem.get(item.id) ?? 0,
      mustPurchaseBefore: item.must_purchase_before,
      status: item.status
    }));

    const purchasedItems = zoneItems.filter(
      (item) => item.status === "in_progress" || item.status === "completed"
    );
    const unpurchasedItems = zoneItems.filter((item) => item.status === "not_started");
    const allocatedBudget = zoneItems.reduce((sum, item) => sum + item.allocatedBudget, 0);
    const amountSpent = zoneItems.reduce((sum, item) => sum + item.amountSpent, 0);
    const purchasedItemRecords = purchasedItems.flatMap((item) => {
      const itemExpenses = expensesByWishlistItem.get(item.id) ?? [];

      return itemExpenses.map((expense) => {
        const rawDescription = expense.description?.trim() ?? "";
        const amount = toNumber(expense.amount);

        return {
          id: expense.id,
          wishlistItemId: item.id,
          purchasedItemName: item.name,
          actualItemName: item.name,
          description: rawDescription.length > 0 ? rawDescription : "-",
          expenseDescription: rawDescription,
          budget: item.allocatedBudget,
          amountSpent: amount,
          difference: item.allocatedBudget - amount,
          purchaseDate: expense.expense_date ?? null,
          deliveryDate: eventByWishlistItemId.get(item.id)?.deliveryDate ?? null,
          installationDate: eventByWishlistItemId.get(item.id)?.installationDate ?? null,
          contactPersonName: eventByWishlistItemId.get(item.id)?.contactPersonName ?? null,
          contactPersonEmail: eventByWishlistItemId.get(item.id)?.contactPersonEmail ?? null,
          contactPersonMobile: eventByWishlistItemId.get(item.id)?.contactPersonMobile ?? null,
          companyBrandName: eventByWishlistItemId.get(item.id)?.companyBrandName ?? null,
          deliveryScheduled: eventByWishlistItemId.get(item.id)?.deliveryScheduled ?? false,
          status: item.status
        };
      });
    });

    return {
      zone: {
        id: zone.id,
        budgetId: zone.budget_id ?? "",
        name: zone.name ?? "Untitled zone",
        currency: zone.budgets?.[0]?.currency ?? "SGD"
      },
      amountSpent,
      allocatedBudget,
      budgetLeft: allocatedBudget - amountSpent,
      purchasedItems,
      unpurchasedItems,
      purchasedItemRecords
    };
  },

  getDeliveryScheduleByBudgetId: async (budgetId: string): Promise<DeliveryScheduleItem[]> => {
    const { data, error } = await supabase
      .from("wishlist_items")
      .select(
        "id, name, zone_id, status, zones!inner(id, name, budget_id), wishlist_item_events(event_type, scheduled_at, delivery_scheduled, contact_person_name, contact_person_email, contact_person_mobile, company_brand_name)"
      )
      .eq("zones.budget_id", budgetId)
      .order("name", { ascending: true });

    if (error) {
      throw toServiceError("Failed to list delivery schedule items", error);
    }

    return ((data ?? []) as DeliveryScheduleRow[])
      .map((row) => {
        const events = row.wishlist_item_events ?? [];
        const deliveryDate = events.find((event) => event.event_type === "delivery")?.scheduled_at ?? null;
        const deliveryScheduled = events.find((event) => event.event_type === "delivery")?.delivery_scheduled ?? false;
        const installationDate =
          events.find((event) => event.event_type === "installation")?.scheduled_at ?? null;
        const contactEvent =
          events.find((event) => event.contact_person_name || event.contact_person_email || event.contact_person_mobile || event.company_brand_name) ??
          events[0];
        const zoneName = Array.isArray(row.zones)
          ? row.zones[0]?.name
          : row.zones?.name;

        return {
          wishlistItemId: row.id,
          wishlistItemName: row.name ?? "Untitled item",
          zoneId: row.zone_id,
          zoneName: zoneName ?? "Untitled zone",
          deliveryDate,
          installationDate,
          contactPersonName: contactEvent?.contact_person_name ?? null,
          contactPersonEmail: contactEvent?.contact_person_email ?? null,
          contactPersonMobile: contactEvent?.contact_person_mobile ?? null,
          companyBrandName: contactEvent?.company_brand_name ?? null,
          deliveryScheduled,
          status: row.status
        };
      })
      .filter((item) => item.deliveryDate || item.installationDate);
  },

  getBudgetMembers: async (budgetId: string): Promise<BudgetMember[]> => {
    const { data, error } = await supabase
      .from("budget_members")
      .select("budget_id, user_id, role, invited_by, created_at, updated_at")
      .eq("budget_id", budgetId)
      .order("created_at", { ascending: true });

    if (error) {
      throw toServiceError("Failed to list budget members", error);
    }

    return (data ?? []).map((row) => mapBudgetMemberRow(row as BudgetMemberRow));
  },

  getBudgetMemberIdentities: async (budgetId: string): Promise<BudgetMemberIdentity[]> => {
    const { data, error } = await supabase.rpc("list_budget_member_identities", {
      target_budget_id: budgetId
    });

    if (error) {
      throw toServiceError("Failed to list budget member identities", error);
    }

    return (data ?? []).map((row: BudgetMemberIdentityRow) => mapBudgetMemberIdentityRow(row));
  },

  inviteBudgetMemberByEmail: async (
    budgetId: string,
    email: string,
    role: BudgetRole
  ): Promise<BudgetMemberIdentity> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error("Email is required.");
    }

    const executeInvite = async (): Promise<InviteBudgetMemberRow> => {
      const { data, error } = await supabase.rpc("invite_budget_member_by_email", {
        target_budget_id: budgetId,
        target_email: normalizedEmail,
        target_role: role
      });

      if (error) {
        throw toServiceError("Failed to invite budget member", error);
      }

      const invitedMember = (data as InviteBudgetMemberRow[] | null)?.[0];
      if (!invitedMember) {
        throw new Error("Invitation did not return a member record.");
      }

      return invitedMember;
    };

    let invitedMember: InviteBudgetMemberRow;
    try {
      invitedMember = await executeInvite();
    } catch (error) {
      if (!isMissingUserInviteError(error)) {
        throw error;
      }

      await inviteAuthUserByEmail(normalizedEmail);
      invitedMember = await executeInvite();
    }

    return {
      userId: invitedMember.member_user_id,
      role: invitedMember.member_role,
      email: invitedMember.member_email,
      firstName: invitedMember.member_first_name
    };
  },

  getCurrentUserBudgetRole: async (budgetId: string): Promise<BudgetRole | null> => {
    const userId = await getCurrentUserId();
    if (!userId) {
      return null;
    }

    const { data, error } = await supabase
      .from("budget_members")
      .select("role")
      .eq("budget_id", budgetId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw toServiceError("Failed to get current user budget role", error);
    }

    if (!data) {
      return null;
    }

    return data.role as BudgetRole;
  },

  upsertBudgetMember: async (
    budgetId: string,
    userId: string,
    role: BudgetRole,
    invitedBy?: string | null
  ): Promise<BudgetMember> => {
    const { data, error } = await supabase
      .from("budget_members")
      .upsert(
        {
          budget_id: budgetId,
          user_id: userId,
          role,
          invited_by: invitedBy ?? null
        },
        { onConflict: "budget_id,user_id" }
      )
      .select("budget_id, user_id, role, invited_by, created_at, updated_at")
      .single();

    if (error) {
      throw toServiceError("Failed to upsert budget member", error);
    }

    return mapBudgetMemberRow(data as BudgetMemberRow);
  },

  removeBudgetMember: async (budgetId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from("budget_members")
      .delete()
      .eq("budget_id", budgetId)
      .eq("user_id", userId);

    if (error) {
      throw toServiceError("Failed to remove budget member", error);
    }
  }
};
