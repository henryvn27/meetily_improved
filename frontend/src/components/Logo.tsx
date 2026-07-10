import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { VisuallyHidden } from "./ui/visually-hidden";
import { About } from "./About";

interface LogoProps {
    isCollapsed: boolean;
}

const Logo = React.forwardRef<HTMLButtonElement, LogoProps>(({ isCollapsed }, ref) => {
  return (
    <Dialog aria-describedby={undefined}>
      {isCollapsed ? (
        <DialogTrigger asChild>
          <button ref={ref} aria-label="About Meetily" className="group grid size-9 place-items-center rounded-md text-[hsl(var(--sidebar-foreground))] transition-colors hover:bg-[hsl(var(--sidebar-hover))]">
            <span aria-hidden="true" className="relative grid size-6 place-items-center rounded-[5px] border border-white/15 bg-white/[0.06] text-[11px] font-semibold tracking-[-0.04em]">
              M
              <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-[2px] bg-accent" />
            </span>
          </button>
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <button ref={ref} className="flex min-h-9 items-center gap-2 rounded-md px-1.5 text-left text-sm font-semibold tracking-[-0.01em] text-[hsl(var(--sidebar-foreground))] transition-colors hover:bg-[hsl(var(--sidebar-hover))]">
            <span aria-hidden="true" className="relative grid size-6 place-items-center rounded-[5px] border border-white/15 bg-white/[0.06] text-[11px] font-semibold tracking-[-0.04em]">
              M
              <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-[2px] bg-accent" />
            </span>
            <span>Meetily</span>
          </button>
        </DialogTrigger>
      )}
      <DialogContent>
        <VisuallyHidden>
          <DialogTitle>About Meetily</DialogTitle>
        </VisuallyHidden>
        <About />
      </DialogContent>
    </Dialog>
  );
});

Logo.displayName = "Logo";

export default Logo;
