"use client";

import React from "react";
import { Bell } from "lucide-react";
import { useAlerts } from "@/contexts/AlertContext";

interface AlertBadgeProps {
  onClick: () => void;
}

/** Bell icon with un-dismissed event count badge. */
export function AlertBadge({ onClick }: AlertBadgeProps) {
  const { activeCount } = useAlerts();

  return (
    <button
      onClick={onClick}
      className="relative text-white/50 hover:text-white/80 transition-colors"
      title="Alerts"
    >
      <Bell size={16} />
      {activeCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1 leading-none">
          {activeCount > 99 ? "99+" : activeCount}
        </span>
      )}
    </button>
  );
}
