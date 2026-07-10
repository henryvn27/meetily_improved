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
      title="Your local meeting workspace"
      description="Record, transcribe, and revisit meetings without sending the default workflow to the cloud."
      step={1}
      hideProgress={true}
    >
      <div className="flex flex-col space-y-6">
        <div className="flex items-center gap-3">
          <Image src="/logo-collapsed.png" alt="" width={32} height={32} priority />
          <p className="text-xs font-semibold tracking-[0.02em] text-muted-foreground">Meetily Improved</p>
        </div>

        <div className="w-full max-w-xl rounded-[10px] border border-border bg-card p-6 space-y-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="flex size-6 items-center justify-center rounded-md bg-secondary">
                    <Icon className="size-3.5 text-muted-foreground" />
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
          <p className="text-xs text-center text-gray-500">Takes less than 3 minutes</p>
        </div>
      </div>
    </OnboardingContainer>
  );
}
