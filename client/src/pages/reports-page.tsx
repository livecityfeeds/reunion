import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BudgetSummary, DashboardSummary } from "@shared/schema";
import { CustomPieChart, CustomBarChart } from "@/components/ui/charts";
import { BadgeStatus } from "@/components/ui/badge-status";
import { Loader2 } from "lucide-react";

export default function ReportsPage() {
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardSummary>({
    queryKey: ["/api/dashboard"],
  });
  
  const { data: budgetData, isLoading: budgetLoading } = useQuery<BudgetSummary>({
    queryKey: ["/api/budget-summary"],
  });
  
  const isLoading = dashboardLoading || budgetLoading;
  
  // Generate section attendance data for charts
  const sectionAttendanceData = dashboardData?.sectionStats.map(section => ({
    section: `Section ${section.section}`,
    attending: section.attendingCount,
    notAttending: section.totalStudents - section.attendingCount - section.notConfirmedCount,
    notConfirmed: section.notConfirmedCount,
  })) || [];
  
  // Generate section payment data for charts
  const sectionPaymentData = dashboardData?.sectionStats.map(section => ({
    section: `Section ${section.section}`,
    paid: section.paidCount,
    pending: section.pendingCount,
    notPaid: section.totalStudents - section.paidCount - section.pendingCount,
  })) || [];
  
  // Generate budget vs expense data
  const budgetVsExpenseData = budgetData?.categoryBreakdown.map(item => ({
    category: item.category.charAt(0).toUpperCase() + item.category.slice(1),
    budget: item.estimatedAmount,
    expenses: item.actualAmount,
    remaining: item.estimatedAmount - item.actualAmount,
  })) || [];
  
  // Generate contribution vs expense pie data
  const contributionVsExpenseData = [
    {
      name: "Expenses",
      value: budgetData?.totalExpenses || 0,
    },
    {
      name: "Remaining",
      value: Math.max(0, (budgetData?.totalContributions || 0) - (budgetData?.totalExpenses || 0)),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 bg-gray-100 min-h-screen">
        <Header title="Reports & Analytics" />
        
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <>
              {/* Financial Summary */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.totalStudents || 0}</div>
                    <div className="flex items-center mt-2">
                      <BadgeStatus
                        status={`${dashboardData?.attendingCount || 0} Attending`}
                        variant="attending"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Contributions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{dashboardData?.totalContributions.toLocaleString() || "0"}</div>
                    <div className="flex items-center mt-2">
                      <BadgeStatus
                        status={`${dashboardData?.paidCount || 0} Paid`}
                        variant="payment"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{budgetData?.totalExpenses.toLocaleString() || "0"}</div>
                    <div className="text-sm text-gray-500 mt-2">
                      {budgetData 
                        ? Math.round((budgetData.totalExpenses / budgetData.totalBudget) * 100)
                        : 0}% of budget
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${budgetData && budgetData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{budgetData?.balance.toLocaleString() || "0"}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Remaining funds
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <CustomBarChart
                  data={sectionAttendanceData}
                  title="Section-wise Attendance"
                  xAxisDataKey="section"
                  bars={[
                    { dataKey: "attending", name: "Attending", color: "#10B981" },
                    { dataKey: "notAttending", name: "Not Attending", color: "#DC2626" },
                    { dataKey: "notConfirmed", name: "Not Confirmed", color: "#6B7280" },
                  ]}
                  height={300}
                />
                
                <CustomBarChart
                  data={sectionPaymentData}
                  title="Section-wise Payment Status"
                  xAxisDataKey="section"
                  bars={[
                    { dataKey: "paid", name: "Paid", color: "#10B981" },
                    { dataKey: "pending", name: "Pending", color: "#F59E0B" },
                    { dataKey: "notPaid", name: "Not Paid", color: "#6B7280" },
                  ]}
                  height={300}
                />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CustomBarChart
                  data={budgetVsExpenseData}
                  title="Budget vs Actual Expenses"
                  xAxisDataKey="category"
                  bars={[
                    { dataKey: "budget", name: "Budget", color: "#3B82F6" },
                    { dataKey: "expenses", name: "Actual Expenses", color: "#F59E0B" },
                  ]}
                  height={300}
                />
                
                <CustomPieChart
                  data={contributionVsExpenseData}
                  title="Contribution Utilization"
                  nameKey="name"
                  dataKey="value"
                  height={300}
                  colors={['#F59E0B', '#10B981']}
                />
              </div>
              
              {/* Detailed Report */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Financial Summary Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Overall Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Total Budget</p>
                          <p className="text-lg font-medium">₹{budgetData?.totalBudget.toLocaleString() || "0"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Expenses</p>
                          <p className="text-lg font-medium">₹{budgetData?.totalExpenses.toLocaleString() || "0"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Contributions</p>
                          <p className="text-lg font-medium">₹{budgetData?.totalContributions.toLocaleString() || "0"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Current Balance</p>
                          <p className={`text-lg font-medium ${budgetData && budgetData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{budgetData?.balance.toLocaleString() || "0"}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Category-wise Spending</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Budget
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Expenses
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Variance
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                % Utilized
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {budgetData?.categoryBreakdown.map((item, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <BadgeStatus status={item.category} />
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                  ₹{item.estimatedAmount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                  ₹{item.actualAmount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                  <span className={item.estimatedAmount - item.actualAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    ₹{(item.estimatedAmount - item.actualAmount).toLocaleString()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                  {item.estimatedAmount > 0 
                                    ? Math.round((item.actualAmount / item.estimatedAmount) * 100)
                                    : 0}%
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-gray-50 font-medium">
                              <td className="px-6 py-4 whitespace-nowrap">Total</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                ₹{budgetData?.totalBudget.toLocaleString() || "0"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                ₹{budgetData?.totalExpenses.toLocaleString() || "0"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className={
                                  budgetData && budgetData.totalBudget - budgetData.totalExpenses >= 0 
                                    ? 'text-green-600' : 'text-red-600'
                                }>
                                  ₹{budgetData 
                                    ? (budgetData.totalBudget - budgetData.totalExpenses).toLocaleString() 
                                    : "0"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                {budgetData && budgetData.totalBudget > 0 
                                  ? Math.round((budgetData.totalExpenses / budgetData.totalBudget) * 100)
                                  : 0}%
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
