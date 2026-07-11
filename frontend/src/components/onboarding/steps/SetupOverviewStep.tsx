import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OnboardingContainer } from '../OnboardingContainer';
import { useOnboarding } from '@/contexts/OnboardingContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SetupOverviewStep() {
  const { goNext } = useOnboarding();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const checkPlatform = async () => {
      try {
        const { platform } = await import('@tauri-apps/plugin-os');
        setIsMac(platform() === 'macos');
      } catch (e) {
        setIsMac(navigator.userAgent.includes('Mac'));
      }
    };
    checkPlatform();
  }, []);

  const steps = [
    {
      number: 1,
      type: 'transcription',
      title: 'Download Transcription Engine',
    },
    {
      number: 2,
      type: 'summarization',
      title: 'Download Summarization Engine',
    },
  ];

  const handleContinue = () => {
    goNext();
  };

  return (
    <OnboardingContainer
      title="Set up local intelligence."
      description="Download the transcription and summary models Meetily uses on this device."
      step={2}
      totalSteps={isMac ? 4 : 3}
    >
      <div className="flex flex-col items-center space-y-10">
        <div className="w-full max-w-2xl border-y border-border bg-card py-2">
          <div>
            {steps.map((step, idx) => {
              return (
                <div
                  key={step.number}
                  className="flex items-start gap-4 border-b border-border/70 px-4 py-5 last:border-b-0"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-[3px] bg-secondary font-mono text-xs text-muted-foreground">{step.number}</span>
                  <div className="flex-1">
                    <h3 className="flex items-center gap-2 font-medium tracking-[-0.02em]">
                        {step.title}

                        {step.type === "summarization" && (
                            <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <button className="text-muted-foreground hover:text-foreground">
                                    <Info className="w-4 h-4" />
                                </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-sm">
                                You can also select external AI providers like OpenAI, Claude, or
                                Ollama for summary generation in settings.
                                </TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
                        )}
                        </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        {/* CTA Section */}
        <div className="w-full max-w-xs space-y-4">
          <Button
            onClick={handleContinue}
            className="h-11 w-full"
          >
            Let&apos;s Go
          </Button>
          <div className="text-center">
            <a
              href="https://github.com/henryvn27/meetily_improved/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Report issues on GitHub
            </a>
          </div>
        </div>
      </div>
    </OnboardingContainer>
  );
}
