import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FileText, Calendar, DollarSign, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClinicalComplaintSummary from "@/components/ClinicalComplaintSummary";

export default function PatientDetailMock() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock patient data
  const mockPatient = {
    id: id || "mock-patient-id",
    name: "Paciente Teste - Mock",
    email: "teste@mock.com",
    phone: "(11) 99999-9999",
    cpf: "123.456.789-00",
    birth_date: "1990-01-01",
    status: "active",
    session_value: 200,
    frequency: "Semanal",
    session_day: "Segunda-feira",
    session_time: "14:00",
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{mockPatient.name}</h1>
          <p className="text-muted-foreground">MOCK - Sistema de Queixa Clínica (Teste)</p>
        </div>
        <Button onClick={() => navigate(`/patients/${id}/complaint/new`)}>
          <FileText className="h-4 w-4 mr-2" />
          Nova Queixa
        </Button>
      </div>

      {/* Informações Básicas */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Informações do Paciente (Mock)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{mockPatient.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Telefone</p>
            <p className="font-medium">{mockPatient.phone}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">CPF</p>
            <p className="font-medium">{mockPatient.cpf}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor da Sessão</p>
            <p className="font-medium">R$ {mockPatient.session_value}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Frequência</p>
            <p className="font-medium">{mockPatient.frequency}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Horário</p>
            <p className="font-medium">{mockPatient.session_day} às {mockPatient.session_time}</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="queixa" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="queixa" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Queixa Clínica
          </TabsTrigger>
          <TabsTrigger value="sessoes" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Sessões
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="comunicacao" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comunicação
          </TabsTrigger>
        </TabsList>

        {/* TAB: Queixa Clínica - NOVO SISTEMA */}
        <TabsContent value="queixa" className="mt-6">
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold text-primary mb-2">
                🎉 Novo Sistema de Queixa Clínica CID-10
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sistema completo com catálogo CID-10 Cap V (F00-F99), sintomas parametrizados, 
                medicações catalogadas e avaliação de risco. Este é um ambiente de teste (mock).
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => navigate(`/patients/${id}/complaint/new`)}
                  variant="default"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Criar Nova Queixa
                </Button>
                <Button 
                  onClick={() => navigate(`/patients/${id}`)}
                  variant="outline"
                >
                  Ver Paciente Real
                </Button>
              </div>
            </div>

            {/* Componente de Resumo da Queixa */}
            <ClinicalComplaintSummary patientId={id || ""} />
          </div>
        </TabsContent>

        {/* TAB: Sessões - Mock */}
        <TabsContent value="sessoes" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sessões (Mock)</h3>
            <p className="text-muted-foreground text-center py-8">
              Esta é uma área de mock. As sessões do paciente real apareceriam aqui.
            </p>
          </Card>
        </TabsContent>

        {/* TAB: Financeiro - Mock */}
        <TabsContent value="financeiro" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Financeiro (Mock)</h3>
            <p className="text-muted-foreground text-center py-8">
              Esta é uma área de mock. O controle financeiro do paciente real apareceria aqui.
            </p>
          </Card>
        </TabsContent>

        {/* TAB: Comunicação - Mock */}
        <TabsContent value="comunicacao" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Comunicação (Mock)</h3>
            <p className="text-muted-foreground text-center py-8">
              Esta é uma área de mock. As conversas do WhatsApp do paciente real apareceriam aqui.
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Instruções de Teste */}
      <Card className="mt-6 p-6 bg-muted/50">
        <h3 className="font-semibold mb-3">📝 Instruções de Teste</h3>
        <div className="space-y-2 text-sm">
          <p><strong>1. Criar Queixa:</strong> Clique em "Criar Nova Queixa" acima</p>
          <p><strong>2. Buscar CID:</strong> Digite "F32" ou "depressão" no campo de busca</p>
          <p><strong>3. Selecionar Sintomas:</strong> Marque os sintomas relevantes e ajuste a intensidade</p>
          <p><strong>4. Adicionar Medicações:</strong> Use o botão "Adicionar Medicação"</p>
          <p><strong>5. Avaliar Risco:</strong> Preencha os campos de suicidalidade e agressividade</p>
          <p><strong>6. Salvar:</strong> Clique em "Salvar Queixa Clínica" ao final</p>
          <p className="text-muted-foreground mt-3">
            Após salvar, você voltará para esta página e verá o resumo da queixa clínica no card acima.
          </p>
        </div>
      </Card>
    </div>
  );
}
