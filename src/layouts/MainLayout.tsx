import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import ChatSidebar from "@/components/ChatSidebar";

function MainContent({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Mobile Header with Sidebar Toggle */}
      {isMobile && (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4">
            <SidebarTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
            </SidebarTrigger>
            <div className="flex-1" />
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
  const isMobile = useIsMobile();
  
  return (
    <SidebarProvider 
      defaultOpen={!isMobile && window.innerWidth >= 1024}
      className="min-h-screen"
    >
      <div className="flex min-h-screen w-full bg-background">
        <ChatSidebar isOpen={true} onClose={() => {}} />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}