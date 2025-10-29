import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Users, Building2 } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";
import plantsHeader from "@/assets/plants-header.jpg";
import familyCourse from "@/assets/family-course.jpg";
import kidsTherapy from "@/assets/kids-therapy.jpg";
import workspace from "@/assets/workspace.jpg";
import concreteWall from "@/assets/concrete-wall.jpg";
import larissaPhoto from "@/assets/larissa-photo.jpg";
import joaoPhoto from "@/assets/joao-photo.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20 lg:py-32 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-foreground">
              Espaço Mindware Psicologia
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
              Localizados no coração da Zona Oeste de São Paulo, no bairro da Pompeia, nossos psicólogos contam com um Espaço acolhedor, confortável e com toda privacidade que nossa atuação requer.
            </p>
            <p className="text-xl lg:text-2xl font-semibold text-primary mb-8">
              Psicologia Clínica e Psicologia Educacional
            </p>
            <p className="text-lg text-muted-foreground mb-8 italic">
              Cultivando consciência, bem estar, saúde e autoconhecimento.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg" asChild>
                <a href="https://api.whatsapp.com/send?phone=5511988802007" target="_blank" rel="noopener noreferrer">
                  Agende sua Consulta
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg" asChild>
                <a href="#sobre">
                  Conheça a Clínica
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Nossos Serviços</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Oferecemos diferentes abordagens terapêuticas para atender às necessidades de cada paciente, 
              proporcionando um espaço de acolhimento, reflexão e transformação.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="card-hover">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-primary">Terapia Cognitiva e Comportamental</h3>
                <p className="text-sm text-muted-foreground mb-2 font-semibold">Para Adultos</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Abordagem da psicologia clínica que promove um espaço terapêutico voltado à reflexão e reconstrução 
                  dos pensamentos, emoções e comportamentos do paciente.
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-primary">Terapia Junguiana</h3>
                <p className="text-sm text-muted-foreground mb-2 font-semibold">Para Adultos</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Abordagem onde os símbolos presentes na vida do paciente são a chave para a compreensão do sentido de suas escolhas. 
                  Espaço de escuta e acolhimento para reflexão, sensibilização e consciência.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-primary">Terapia Infantil</h3>
                <p className="text-sm text-muted-foreground mb-2 font-semibold">Para Crianças</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Espaço para a criança e a família. Oferecemos ferramentas para entender as demandas da criança, 
                  focando em habilidades sociais, emocionais e orientação parental.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-primary">Terapia Online</h3>
                <p className="text-sm text-muted-foreground mb-2 font-semibold">Todas as Abordagens</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  A experiência terapêutica é a mesma de quando realizada presencialmente, mas com você no conforto da sua casa. 
                  Escolha sua abordagem e agende seu horário.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-primary">Curso de Mães, Pais e Cuidadores</h3>
                <p className="text-sm text-muted-foreground mb-2 font-semibold">Grupos</p>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Grupo de apoio e aprendizado para mães, pais e cuidadores desenvolverem habilidades parentais 
                  e trocarem experiências em um ambiente acolhedor.
                </p>
                <Button size="sm" variant="outline" asChild className="w-full">
                  <a href="https://chat.whatsapp.com/DkUrLuuixmk1cfvkzW9k2A" target="_blank" rel="noopener noreferrer">
                    Participe do Grupo
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-hover bg-primary/5">
              <CardContent className="p-6 flex flex-col justify-center items-center text-center h-full">
                <MapPin className="w-12 h-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Localização Privilegiada</h3>
                <p className="text-muted-foreground text-sm">Pompeia, Zona Oeste de São Paulo, com fácil acesso e ambiente acolhedor</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Psychologists Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">Nossos Profissionais</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Conheça nossa equipe de psicólogos especializados
          </p>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* João Felipe Bernacchio */}
            <Card className="card-hover">
              <CardContent className="p-8">
                <div className="aspect-square rounded-lg mb-6 overflow-hidden">
                  <img 
                    src={joaoPhoto} 
                    alt="João Felipe Bernacchio - Psicólogo CRP 06/124232"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold mb-2">João Felipe Bernacchio</h3>
                <p className="text-sm text-muted-foreground mb-4">CRP 06/124232</p>
                <p className="text-primary font-semibold mb-4">Psicologia Analítica Junguiana</p>
                <p className="text-muted-foreground">
                  Psicólogo clínico especializado na abordagem da psicologia analítica junguiana, 
                  com atendimento voltado para adultos.
                </p>
              </CardContent>
            </Card>

            {/* Larissa Schwarcz Zein */}
            <Card className="card-hover">
              <CardContent className="p-8">
                <div className="aspect-square rounded-lg mb-6 overflow-hidden">
                  <img 
                    src={larissaPhoto} 
                    alt="Larissa Schwarcz Zein - Psicóloga CRP 06/124230"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold mb-2">Larissa Schwarcz Zein</h3>
                <p className="text-sm text-muted-foreground mb-4">CRP 06/124230</p>
                <p className="text-primary font-semibold mb-4">Psicologia Cognitiva e Comportamental</p>
                <p className="text-muted-foreground">
                  Psicologia clínica na abordagem Cognitiva e Comportamental, 
                  com atendimento especializado para crianças e adultos.
                </p>
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
              O Espaço Mindware oferece salas para locação mensal para profissionais da saúde. 
              Nosso espaço conta com consultórios totalmente equipados e preparados para atendimentos, 
              em um ambiente acolhedor e profissional.
            </p>
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <div className="bg-primary/10 rounded-lg p-6 mb-6">
                  <p className="text-xl font-semibold text-primary">Aluguel Mensal</p>
                  <p className="text-sm text-muted-foreground mt-2">Para profissionais da saúde</p>
                </div>
                <p className="text-muted-foreground mb-6">
                  Interessado em fazer parte do nosso espaço? Entre em contato para mais informações 
                  sobre disponibilidade e valores.
                </p>
                <Button size="lg" variant="outline" asChild>
                  <a href="https://api.whatsapp.com/send?phone=5511988802007" target="_blank" rel="noopener noreferrer">
                    Entrar em Contato
                  </a>
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
                      <p className="font-semibold">WhatsApp</p>
                      <a href="https://api.whatsapp.com/send?phone=5511988802007" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        (11) 98880-2007
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Mail className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold">E-mail</p>
                      <a href="mailto:contato@espacomindware.com.br" className="text-muted-foreground hover:text-primary transition-colors">
                        contato@espacomindware.com.br
                      </a>
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
