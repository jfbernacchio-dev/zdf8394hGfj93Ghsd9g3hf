import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountantRequests } from "@/components/AccountantRequests";
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

interface TherapistData {
  id: string;
  name: string;
  revenue: number;
}

interface NFSeData {
  total_revenue: number;
  therapists: TherapistData[];
  total_count: number;
}

const AccountantDashboard = () => {
  const { user } = useAuth();
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("current_month");
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [loading, setLoading] = useState(true);
  const [subordinatedTherapists, setSubordinatedTherapists] = useState<Array<{ id: string; full_name: string }>>([]);
  const [data, setData] = useState<NFSeData>({
    total_revenue: 0,
    therapists: [],
    total_count: 0,
  });

  useEffect(() => {
    const fetchSubordinatedTherapists = async () => {
      if (!user) return;

      try {
        // PASSO 1: Buscar terapeutas Full diretamente atribuídos
        const { data: assignments, error: assignError } = await supabase
          .from("accountant_therapist_assignments")
          .select(`
            therapist_id,
            profiles!accountant_therapist_assignments_therapist_id_fkey (
              id,
              full_name
            )
          `)
          .eq("accountant_id", user.id);

        if (assignError) throw assignError;

        const fullTherapists = assignments?.map((a: any) => ({
          id: a.profiles.id,
          full_name: a.profiles.full_name,
        })) || [];

        // PASSO 2: Buscar subordinados desses terapeutas Full
        if (fullTherapists.length === 0) {
          setSubordinatedTherapists([]);
          return;
        }

        const fullTherapistIds = fullTherapists.map(t => t.id);

        const { data: subordinateAssignments, error: subError } = await supabase
          .from("therapist_assignments")
          .select(`
            subordinate_id,
            profiles!therapist_assignments_subordinate_id_fkey (
              id,
              full_name
            )
          `)
          .in("manager_id", fullTherapistIds);

        if (subError) throw subError;

        const subordinates = subordinateAssignments?.map((a: any) => ({
          id: a.profiles.id,
          full_name: a.profiles.full_name,
        })) || [];

        // PASSO 3: Consolidar lista expandida
        const allTherapists = [...fullTherapists, ...subordinates];
        
        console.log("📊 Terapeutas carregados:", {
          full: fullTherapists.length,
          subordinates: subordinates.length,
          total: allTherapists.length,
        });

        setSubordinatedTherapists(allTherapists);
      } catch (error) {
        console.error("Error fetching subordinated therapists:", error);
        toast.error("Erro ao carregar terapeutas subordinados");
      }
    };

    fetchSubordinatedTherapists();
  }, [user]);

  useEffect(() => {
    if (periodPreset !== "custom") {
      updateDatesFromPreset(periodPreset);
    }
  }, [periodPreset]);

  useEffect(() => {
    if (subordinatedTherapists.length > 0) {
      fetchNFSeData();
    }
  }, [startDate, endDate, subordinatedTherapists]);

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
    if (subordinatedTherapists.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const therapistIds = subordinatedTherapists.map(t => t.id);

      // Fetch NFSe with status 'issued' and environment 'producao' in the period
      const { data: nfses, error } = await supabase
        .from("nfse_issued")
        .select("user_id, net_value")
        .eq("status", "issued")
        .eq("environment", "producao")
        .in("user_id", therapistIds)
        .gte("issue_date", startDate.toISOString())
        .lte("issue_date", endDate.toISOString());

      if (error) throw error;

      // Calculate totals per therapist
      const therapistRevenues = new Map<string, number>();
      let totalRevenue = 0;

      nfses?.forEach((nfse) => {
        const value = Number(nfse.net_value);
        totalRevenue += value;
        const current = therapistRevenues.get(nfse.user_id) || 0;
        therapistRevenues.set(nfse.user_id, current + value);
      });

      // Build therapist data array
      const therapistsData: TherapistData[] = subordinatedTherapists.map(therapist => {
        const names = therapist.full_name.split(' ');
        const displayName = names.length > 1 
          ? `${names[0]} ${names[names.length - 1]}`
          : names[0];

        return {
          id: therapist.id,
          name: displayName,
          revenue: therapistRevenues.get(therapist.id) || 0,
        };
      });

      setData({
        total_revenue: totalRevenue,
        therapists: therapistsData,
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

        {/* Seção de Pedidos de Subordinação */}
        <AccountantRequests />

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Carregando dados...
          </div>
        ) : subordinatedTherapists.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <p className="text-lg mb-2">Nenhum terapeuta subordinado</p>
              <p className="text-sm">
                Configure os terapeutas subordinados nas configurações do seu perfil.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card de Faturamento Total */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.total_revenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Período: {format(startDate, "dd/MM/yy")} - {format(endDate, "dd/MM/yy")}
                </p>
              </CardContent>
            </Card>

            {/* Cards dinâmicos por terapeuta */}
            {data.therapists.map((therapist) => (
              <Card key={therapist.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faturamento {therapist.name}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(therapist.revenue)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.total_revenue > 0
                      ? `${((therapist.revenue / data.total_revenue) * 100).toFixed(1)}% do total`
                      : "0% do total"}
                  </p>
                </CardContent>
              </Card>
            ))}

            {/* Card de Número de NFS-e */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Número de NFS-e</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.total_count}</div>
                <p className="text-xs text-muted-foreground mt-1">Notas emitidas no período</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AccountantDashboard;