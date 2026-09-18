/**
 * EmptyState Component
 *
 * Presentation-only component representing empty or pending states.
 * Uses semantic HTML and Bootstrap 5 utilities.
 */

export const EmptyState = ({
  title = 'No Data Available',
  message = 'There are no items to display at this time.',
  children,
}) => {
  return (
    <div className="card border-0 bg-light text-center py-5 px-3 my-3">
      <div className="card-body">
        <h2 className="h4 text-secondary mb-2">{title}</h2>
        <p className="text-muted mb-3 mx-auto" style={{ maxWidth: '480px' }}>
          {message}
        </p>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
};

export default EmptyState;
