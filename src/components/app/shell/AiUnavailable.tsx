"use client";

interface AiUnavailableProps {
  /** What the user was trying to do, e.g. "generate this report". */
  feature: string;
  onRetry?: () => void;
}

/**
 * Honest state for model surfaces when the key is missing or refused.
 * Better than a silent failure or a spinner that never ends.
 */
export const AiUnavailable = ({ feature, onRetry }: AiUnavailableProps) => {
  return (
    <div className="vck-empty" data-tone="warn">
      <strong>The model is not available</strong>
      <p>
        Vuneli cannot {feature} because the model key is missing or was refused.
        Everything else on this page keeps working. Add a valid key in workspace
        settings to turn this back on.
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="vck-btn">
          Try again
        </button>
      )}
    </div>
  );
};
