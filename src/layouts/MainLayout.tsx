import React from 'react';
import { ResponsiveSidebar } from '@/components/ResponsiveSidebar';
import { useResponsive } from '@/hooks/use-responsive';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const { isMobile, isTablet } = useResponsive();
  const isMobileOrTablet = isMobile || isTablet;
  const { isCollapsed, toggleCollapse } = useSidebar();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {!isMobileOrTablet && (
        <div className="fixed left-0 top-0 h-screen z-30">
          <ResponsiveSidebar 
            isCollapsed={isCollapsed} 
            onToggleCollapse={toggleCollapse}
          />
        </div>
      )}
      {isMobileOrTablet && <ResponsiveSidebar />}
      
      <main className={`flex-1 flex flex-col overflow-hidden ${!isMobileOrTablet ? (isCollapsed ? 'ml-16' : 'ml-80') : ''} transition-all duration-300`}>
        {children}
      </main>
    </div>
  );
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
}