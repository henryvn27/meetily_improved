'use client';

import { useState } from 'react';
import { BookmarkIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { LanguagePickerPopover } from '@/components/LanguagePickerPopover';
import { useRecentLanguages } from '@/hooks/useRecentLanguages';
import { labelForCode } from '@/lib/summary-languages';

export function SummaryLanguageSettings() {
  const { recents, pinned, addRecent, removeRecent, setPinned } = useRecentLanguages();
  const [pickerOpen, setPickerOpen] = useState(false);

  const togglePin = (code: string) => {
    setPinned(pinned === code ? null : code);
  };

  return (
    <section className="settings-card relative">
      <div className="mb-2 flex items-center gap-2">
        <GlobeAltIcon className="size-[18px] text-muted-foreground" />
        <h3 className="text-lg font-semibold tracking-[-0.03em]">Summary language</h3>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Pin one language as the default for new meetings. Unpinned languages remain as
        quick-switch options in the summary generator. Auto uses the dominant transcript language.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {recents.map((code) => {
          const isPinned = pinned === code;
          return (
            <span
              key={code}
              className={`inline-flex items-center overflow-hidden rounded-[3px] border text-sm ${
                isPinned
                  ? 'border-accent/25 bg-[hsl(var(--accent-soft))] text-foreground'
                  : 'border-border bg-secondary text-foreground'
              }`}
            >
              <button
                type="button"
                aria-label={isPinned ? `Unpin ${labelForCode(code)} as default` : `Pin ${labelForCode(code)} as default`}
                aria-pressed={isPinned}
                title={isPinned ? 'Click to unset as default' : 'Click to set as default'}
                onClick={() => togglePin(code)}
                className={`flex items-center gap-1.5 pl-3 pr-2 py-1 hover:brightness-95 active:brightness-90 ${
                  'text-foreground'
                }`}
              >
                <BookmarkIcon
                  className={isPinned ? 'text-accent' : 'text-muted-foreground'}
                  width={14}
                  height={14}
                  fill={isPinned ? 'currentColor' : 'none'}
                />
                {labelForCode(code)}
              </button>
              <button
                type="button"
                aria-label={`Remove ${labelForCode(code)}`}
                onClick={() => removeRecent(code)}
                className="py-1 pl-0.5 pr-2.5 leading-none text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </span>
          );
        })}

        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={recents.length >= 5}
              className="inline-flex items-center gap-1 rounded-[3px] border border-dashed border-input px-3 py-1 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              ＋ Add language
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0 border-0 shadow-none bg-transparent">
            <LanguagePickerPopover
              mode="settings"
              value={null}
              onChange={(code) => {
                if (code) addRecent(code);
                setPickerOpen(false);
              }}
              onClose={() => setPickerOpen(false)}
            />
          </PopoverContent>
        </Popover>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {pinned
          ? `Default: ${labelForCode(pinned)} - click it again to unset. Max 5 quick-switch options.`
          : 'Click any language to set it as your default. Max 5 quick-switch options.'}
      </p>
    </section>
  );
}
