import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUp, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function ImportExcel() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error("No file selected");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to import students");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.students.length} students`,
      });
      setOpen(false);
      setFile(null);
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message || "An error occurred during import",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Check file type
      if (
        !selectedFile.name.endsWith(".xlsx") &&
        !selectedFile.name.endsWith(".xls") &&
        !selectedFile.name.endsWith(".csv")
      ) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an Excel or CSV file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      // Check file type
      if (
        !droppedFile.name.endsWith(".xlsx") &&
        !droppedFile.name.endsWith(".xls") &&
        !droppedFile.name.endsWith(".csv")
      ) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an Excel or CSV file",
          variant: "destructive",
        });
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleImport = () => {
    importMutation.mutate();
  };

  return (
    <>
      <Button
        className="flex items-center gap-2"
        onClick={() => setOpen(true)}
      >
        <FileUp size={16} />
        Import Excel
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Students from Excel</DialogTitle>
            <DialogDescription>
              Upload an Excel file with student data. The file should have columns matching the student fields.
            </DialogDescription>
          </DialogHeader>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileUp className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Drag and drop your Excel file here, or click to browse
              </p>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="mt-2"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {file && (
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
              <div className="flex items-center space-x-2">
                <FileUp className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <Badge variant="outline">{(file.size / 1024).toFixed(2)} KB</Badge>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Students"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
