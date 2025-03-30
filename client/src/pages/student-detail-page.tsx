import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { User, Pencil, ArrowLeft, IndianRupee } from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { BadgeStatus } from "@/components/ui/badge-status";
import { Student } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StudentForm } from "@/components/students/student-form";
import { ContributionList } from "@/components/payments/contribution-list";
import { ContributionForm } from "@/components/payments/contribution-form";

export default function StudentDetailPage() {
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = React.useState(false);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/students/:id");
  
  const studentId = match ? parseInt(params.id) : null;

  // Fetch student data
  const { data: student, isLoading, error } = useQuery({
    queryKey: ["/api/students", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const res = await apiRequest("GET", `/api/students/${studentId}`);
      return res.json();
    },
    enabled: !!studentId,
  });

  // Check if user can edit this student
  const canEdit = user?.role === "superadmin" || 
    (user?.role === "section_admin" && user.section === student?.section);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 md:ml-64 bg-gray-100 min-h-screen">
          <Header title="Student Details" />
          <div className="py-6 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 md:ml-64 bg-gray-100 min-h-screen">
          <Header title="Student Details" />
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-600">Error loading student details</h2>
              <p className="mt-2 text-gray-600">Unable to load this student's information. They may not exist or you may not have permission to view them.</p>
              <Button className="mt-4" onClick={() => setLocation("/students")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Format date of birth if available
  const formattedDob = student.dob ? format(new Date(student.dob), "MMMM d, yyyy") : "Not provided";

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 bg-gray-100 min-h-screen">
        <Header title="Student Details" />
        
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex justify-between items-center">
            <Button variant="outline" onClick={() => setLocation("/students")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
            </Button>
            {canEdit && (
              <Button onClick={() => setIsEditModalOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit Student
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student Info Card */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Student Profile</CardTitle>
                <CardDescription>Personal information and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center mb-6">
                  <UserAvatar
                    user={{
                      firstName: student.firstName,
                      lastName: student.lastName
                    }}
                    className="h-24 w-24 mb-4"
                  />
                  <h3 className="text-xl font-bold">{student.firstName} {student.lastName}</h3>
                  <p className="text-sm text-muted-foreground">Section {student.section}</p>
                  <div className="flex gap-2 mt-2">
                    <BadgeStatus
                      status={student.attendingStatus}
                      variant="attending"
                    />
                    <BadgeStatus
                      status={student.paidStatus}
                      variant="payment"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mobile:</span>
                    <span className="font-medium">{student.mobile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{student.email || "Not provided"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Birth:</span>
                    <span className="font-medium">{formattedDob}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current City:</span>
                    <span className="font-medium">{student.city || "Not provided"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Occupation:</span>
                    <span className="font-medium">{student.work || "Not provided"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Contribution:</span>
                    <span className="font-medium">₹{(student.contributionAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Payment History Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Contribution History</h3>
                    <p className="text-sm text-gray-500">Records of all past contributions</p>
                  </div>
                  {canEdit && (
                    <Button 
                      onClick={() => setIsContributionModalOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <IndianRupee className="h-4 w-4" />
                      Add Contribution
                    </Button>
                  )}
                </div>
                <ContributionList student={student} hideAddButton={true} />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Edit Student Form Modal */}
      {canEdit && (
        <StudentForm
          student={{
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            section: student.section,
            gender: student.gender,
            mobile: student.mobile,
            email: student.email || "",
            dob: student.dob || "",
            city: student.city || "",
            work: student.work || "",
            attendingStatus: student.attendingStatus,
            paidStatus: student.paidStatus,
          }}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          title="Edit Student"
        />
      )}
      
      {/* Contribution Form Modal */}
      {canEdit && (
        <ContributionForm
          student={student}
          open={isContributionModalOpen}
          onOpenChange={setIsContributionModalOpen}
        />
      )}
    </div>
  );
}