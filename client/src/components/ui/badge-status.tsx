import React from "react";
import { cn } from "@/lib/utils";

type BadgeStatusProps = {
  status: string;
  variant?: "attending" | "payment" | "default";
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>;

export function BadgeStatus({
  status,
  variant = "default",
  className,
  ...props
}: BadgeStatusProps) {
  const getColors = () => {
    if (variant === "attending") {
      switch (status.toLowerCase()) {
        case "attending":
          return "bg-green-100 text-green-800";
        case "not attending":
        case "not_attending":
          return "bg-red-100 text-red-800";
        case "not confirmed":
        case "not_confirmed":
          return "bg-gray-100 text-gray-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    } else if (variant === "payment") {
      switch (status.toLowerCase()) {
        case "paid":
          return "bg-green-100 text-green-800";
        case "pending":
          return "bg-yellow-100 text-yellow-800";
        case "not paid":
        case "not_paid":
          return "bg-gray-100 text-gray-800";
        case "not applicable":
        case "not_applicable":
          return "bg-gray-100 text-gray-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    } else {
      // For categories and other badges
      const colorMap: Record<string, string> = {
        venue: "bg-blue-100 text-blue-800",
        food: "bg-green-100 text-green-800",
        entertainment: "bg-pink-100 text-pink-800",
        decoration: "bg-purple-100 text-purple-800",
        transportation: "bg-indigo-100 text-indigo-800",
        gifts: "bg-red-100 text-red-800",
        technology: "bg-purple-100 text-purple-800",
        marketing: "bg-yellow-100 text-yellow-800",
        miscellaneous: "bg-gray-100 text-gray-800",
      };

      return colorMap[status.toLowerCase()] || "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={cn(
        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
        getColors(),
        className
      )}
      {...props}
    >
      {status.replace("_", " ")}
    </span>
  );
}
