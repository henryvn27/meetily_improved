'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ComplianceNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
  recordingButtonRef?: React.RefObject<HTMLElement | HTMLButtonElement>;
}

export const ComplianceNotification: React.FC<ComplianceNotificationProps> = ({
  isOpen,
  onClose,
  onAcknowledge,
  recordingButtonRef,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 192 }); // Default width

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      
      // Calculate position relative to recording button
      if (recordingButtonRef?.current) {
        const buttonRect = recordingButtonRef.current.getBoundingClientRect();
        const buttonWidth = buttonRect.width;
        const notificationWidth = buttonWidth * 1.5; // 1.5x the button width
        
        setPosition({
          top: buttonRect.top - 100, // 100px above the button
          left: buttonRect.left + (buttonWidth - notificationWidth) / 2, // Center the notification relative to button
          width: notificationWidth,
        });
      } else {
        // Fallback position if no button ref
        setPosition({
          top: window.innerHeight - 200, // Near bottom of screen
          left: window.innerWidth - 250, // Near right edge
          width: 192, // Default width
        });
      }
    }
  }, [isOpen, recordingButtonRef]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleAcknowledge = () => {
    onAcknowledge();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
      }}
    >
      <div className="border border-border bg-card p-3 shadow-[0_16px_40px_rgba(23,23,26,0.16)]">
        {/* Header with close button */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1">
            <ExclamationTriangleIcon className="h-3 w-3 flex-shrink-0 text-[hsl(var(--warning))]" />
            <h3 className="text-xs font-semibold text-foreground">
              Recording Notice
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="rounded-[3px] p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <XMarkIcon className="h-3 w-3" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-2">
          <p className="mb-1 text-xs text-muted-foreground">
            Inform participants about recording.
          </p>
          <div className="border border-[hsl(var(--warning)/0.30)] bg-[hsl(var(--warning)/0.10)] p-1">
            <p className="text-xs font-medium text-[hsl(var(--warning))]">
              US compliance required
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="text-xs px-2 py-0.5 h-6 flex-1"
          >
            Later
          </Button>
          <Button
            size="sm"
            onClick={handleAcknowledge}
            className="h-6 flex-1 bg-accent px-2 py-0.5 text-xs text-accent-foreground hover:bg-accent/90"
          >
            <CheckCircleIcon className="mr-1 h-2 w-2" />
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
