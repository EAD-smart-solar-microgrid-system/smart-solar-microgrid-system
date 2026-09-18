/**
 * PageHeader Component
 *
 * Reusable presentation-only page header.
 * Uses semantic HTML (<header>, <h1>) and Bootstrap 5 utilities.
 */

export const PageHeader = ({
  title,
  subtitle,
  badgeText,
  badgeVariant = 'secondary',
  children,
}) => {
  if (!title) return null;

  return (
    <header className="page-header pb-3 mb-4 border-bottom">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="h2 mb-0 text-dark fw-bold">{title}</h1>
            {badgeText && (
              <span className={`badge bg-${badgeVariant} text-uppercase`}>
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-muted mt-1 mb-0 fs-6">{subtitle}</p>
          )}
        </div>
        {children && <div className="page-header-actions">{children}</div>}
      </div>
    </header>
  );
};

export default PageHeader;
