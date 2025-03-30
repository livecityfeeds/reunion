import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { insertContributionSchema, Student } from "@shared/schema";

// Extend the contribution schema with validation rules
const contributionFormSchema = insertContributionSchema.extend({
  amount: z.coerce
    .number()
    .min(1, "Amount must be at least 1")
    .max(100000, "Amount must not exceed 100,000"),
  date: z.coerce.date({
    required_error: "Date is required",
  }),
});

// Infer the type for the form from the schema
type ContributionFormData = z.infer<typeof contributionFormSchema>;

interface ContributionFormProps {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode?: boolean;
  defaultValues?: Partial<ContributionFormData>;
  contributionId?: number;
}

export function ContributionForm({
  student,
  open,
  onOpenChange,
  isEditMode = false,
  defaultValues,
  contributionId,
}: ContributionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date();

  // Set form default values
  const form = useForm<ContributionFormData>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      studentId: student.id,
      date: today,
      amount: 0,
      ...defaultValues,
    },
  });

  // Handle form submission
  const mutation = useMutation({
    mutationFn: async (formData: ContributionFormData) => {
      const data = {
        ...formData,
        date: format(formData.date, "yyyy-MM-dd"),
      };

      let res;
      if (isEditMode && contributionId) {
        res = await apiRequest("PUT", `/api/contributions/${contributionId}`, data);
      } else {
        res = await apiRequest("POST", "/api/contributions", data);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contributions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      onOpenChange(false);
      form.reset();
      toast({
        title: isEditMode
          ? "Contribution updated successfully"
          : "Contribution recorded successfully",
        description: isEditMode
          ? `The contribution record has been updated.`
          : `A contribution of ₹${form.getValues().amount} has been recorded for ${student.firstName} ${student.lastName}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to record contribution",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Contribution" : "Add Contribution"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the contribution details below."
              : `Add a contribution for ${student.firstName} ${student.lastName}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter contribution amount"
                      type="number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Contribution Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("2000-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Processing..." : isEditMode ? "Update Contribution" : "Add Contribution"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}