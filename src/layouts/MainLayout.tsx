import React from 'react';
import { ResponsiveSidebar } from '@/components/ResponsiveSidebar';
import { useResponsive } from '@/hooks/use-responsive';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { isMobile, isTablet } = useResponsive();
  const isMobileOrTablet = isMobile || isTablet;

  return (
    <div className="flex min-h-screen w-full bg-background">
      {!isMobileOrTablet && <ResponsiveSidebar />}
      {isMobileOrTablet && <ResponsiveSidebar />}
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}