import React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  className?: string;
}

export function Header({ title, className }: HeaderProps) {
  // Calculate days remaining until reunion
  const reunionDate = new Date(2025, 3, 6); // April 6, 2025
  const today = new Date();
  const timeDiff = reunionDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

  return (
    <header className={cn("bg-white shadow", className)}>
      <div className="mx-auto px-4 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <div className="flex items-center">
          <span className="bg-green-100 text-green-800 text-xs font-medium mr-4 px-2.5 py-0.5 rounded-full">
            Event: April 6, 2025
          </span>
          <div className="relative">
            <Button variant="ghost" className="p-2 rounded-full relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-600 text-white text-xs absolute -top-2 -right-2">
                {daysRemaining < 100 ? '!' : '3'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
