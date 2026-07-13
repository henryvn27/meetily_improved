'use client';

import React from 'react';
import { CheckIcon, InformationCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { APP_VERSION } from '@/lib/app-version';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const analyticsCategories = [
  {
    title: 'Model preferences',
    detail: 'Transcription and summary model names, plus the provider type.',
    purpose: 'Helps prioritize the local model paths people actually use.',
  },
  {
    title: 'Anonymous meeting metrics',
    detail: 'Recording and pause duration, transcript segment count, and processed chunk count.',
    purpose: 'Helps improve performance without seeing the meeting itself.',
  },
  {
    title: 'Device types',
    detail: 'Broad categories such as Bluetooth, wired, or unknown—never the device name.',
    purpose: 'Helps identify compatibility gaps.',
  },
  {
    title: 'App usage patterns',
    detail: 'App sessions, feature usage, settings changes, and error occurrences.',
    purpose: 'Helps find unreliable or confusing product areas.',
  },
  {
    title: 'Platform information',
    detail: 'Operating system, app version, and processor architecture.',
    purpose: 'Helps prioritize platform support.',
  },
] as const;

const neverCollected = [
  'Meeting names or titles',
  'File names, paths, or folders',
  'Meeting transcripts or content',
  'Audio recordings',
  'Device names',
  'Personal or identifiable information',
] as const;

interface AnalyticsDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDisable: () => void;
}

export default function AnalyticsDataModal({ isOpen, onClose, onConfirmDisable }: AnalyticsDataModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[min(90vh,760px)] max-w-2xl gap-0 overflow-hidden p-0 sm:rounded-[10px]">
        {/* Header */}
        <DialogHeader className="border-b border-border px-6 py-5 pr-14">
          <div className="flex items-start gap-3">
            <LockClosedIcon className="size-5 text-muted-foreground" />
            <div className="space-y-1">
              <DialogTitle className="app-display text-xl">What analytics collects</DialogTitle>
              <DialogDescription>Review the anonymous product data shared only when analytics is enabled.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-7 overflow-y-auto px-6 py-6">
          <div className="bg-secondary/50 px-4 py-3.5">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="mt-0.5 size-5 shrink-0 text-success" />
              <div className="text-sm leading-5 text-foreground">
                <p className="mb-1 font-semibold">Your privacy is protected</p>
                <p>Analytics is off by default. If you enable it, we collect <strong>anonymous usage data only</strong>. No meeting content, names, file paths, or personal information is ever collected.</p>
              </div>
            </div>
          </div>

          <section aria-labelledby="analytics-collected-heading">
            <h3 id="analytics-collected-heading" className="app-eyebrow mb-2">Collected when enabled</h3>
            <div className="divide-y divide-border/70 border-y border-border/70">
              {analyticsCategories.map((category, index) => (
                <div key={category.title} className="grid gap-1 py-4 sm:grid-cols-[1.4rem_12rem_1fr] sm:gap-x-3">
                  <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                  <h4 className="text-sm font-semibold text-foreground">{category.title}</h4>
                  <div className="text-sm leading-5">
                    <p className="text-foreground">{category.detail}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{category.purpose}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="analytics-never-heading">
            <h3 id="analytics-never-heading" className="app-eyebrow mb-3">Never collected</h3>
            <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {neverCollected.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <details className="group border-y border-border/70 py-3">
            <summary className="cursor-pointer list-none text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              View an example anonymous event
              <span className="ml-2 text-xs font-normal text-muted-foreground group-open:hidden">Show</span>
              <span className="ml-2 hidden text-xs font-normal text-muted-foreground group-open:inline">Hide</span>
            </summary>
            <pre className="mt-3 overflow-x-auto bg-secondary/50 p-4 text-xs leading-5 text-foreground">
              {`{
  "event": "meeting_ended",
  "app_version": "${APP_VERSION}",
  "transcription_provider": "parakeet",
  "transcription_model": "parakeet-tdt-0.6b-v3-int8",
  "summary_provider": "ollama",
  "summary_model": "llama3.2:latest",
  "total_duration_seconds": "125.5",
  "microphone_device_type": "Wired",
  "system_audio_device_type": "Bluetooth",
  "chunks_processed": "150",
  "had_fatal_error": "false"
}`}
            </pre>
          </details>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-border bg-muted/50 px-6 py-4 sm:justify-between sm:space-x-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Keep Analytics Enabled
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirmDisable}>
            Disable Analytics
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
