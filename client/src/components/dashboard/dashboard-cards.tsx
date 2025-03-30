import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CreditCard, Calculator, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  progressValue?: number;
  progressLabel?: string;
  className?: string;
  iconClassName?: string;
  progressBarClassName?: string;
}

export function StatCard({
  title,
  value,
  icon,
  progressValue = 0,
  progressLabel = "",
  className = "",
  iconClassName = "bg-blue-100 text-blue-500",
  progressBarClassName = "bg-blue-600",
}: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="pt-5">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
          <div className={cn("rounded-md p-2", iconClassName)}>
            {icon}
          </div>
        </div>
        {(progressValue > 0 || progressLabel) && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Progress</span>
              <span className="text-sm font-medium text-blue-600">{progressLabel}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
              <div
                className={cn("h-2.5 rounded-full", progressBarClassName)}
                style={{ width: `${progressValue}%` }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardCardsProps {
  totalStudents: number;
  attendingCount: number;
  attendingPercentage: number;
  totalContributions: number;
  paidCount: number;
  paidPercentage: number;
  totalExpenses: number;
  budgetUtilization: number;
  daysRemaining: number;
  progressPercentage: number;
}

export function DashboardCards({
  totalStudents,
  attendingCount,
  attendingPercentage,
  totalContributions,
  paidCount,
  paidPercentage,
  totalExpenses,
  budgetUtilization,
  daysRemaining,
  progressPercentage,
}: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Students"
        value={totalStudents}
        icon={<Users className="h-6 w-6" />}
        progressValue={attendingPercentage}
        progressLabel={`Attending: ${attendingCount} (${attendingPercentage}%)`}
        iconClassName="bg-blue-100 text-blue-500"
        progressBarClassName="bg-green-600"
      />
      <StatCard
        title="Payments"
        value={`₹${totalContributions.toLocaleString()}`}
        icon={<CreditCard className="h-6 w-6" />}
        progressValue={paidPercentage}
        progressLabel={`Paid: ${paidCount} (${paidPercentage}%)`}
        iconClassName="bg-green-100 text-green-500"
        progressBarClassName="bg-green-600"
      />
      <StatCard
        title="Budget Utilization"
        value={`₹${totalExpenses.toLocaleString()}`}
        icon={<Calculator className="h-6 w-6" />}
        progressValue={budgetUtilization}
        progressLabel={`Spent: ${budgetUtilization}%`}
        iconClassName="bg-purple-100 text-purple-500"
        progressBarClassName="bg-amber-500"
      />
      <StatCard
        title="Days Remaining"
        value={daysRemaining}
        icon={<Clock className="h-6 w-6" />}
        progressValue={progressPercentage}
        progressLabel={`${progressPercentage}% Complete`}
        iconClassName="bg-red-100 text-red-500"
        progressBarClassName="bg-blue-600"
      />
    </div>
  );
}
