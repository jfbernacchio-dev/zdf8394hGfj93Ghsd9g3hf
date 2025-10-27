import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Users, Building2 } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-foreground">
              Espaço Mindware Psicologia
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8">
              Cuidado psicológico especializado para adultos e crianças em São Paulo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg">
                Agende sua Consulta
              </Button>
              <Button size="lg" variant="outline" className="text-lg">
                Conheça a Clínica
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Sobre o Espaço Mindware</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="card-hover">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Atendimento Personalizado</h3>
                <p className="text-muted-foreground">Profissionais especializados em diferentes abordagens terapêuticas</p>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-6 text-center">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Localização Privilegiada</h3>
                <p className="text-muted-foreground">Pompeia, Zona Oeste de São Paulo, fácil acesso</p>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-6 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Espaço Acolhedor</h3>
                <p className="text-muted-foreground">Ambiente preparado para seu conforto e bem-estar</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Psychologists Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">Nossos Profissionais</h2>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Psychologist 1 */}
            <Card className="card-hover">
              <CardContent className="p-8">
                <div className="aspect-square bg-primary/10 rounded-lg mb-6 flex items-center justify-center">
                  <Users className="w-20 h-20 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Psicólogo</h3>
                <p className="text-primary font-semibold mb-4">Psicologia Analítica Junguiana</p>
                <p className="text-muted-foreground mb-4">Atendimento para adultos</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Formação:</strong> Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                  <p><strong>Especialização:</strong> Lorem ipsum dolor sit amet.</p>
                  <p><strong>CRP:</strong> 00/000000</p>
                </div>
              </CardContent>
            </Card>

            {/* Psychologist 2 */}
            <Card className="card-hover">
              <CardContent className="p-8">
                <div className="aspect-square bg-primary/10 rounded-lg mb-6 flex items-center justify-center">
                  <Users className="w-20 h-20 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Larissa</h3>
                <p className="text-primary font-semibold mb-4">Psicologia Cognitivo-Comportamental</p>
                <p className="text-muted-foreground mb-4">Atendimento para crianças</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Formação:</strong> Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                  <p><strong>Especialização:</strong> Lorem ipsum dolor sit amet.</p>
                  <p><strong>CRP:</strong> 00/000000</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Room Rental Section */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Building2 className="w-16 h-16 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Aluguel de Salas</h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              O Espaço Mindware oferece salas para locação para profissionais da saúde mental. 
              Nosso espaço conta com 3 consultórios totalmente equipados e preparados para atendimentos.
            </p>
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <div className="bg-primary/10 rounded-lg p-6 mb-6">
                  <p className="text-xl font-semibold text-primary">Salas Disponíveis</p>
                  <p className="text-3xl font-bold mt-2">0/3</p>
                  <p className="text-sm text-muted-foreground mt-2">Atualmente todas as salas estão ocupadas</p>
                </div>
                <p className="text-muted-foreground mb-6">
                  Caso tenha interesse em fazer parte do nosso espaço, entre em contato para ser incluído em nossa lista de espera.
                </p>
                <Button size="lg" variant="outline">
                  Entrar em Contato
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Location & Contact Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">Localização e Contato</h2>
          
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">Como Chegar</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold">Endereço</p>
                      <p className="text-muted-foreground">Pompeia, Zona Oeste<br />São Paulo - SP</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold">Horário de Atendimento</p>
                      <p className="text-muted-foreground">Segunda a Sexta: 8h às 20h<br />Sábado: 8h às 14h</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 aspect-video bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-16 h-16 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">Entre em Contato</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-4">
                    <Phone className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Telefone</p>
                      <p className="text-muted-foreground">(11) 0000-0000</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Mail className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold">E-mail</p>
                      <p className="text-muted-foreground">contato@espacomindware.com.br</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Seu nome" 
                    className="w-full px-4 py-3 rounded-md border bg-background"
                  />
                  <input 
                    type="email" 
                    placeholder="Seu e-mail" 
                    className="w-full px-4 py-3 rounded-md border bg-background"
                  />
                  <textarea 
                    placeholder="Sua mensagem" 
                    rows={4}
                    className="w-full px-4 py-3 rounded-md border bg-background"
                  />
                  <Button size="lg" className="w-full">
                    Enviar Mensagem
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary/10 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2025 Espaço Mindware Psicologia. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
