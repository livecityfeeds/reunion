import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StudentTable } from "@/components/students/student-table";
import { StudentForm } from "@/components/students/student-form";
import { ImportExcel } from "@/components/students/import-excel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { ContributionForm } from "@/components/payments/contribution-form";
import { useQuery } from "@tanstack/react-query";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | undefined>(undefined);
  const { user } = useAuth();
  const [location] = useLocation();

  // Fetch students list for contribution when needed
  const { data: students } = useQuery<any[]>({
    queryKey: ['/api/students', { limit: 1 }],
    enabled: showContributionForm,
    queryFn: () => fetch('/api/students?limit=1').then(res => res.json())
  });
  
  // Fetch specific student data if we have an ID
  const { data: studentData } = useQuery<any>({
    queryKey: ['/api/students', selectedStudentId],
    enabled: selectedStudentId !== null,
    queryFn: () => fetch(`/api/students/${selectedStudentId}`).then(res => res.json())
  });
  
  // Set the selected student ID when students are loaded
  useEffect(() => {
    if (students && students.length > 0 && selectedStudentId === null) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  // Parse URL query parameters to check for action
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const action = searchParams.get('action');
    
    if (action === 'add_contribution') {
      // If action is to add contribution, show the contribution form
      setShowContributionForm(true);
    }
  }, [location]);

  // Only section admins and superadmins can add new students or import
  const canAddStudents = user?.role === "superadmin" || user?.role === "section_admin";

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 bg-gray-100 min-h-screen">
        <Header title="Student Management" />
        
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <h2 className="text-lg font-semibold text-gray-900">Student Management</h2>
                {canAddStudents && (
                  <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
                    <Button
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Student
                    </Button>
                    <ImportExcel />
                  </div>
                )}
              </div>
            </div>
            
            {user?.role === "superadmin" && (
              <div className="px-6 pt-4">
                <Tabs
                  defaultValue="all"
                  className="w-full"
                  onValueChange={(value) => setSelectedSection(value === "all" ? undefined : value)}
                >
                  <TabsList className="grid grid-cols-5 w-full max-w-md">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="A">Section A</TabsTrigger>
                    <TabsTrigger value="B">Section B</TabsTrigger>
                    <TabsTrigger value="C">Section C</TabsTrigger>
                    <TabsTrigger value="D">Section D</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
            
            <div className="px-6 py-4">
              <StudentTable
                searchValue={search}
                onSearchChange={setSearch}
                selectedSection={selectedSection}
              />
            </div>
          </div>
        </div>
      </main>
      
      {canAddStudents && (
        <StudentForm
          open={showAddModal}
          onOpenChange={setShowAddModal}
          title="Add New Student"
        />
      )}
      
      {showContributionForm && selectedStudentId && studentData && (
        <ContributionForm
          open={showContributionForm}
          onOpenChange={setShowContributionForm}
          student={studentData}
          onSuccess={() => {
            setShowContributionForm(false);
            setSelectedStudentId(null);
          }}
        />
      )}
    </div>
  );
}
