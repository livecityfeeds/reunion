import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DataTable } from "@/components/ui/data-table";
import { BadgeStatus } from "@/components/ui/badge-status";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Edit, Eye, FileText, IndianRupee } from "lucide-react";
import { StudentForm } from "@/components/students/student-form";
import { ContributionForm } from "@/components/payments/contribution-form";
import { useAuth } from "@/hooks/use-auth";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  section: "A" | "B" | "C" | "D";
  gender: "male" | "female" | "other";
  mobile: string;
  email?: string;
  dob?: string;
  city?: string;
  work?: string;
  attendingStatus: "attending" | "not_attending" | "not_confirmed";
  paidStatus: "paid" | "pending" | "not_paid" | "not_applicable";
  contributionAmount?: number;
  createdAt?: string;
}

interface StudentTableProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedSection?: string;
}

export function StudentTable({
  searchValue,
  onSearchChange,
  selectedSection,
}: StudentTableProps) {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const [contributionStudent, setContributionStudent] = useState<Student | null>(null);
  const [showContributionForm, setShowContributionForm] = useState(false);

  // Only allow section admins to see their own section
  const sectionParam = user?.role === "section_admin" ? user.section : selectedSection;

  // Use a consistent query key structure for better cache invalidation
  const queryParams = {
    section: sectionParam,
    search: searchValue
  };

  const { data, isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students', queryParams],
    queryFn: async () => {
      const queryString = new URLSearchParams({
        ...(sectionParam ? { section: sectionParam } : {}),
        ...(searchValue ? { search: searchValue } : {}),
      }).toString();
      
      const url = `/api/students${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.json();
    }
  });

  const [, setLocation] = useLocation();
  const isAdmin = user?.role === "superadmin" || user?.role === "section_admin";

  const handleViewStudent = (studentId: number) => {
    setLocation(`/students/${studentId}`);
  };

  const handleAddContribution = (student: Student) => {
    setContributionStudent(student);
    setShowContributionForm(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setEditModalOpen(true);
  };

  const columns = [
    {
      header: "Name",
      accessorKey: (row: Student) => (
        <div className="flex items-center">
          <UserAvatar
            user={{
              firstName: row.firstName,
              lastName: row.lastName,
              fullName: row.fullName,
            }}
            className="mr-4"
          />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {row.fullName}
            </div>
            <div className="text-sm text-gray-500">{row.email || "-"}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Section",
      accessorKey: "section",
      cell: (row: Student) => <div className="text-sm text-gray-900">Section {row.section}</div>,
    },
    {
      header: "Contact",
      accessorKey: "mobile",
      cell: (row: Student) => <div className="text-sm text-gray-900">{row.mobile}</div>,
    },
    {
      header: "Location",
      accessorKey: "city",
      cell: (row: Student) => <div className="text-sm text-gray-900">{row.city || "-"}</div>,
    },
    {
      header: "Status",
      accessorKey: "attendingStatus",
      cell: (row: Student) => (
        <BadgeStatus
          status={row.attendingStatus.replace("_", " ")}
          variant="attending"
        />
      ),
    },
    {
      header: "Payment",
      accessorKey: "paidStatus",
      cell: (row: Student) => (
        <BadgeStatus
          status={row.paidStatus.replace("_", " ")}
          variant="payment"
        />
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row: Student) => (
        <div className="flex justify-end space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewStudent(row.id)}
          >
            <FileText className="h-4 w-4" />
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAddContribution(row)}
            >
              <IndianRupee className="h-4 w-4 text-primary" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditStudent(row)}
          >
            {user?.role === "student" ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          </Button>
        </div>
      ),
    },
  ];

  // For pagination
  const pageCount = data ? Math.ceil(data.length / pageSize) : 0;
  const paginatedData = data
    ? data.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
    : [];

  return (
    <>
      <DataTable
        data={paginatedData}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search students..."
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        pagination={{
          pageIndex: currentPage,
          pageSize: pageSize,
          pageCount: pageCount,
          onPageChange: setCurrentPage,
        }}
      />

      {selectedStudent && (
        <StudentForm
          student={{
            ...selectedStudent,
            dob: selectedStudent.dob || "",
            email: selectedStudent.email || "",
            city: selectedStudent.city || "",
            work: selectedStudent.work || "",
            // Make sure it's properly typed with enum values
            section: selectedStudent.section as "A" | "B" | "C" | "D",
            gender: selectedStudent.gender as "male" | "female" | "other",
            attendingStatus: selectedStudent.attendingStatus as "attending" | "not_attending" | "not_confirmed",
            paidStatus: selectedStudent.paidStatus as "paid" | "pending" | "not_paid" | "not_applicable"
          }}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          title={user?.role === "student" ? "Student Details" : "Edit Student"}
        />
      )}

      {/* Contribution form for quick contribution entry */}
      {contributionStudent && (
        <ContributionForm
          student={contributionStudent}
          open={showContributionForm}
          onOpenChange={setShowContributionForm}
          isEditMode={false}
        />
      )}
    </>
  );
}
