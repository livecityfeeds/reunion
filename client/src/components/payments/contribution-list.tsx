import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface ContributionListProps {
  student: Student;
  hideAddButton?: boolean;
}

export function ContributionList({ student, hideAddButton = false }: ContributionListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
  const [contributionToDelete, setContributionToDelete] = useState<Contribution | null>(null);

  // Fetch contributions for this student
  const { data: contributions = [], isLoading } = useQuery({
    queryKey: ["/api/contributions", student.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/contributions?studentId=${student.id}`);
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

  const handleEditClick = (contribution: Contribution) => {
    setEditingContribution(contribution);
    setIsEditMode(true);
    setShowContributionForm(true);
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Contribution History
            {isAdmin && !hideAddButton && (
              <Button onClick={() => {
                setIsEditMode(false);
                setEditingContribution(null);
                setShowContributionForm(true);
              }}>
                Add Contribution
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            All contributions made by {student.firstName} {student.lastName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : contributions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No contribution records found for this student.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                  <TableHead>Recorded By</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.map((contribution: Contribution) => (
                  <TableRow key={contribution.id}>
                    <TableCell>{formatDate(contribution.date)}</TableCell>
                    <TableCell>₹{contribution.amount.toLocaleString()}</TableCell>
                    <TableCell>Admin</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(contribution)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user?.role === "superadmin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setContributionToDelete(contribution)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Contribution form dialog */}
      {showContributionForm && (
        <ContributionForm
          student={student}
          open={showContributionForm}
          onOpenChange={setShowContributionForm}
          isEditMode={isEditMode}
          contributionId={editingContribution?.id}
          defaultValues={
            isEditMode && editingContribution
              ? {
                  amount: editingContribution.amount,
                  date: new Date(editingContribution.date),
                  studentId: student.id,
                }
              : undefined
          }
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!contributionToDelete} onOpenChange={(open) => !open && setContributionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              contribution record of ₹
              {contributionToDelete?.amount.toLocaleString()} from{" "}
              {formatDate(contributionToDelete?.date || "")}.
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