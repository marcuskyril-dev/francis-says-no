export interface Project {
  id: string;
  name: string;
  totalBudget: number;
  currency: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type BudgetRole = "owner" | "admin" | "maintainer" | "guest";

export interface BudgetMember {
  budgetId: string;
  userId: string;
  role: BudgetRole;
  invitedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetMemberIdentity {
  userId: string;
  role: BudgetRole;
  email: string | null;
  firstName: string | null;
}

export interface Expense {
  id: string;
  wishlistItemId: string;
  amount: number;
  description: string | null;
  expenseDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectState {
  selectedProjectId: string | null;
  setSelectedProjectId: (projectId: string | null) => void;
  resetSelectedProject: () => void;
}

export interface BudgetDashboardSummary {
  id: string;
  name: string;
  totalBudget: number;
  currency: string;
}

export interface ZoneDashboardMetrics {
  id: string;
  name: string;
  allocatedBudget: number;
  amountSpent: number;
  itemsPurchased: number;
  itemsLeftToPurchase: number;
}

export interface ProjectDashboardData {
  budget: BudgetDashboardSummary;
  zones: ZoneDashboardMetrics[];
  unbudgetedItems: number;
  contractExpenseSummary: ContractExpenseSummary;
}

export type ContractExpenseType = "renovation_cost" | "variation_order" | "external_service";

export interface ContractExpenseMilestone {
  id: string;
  contractExpenseId: string;
  sequenceNumber: number;
  percentage: number | null;
  amount: number | null;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractExpensePayment {
  id: string;
  contractExpenseId: string;
  amount: number;
  paidAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractExpense {
  id: string;
  budgetId: string;
  expenseType: ContractExpenseType;
  expenseName: string;
  expenseDate: string | null;
  notes: string;
  vendorName: string;
  contractTotalAmount: number | null;
  milestoneTotalAmount: number;
  paidToDate: number;
  totalContractCost: number;
  remainingBalance: number;
  milestones: ContractExpenseMilestone[];
  payments: ContractExpensePayment[];
  createdAt: string;
  updatedAt: string;
}

export interface ContractExpenseSummary {
  totalContractCost: number;
  paidToDate: number;
  remainingBalance: number;
  expensesCount: number;
}

export interface ZoneDetailItem {
  id: string;
  name: string;
  allocatedBudget: number;
  amountSpent: number;
  mustPurchaseBefore: string | null;
  status: WishlistItemStatus;
}

export type WishlistItemStatus = "not_started" | "in_progress" | "completed";

export interface PurchasedItemRecord {
  id: string;
  wishlistItemId: string;
  purchasedItemName: string;
  actualItemName: string;
  description: string;
  expenseDescription: string;
  budget: number;
  amountSpent: number;
  difference: number;
  purchaseDate: string | null;
  deliveryDate: string | null;
  installationDate: string | null;
  contactPersonName: string | null;
  contactPersonEmail: string | null;
  contactPersonMobile: string | null;
  companyBrandName: string | null;
  deliveryScheduled: boolean;
  status: WishlistItemStatus;
  notes: string | null;
}

export interface ZoneDetailData {
  zone: {
    id: string;
    budgetId: string;
    name: string;
    currency: string;
  };
  amountSpent: number;
  allocatedBudget: number;
  budgetLeft: number;
  purchasedItems: ZoneDetailItem[];
  unpurchasedItems: ZoneDetailItem[];
  purchasedItemRecords: PurchasedItemRecord[];
}

export interface DeliveryScheduleItem {
  wishlistItemId: string;
  wishlistItemName: string;
  zoneId: string;
  zoneName: string;
  deliveryDate: string | null;
  installationDate: string | null;
  contactPersonName: string | null;
  contactPersonEmail: string | null;
  contactPersonMobile: string | null;
  companyBrandName: string | null;
  deliveryScheduled: boolean;
  status: WishlistItemStatus;
  notes: string | null;
}
