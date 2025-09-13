import React from 'react';
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/ChatSidebar";
import { MessageSquare } from "lucide-react";

function MainContent({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Mobile trigger for collapsed sidebar */}
      {collapsed && (
        <header className="h-14 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40 px-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded-md flex items-center justify-center">
                <MessageSquare className="w-3 h-3 text-primary-foreground" />
              </div>
              <h1 className="text-sm font-semibold text-foreground">adamGPT</h1>
            </div>
          </div>
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
    <SidebarProvider defaultOpen={window.innerWidth >= 1024}>
      <div className="flex min-h-screen w-full bg-background">
        <ChatSidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}