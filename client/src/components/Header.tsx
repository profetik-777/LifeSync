import { Search, Bell, Archive, User, Shield, FileText } from "lucide-react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">
                LifeSync
              </h1>
            </Link>
            <span className="ml-2 text-sm text-gray-500">Productivity Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" data-testid="button-search">
              <Search className="h-5 w-5 text-gray-500" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" data-testid="button-notifications">
              <Bell className="h-5 w-5 text-gray-500" />
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                  data-testid="button-profile"
                >
                  <span className="text-white text-sm font-semibold">JD</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" data-testid="dropdown-profile">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/docs">
                  <DropdownMenuItem className="cursor-pointer" data-testid="menu-item-docs">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Docs</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/archived-tasks">
                  <DropdownMenuItem className="cursor-pointer" data-testid="menu-item-archived-tasks">
                    <Archive className="mr-2 h-4 w-4" />
                    <span>Archived Tasks</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem className="cursor-pointer" data-testid="menu-item-my-account">
                  <User className="mr-2 h-4 w-4" />
                  <span>My Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" data-testid="menu-item-security">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Security</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
