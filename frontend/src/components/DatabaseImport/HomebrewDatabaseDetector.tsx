'use client';

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { ArrowPathIcon, CheckCircleIcon, CircleStackIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface HomebrewDatabaseDetectorProps {
  onImportSuccess: () => void;
  onDecline: () => void;
}

// Homebrew paths differ between Intel and Apple Silicon Macs
const HOMEBREW_PATHS = [
  '/opt/homebrew/var/meetily/meeting_minutes.db',  // Apple Silicon (M1/M2/M3)
  '/usr/local/var/meetily/meeting_minutes.db',      // Intel Macs
];

export function HomebrewDatabaseDetector({ onImportSuccess, onDecline }: HomebrewDatabaseDetectorProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [homebrewDbExists, setHomebrewDbExists] = useState(false);
  const [dbSize, setDbSize] = useState<number>(0);
  const [detectedPath, setDetectedPath] = useState<string>('');
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    checkHomebrewDatabase();
  }, []);

  const checkHomebrewDatabase = async () => {
    try {
      setIsChecking(true);

      // Check all possible Homebrew locations
      for (const path of HOMEBREW_PATHS) {
        const result = await invoke<{ exists: boolean; size: number } | null>('check_homebrew_database', {
          path,
        });

        if (result && result.exists && result.size > 0) {
          setHomebrewDbExists(true);
          setDbSize(result.size);
          setDetectedPath(path);
          break; // Stop checking once we find a valid database
        }
      }
    } catch (error) {
      console.error('Error checking homebrew database:', error);
      // Silently fail - this is just auto-detection
    } finally {
      setIsChecking(false);
    }
  };

  const handleYes = async () => {
    try {
      setIsImporting(true);

      await invoke('import_and_initialize_database', {
        legacyDbPath: detectedPath,
      });

      toast.success('Database imported successfully! Reloading...');

      // Wait 1 second for user to see success, then reload window to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error importing database:', error);
      toast.error(`Import failed: ${error}`);
      setIsImporting(false);
    }
  };

  const handleNo = () => {
    setIsDismissed(true);
    onDecline();
  };

  if (isChecking || !homebrewDbExists || isDismissed) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mb-4 border border-accent/30 bg-accent/10 p-4">
      <div className="flex items-start gap-3">
        <CircleStackIcon className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ExclamationCircleIcon className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">
              Previous Meetily Installation Detected!
            </h3>
          </div>
          <p className="mb-2 text-sm text-muted-foreground">
            We found an existing database from your previous Meetily installation (Python backend version).
          </p>
          <div className="mb-3 bg-card/70 p-2">
            <p className="break-all font-mono text-xs text-foreground">
              {detectedPath}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Size: {formatFileSize(dbSize)}
            </p>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Would you like to import your previous meetings, transcripts, and summaries?
          </p>
          
          {/* Yes/No Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleYes}
              disabled={isImporting}
              className="flex flex-1 items-center justify-center gap-2 bg-[hsl(var(--success))] px-4 py-2 text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isImporting ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Yes, Import</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleNo}
              disabled={isImporting}
              className="flex-1 border border-border px-4 py-2 text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45"
            >
              No, Browse Manually
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
