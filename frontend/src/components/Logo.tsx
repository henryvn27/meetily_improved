import React from "react";
import Image from "next/image";
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
          <button ref={ref} aria-label="About Meetily" className="grid size-9 place-items-center rounded-md transition-colors hover:bg-[hsl(var(--sidebar-hover))]">
            <Image src="/logo-collapsed.png" alt="" width={24} height={24} priority />
          </button>
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <button ref={ref} className="flex min-h-9 items-center gap-2 rounded-md px-1.5 text-left text-sm font-semibold tracking-[-0.01em] text-[hsl(var(--sidebar-foreground))] transition-colors hover:bg-[hsl(var(--sidebar-hover))]">
            <Image src="/logo-collapsed.png" alt="" width={24} height={24} priority />
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
