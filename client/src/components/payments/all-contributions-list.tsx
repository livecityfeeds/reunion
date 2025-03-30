import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { Edit, Trash2, Eye, IndianRupee } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { ContributionForm } from "./contribution-form";
import { Contribution, Student } from "@shared/schema";

interface AllContributionsListProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function AllContributionsList({ 
  searchValue, 
  onSearchChange 
}: AllContributionsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const [contributionToDelete, setContributionToDelete] = useState<Contribution | null>(null);
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fetch all contributions
  const { data = [], isLoading } = useQuery<(Contribution & { student?: Student })[]>({
    queryKey: ["/api/contributions", { search: searchValue }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/contributions/with-students${searchValue ? `?search=${searchValue}` : ""}`);
      return res.json();
    },
  });

  // Delete contribution mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/contributions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contributions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Contribution record deleted",
        description: "The contribution record has been successfully removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete contribution record",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteConfirm = () => {
    if (contributionToDelete) {
      deleteMutation.mutate(contributionToDelete.id);
      setContributionToDelete(null);
    }
  };

  const handleViewStudent = (studentId: number) => {
    setLocation(`/students/${studentId}`);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Check if user is an admin
  const isAdmin = user?.role === "superadmin" || user?.role === "section_admin";
  const isSuperAdmin = user?.role === "superadmin";

  const columns = [
    {
      header: "Date",
      accessorKey: "date",
      cell: (row: any) => <div>{formatDate(row.date)}</div>,
    },
    {
      header: "Student",
      accessorKey: "studentId",
      cell: (row: any) => (
        <div className="flex items-center">
          <Button
            variant="link"
            onClick={() => handleViewStudent(row.studentId)}
            className="p-0 h-auto font-medium text-primary"
          >
            {row.student?.firstName} {row.student?.lastName}
          </Button>
          <span className="ml-2 text-sm text-muted-foreground">
            (Section {row.student?.section})
          </span>
        </div>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: (row: any) => <div className="font-medium">₹{row.amount.toLocaleString()}</div>,
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row: any) => (
        <div className="flex justify-end space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewStudent(row.studentId)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {isAdmin && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedContribution(row);
                  // We need to fetch the student data to pass to the form
                  fetchStudentAndOpenForm(row.studentId, row);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              {isSuperAdmin && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setContributionToDelete(row)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  // Function to fetch student data and open contribution form
  const fetchStudentAndOpenForm = async (studentId: number, contribution: Contribution | null = null) => {
    try {
      const res = await apiRequest("GET", `/api/students/${studentId}`);
      const student = await res.json();
      setSelectedStudent(student);
      if (contribution) {
        setSelectedContribution(contribution);
      }
      setEditModalOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch student data",
        variant: "destructive",
      });
    }
  };

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
        searchPlaceholder="Search contributions..."
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        pagination={{
          pageIndex: currentPage,
          pageSize: pageSize,
          pageCount: pageCount,
          onPageChange: setCurrentPage,
        }}
      />

      {/* Contribution form dialog */}
      {selectedStudent && editModalOpen && (
        <ContributionForm
          student={selectedStudent}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          isEditMode={!!selectedContribution}
          contributionId={selectedContribution?.id}
          defaultValues={
            selectedContribution
              ? {
                  amount: selectedContribution.amount,
                  date: new Date(selectedContribution.date),
                  studentId: selectedStudent.id,
                }
              : undefined
          }
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog 
        open={!!contributionToDelete} 
        onOpenChange={(open) => !open && setContributionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              contribution record of ₹
              {contributionToDelete?.amount.toLocaleString()} from{" "}
              {formatDate(contributionToDelete?.date || "")}
              {contributionToDelete?.student && ` for ${contributionToDelete.student.firstName} ${contributionToDelete.student.lastName}`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}