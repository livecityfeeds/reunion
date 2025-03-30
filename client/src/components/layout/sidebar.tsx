import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  CreditCard,
  Calculator,
  PiggyBank,
  BarChart4,
  LogOut,
  Menu,
  User,
  Tags,
  Wallet,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useMediaQuery } from "@/hooks/use-mobile";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: "Students",
      href: "/students",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Contributions",
      href: "/contributions",
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      label: "Finances",
      href: "/finances",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      label: "Budget Planning",
      href: "/budget",
      icon: <Calculator className="h-5 w-5" />,
      roles: ["superadmin", "section_admin"],
    },
    {
      label: "Expenses",
      href: "/expenses",
      icon: <PiggyBank className="h-5 w-5" />,
      roles: ["superadmin", "section_admin"],
    },
    {
      label: "Reports",
      href: "/reports",
      icon: <BarChart4 className="h-5 w-5" />,
      roles: ["superadmin", "section_admin"],
    },
    {
      label: "Categories",
      href: "/categories",
      icon: <Tags className="h-5 w-5" />,
      roles: ["superadmin"],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role || "")
  );

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const renderUserInfo = () => (
    <div className="mb-6 p-4">
      <div className="flex items-center space-x-2 mb-2">
        <UserAvatar
          user={{
            username: user?.username || "User",
          }}
          size="md"
        />
        <div>
          <p className="font-medium text-sm text-white">{user?.username}</p>
          <p className="text-gray-400 text-xs capitalize">
            {user?.role === "section_admin"
              ? `Section ${user.section} Admin`
              : user?.role}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile header with toggle button */}
      <div className="bg-gray-800 text-white md:hidden p-4 flex justify-between items-center fixed top-0 w-full z-20">
        <h1 className="font-bold text-xl">Batch 2002 Reunion</h1>
        <button onClick={toggleSidebar} className="md:hidden">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-gray-800 text-white w-64 min-h-screen fixed top-0 left-0 z-10 transition-transform duration-300 transform",
          {
            "-translate-x-full": isMobile && !isSidebarOpen,
            "translate-x-0": !isMobile || isSidebarOpen,
          }
        )}
      >
        <div className="p-4 flex justify-center md:justify-center py-6">
          <h1 className="font-bold text-xl md:text-2xl">Batch 2002 Reunion</h1>
        </div>

        {renderUserInfo()}

        <nav>
          <ul className="space-y-1 px-2">
            {filteredNavItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2.5 rounded-md transition cursor-pointer",
                      {
                        "bg-gray-900 text-white": location === item.href,
                        "text-gray-300 hover:bg-gray-700":
                          location !== item.href,
                      }
                    )}
                    onClick={() => isMobile && setIsSidebarOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </Link>
              </li>
            ))}

            <li className="pt-4 mt-4 border-t border-gray-700">
              <Button
                variant="ghost"
                className="flex items-center w-full space-x-2 text-gray-300 hover:bg-gray-700 px-4 py-2.5 rounded-md transition"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </Button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-0"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
}
