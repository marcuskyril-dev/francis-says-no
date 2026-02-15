type BudgetProgressBarProps = {
  amountSpent: number;
  allocatedBudget: number;
  currency: string;
  formatCurrency: (amount: number, currency: string) => string;
};

export const BudgetProgressBar = ({
  amountSpent,
  allocatedBudget,
  currency,
  formatCurrency
}: BudgetProgressBarProps) => {
  const spentRatio = allocatedBudget > 0 ? Math.min(amountSpent / allocatedBudget, 1) : 0;
  const spentMarkerLeft = `${spentRatio * 100}%`;

  return (
    <div className="relative mt-8">
      <div className="h-5 w-full border" style={{ borderColor: "#000000", borderWidth: "1px" }}>
        <div className="h-full bg-black" style={{ width: spentMarkerLeft }} />
      </div>
      <div className="pointer-events-none absolute -top-5 left-0 h-8 w-full">
        {amountSpent > 0 && <div
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
        </div>}
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
  );
};
