import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, TrendingUp, FileText, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Layout from "@/components/Layout";

type PeriodPreset = "current_month" | "last_month" | "current_year" | "last_year" | "custom";

interface NFSeData {
  total_revenue: number;
  joao_revenue: number;
  larissa_revenue: number;
  total_count: number;
}

const AccountantDashboard = () => {
  const { user } = useAuth();
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("current_month");
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<NFSeData>({
    total_revenue: 0,
    joao_revenue: 0,
    larissa_revenue: 0,
    total_count: 0,
  });

  // João and Larissa user IDs (you'll need to get these from the profiles table)
  const [joaoId, setJoaoId] = useState<string | null>(null);
  const [larissaId, setLarissaId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTherapistIds = async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("full_name", ["João Paulo Silva Santos", "Larissa Queiroz Pereira"]);

      if (error) {
        console.error("Error fetching therapist IDs:", error);
        return;
      }

      profiles?.forEach((profile) => {
        if (profile.full_name === "João Paulo Silva Santos") {
          setJoaoId(profile.id);
        } else if (profile.full_name === "Larissa Queiroz Pereira") {
          setLarissaId(profile.id);
        }
      });
    };

    fetchTherapistIds();
  }, []);

  useEffect(() => {
    if (periodPreset !== "custom") {
      updateDatesFromPreset(periodPreset);
    }
  }, [periodPreset]);

  useEffect(() => {
    if (joaoId && larissaId) {
      fetchNFSeData();
    }
  }, [startDate, endDate, joaoId, larissaId]);

  const updateDatesFromPreset = (preset: PeriodPreset) => {
    const now = new Date();
    switch (preset) {
      case "current_month":
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case "last_month":
        setStartDate(startOfMonth(subMonths(now, 1)));
        setEndDate(endOfMonth(subMonths(now, 1)));
        break;
      case "current_year":
        setStartDate(startOfYear(now));
        setEndDate(endOfYear(now));
        break;
      case "last_year":
        setStartDate(startOfYear(subYears(now, 1)));
        setEndDate(endOfYear(subYears(now, 1)));
        break;
    }
  };

  const fetchNFSeData = async () => {
    if (!joaoId || !larissaId) {
      console.log("IDs não carregados ainda:", { joaoId, larissaId });
      return;
    }

    setLoading(true);
    try {
      console.log("Buscando NFSe entre:", startDate.toISOString(), "e", endDate.toISOString());
      
      // Fetch all NFSe with status 'issued' in the period
      const { data: nfses, error } = await supabase
        .from("nfse_issued")
        .select("user_id, net_value, status, issue_date")
        .eq("status", "issued")
        .gte("issue_date", startDate.toISOString())
        .lte("issue_date", endDate.toISOString());

      console.log("NFSe encontradas:", nfses?.length || 0, nfses);

      if (error) {
        console.error("Erro na query:", error);
        throw error;
      }

      // Calculate totals
      let totalRevenue = 0;
      let joaoRevenue = 0;
      let larissaRevenue = 0;

      nfses?.forEach((nfse) => {
        const value = Number(nfse.net_value);
        totalRevenue += value;
        if (nfse.user_id === joaoId) {
          joaoRevenue += value;
        } else if (nfse.user_id === larissaId) {
          larissaRevenue += value;
        }
      });

      console.log("Totais calculados:", {
        totalRevenue,
        joaoRevenue,
        larissaRevenue,
        count: nfses?.length || 0
      });

      setData({
        total_revenue: totalRevenue,
        joao_revenue: joaoRevenue,
        larissa_revenue: larissaRevenue,
        total_count: nfses?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching NFSe data:", error);
      toast.error("Erro ao carregar dados de faturamento");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard Contador</h1>
          
          <div className="flex gap-4 items-center">
            <Select
              value={periodPreset}
              onValueChange={(value) => setPeriodPreset(value as PeriodPreset)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Mês Atual</SelectItem>
                <SelectItem value="last_month">Mês Anterior</SelectItem>
                <SelectItem value="current_year">Ano Atual</SelectItem>
                <SelectItem value="last_year">Ano Anterior</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {periodPreset === "custom" && (
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px]">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>

                <span className="self-center">até</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px]">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-2xl font-bold text-muted-foreground">Carregando...</div>
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(data.total_revenue)}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Período: {format(startDate, "dd/MM/yy")} - {format(endDate, "dd/MM/yy")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento João</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-2xl font-bold text-muted-foreground">Carregando...</div>
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(data.joao_revenue)}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {data.total_revenue > 0
                  ? `${((data.joao_revenue / data.total_revenue) * 100).toFixed(1)}% do total`
                  : "0% do total"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Larissa</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-2xl font-bold text-muted-foreground">Carregando...</div>
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(data.larissa_revenue)}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {data.total_revenue > 0
                  ? `${((data.larissa_revenue / data.total_revenue) * 100).toFixed(1)}% do total`
                  : "0% do total"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Número de NFS-e</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-2xl font-bold text-muted-foreground">Carregando...</div>
              ) : (
                <div className="text-2xl font-bold">{data.total_count}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Notas emitidas no período</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AccountantDashboard;