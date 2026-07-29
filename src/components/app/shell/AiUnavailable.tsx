"use client";

interface AiUnavailableProps {
  /** What the user was trying to do, e.g. "generate this report". */
  feature: string;
  onRetry?: () => void;
}

/**
 * Honest state for AI surfaces when the model key is missing or rejected.
 * Better than a silent failure or an endless spinner.
 */
export const AiUnavailable = ({ feature, onRetry }: AiUnavailableProps) => {
  return (
    <div className="app-card px-5 py-6">
      <h3 className="text-[1.0625rem] font-semibold leading-snug">
        AI is unavailable right now
      </h3>
      <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
        Vuneli cannot {feature} because the model provider key is missing or was
        rejected. Everything else on this page keeps working. Add a valid key in
        the project settings to turn this back on.
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="app-btn-ghost app-btn mt-4">
          Try again
        </button>
      )}
    </div>
  );
};
