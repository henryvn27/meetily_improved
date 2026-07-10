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
          <button ref={ref} aria-label="About Meetily" className="grid size-10 place-items-center rounded-lg bg-transparent transition-colors hover:bg-[hsl(var(--sidebar-strong))]">
            <Image src="/logo-collapsed.png" alt="" width={32} height={26} />
          </button>
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <button ref={ref} className="min-h-9 rounded-md px-2 text-left text-base font-semibold tracking-[-0.02em] text-foreground transition-colors hover:bg-[hsl(var(--sidebar-strong))]">
            Meetily
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
