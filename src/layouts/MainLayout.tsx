import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import ChatSidebar from "@/components/ChatSidebar";

function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col bg-background">
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
        <ChatSidebar isOpen={true} onClose={() => {}} />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}