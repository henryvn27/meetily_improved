import React from 'react';
import Image from 'next/image';
import { Lock, Sparkles, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OnboardingContainer } from '../OnboardingContainer';
import { useOnboarding } from '@/contexts/OnboardingContext';

export function WelcomeStep() {
  const { goNext } = useOnboarding();

  const features = [
    {
      icon: Lock,
      title: 'Meetings and recordings are stored on your device',
    },
    {
      icon: Sparkles,
      title: 'Intelligent summaries & insights',
    },
    {
      icon: Cpu,
      title: 'Local models work offline; remote AI providers are optional',
    },
  ];

  return (
    <OnboardingContainer
      title="Your meeting workbench."
      description="Record, transcribe, and revisit meetings with a local-first workflow."
      step={1}
      hideProgress={true}
    >
      <div className="flex flex-col space-y-6">
        <div className="flex items-center gap-3">
          <Image src="/logo-collapsed.png" alt="" width={36} height={36} priority />
          <p className="app-eyebrow">Meetily Improved</p>
        </div>

        <div className="w-full max-w-2xl border-y border-border bg-card py-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex items-start gap-4 border-b border-border/70 px-2 py-4 last:border-b-0">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="flex size-8 items-center justify-center rounded-[3px] bg-secondary">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-foreground">{feature.title}</p>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="w-full max-w-xs space-y-3">
          <Button
            onClick={goNext}
            className="h-10 w-full"
          >
            Get Started
          </Button>
          <p className="text-center font-mono text-[0.6875rem] text-muted-foreground">Takes less than 3 minutes</p>
        </div>
      </div>
    </OnboardingContainer>
  );
}
