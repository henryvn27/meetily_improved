'use client';

import React from 'react';
import { useSidebar } from '@/components/Sidebar/SidebarProvider';

interface MainContentProps {
  children: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  const { isCollapsed } = useSidebar();

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`h-dvh min-w-0 flex-1 overflow-hidden bg-background transition-[margin] duration-200 ease-out ${
        isCollapsed ? 'ml-[4.5rem]' : 'ml-[17.5rem]'
      }`}
    >
      <div className="h-full min-w-0 overflow-auto custom-scrollbar">
        {children}
      </div>
    </main>
  );
};

export default MainContent;
