import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * FASE C3.9 — METRICS WEBSITE LEGACY WRAPPER
 * 
 * Componente responsável por interceptar acessos à rota legada `/metrics/website`
 * e redirecionar para a nova estrutura unificada:
 * `/metrics?domain=marketing&subTab=website`
 * 
 * Preserva query params legados se existirem:
 * - period (week, month, year, custom)
 * - start, end (datas ISO)
 */
export function MetricsWebsiteLegacyWrapper() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const oldParams = new URLSearchParams(location.search);
    const newParams = new URLSearchParams();

    // 1) Sempre forçar domain=marketing e subTab=website
    newParams.set("domain", "marketing");
    newParams.set("subTab", "website");

    // 2) Preservar período se fornecido
    const period = oldParams.get("period");
    if (period) {
      newParams.set("period", period);
    }

    // 3) Preservar datas se fornecidas (para custom period)
    const start = oldParams.get("start");
    const end = oldParams.get("end");
    if (start) newParams.set("start", start);
    if (end) newParams.set("end", end);

    // 4) Preservar possíveis variantes de datas customizadas
    const customStartDate = oldParams.get("customStartDate");
    const customEndDate = oldParams.get("customEndDate");
    if (customStartDate) newParams.set("customStartDate", customStartDate);
    if (customEndDate) newParams.set("customEndDate", customEndDate);

    // Redirecionar usando replace para não criar entrada extra no histórico
    navigate(`/metrics?${newParams.toString()}`, { replace: true });
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center py-16">
      <span className="text-sm text-muted-foreground">
        Redirecionando para as métricas de website...
      </span>
    </div>
  );
}
