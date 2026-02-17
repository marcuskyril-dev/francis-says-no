"use client";

import { Card } from "@/components/ui/card";
import type { ZoneDashboardMetrics } from "@/types";

interface ZoneCardProps {
  zone: ZoneDashboardMetrics;
  currency: string;
  formatCurrency: (amount: number, currency: string) => string;
}

export const ZoneCard = ({ zone, currency, formatCurrency }: ZoneCardProps) => {
  const totalItems = zone.itemsPurchased + zone.itemsLeftToPurchase;
  const purchasedRatio = totalItems > 0 ? zone.itemsPurchased / totalItems : 1;
  const statusProgress = purchasedRatio * 100;
  const statusProgressWidth = `${Math.max(0, Math.min(100, statusProgress))}%`;
  const hasBudgetOverrun = zone.amountSpent > zone.allocatedBudget;
  const shouldShowSlowPurchaseWarning = purchasedRatio < 0.5 && !hasBudgetOverrun;
  const shouldHighlightStatusRisk = purchasedRatio < 0.75 && hasBudgetOverrun;

  return (
    <Card className="h-full">
      <p className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Zone</p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight">{zone.name}</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-zinc-600 dark:text-zinc-400">Amount spent</dt>
          <dd>{formatCurrency(zone.amountSpent, currency)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-zinc-600 dark:text-zinc-400">Allocated budget</dt>
          <dd>{formatCurrency(zone.allocatedBudget, currency)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-zinc-600 dark:text-zinc-400">Amount left</dt>
          <dd>
            <span style={zone.allocatedBudget - zone.amountSpent < 0 ? { color: "#CC1000" } : undefined}>
              {zone.allocatedBudget - zone.amountSpent < 0
                ? `(${formatCurrency(Math.abs(zone.allocatedBudget - zone.amountSpent), currency)})`
                : formatCurrency(zone.allocatedBudget - zone.amountSpent, currency)}
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full"
            style={{
              width: statusProgressWidth,
              backgroundColor: shouldHighlightStatusRisk
                ? "#CC1000"
                : shouldShowSlowPurchaseWarning
                  ? "#f2721b"
                  : "#000000"
            }}
          />
        </div>
      </div>
    </Card>
  );
};
