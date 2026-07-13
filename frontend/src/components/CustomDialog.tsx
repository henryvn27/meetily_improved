import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { VisuallyHidden } from "./ui/visually-hidden";

interface DialogProps {
    triggerComponent: React.ReactElement;
    dialogContent: React.ReactNode;
    dialogTitle?: string;
}

export function CustomDialog({ triggerComponent, dialogContent, dialogTitle = "Dialog" }: DialogProps) {
    // Clone the trigger component to ensure it can receive refs
    const clonedTrigger = React.cloneElement(triggerComponent, {
        ...triggerComponent.props
    });

    return (
        <Dialog>
            <DialogTrigger asChild>
                {clonedTrigger}
            </DialogTrigger>
            <DialogContent aria-describedby={undefined}>
                <VisuallyHidden>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                </VisuallyHidden>
                {dialogContent}                  
                <DialogFooter>
                    
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
