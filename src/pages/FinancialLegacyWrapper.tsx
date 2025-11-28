import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * FASE C3.8 - Legacy Wrapper for /financial route
 * 
 * This component acts as a facade between the legacy /financial route
 * and the new unified /metrics page. It preserves backwards compatibility
 * while redirecting users to the new metrics experience.
 * 
 * Mapping:
 * - /financial → /metrics?domain=financial
 * - Preserves period filters (week/month/year/custom)
 * - Preserves custom date ranges (start/end)
 */
export function FinancialLegacyWrapper() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    // Read legacy parameters if they exist
    const legacyPeriod = params.get('period');
    const legacyStart = params.get('start');
    const legacyEnd = params.get('end');
    const legacyCustomStartDate = params.get('customStartDate');
    const legacyCustomEndDate = params.get('customEndDate');

    // Build new parameters for /metrics
    const newParams = new URLSearchParams();

    // 1) Always set domain to financial
    newParams.set('domain', 'financial');

    // 2) Map legacy period if exists
    if (legacyPeriod && ['week', 'month', 'year', 'custom'].includes(legacyPeriod)) {
      newParams.set('period', legacyPeriod);
    }

    // 3) Map legacy date ranges if they exist
    if (legacyStart) {
      newParams.set('start', legacyStart);
    } else if (legacyCustomStartDate) {
      newParams.set('start', legacyCustomStartDate);
    }

    if (legacyEnd) {
      newParams.set('end', legacyEnd);
    } else if (legacyCustomEndDate) {
      newParams.set('end', legacyCustomEndDate);
    }

    // Navigate to the new metrics page with replace to avoid back button issues
    navigate(`/metrics?${newParams.toString()}`, { replace: true });
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <svg
            className="w-6 h-6 text-primary animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">
          Redirecionando para o painel de métricas...
        </p>
      </div>
    </div>
  );
}
