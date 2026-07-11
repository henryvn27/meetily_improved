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
      className={`h-dvh min-w-0 overflow-hidden bg-background transition-[margin,width] duration-200 ease-out ${
        isCollapsed
          ? 'ml-[4.5rem] w-[calc(100%-4.5rem)]'
          : 'ml-[17.5rem] w-[calc(100%-17.5rem)]'
      }`}
    >
      <div className="flex h-full min-w-0 flex-col">
        <header className="titlebar flex h-12 shrink-0 items-center justify-end border-b border-border/80 bg-background/85 px-4 backdrop-blur-xl">
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
