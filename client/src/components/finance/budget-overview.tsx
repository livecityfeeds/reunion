import React from "react";
import { useQuery } from "@tanstack/react-query";
import { CustomPieChart } from "@/components/ui/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface BudgetSummary {
  totalBudget: number;
  totalExpenses: number;
  totalContributions: number;
  balance: number;
  categoryBreakdown: {
    category: string;
    estimatedAmount: number;
    actualAmount: number;
  }[];
}

export function BudgetOverview() {
  const { data, isLoading } = useQuery<BudgetSummary>({
    queryKey: ["/api/budget-summary"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-72">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="text-gray-500">No budget data available</p>
        </CardContent>
      </Card>
    );
  }

  // Transform data for pie chart
  const chartData = data.categoryBreakdown
    .filter((item) => item.estimatedAmount > 0)
    .map((item) => ({
      name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
      value: item.estimatedAmount,
    }));

  return (
    <CustomPieChart
      data={chartData}
      title="Budget Allocation"
      nameKey="name"
      dataKey="value"
      height={350}
      colors={[
        '#3B82F6', // blue - venue
        '#10B981', // green - food
        '#F59E0B', // amber - entertainment
        '#8B5CF6', // violet - decorations
        '#EC4899', // pink - transportation
        '#F97316', // orange - gifts
        '#6B7280', // gray - miscellaneous
        '#0EA5E9', // sky - technology
        '#14B8A6', // teal - marketing
      ]}
    />
  );
}
