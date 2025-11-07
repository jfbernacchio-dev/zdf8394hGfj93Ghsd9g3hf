import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, MousePointerClick, Eye, ArrowUpRight, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const WebsiteMetrics = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Métricas do Website</h1>
        <p className="text-muted-foreground">
          Acompanhe o desempenho e engajamento do seu website
        </p>
      </div>

      <Alert>
        <Globe className="h-4 w-4" />
        <AlertDescription>
          Para coletar métricas reais, é recomendado integrar com Google Analytics ou similar.
          As métricas abaixo são exemplos de dados que podem ser coletados.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Total de visualizações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Visitantes diferentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Formulários enviados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Cliques</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">CTR médio</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Páginas Mais Visitadas</CardTitle>
            <CardDescription>Ranking de visualizações por página</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Home", path: "/", views: "-" },
                { name: "Sobre Nós", path: "/sobre-nos", views: "-" },
                { name: "Terapia Cognitiva Comportamental", path: "/servicos/terapia-cognitiva-comportamental", views: "-" },
                { name: "Terapia Infantil", path: "/servicos/terapia-infantil", views: "-" },
                { name: "O Espaço", path: "/o-espaco", views: "-" },
              ].map((page) => (
                <div key={page.path} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{page.name}</p>
                    <p className="text-xs text-muted-foreground">{page.path}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{page.views}</span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Origem do Tráfego</CardTitle>
            <CardDescription>De onde seus visitantes vêm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { source: "Busca Orgânica (Google)", percentage: "-" },
                { source: "Redes Sociais", percentage: "-" },
                { source: "Direto", percentage: "-" },
                { source: "Referências", percentage: "-" },
                { source: "Outros", percentage: "-" },
              ].map((traffic) => (
                <div key={traffic.source} className="flex items-center justify-between">
                  <span className="text-sm">{traffic.source}</span>
                  <span className="text-sm font-bold">{traffic.percentage}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
          <CardDescription>Como começar a coletar métricas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. <strong>Integrar Google Analytics:</strong> Adicione o código de rastreamento do Google Analytics nas páginas públicas</p>
            <p>2. <strong>Configurar eventos:</strong> Rastreie ações importantes como cliques em botões de agendamento</p>
            <p>3. <strong>Criar API:</strong> Desenvolva uma edge function para buscar dados do Google Analytics API</p>
            <p>4. <strong>Atualizar dashboard:</strong> Conecte os dados reais nesta página de métricas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebsiteMetrics;
