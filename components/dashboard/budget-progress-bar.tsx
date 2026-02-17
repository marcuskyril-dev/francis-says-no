type BudgetProgressBarProps = {
  amountSpent: number;
  allocatedBudget: number;
  unbudgetedItems: number;
  currency: string;
  formatCurrency: (amount: number, currency: string) => string;
};

export const BudgetProgressBar = ({
  amountSpent,
  allocatedBudget,
  unbudgetedItems,
  currency,
  formatCurrency
}: BudgetProgressBarProps) => {
  const spentRatio = allocatedBudget > 0 ? Math.min(amountSpent / allocatedBudget, 1) : 0;
  const spentMarkerLeft = `${spentRatio * 100}%`;
  const amountLeft = allocatedBudget - amountSpent;

  return (
    <div className="mt-4 md:grid md:grid-cols-4 md:items-end md:gap-8">
      <dl className="space-y-2 text-sm md:col-span-1">
        <div className="flex items-center justify-between">
          <dt className="text-zinc-600 dark:text-zinc-400">Amount spent</dt>
          <dd>{formatCurrency(amountSpent, currency)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-zinc-600 dark:text-zinc-400">Allocated budget</dt>
          <dd>{formatCurrency(allocatedBudget, currency)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-zinc-600 dark:text-zinc-400">Amount left</dt>
          <dd>
            <span style={amountLeft < 0 ? { color: "#CC1000" } : undefined}>
              {amountLeft < 0 ? `(${formatCurrency(Math.abs(amountLeft), currency)})` : formatCurrency(amountLeft, currency)}
            </span>
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-zinc-600 dark:text-zinc-400">Unbudgeted items</dt>
          <dd>{unbudgetedItems}</dd>
        </div>
      </dl>

      <div className="relative hidden md:col-span-3 md:block">
        <div className="h-5 w-full border" style={{ borderColor: "#000000", borderWidth: "1px" }}>
          <div className="h-full bg-black" style={{ width: spentMarkerLeft }} />
        </div>
        <div className="pointer-events-none absolute -top-5 left-0 h-8 w-full">
          {amountSpent > 0 ? (
            <div
              className="absolute flex items-center gap-2"
              style={{ left: spentMarkerLeft, transform: "translateX(calc(-100% - 0px))" }}
            >
              <span className="text-xs">{formatCurrency(amountSpent, currency)}</span>
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "4.62px solid transparent",
                  borderRight: "4.62px solid transparent",
                  borderTop: "8px solid #000000"
                }}
              />
            </div>
          ) : null}
          <div
            className="absolute flex items-center gap-2"
            style={{ left: "100%", transform: "translateX(calc(-100% - 0px))" }}
          >
            <span className="text-xs">{formatCurrency(allocatedBudget, currency)}</span>
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "4.62px solid transparent",
                borderRight: "4.62px solid transparent",
                borderTop: "8px solid #000000"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
