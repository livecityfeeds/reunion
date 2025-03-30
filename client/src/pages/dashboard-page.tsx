import React from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardSummary } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { SectionStatistics } from "@/components/dashboard/section-statistics";
import { CustomBarChart } from "@/components/ui/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardSummary>({
    queryKey: ["/api/dashboard"],
  });

  // Calculate percentages
  const attendingPercentage = data 
    ? Math.round((data.attendingCount / (data.totalStudents || 1)) * 100) 
    : 0;
  
  const paidPercentage = data 
    ? Math.round((data.paidCount / (data.totalStudents || 1)) * 100) 
    : 0;

  // Bar chart data for section-wise attendance
  const sectionData = data?.sectionStats.map(section => ({
    section: `Section ${section.section}`,
    attending: section.attendingCount,
    total: section.totalStudents,
  })) || [];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 bg-gray-100 min-h-screen">
        <Header title="Dashboard" />
        
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : error ? (
            <div className="text-center p-6 bg-white rounded-lg shadow">
              <p className="text-red-500">Failed to load dashboard data</p>
              <p className="text-gray-500 mt-2">Please try refreshing the page</p>
            </div>
          ) : data ? (
            <>
              <DashboardCards 
                totalStudents={data.totalStudents}
                attendingCount={data.attendingCount}
                attendingPercentage={attendingPercentage}
                totalContributions={data.totalContributions}
                paidCount={data.paidCount}
                paidPercentage={paidPercentage}
                totalExpenses={data.totalExpenses}
                budgetUtilization={data.budgetUtilization}
                daysRemaining={data.daysRemaining}
                progressPercentage={data.progressPercentage}
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <div className="lg:col-span-2">
                  <CustomBarChart
                    data={sectionData}
                    title="Section-wise Attendance"
                    xAxisDataKey="section"
                    bars={[
                      { dataKey: "attending", name: "Attending", color: "#3B82F6" },
                      { dataKey: "total", name: "Total Students", color: "#E5E7EB" }
                    ]}
                    height={300}
                  />
                </div>
                
                <div>
                  <SectionStatistics sectionStats={data.sectionStats} />
                </div>
              </div>
              
              {/* Recent Students and Activities */}
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Reunion Countdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="text-5xl font-bold text-blue-600 mb-2">
                        {data.daysRemaining}
                      </div>
                      <div className="text-lg text-gray-600">
                        Days until our reunion!
                      </div>
                      <div className="mt-6 w-full max-w-md">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-blue-600 h-4 rounded-full"
                            style={{ width: `${data.progressPercentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-2 text-sm text-gray-600">
                          <span>Planning Started</span>
                          <span>April 6, 2025</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center p-6 bg-white rounded-lg shadow">
              <p className="text-gray-500">No dashboard data available</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
