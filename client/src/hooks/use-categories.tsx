import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";

/**
 * Custom hook to fetch categories from the API
 */
export function useCategories() {
  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Map category names to lowercase to match the expenseCategoryEnum values
  const categoryOptions = categories?.map(category => ({
    label: category.name,
    value: category.name.toLowerCase(), // Match the enum value format
    description: category.description || "",
    type: category.type
  })) || [];

  return {
    categories,
    categoryOptions,
    isLoading,
    error
  };
}