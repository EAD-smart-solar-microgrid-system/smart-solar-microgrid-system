/**
 * LoadingIndicator Component
 *
 * Accessible presentation spinner using Bootstrap 5 classes.
 * Includes ARIA role="status" and visually hidden text for screen readers.
 */

export const LoadingIndicator = ({
  message = 'Loading...',
  size = 'md',
  centered = true,
}) => {
  const spinnerClass = size === 'sm' ? 'spinner-border spinner-border-sm' : 'spinner-border';
  const containerClass = centered
    ? 'd-flex flex-column align-items-center justify-content-center py-5'
    : 'd-inline-flex align-items-center gap-2';

  return (
    <div className={containerClass} role="status" aria-live="polite">
      <div className={`${spinnerClass} text-primary`} aria-hidden="true" />
      {message && (
        <span className={centered ? 'mt-2 text-muted small' : 'text-muted small'}>
          {message}
        </span>
      )}
      <span className="visually-hidden">{message}</span>
    </div>
  );
};

export default LoadingIndicator;
