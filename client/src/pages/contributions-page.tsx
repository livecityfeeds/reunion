import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { AllContributionsList } from "@/components/payments/all-contributions-list";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function ContributionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "superadmin" || user?.role === "section_admin";
  const [searchValue, setSearchValue] = useState("");
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 bg-gray-100 min-h-screen">
        <Header title="Contributions" />
        
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">All Contributions</h2>
            <p className="text-gray-500 mb-6">View and manage all student contributions across sections</p>
            
            <AllContributionsList 
              searchValue={searchValue} 
              onSearchChange={setSearchValue} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}