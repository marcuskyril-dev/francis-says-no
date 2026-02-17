import type {
  ContractExpense,
  ContractExpenseMilestone,
  ContractExpensePayment,
  ContractExpenseSummary,
  ContractExpenseType
} from "@/types";
import { supabase, toServiceError } from "@/services/supabase";

interface ContractExpenseRow {
  id: string;
  budget_id: string;
  expense_type: ContractExpenseType;
  expense_name: string;
  expense_date: string | null;
  notes: string | null;
  vendor_name: string;
  contract_total_amount: number | null;
  created_at: string;
  updated_at: string;
}

interface ContractExpenseSummaryRow extends ContractExpenseRow {
  milestone_total_amount: number | string;
  paid_to_date: number | string;
  total_contract_cost: number | string;
  remaining_balance: number | string;
}

interface ContractExpenseMilestoneRow {
  id: string;
  contract_expense_id: string;
  sequence_number: number;
  percentage: number | null;
  amount: number | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ContractExpensePaymentRow {
  id: string;
  contract_expense_id: string;
  amount: number;
  paid_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractExpenseMilestoneInput {
  sequenceNumber: number;
  percentage?: number;
  amount?: number;
  dueDate?: string;
  notes?: string;
}

export interface ContractExpensePaymentInput {
  amount: number;
  paidAt: string;
  notes?: string;
}

export interface CreateContractExpenseInput {
  budgetId: string;
  expenseType: ContractExpenseType;
  expenseName: string;
  expenseDate?: string;
  notes?: string;
  vendorName: string;
  contractTotalAmount?: number;
  milestones?: ContractExpenseMilestoneInput[];
  payments?: ContractExpensePaymentInput[];
}

export interface UpdateContractExpenseInput extends CreateContractExpenseInput {
  contractExpenseId: string;
}

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

const sanitizeRequiredText = (value: string, fieldLabel: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldLabel} is required.`);
  }
  return trimmed;
};

const sanitizeOptionalText = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

const sanitizeOptionalDate = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

const sanitizeMilestones = (milestones: ContractExpenseMilestoneInput[] | undefined) =>
  (milestones ?? [])
    .filter((milestone) => Number.isFinite(milestone.sequenceNumber) && milestone.sequenceNumber > 0)
    .map((milestone) => ({
      sequence_number: milestone.sequenceNumber,
      percentage:
        typeof milestone.percentage === "number" && Number.isFinite(milestone.percentage)
          ? milestone.percentage
          : null,
      amount:
        typeof milestone.amount === "number" && Number.isFinite(milestone.amount)
          ? milestone.amount
          : null,
      due_date: sanitizeOptionalText(milestone.dueDate),
      notes: sanitizeOptionalText(milestone.notes)
    }))
    .filter((milestone) => milestone.percentage !== null || milestone.amount !== null);

const sanitizePayments = (payments: ContractExpensePaymentInput[] | undefined) =>
  (payments ?? [])
    .filter((payment) => Number.isFinite(payment.amount) && payment.amount >= 0 && payment.paidAt.trim().length > 0)
    .map((payment) => ({
      amount: payment.amount,
      paid_at: payment.paidAt.trim(),
      notes: sanitizeOptionalText(payment.notes)
    }));

const mapMilestoneRow = (row: ContractExpenseMilestoneRow): ContractExpenseMilestone => ({
  id: row.id,
  contractExpenseId: row.contract_expense_id,
  sequenceNumber: row.sequence_number,
  percentage: row.percentage === null ? null : Number(row.percentage),
  amount: row.amount === null ? null : Number(row.amount),
  dueDate: row.due_date,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapPaymentRow = (row: ContractExpensePaymentRow): ContractExpensePayment => ({
  id: row.id,
  contractExpenseId: row.contract_expense_id,
  amount: Number(row.amount),
  paidAt: row.paid_at,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const listChildrenByContractExpenseIds = async (
  contractExpenseIds: string[]
): Promise<{
  milestonesByContractExpenseId: Map<string, ContractExpenseMilestone[]>;
  paymentsByContractExpenseId: Map<string, ContractExpensePayment[]>;
}> => {
  const milestonesByContractExpenseId = new Map<string, ContractExpenseMilestone[]>();
  const paymentsByContractExpenseId = new Map<string, ContractExpensePayment[]>();
  if (contractExpenseIds.length === 0) {
    return { milestonesByContractExpenseId, paymentsByContractExpenseId };
  }

  const [{ data: milestoneData, error: milestoneError }, { data: paymentData, error: paymentError }] =
    await Promise.all([
      supabase
        .from("project_contract_payment_milestones")
        .select("id, contract_expense_id, sequence_number, percentage, amount, due_date, notes, created_at, updated_at")
        .in("contract_expense_id", contractExpenseIds)
        .order("sequence_number", { ascending: true }),
      supabase
        .from("project_contract_payments")
        .select("id, contract_expense_id, amount, paid_at, notes, created_at, updated_at")
        .in("contract_expense_id", contractExpenseIds)
        .order("paid_at", { ascending: true })
    ]);

  if (milestoneError) {
    throw toServiceError("Failed to list contract payment milestones", milestoneError);
  }
  if (paymentError) {
    throw toServiceError("Failed to list contract payments", paymentError);
  }

  for (const row of (milestoneData ?? []) as ContractExpenseMilestoneRow[]) {
    const mapped = mapMilestoneRow(row);
    const existingMilestones = milestonesByContractExpenseId.get(mapped.contractExpenseId) ?? [];
    existingMilestones.push(mapped);
    milestonesByContractExpenseId.set(mapped.contractExpenseId, existingMilestones);
  }

  for (const row of (paymentData ?? []) as ContractExpensePaymentRow[]) {
    const mapped = mapPaymentRow(row);
    const existingPayments = paymentsByContractExpenseId.get(mapped.contractExpenseId) ?? [];
    existingPayments.push(mapped);
    paymentsByContractExpenseId.set(mapped.contractExpenseId, existingPayments);
  }

  return { milestonesByContractExpenseId, paymentsByContractExpenseId };
};

const mapSummaryRowToContractExpense = (
  row: ContractExpenseSummaryRow,
  milestonesByContractExpenseId: Map<string, ContractExpenseMilestone[]>,
  paymentsByContractExpenseId: Map<string, ContractExpensePayment[]>
): ContractExpense => ({
  id: row.id,
  budgetId: row.budget_id,
  expenseType: row.expense_type,
  expenseName: row.expense_name,
  expenseDate: row.expense_date,
  notes: row.notes ?? "",
  vendorName: row.vendor_name,
  contractTotalAmount: row.contract_total_amount === null ? null : Number(row.contract_total_amount),
  milestoneTotalAmount: toNumber(row.milestone_total_amount),
  paidToDate: toNumber(row.paid_to_date),
  totalContractCost: toNumber(row.total_contract_cost),
  remainingBalance: toNumber(row.remaining_balance),
  milestones: milestonesByContractExpenseId.get(row.id) ?? [],
  payments: paymentsByContractExpenseId.get(row.id) ?? [],
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const contractExpenseService = {
  listByBudgetId: async (budgetId: string): Promise<ContractExpense[]> => {
    const { data, error } = await supabase
      .from("project_contract_expense_summaries_v")
      .select(
        "id, budget_id, expense_type, expense_name, expense_date, notes, vendor_name, contract_total_amount, created_at, updated_at, milestone_total_amount, paid_to_date, total_contract_cost, remaining_balance"
      )
      .eq("budget_id", budgetId)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw toServiceError("Failed to list contract expenses", error);
    }

    const rows = (data ?? []) as ContractExpenseSummaryRow[];
    const contractExpenseIds = rows.map((row) => row.id);
    const { milestonesByContractExpenseId, paymentsByContractExpenseId } =
      await listChildrenByContractExpenseIds(contractExpenseIds);

    return rows.map((row) =>
      mapSummaryRowToContractExpense(row, milestonesByContractExpenseId, paymentsByContractExpenseId)
    );
  },

  getBudgetSummary: async (budgetId: string): Promise<ContractExpenseSummary> => {
    const { data, error } = await supabase
      .from("project_contract_expense_summaries_v")
      .select("total_contract_cost, paid_to_date, remaining_balance")
      .eq("budget_id", budgetId);

    if (error) {
      throw toServiceError("Failed to get contract expense summary", error);
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
      { totalContractCost: 0, paidToDate: 0, remainingBalance: 0, expensesCount: 0 }
    );
  },

  create: async (input: CreateContractExpenseInput): Promise<ContractExpense> => {
    const expenseName = sanitizeRequiredText(input.expenseName, "Expense name");
    const expenseDate = sanitizeOptionalDate(input.expenseDate);
    const notes = sanitizeOptionalText(input.notes);
    const vendorName = sanitizeRequiredText(input.vendorName, "Vendor name");
    const milestones = sanitizeMilestones(input.milestones);
    const payments = sanitizePayments(input.payments);
    if (payments.length === 0) {
      throw new Error("At least one actual payment is required.");
    }

    const { data, error } = await supabase
      .from("project_contract_expenses")
      .insert({
        budget_id: input.budgetId,
        expense_type: input.expenseType,
        expense_name: expenseName,
        expense_date: expenseDate,
        notes,
        vendor_name: vendorName,
        contract_total_amount:
          typeof input.contractTotalAmount === "number" && Number.isFinite(input.contractTotalAmount)
            ? input.contractTotalAmount
            : null
      })
      .select(
        "id, budget_id, expense_type, expense_name, expense_date, notes, vendor_name, contract_total_amount, created_at, updated_at"
      )
      .single();

    if (error) {
      throw toServiceError("Failed to create contract expense", error);
    }

    const created = data as ContractExpenseRow;
    if (milestones.length > 0) {
      const { error: milestoneError } = await supabase.from("project_contract_payment_milestones").insert(
        milestones.map((milestone) => ({
          contract_expense_id: created.id,
          ...milestone
        }))
      );
      if (milestoneError) {
        throw toServiceError("Failed to create contract expense milestones", milestoneError);
      }
    }

    if (payments.length > 0) {
      const { error: paymentError } = await supabase.from("project_contract_payments").insert(
        payments.map((payment) => ({
          contract_expense_id: created.id,
          ...payment
        }))
      );
      if (paymentError) {
        throw toServiceError("Failed to create contract expense payments", paymentError);
      }
    }

    const { data: createdSummaryData, error: createdSummaryError } = await supabase
      .from("project_contract_expense_summaries_v")
      .select(
        "id, budget_id, expense_type, expense_name, expense_date, notes, vendor_name, contract_total_amount, created_at, updated_at, milestone_total_amount, paid_to_date, total_contract_cost, remaining_balance"
      )
      .eq("id", created.id)
      .single();
    if (createdSummaryError) {
      throw toServiceError("Failed to load created contract expense", createdSummaryError);
    }

    const { milestonesByContractExpenseId, paymentsByContractExpenseId } =
      await listChildrenByContractExpenseIds([created.id]);
    const createdSummary = mapSummaryRowToContractExpense(
      createdSummaryData as ContractExpenseSummaryRow,
      milestonesByContractExpenseId,
      paymentsByContractExpenseId
    );

    if (!createdSummary) {
      throw new Error("Created contract expense could not be loaded.");
    }
    return createdSummary;
  },

  update: async (input: UpdateContractExpenseInput): Promise<ContractExpense> => {
    const expenseName = sanitizeRequiredText(input.expenseName, "Expense name");
    const expenseDate = sanitizeOptionalDate(input.expenseDate);
    const notes = sanitizeOptionalText(input.notes);
    const vendorName = sanitizeRequiredText(input.vendorName, "Vendor name");
    const milestones = sanitizeMilestones(input.milestones);
    const payments = sanitizePayments(input.payments);
    if (payments.length === 0) {
      throw new Error("At least one actual payment is required.");
    }

    const { data, error } = await supabase
      .from("project_contract_expenses")
      .update({
        budget_id: input.budgetId,
        expense_type: input.expenseType,
        expense_name: expenseName,
        expense_date: expenseDate,
        notes,
        vendor_name: vendorName,
        contract_total_amount:
          typeof input.contractTotalAmount === "number" && Number.isFinite(input.contractTotalAmount)
            ? input.contractTotalAmount
            : null
      })
      .eq("id", input.contractExpenseId)
      .select(
        "id, budget_id, expense_type, expense_name, expense_date, notes, vendor_name, contract_total_amount, created_at, updated_at"
      )
      .single();

    if (error) {
      throw toServiceError("Failed to update contract expense", error);
    }

    const { error: deleteMilestonesError } = await supabase
      .from("project_contract_payment_milestones")
      .delete()
      .eq("contract_expense_id", input.contractExpenseId);
    if (deleteMilestonesError) {
      throw toServiceError("Failed to replace contract expense milestones", deleteMilestonesError);
    }
    if (milestones.length > 0) {
      const { error: insertMilestonesError } = await supabase.from("project_contract_payment_milestones").insert(
        milestones.map((milestone) => ({
          contract_expense_id: input.contractExpenseId,
          ...milestone
        }))
      );
      if (insertMilestonesError) {
        throw toServiceError("Failed to save contract expense milestones", insertMilestonesError);
      }
    }

    const { error: deletePaymentsError } = await supabase
      .from("project_contract_payments")
      .delete()
      .eq("contract_expense_id", input.contractExpenseId);
    if (deletePaymentsError) {
      throw toServiceError("Failed to replace contract expense payments", deletePaymentsError);
    }
    if (payments.length > 0) {
      const { error: insertPaymentsError } = await supabase.from("project_contract_payments").insert(
        payments.map((payment) => ({
          contract_expense_id: input.contractExpenseId,
          ...payment
        }))
      );
      if (insertPaymentsError) {
        throw toServiceError("Failed to save contract expense payments", insertPaymentsError);
      }
    }

    const updated = data as ContractExpenseRow;
    const contractExpenses = await contractExpenseService.listByBudgetId(updated.budget_id);
    const updatedExpense = contractExpenses.find((expense) => expense.id === updated.id);
    if (!updatedExpense) {
      throw new Error("Updated contract expense could not be loaded.");
    }
    return updatedExpense;
  },

  remove: async (contractExpenseId: string): Promise<void> => {
    const { error } = await supabase.from("project_contract_expenses").delete().eq("id", contractExpenseId);
    if (error) {
      throw toServiceError("Failed to delete contract expense", error);
    }
  }
};
