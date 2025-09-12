import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/ChatSidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <ChatSidebar />
        
        <div className="flex-1 flex flex-col bg-background">
          {/* Global trigger that is ALWAYS visible */}
          <header className="h-12 flex items-center border-b border-border bg-background">
            <SidebarTrigger className="ml-2" />
          </header>
          
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}