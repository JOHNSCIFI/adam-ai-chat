import React from 'react';
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/ChatSidebar";

function MainContent({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Global trigger that is ONLY visible when collapsed */}
      {collapsed && (
        <header className="h-12 flex items-center border-b border-border bg-background">
          <SidebarTrigger className="ml-2" />
        </header>
      )}
      
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <ChatSidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}