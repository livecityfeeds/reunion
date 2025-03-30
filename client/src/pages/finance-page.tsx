import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useQuery } from "@tanstack/react-query";
import { BudgetSummary } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetOverview } from "@/components/finance/budget-overview";
import { ExpenseList } from "@/components/finance/expense-list";
import { Loader2 } from "lucide-react";

export default function FinancePage() {
  const [search, setSearch] = useState("");
  
  const { data, isLoading } = useQuery<BudgetSummary>({
    queryKey: ["/api/budget-summary"],
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 bg-gray-100 min-h-screen">
        <Header title="Financial Overview" />
        
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          {/* Financial Summary Cards */}
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{data.totalBudget.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{data.totalExpenses.toLocaleString()}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {Math.round((data.totalExpenses / data.totalBudget) * 100)}% of budget
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Current Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{data.balance.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Total collections: ₹{data.totalContributions.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Pie Chart */}
            <BudgetOverview />
            
            {/* Recent Expenses Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseList
                  searchValue={search}
                  onSearchChange={setSearch}
                />
              </CardContent>
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <a href="/expenses" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  View all expenses →
                </a>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
