import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ExpenseList } from "@/components/finance/expense-list";
import { ExpenseForm } from "@/components/finance/expense-form";
import { useQuery } from "@tanstack/react-query";
import { BudgetSummary } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/use-categories";

export default function ExpensesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  
  const { data } = useQuery<BudgetSummary>({
    queryKey: ["/api/budget-summary"],
  });

  // Get categories from database
  const { categoryOptions, isLoading: categoriesLoading } = useCategories();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 bg-gray-100 min-h-screen">
        <Header title="Expense Management" />
        
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{data?.totalExpenses.toLocaleString() || "0"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Budget Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data ? Math.round((data.totalExpenses / data.totalBudget) * 100) : 0}%
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${data ? Math.min(100, Math.round((data.totalExpenses / data.totalBudget) * 100)) : 0}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${data && data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{data?.balance.toLocaleString() || "0"}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expense Management</CardTitle>
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              {!categoriesLoading && categoryOptions && categoryOptions.length > 0 && (
                <Tabs
                  defaultValue="all"
                  className="w-full mb-6"
                  onValueChange={(value) => setSelectedCategory(value === "all" ? undefined : value)}
                >
                  <TabsList className="inline-flex mb-2">
                    <TabsTrigger value="all">All Categories</TabsTrigger>
                    {categoryOptions.map((category) => (
                      <TabsTrigger key={category.value} value={category.value}>
                        {category.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
              
              <ExpenseList
                searchValue={search}
                onSearchChange={setSearch}
                selectedCategory={selectedCategory}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      
      <ExpenseForm
        open={showAddModal}
        onOpenChange={setShowAddModal}
        title="Add New Expense"
      />
    </div>
  );
}
