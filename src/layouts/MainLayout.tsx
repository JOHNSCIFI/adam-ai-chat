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
          <header className="h-14 flex items-center border-b border-border/50 px-6 bg-background/80 backdrop-blur-sm">
            <SidebarTrigger className="hover:bg-sidebar-accent rounded-md" />
          </header>
          
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}