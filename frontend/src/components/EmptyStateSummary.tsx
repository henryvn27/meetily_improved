'use client';

import { motion } from 'framer-motion';
import { DocumentMagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EmptyStateSummaryProps {
  onGenerate: () => void;
  hasModel: boolean;
  isGenerating?: boolean;
}

export function EmptyStateSummary({ onGenerate, hasModel, isGenerating = false }: EmptyStateSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex h-full flex-col items-center justify-center p-8 text-center"
    >
      <DocumentMagnifyingGlassIcon className="mb-4 h-16 w-16 text-muted-foreground/35" />
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        No Summary Generated Yet
      </h3>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        Generate an AI-powered summary of your meeting transcript to get key points, action items, and decisions.
      </p>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                onClick={onGenerate}
                disabled={!hasModel || isGenerating}
                className="gap-2"
              >
                <SparklesIcon className="h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate Summary'}
              </Button>
            </div>
          </TooltipTrigger>
          {!hasModel && (
            <TooltipContent>
              <p>Please select a model in Settings first</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {!hasModel && (
        <p className="mt-3 text-xs text-warning">
          Please select a model in Settings first
        </p>
      )}
    </motion.div>
  );
}
