'use client';

import React from 'react';
import { useSidebar } from '@/components/Sidebar/SidebarProvider';
import { ThemeControl } from '@/components/app-shell/ThemeControl';

interface MainContentProps {
  children: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  const { isCollapsed } = useSidebar();

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`h-dvh min-w-[calc(1100px-4.5rem)] flex-1 overflow-hidden bg-background transition-[margin] duration-200 ease-out ${
        isCollapsed ? 'ml-[4.5rem]' : 'ml-[17.5rem]'
      }`}
    >
      <div className="flex h-full min-w-0 flex-col">
        <header className="titlebar flex h-11 shrink-0 items-center justify-end border-b border-border bg-background px-4">
          <ThemeControl />
        </header>
        <div className="min-h-0 flex-1 overflow-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </main>
  );
};

export default MainContent;
