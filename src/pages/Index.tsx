import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, MessageCircle, Instagram, Facebook, Youtube, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import heroMain from "@/assets/hero-main.jpg";
import plantsBanner from "@/assets/plants-banner.jpg";
import mothersCourse from "@/assets/mothers-course.jpg";
import toys from "@/assets/toys.jpg";
import desk from "@/assets/desk.jpg";
import concreteWallBanner from "@/assets/concrete-wall-banner.jpg";
import larissaFull from "@/assets/larissa-full.jpg";
import joaoFull from "@/assets/joao-full.jpg";
import mindwareLogo from "@/assets/mindware-logo.png";
import { useState, useEffect } from "react";

const Index = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-lg shadow-lg" : "bg-background/80 backdrop-blur-sm"
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 animate-fade-in">
              <img src={mindwareLogo} alt="Mindware" className="w-12 h-12" />
              <span className="text-xl font-semibold text-foreground hidden sm:block">Espaço Mindware</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              <a href="#inicio" className="text-sm font-medium hover:text-primary transition-colors">INÍCIO</a>
              <a href="#servicos" className="text-sm font-medium hover:text-primary transition-colors">SERVIÇOS</a>
              <a href="#sobre-nos" className="text-sm font-medium hover:text-primary transition-colors">SOBRE NÓS</a>
              <a href="#espaco" className="text-sm font-medium hover:text-primary transition-colors">O ESPAÇO</a>
              <a href="#curso" className="text-sm font-medium hover:text-primary transition-colors">CURSO DE MÃES</a>
              <a href="#contato" className="text-sm font-medium hover:text-primary transition-colors">CONTATO</a>
            </div>

            {/* Social Icons & Login */}
            <div className="flex items-center gap-3">
              <a href="https://api.whatsapp.com/send?phone=5511988802007" target="_blank" rel="noopener noreferrer" 
                className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/espacomindware" target="_blank" rel="noopener noreferrer" 
                className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.facebook.com/espacomindware" target="_blank" rel="noopener noreferrer" 
                className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@espacomindware" target="_blank" rel="noopener noreferrer" 
                className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <Button variant="ghost" size="sm" asChild className="ml-2">
                <Link to="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Acesso</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        id="inicio"
        className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden pt-20"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroMain})`,
            backgroundAttachment: 'fixed',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/60" />
        
        <div className="relative container mx-auto px-4 text-center z-10">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <p className="text-lg lg:text-xl text-foreground/90 mb-8 leading-relaxed">
              Localizados no coração da Zona Oeste de São Paulo, no bairro da Pompeia, 
              nossos psicólogos contam com um Espaço acolhedor, confortável e com toda 
              privacidade que nossa atuação requer.
            </p>
            <Button size="lg" className="text-lg shadow-lg hover:shadow-xl transition-shadow" asChild>
              <a href="#servicos">
                Conheça nosso Espaço, nossa equipe de psicólogos e nosso trabalho!
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Plants Banner */}
      <section 
        className="relative h-64 lg:h-80 overflow-hidden"
        style={{
          backgroundImage: `url(${plantsBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background/60" />
        <div className="relative h-full flex items-end justify-center pb-8">
          <div className="text-center animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-bold mb-2">Psicologia Clínica e Psicologia Educacional</h2>
            <p className="text-xl lg:text-2xl italic text-muted-foreground">
              Cultivando consciência, bem estar, saúde e autoconhecimento.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicos" className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          {/* Course Card */}
          <div className="max-w-5xl mx-auto mb-16">
            <Card className="overflow-hidden card-hover">
              <div className="grid md:grid-cols-2 gap-0">
                <div 
                  className="h-64 md:h-auto bg-cover bg-center"
                  style={{ backgroundImage: `url(${mothersCourse})` }}
                />
                <CardContent className="p-8 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold mb-4 text-primary">CURSO DE MÃES, PAIS E CUIDADORES</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Grupo de apoio e aprendizado para mães, pais e cuidadores desenvolverem habilidades parentais 
                    e trocarem experiências em um ambiente acolhedor.
                  </p>
                  <Button asChild>
                    <a href="https://chat.whatsapp.com/DkUrLuuixmk1cfvkzW9k2A" target="_blank" rel="noopener noreferrer">
                      Participe do Grupo!
                    </a>
                  </Button>
                </CardContent>
              </div>
            </Card>
          </div>

          {/* Adult Services */}
          <div className="mb-16">
            <h3 className="text-center text-lg font-semibold text-muted-foreground mb-8">PARA ADULTOS</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="card-hover">
                <CardContent className="p-8">
                  <h4 className="text-2xl font-bold mb-4 text-primary">Terapia Cognitiva e Comportamental</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    É uma abordagem da psicologia clínica que procura promover um espaço terapêutico voltado à reflexão e reconstrução 
                    dos pensamentos, emoções e comportamentos do paciente. Nossos pensamentos, e os significados que damos às nossas 
                    experiências, é o que nos leva a vivenciar as nossas emoções e comportamentos, que serão explorados ao longo das 
                    sessões pelo paciente e psicólogo.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-8">
                  <h4 className="text-2xl font-bold mb-4 text-primary">Terapia Junguiana</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Abordagem da psicologia clínica na qual os símbolos presentes na vida do paciente são a chave para a compreensão 
                    do sentido de suas escolhas. Este é um espaço terapêutico de vínculo entre o paciente e o psicólogo, para que as 
                    pessoas possam pensar sobre a própria vida. O espaço de escuta e acolhimento pretende oferecer reflexão, 
                    sensibilização e consciência a respeito de si e do mundo à sua volta.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-8">
                  <h4 className="text-2xl font-bold mb-4 text-primary">Terapia Online</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    O Espaço Mindware agora oferece a possibilidade da terapia online. Não importando a abordagem escolhida, 
                    a experiência terapêutica é a mesma de quando realizada presencialmente, mas com você no conforto da sua casa. 
                    Basta escolher uma abordagem, entrar em contato conosco por um de nossos canais de comunicação e agendar um 
                    horário para sua terapia virtual!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Kids Therapy with Image */}
          <div 
            className="relative h-[600px] overflow-hidden rounded-lg mb-8"
            style={{
              backgroundImage: `url(${toys})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="relative h-full flex items-end justify-center pb-16">
              <div className="max-w-3xl mx-auto text-center px-4">
                <h3 className="text-lg font-semibold text-muted-foreground mb-4">PARA CRIANÇAS</h3>
                <h4 className="text-3xl font-bold mb-6 text-primary">Terapia Infantil</h4>
                <p className="text-lg leading-relaxed mb-6">
                  A clínica psicológica infantil é um espaço para a criança e a família. Este processo procura oferecer aos 
                  cuidadores ferramentas e condições para entender as demandas da criança. O objetivo da terapia é transformar 
                  as dinâmicas da criança e da família, visando um desenvolvimento e uma relação familiar mais saudável e bem adaptada. 
                  Os focos de trabalho do psicólogo são as habilidades sociais e emocionais da criança, os ambientes em que vive 
                  e orientação parental.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div 
            className="relative h-[400px] overflow-hidden rounded-lg"
            style={{
              backgroundImage: `url(${desk})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-background/70" />
            <div className="relative h-full flex items-center justify-center">
              <Button size="lg" className="text-xl px-8 py-6 shadow-xl" asChild>
                <a href="https://api.whatsapp.com/send?phone=5511988802007" target="_blank" rel="noopener noreferrer">
                  FALE CONOSCO
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Psychologists Section */}
      <section 
        id="sobre-nos"
        className="relative py-24 lg:py-32 overflow-hidden"
        style={{
          backgroundImage: `url(${concreteWallBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-background/90" />
        <div className="relative container mx-auto px-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-4">QUEM SOMOS</h2>
          <p className="text-center text-muted-foreground mb-16 text-lg">
            Nossa equipe de psicólogos especializados
          </p>
          
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 max-w-5xl mx-auto">
            {/* Larissa */}
            <Card className="card-hover overflow-hidden">
              <div 
                className="h-96 bg-cover bg-center"
                style={{ backgroundImage: `url(${larissaFull})` }}
              />
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-2">Larissa Schwarcz Zein</h3>
                <p className="text-sm text-muted-foreground mb-1">Psicóloga</p>
                <p className="text-sm text-muted-foreground mb-4">CRP 06/124230</p>
                <p className="text-primary font-semibold mb-2">
                  Psicologia clínica na abordagem Cognitiva e Comportamental (infantil e adulto)
                </p>
              </CardContent>
            </Card>

            {/* João */}
            <Card className="card-hover overflow-hidden">
              <div 
                className="h-96 bg-cover bg-center"
                style={{ backgroundImage: `url(${joaoFull})` }}
              />
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-2">João Felipe Bernacchio</h3>
                <p className="text-sm text-muted-foreground mb-1">Psicólogo</p>
                <p className="text-sm text-muted-foreground mb-4">CRP 06/124232</p>
                <p className="text-primary font-semibold mb-2">
                  Psicólogo clínico na abordagem da psicologia analítica junguiana
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Room Rental Section */}
      <section id="espaco" className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-12">SALAS PARA ALUGUEL MENSAL</h2>
            <Card className="overflow-hidden">
              <CardContent className="p-12">
                <h3 className="text-2xl font-semibold text-primary mb-6">PARA PROFISSIONAIS DA SAÚDE</h3>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  O Espaço Mindware oferece salas para locação mensal para profissionais da saúde. 
                  Nosso espaço conta com consultórios totalmente equipados e preparados para atendimentos, 
                  em um ambiente acolhedor e profissional.
                </p>
                <Button size="lg" asChild>
                  <a href="https://api.whatsapp.com/send?phone=5511988802007" target="_blank" rel="noopener noreferrer">
                    Entrar em Contato
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">REDES SOCIAIS</h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">Entre em contato conosco</p>
          
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="flex items-center gap-4">
                    <MessageCircle className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">WhatsApp</p>
                      <a href="https://api.whatsapp.com/send?phone=5511988802007" target="_blank" rel="noopener noreferrer" 
                        className="text-muted-foreground hover:text-primary transition-colors">
                        (11) 98880-2007
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Mail className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">E-mail</p>
                      <a href="mailto:contato@espacomindware.com.br" 
                        className="text-muted-foreground hover:text-primary transition-colors">
                        contato@espacomindware.com.br
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <MapPin className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">Endereço</p>
                      <p className="text-muted-foreground">Pompeia, Zona Oeste<br />São Paulo - SP</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Instagram className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">Instagram</p>
                      <a href="https://www.instagram.com/espacomindware" target="_blank" rel="noopener noreferrer" 
                        className="text-muted-foreground hover:text-primary transition-colors">
                        @espacomindware
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4 pt-6 border-t">
                  <Button size="lg" asChild>
                    <a href="https://api.whatsapp.com/send?phone=5511988802007" target="_blank" rel="noopener noreferrer">
                      Agendar Consulta
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary/5 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <img src={mindwareLogo} alt="Mindware" className="w-10 h-10" />
              <span className="text-xl font-semibold">Espaço Mindware</span>
            </div>
            <div className="flex gap-4">
              <a href="https://api.whatsapp.com/send?phone=5511988802007" target="_blank" rel="noopener noreferrer" 
                className="p-3 rounded-full hover:bg-primary/10 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/espacomindware" target="_blank" rel="noopener noreferrer" 
                className="p-3 rounded-full hover:bg-primary/10 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.facebook.com/espacomindware" target="_blank" rel="noopener noreferrer" 
                className="p-3 rounded-full hover:bg-primary/10 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@espacomindware" target="_blank" rel="noopener noreferrer" 
                className="p-3 rounded-full hover:bg-primary/10 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 Espaço Mindware Psicologia. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
