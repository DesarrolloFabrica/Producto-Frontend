import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** @deprecated Usar /planning/dashboard?filter=radication */
export function PlanningRadicationPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/planning/dashboard?filter=radication', { replace: true });
  }, [navigate]);
  return null;
}
