"use client";

import { AddMembersDialog } from "@/components/dashboard/add-members-dialog";
import type { BudgetMemberIdentity } from "@/types";

interface BudgetMembersRowProps {
  members: BudgetMemberIdentity[];
  projectId: string | null;
  canManageMembers: boolean;
  currentUserId: string | null;
}

const getMemberInitial = (member: { email: string | null; firstName: string | null }): string => {
  const source = member.firstName?.trim() || member.email?.trim() || "?";
  return source.charAt(0).toUpperCase();
};

export const BudgetMembersRow = ({
  members,
  projectId,
  canManageMembers,
  currentUserId
}: BudgetMembersRowProps) => (
  <div className="mt-3 flex items-center gap-4">
    <div className="flex items-center gap-2">
      {members.map((member) => (
        <span
          key={member.userId}
          title={member.firstName?.trim() || member.email || member.userId}
          className={
            member.userId === currentUserId
              ? "flex h-8 w-8 items-center justify-center rounded-full border border-[#000] bg-[#000] text-xs font-medium uppercase text-[#FFF]"
              : "flex h-8 w-8 items-center justify-center rounded-full border border-[#000] text-xs font-medium uppercase"
          }
        >
          {getMemberInitial(member)}
        </span>
      ))}
    </div>
    <AddMembersDialog projectId={projectId} disabled={!projectId || !canManageMembers} />
  </div>
);
