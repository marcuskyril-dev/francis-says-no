"use client";

import { useMemo } from "react";

import type { PurchasedItemRecord, ZoneDetailItem } from "@/types";

type NotificationKind = "upcoming" | "overdue";
type NotificationField = "mustPurchaseBefore" | "deliveryDate" | "installationDate";

export interface ItemDateNotification {
  id: string;
  kind: NotificationKind;
  field: NotificationField;
  fieldLabel: string;
  itemId: string;
  itemName: string;
  dateValue: string;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const parseDateValue = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
};

const getIsActioned = (item: ZoneDetailItem, field: NotificationField): boolean => {
  if (field === "mustPurchaseBefore") {
    return item.status === "in_progress" || item.status === "completed";
  }

  return false;
};

export const useItemDateNotifications = (
  items: ZoneDetailItem[],
  purchasedItemRecords: PurchasedItemRecord[]
): ItemDateNotification[] =>
  useMemo(() => {
    const now = Date.now();
    const notifications: ItemDateNotification[] = [];

    for (const item of items) {
      const dateFields: Array<{ field: NotificationField; label: string; value: string | null }> = [
        {
          field: "mustPurchaseBefore",
          label: "Must purchase before",
          value: item.mustPurchaseBefore
        }
      ];

      for (const dateField of dateFields) {
        const dueDateMs = parseDateValue(dateField.value);
        if (!dueDateMs || getIsActioned(item, dateField.field)) {
          continue;
        }

        const isUpcoming = now >= dueDateMs - ONE_DAY_MS && now < dueDateMs;
        const isOverdue = now >= dueDateMs;
        if (!isUpcoming && !isOverdue) {
          continue;
        }

        notifications.push({
          id: `${item.id}-${dateField.field}`,
          kind: isOverdue ? "overdue" : "upcoming",
          field: dateField.field,
          fieldLabel: dateField.label,
          itemId: item.id,
          itemName: item.name,
          dateValue: dateField.value ?? ""
        });
      }
    }

    for (const record of purchasedItemRecords) {
      const dateFields: Array<{ field: NotificationField; label: string; value: string | null }> = [
        {
          field: "deliveryDate",
          label: "Delivery date",
          value: record.deliveryDate
        },
        {
          field: "installationDate",
          label: "Installation date",
          value: record.installationDate
        }
      ];

      for (const dateField of dateFields) {
        const dueDateMs = parseDateValue(dateField.value);
        if (!dueDateMs) {
          continue;
        }

        const isUpcoming = now >= dueDateMs - ONE_DAY_MS && now < dueDateMs;
        const isOverdue = now >= dueDateMs;
        if (!isUpcoming && !isOverdue) {
          continue;
        }

        notifications.push({
          id: `${record.id}-${dateField.field}`,
          kind: isOverdue ? "overdue" : "upcoming",
          field: dateField.field,
          fieldLabel: dateField.label,
          itemId: record.wishlistItemId,
          itemName: record.purchasedItemName,
          dateValue: dateField.value ?? ""
        });
      }
    }

    notifications.sort((left, right) => {
      const leftDate = parseDateValue(left.dateValue) ?? Number.MAX_SAFE_INTEGER;
      const rightDate = parseDateValue(right.dateValue) ?? Number.MAX_SAFE_INTEGER;
      return leftDate - rightDate;
    });

    return notifications;
  }, [items, purchasedItemRecords]);
