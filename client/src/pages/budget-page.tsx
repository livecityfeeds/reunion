import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { BadgeStatus } from "@/components/ui/badge-status";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Loader2, Plus, Trash } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BudgetItem } from "@shared/schema";
import { BudgetOverview } from "@/components/finance/budget-overview";
import { useCategories } from "@/hooks/use-categories";

// Budget form schema
const budgetFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  category: z.string().min(1, { message: "Category is required" }),
  description: z.string().min(3, { message: "Description must be at least 3 characters" }),
  estimatedAmount: z.coerce.number().positive({ message: "Amount must be greater than 0" }),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export default function BudgetPage() {
  const { toast } = useToast();
  const { categoryOptions, isLoading: categoriesLoading } = useCategories();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<BudgetItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  
  const { data: budgetItems, isLoading } = useQuery<BudgetItem[]>({
    queryKey: ["/api/budget"],
  });

  // Get first category for default value when categories are loaded
  const defaultCategory = categoryOptions && categoryOptions.length > 0 
    ? categoryOptions[0].value 
    : "";

  // Form setup
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      name: "",
      category: defaultCategory,
      description: "",
      estimatedAmount: 0,
    },
  });

  // Create/update mutation
  const mutation = useMutation({
    mutationFn: async (values: BudgetFormValues) => {
      if (currentItem) {
        return apiRequest("PUT", `/api/budget/${currentItem.id}`, values);
      } else {
        return apiRequest("POST", "/api/budget", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setFormModalOpen(false);
      toast({
        title: currentItem ? "Budget Item Updated" : "Budget Item Added",
        description: currentItem
          ? "The budget item has been updated successfully."
          : "The budget item has been added successfully.",
      });
      setCurrentItem(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!currentItem) throw new Error("No item selected");
      return apiRequest("DELETE", `/api/budget/${currentItem.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDeleteModalOpen(false);
      toast({
        title: "Budget Item Deleted",
        description: "The budget item has been deleted successfully.",
      });
      setCurrentItem(null);
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
  const filteredData = budgetItems
    ? budgetItems.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // For pagination
  const pageCount = filteredData ? Math.ceil(filteredData.length / pageSize) : 0;
  const paginatedData = filteredData
    ? filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
    : [];

  // Handlers
  const onSubmit = (values: BudgetFormValues) => {
    mutation.mutate(values);
  };

  const handleEdit = (item: BudgetItem) => {
    setCurrentItem(item);
    form.reset({
      name: item.name,
      category: item.category,
      description: item.description,
      estimatedAmount: item.estimatedAmount,
    });
    setFormModalOpen(true);
  };

  const handleAdd = () => {
    setCurrentItem(null);
    form.reset({
      name: "",
      category: defaultCategory,
      description: "",
      estimatedAmount: 0,
    });
    setFormModalOpen(true);
  };

  const handleDelete = (item: BudgetItem) => {
    setCurrentItem(item);
    setDeleteModalOpen(true);
  };

  // DataTable columns
  const columns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (row: BudgetItem) => (
        <div className="text-sm font-medium text-gray-900">{row.name}</div>
      ),
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: (row: BudgetItem) => (
        <div className="text-sm font-medium text-gray-900">{row.description}</div>
      ),
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: (row: BudgetItem) => (
        <BadgeStatus status={row.category} />
      ),
    },
    {
      header: "Estimated Amount",
      accessorKey: "estimatedAmount",
      cell: (row: BudgetItem) => (
        <div className="text-sm font-medium text-right">
          ₹{row.estimatedAmount.toLocaleString()}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: (row: BudgetItem) => (
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
        <Header title="Budget Planning" />
        
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <BudgetOverview />
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Budget Items</CardTitle>
                <Button size="sm" onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Budget Item
                </Button>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={paginatedData}
                  columns={columns}
                  isLoading={isLoading}
                  searchPlaceholder="Search budget items..."
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
        </div>
      </main>
      
      {/* Budget Item Form Modal */}
      <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentItem ? "Edit Budget Item" : "Add Budget Item"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoriesLoading ? (
                          <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                        ) : categoryOptions.length === 0 ? (
                          <SelectItem value="none" disabled>No categories found</SelectItem>
                        ) : (
                          categoryOptions.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Budget item description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="estimatedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Amount"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : currentItem ? "Update Item" : "Add Item"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this budget item? This action cannot be undone.
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
              ) : "Delete Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
