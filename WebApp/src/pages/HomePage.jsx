/**
 * HomePage Component
 *
 * Web Application Landing Page for the Common Foundation.
 * Displays project identity and non-functional placeholder cards
 * for future member feature assignments.
 *
 * Strict Compliance:
 * - No working feature buttons
 * - No forms
 * - No login
 * - No account CRUD
 * - No reservation CRUD
 * - No fake API data
 * - No role checks
 */

import { PageHeader } from '../components/common/PageHeader.jsx';

const FEATURE_MODULES = [
  {
    id: 'auth',
    title: 'Login and role-based access',
    assignedTo: 'Member 1',
    description:
      'Authentication and secure access control module for Backoffice users and Grid Operators.',
  },
  {
    id: 'user-mgmt',
    title: 'User Management',
    assignedTo: 'Member 1',
    description:
      'Administration portal for managing system accounts, roles, and administrative access.',
  },
  {
    id: 'prosumer-mgmt',
    title: 'Prosumer Management',
    assignedTo: 'Member 2',
    description:
      'Profile management, status activation, deactivation, and reactivation for Solar Prosumers.',
  },
  {
    id: 'microgrid-nodes',
    title: 'Microgrid Node Management',
    assignedTo: 'Member 3',
    description:
      'Configuration, status oversight, operational scheduling, and maintenance of microgrid nodes.',
  },
  {
    id: 'energy-slots',
    title: 'Energy Slot Reservation Management',
    assignedTo: 'Member 4',
    description:
      'Monitoring, allocation, and lifecycle management for prosumer energy trading reservations.',
  },
];

export const HomePage = () => {
  return (
    <div className="home-page">
      <PageHeader
        title="Smart Solar Microgrid Trading System"
        subtitle="Web Application"
        badgeText="Foundation Ready"
        badgeVariant="success"
      />

      <div className="alert alert-info border-info-subtle shadow-sm mb-4" role="status">
        <div className="d-flex align-items-center">
          <div>
            <h2 className="h5 alert-heading mb-1 fw-bold">Common project foundation is ready</h2>
            <p className="mb-0 small text-body-secondary">
              The shared client infrastructure, routing layout, generic HTTP client, session
              storage utilities, and feature boundaries have been established. Feature modules
              below represent future work assignments and are currently inactive.
            </p>
          </div>
        </div>
      </div>

      <section aria-labelledby="assigned-features-heading">
        <h2 id="assigned-features-heading" className="h4 text-dark mb-3 fw-semibold">
          Assignment Feature Boundaries
        </h2>
        <div className="row g-4">
          {FEATURE_MODULES.map((feature) => (
            <div key={feature.id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 border-secondary-subtle shadow-sm opacity-75">
                <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                  <span className="badge bg-secondary-subtle text-secondary border">
                    {feature.assignedTo}
                  </span>
                  <span className="badge bg-light text-muted border">
                    Pending Implementation
                  </span>
                </div>
                <div className="card-body d-flex flex-column">
                  <h3 className="h5 card-title text-secondary fw-bold mb-2">
                    {feature.title}
                  </h3>
                  <p className="card-text text-muted small flex-grow-1">
                    {feature.description}
                  </p>
                  <div className="mt-3 pt-2 border-top">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm w-100 disabled"
                      disabled
                      aria-disabled="true"
                    >
                      Module Inactive (Shared Foundation Only)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
