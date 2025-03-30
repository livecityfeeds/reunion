import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { BadgeStatus } from "@/components/ui/badge-status";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { format } from "date-fns";
import { Expense } from "@shared/schema";
import { ExpenseForm } from "@/components/finance/expense-form";
import { useAuth } from "@/hooks/use-auth";

interface ExpenseListProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedCategory?: string;
}

export function ExpenseList({
  searchValue,
  onSearchChange,
  selectedCategory,
}: ExpenseListProps) {
  const { user } = useAuth();
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Query string for API
  const queryString = new URLSearchParams({
    ...(selectedCategory ? { category: selectedCategory } : {}),
  }).toString();

  const { data, isLoading } = useQuery<Expense[]>({
    queryKey: [`/api/expenses${queryString ? `?${queryString}` : ''}`],
  });

  // Filter data based on search input
  const filteredData = data
    ? data.filter((expense) =>
        expense.description.toLowerCase().includes(searchValue.toLowerCase())
      )
    : [];

  const columns = [
    {
      header: "Description",
      accessorKey: "description",
      cell: (row: Expense) => (
        <div className="text-sm font-medium text-gray-900">{row.description}</div>
      ),
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: (row: Expense) => (
        <BadgeStatus status={row.category} />
      ),
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: (row: Expense) => (
        <div className="text-sm text-gray-500">
          {format(new Date(row.date), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: (row: Expense) => (
        <div className="text-sm font-medium text-right">
          ₹{row.amount.toLocaleString()}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: (row: Expense) => (
        <div className="flex justify-end space-x-2">
          {(user?.role === "superadmin" || user?.role === "section_admin") && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedExpense(row);
                setEditModalOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // For pagination
  const pageCount = filteredData ? Math.ceil(filteredData.length / pageSize) : 0;
  const paginatedData = filteredData
    ? filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
    : [];

  return (
    <>
      <DataTable
        data={paginatedData}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search expenses..."
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        pagination={{
          pageIndex: currentPage,
          pageSize: pageSize,
          pageCount: pageCount,
          onPageChange: setCurrentPage,
        }}
      />

      {selectedExpense && (
        <ExpenseForm
          expense={selectedExpense}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          title="Edit Expense"
        />
      )}
    </>
  );
}
