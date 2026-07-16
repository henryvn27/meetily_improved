"use client"

import { Switch } from "./ui/switch"
import { BeakerIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline"
import { useConfig } from "@/contexts/ConfigContext"
import {
  BetaFeatureKey,
  BETA_FEATURE_NAMES,
  BETA_FEATURE_DESCRIPTIONS
} from "@/types/betaFeatures"

export function BetaSettings() {
  const { betaFeatures, toggleBetaFeature } = useConfig();

  // Define feature order for display (allows custom ordering)
  const featureOrder: BetaFeatureKey[] = ['importAndRetranscribe'];

  return (
    <div className="space-y-6">
      {/* Yellow Warning Banner */}
      <div className="flex items-start gap-3 rounded-[3px] border border-[hsl(var(--warning)/0.25)] bg-[hsl(var(--warning)/0.08)] p-4">
        <ExclamationCircleIcon aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-[hsl(var(--warning))]" />
        <div className="text-sm text-[hsl(var(--warning))]">
          <p className="font-medium">Beta Features</p>
          <p className="mt-1">
            These features are still being tested. You may encounter issues, and we appreciate your feedback.
          </p>
        </div>
      </div>

      {/* Dynamic Feature Toggles - Automatically renders all features */}
      {featureOrder.map((featureKey) => (
        <div
          key={featureKey}
          className="settings-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BeakerIcon className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold tracking-[-0.03em]">
                  {BETA_FEATURE_NAMES[featureKey]}
                </h3>
                <span className="rounded-[3px] bg-[hsl(var(--warning)/0.14)] px-2 py-0.5 font-mono text-[0.625rem] font-medium text-[hsl(var(--warning))]">
                  BETA
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {BETA_FEATURE_DESCRIPTIONS[featureKey]}
              </p>
            </div>

            <div className="ml-6">
              <Switch
                aria-label={`Enable ${BETA_FEATURE_NAMES[featureKey]}`}
                checked={betaFeatures[featureKey]}
                onCheckedChange={(checked) => toggleBetaFeature(featureKey, checked)}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Info Box */}
      <div className="rounded-[3px] border border-accent/25 bg-[hsl(var(--accent-soft))] p-4">
        <p className="text-sm text-foreground">
          <strong>Note:</strong> When disabled, beta features will be hidden. Your existing meetings remain unaffected.
        </p>
      </div>
    </div>
  );
}
