import { useAuth } from '../auth/AuthContext';
import { ProductDashboardPage } from '../dashboard/ProductDashboardPage';
import { AdminInstitutionalTrackingPage } from '../admin-tracking/AdminInstitutionalTrackingPage';

export function ProductOrAdminDashboardPage() {
  const { role } = useAuth();

  if (role === 'ADMIN') {
    return <AdminInstitutionalTrackingPage />;
  }

  return <ProductDashboardPage />;
}
