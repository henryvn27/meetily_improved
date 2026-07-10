import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-6 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && (
          <p className="app-eyebrow mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="app-display text-foreground sm:text-[3.125rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-[42rem] text-[0.9375rem] leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2 pb-0.5">{actions}</div>}
    </header>
  );
}
