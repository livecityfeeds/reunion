import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  user: {
    firstName?: string;
    lastName?: string;
    username?: string;
    fullName?: string;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
  randomColor?: boolean;
}

// Function to get initials from name
const getInitials = (user: UserAvatarProps["user"]): string => {
  if (user.fullName) {
    const nameParts = user.fullName.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return user.fullName[0].toUpperCase();
  }
  
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  
  if (user.username) {
    return user.username[0].toUpperCase();
  }
  
  return "U";
};

// Function to generate a random HSL color
const getRandomColor = (name: string): string => {
  // Generate a consistent color from a string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to HSL color (vibrant colors with good contrast for text)
  const h = hash % 360;
  return `hsl(${h}, 70%, 40%)`;
};

export function UserAvatar({ 
  user, 
  size = "md", 
  className,
  randomColor = true,
  ...props 
}: UserAvatarProps) {
  const initials = getInitials(user);
  
  const sizeClass = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  };
  
  const baseFullName = user.fullName || 
    `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
    user.username || 
    'User';
  
  const bgColor = randomColor ? getRandomColor(baseFullName) : undefined;
  
  return (
    <Avatar 
      className={cn(sizeClass[size], className)}
      {...props}
    >
      <AvatarFallback 
        style={bgColor ? { backgroundColor: bgColor } : undefined}
        className="text-white"
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
