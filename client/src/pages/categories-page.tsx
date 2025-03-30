import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash, Loader2 } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { DataTable } from "@/components/ui/data-table";
import { BadgeStatus } from "@/components/ui/badge-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Category } from "@shared/schema";
import { CategoryForm } from "@/components/categories/category-form";

export default function CategoriesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  // Fetch categories
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!currentCategory) throw new Error("No category selected");
      return apiRequest("DELETE", `/api/categories/${currentCategory.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDeleteModalOpen(false);
      toast({
        title: "Category Deleted",
        description: "The category has been deleted successfully.",
      });
      setCurrentCategory(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter data based on search
  const filteredData = categories
    ? categories.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()) ||
        item.type.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // For pagination
  const pageCount = filteredData ? Math.ceil(filteredData.length / pageSize) : 0;
  const paginatedData = filteredData
    ? filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
    : [];

  // Handlers
  const handleEdit = (item: Category) => {
    setCurrentCategory(item);
    setFormModalOpen(true);
  };

  const handleAdd = () => {
    setCurrentCategory(null);
    setFormModalOpen(true);
  };

  const handleDelete = (item: Category) => {
    setCurrentCategory(item);
    setDeleteModalOpen(true);
  };

  // DataTable columns
  const columns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (row: Category) => (
        <div className="text-sm font-medium text-gray-900">{row.name}</div>
      ),
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: (row: Category) => (
        <BadgeStatus status={row.type} />
      ),
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: (row: Category) => (
        <div className="text-sm text-gray-500">{row.description || "N/A"}</div>
      ),
    },
    {
      header: "Actions",
      accessorKey: (row: Category) => (
        <div className="flex justify-end space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(row)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 bg-gray-100 min-h-screen">
        <Header title="Category Management" />
        
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Categories</CardTitle>
              <Button size="sm" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-1" />
                Add Category
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={paginatedData}
                columns={columns}
                isLoading={isLoading}
                searchPlaceholder="Search categories..."
                searchValue={search}
                onSearchChange={setSearch}
                pagination={{
                  pageIndex: currentPage,
                  pageSize: pageSize,
                  pageCount: pageCount,
                  onPageChange: setCurrentPage,
                }}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Category Form Modal */}
      <CategoryForm
        category={currentCategory || undefined}
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        title={currentCategory ? "Edit Category" : "Add Category"}
      />
      
      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : "Delete Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}