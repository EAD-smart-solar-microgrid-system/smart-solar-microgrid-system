/**
 * NotFoundPage Component
 *
 * Simple accessible 404 Not Found page with a navigation link back to Home.
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes.js';
import { PageHeader } from '../components/common/PageHeader.jsx';

export const NotFoundPage = () => {
  return (
    <div className="not-found-page py-4">
      <PageHeader
        title="404 - Page Not Found"
        subtitle="The requested resource could not be found."
        badgeText="Error"
        badgeVariant="danger"
      />

      <div className="card border-0 bg-light p-4 text-center my-4">
        <div className="card-body">
          <p className="lead text-muted mb-4">
            The page you are looking for does not exist or has not been implemented yet.
          </p>
          <div>
            <Link to={ROUTES.HOME} className="btn btn-primary">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
