'use client';

interface EmptyStateProps {
  /**
   * Title text
   */
  title?: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Icon to display (optional)
   */
  icon?: React.ReactNode;
  /**
   * Custom className for styling
   */
  className?: string;
}

/**
 * EmptyState component
 * Shows helpful guidance when there's no content yet
 */
export function EmptyState({
  title = 'Ready when you are!',
  description = 'Paste your text above and I\'ll create a concise summary for you.',
  icon,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center ${className}`}
    >
      {icon && <div className="mb-4 opacity-50">{icon}</div>}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{description}</p>
    </div>
  );
}
