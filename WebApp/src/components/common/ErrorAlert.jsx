/**
 * ErrorAlert Component
 *
 * Presentation-only accessible error notification component.
 * Uses Bootstrap 5 alert classes and ARIA role="alert".
 */

export const ErrorAlert = ({
  message,
  details,
  onDismiss,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div
      className={`alert alert-danger ${onDismiss ? 'alert-dismissible fade show' : ''} ${className}`}
      role="alert"
    >
      <div className="d-flex align-items-start">
        <div className="flex-grow-1">
          <p className="mb-0 fw-semibold">{message}</p>
          {Array.isArray(details) && details.length > 0 && (
            <ul className="mb-0 mt-2 ps-3 small">
              {details.map((item, index) => (
                <li key={index}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
              ))}
            </ul>
          )}
          {typeof details === 'string' && (
            <p className="mb-0 mt-1 small text-secondary">{details}</p>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            className="btn-close"
            aria-label="Close alert"
            onClick={onDismiss}
          />
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
