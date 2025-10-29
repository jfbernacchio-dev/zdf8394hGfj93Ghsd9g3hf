import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, MessageCircle, Instagram, Facebook, Youtube, LogIn, ChevronDown } from "lucide-react";
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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-background/98 backdrop-blur-lg navbar-scrolled" : "bg-background/90 backdrop-blur-sm"
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 animate-fade-in">
              <img src={mindwareLogo} alt="Mindware" className="w-12 h-12 object-contain" />
              <span className="text-lg font-bold text-foreground hidden sm:block tracking-wide">ESPAÇO MINDWARE</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <button onClick={() => scrollToSection("inicio")} className="text-sm font-medium hover:text-primary transition-colors tracking-wide">INÍCIO</button>
              <button onClick={() => scrollToSection("servicos")} className="text-sm font-medium hover:text-primary transition-colors tracking-wide">SERVIÇOS</button>
              <button onClick={() => scrollToSection("sobre-nos")} className="text-sm font-medium hover:text-primary transition-colors tracking-wide">SOBRE NÓS</button>
              <button onClick={() => scrollToSection("espaco")} className="text-sm font-medium hover:text-primary transition-colors tracking-wide">O ESPAÇO</button>
              <button onClick={() => scrollToSection("curso")} className="text-sm font-medium hover:text-primary transition-colors tracking-wide">CURSO DE MÃES</button>
              <button onClick={() => scrollToSection("contato")} className="text-sm font-medium hover:text-primary transition-colors tracking-wide">CONTATO</button>
            </div>

            {/* Social Icons & Login */}
            <div className="flex items-center gap-2">
              <a href="https://api.whatsapp.com/send?phone=5511988802007" target="_blank" rel="noopener noreferrer" 
                className="p-2.5 rounded-full hover:bg-primary/10 transition-all hover:scale-110">
                <MessageCircle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </a>
              <a href="https://www.instagram.com/espacomindware" target="_blank" rel="noopener noreferrer" 
                className="p-2.5 rounded-full hover:bg-primary/10 transition-all hover:scale-110">
                <Instagram className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </a>
              <a href="https://www.facebook.com/espacomindware" target="_blank" rel="noopener noreferrer" 
                className="p-2.5 rounded-full hover:bg-primary/10 transition-all hover:scale-110">
                <Facebook className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </a>
              <a href="https://www.youtube.com/@espacomindware" target="_blank" rel="noopener noreferrer" 
                className="p-2.5 rounded-full hover:bg-primary/10 transition-all hover:scale-110">
                <Youtube className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </a>
              <Button variant="ghost" size="sm" asChild className="ml-2 hover:bg-primary/10">
                <Link to="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline font-medium">Acesso</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Parallax */}
      <section 
        id="inicio"
        className="parallax relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroMain})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background/50" />
        
        <div className="relative container mx-auto px-4 text-center z-10 pt-20">
          <div className="max-w-4xl mx-auto animate-slide-up">
            <p className="text-lg lg:text-2xl text-foreground/90 mb-8 leading-relaxed font-light">
              Localizados no coração da Zona Oeste de São Paulo, no bairro da Pompeia, 
              nossos psicólogos contam com um Espaço acolhedor, confortável e com toda 
              privacidade que nossa atuação requer.
            </p>
            <p className="text-base lg:text-lg text-muted-foreground mb-12 animate-slide-up stagger-1">
              Conheça nosso Espaço, nossa equipe de psicólogos e nosso trabalho!
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => scrollToSection("servicos")}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-foreground/60 hover:text-foreground transition-colors"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </section>

      {/* Plants Banner with Parallax */}
      <section 
        className="parallax relative h-[400px] overflow-hidden"
        style={{
          backgroundImage: `url(${plantsBanner})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/50" />
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center animate-slide-up px-4">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 text-foreground drop-shadow-lg">
              Psicologia Clínica e Psicologia Educacional
            </h2>
            <p className="text-xl lg:text-2xl italic text-muted-foreground drop-shadow-md">
              Cultivando consciência, bem estar, saúde e autoconhecimento.
            </p>
          </div>
        </div>
      </section>

      {/* Course Section */}
      <section id="curso" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="image-zoom-container h-80 md:h-auto">
                  <div 
                    className="image-zoom h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${mothersCourse})` }}
                  />
                </div>
                <CardContent className="p-10 lg:p-12 flex flex-col justify-center bg-gradient-to-br from-card to-muted/20">
                  <h3 className="text-2xl lg:text-3xl font-bold mb-6 text-primary">
                    CURSO DE MÃES, PAIS E CUIDADORES
                  </h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                    Grupo de apoio e aprendizado para mães, pais e cuidadores desenvolverem habilidades parentais 
                    e trocarem experiências em um ambiente acolhedor.
                  </p>
                  <Button size="lg" asChild className="w-full sm:w-auto">
                    <a href="https://chat.whatsapp.com/DkUrLuuixmk1cfvkzW9k2A" target="_blank" rel="noopener noreferrer">
                      Participe do Grupo!
                    </a>
                  </Button>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicos" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h3 className="text-center text-lg font-semibold text-muted-foreground mb-12 tracking-widest">PARA ADULTOS</h3>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-20">
            <Card className="card-hover shadow-lg hover:shadow-xl">
              <CardContent className="p-8 lg:p-10 h-full flex flex-col">
                <h4 className="text-2xl font-bold mb-6 text-primary">
                  Terapia Cognitiva e Comportamental
                </h4>
                <p className="text-muted-foreground leading-relaxed flex-grow">
                  É uma abordagem da psicologia clínica que procura promover um espaço terapêutico voltado à reflexão e reconstrução 
                  dos pensamentos, emoções e comportamentos do paciente. Nossos pensamentos, e os significados que damos às nossas 
                  experiências, é o que nos leva a vivenciar as nossas emoções e comportamentos, que serão explorados ao longo das 
                  sessões pelo paciente e psicólogo.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover shadow-lg hover:shadow-xl">
              <CardContent className="p-8 lg:p-10 h-full flex flex-col">
                <h4 className="text-2xl font-bold mb-6 text-primary">
                  Terapia Junguiana
                </h4>
                <p className="text-muted-foreground leading-relaxed flex-grow">
                  Abordagem da psicologia clínica na qual os símbolos presentes na vida do paciente são a chave para a compreensão 
                  do sentido de suas escolhas. Este é um espaço terapêutico de vínculo entre o paciente e o psicólogo, para que as 
                  pessoas possam pensar sobre a própria vida. O espaço de escuta e acolhimento pretende oferecer reflexão, 
                  sensibilização e consciência a respeito de si e do mundo à sua volta.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover shadow-lg hover:shadow-xl">
              <CardContent className="p-8 lg:p-10 h-full flex flex-col">
                <h4 className="text-2xl font-bold mb-6 text-primary">
                  Terapia Online
                </h4>
                <p className="text-muted-foreground leading-relaxed flex-grow">
                  O Espaço Mindware agora oferece a possibilidade da terapia online. Não importando a abordagem escolhida, 
                  a experiência terapêutica é a mesma de quando realizada presencialmente, mas com você no conforto da sua casa. 
                  Basta escolher uma abordagem, entrar em contato conosco por um de nossos canais de comunicação e agendar um 
                  horário para sua terapia virtual!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Kids Therapy with Parallax */}
          <div 
            className="parallax relative h-[700px] rounded-2xl overflow-hidden shadow-2xl"
            style={{
              backgroundImage: `url(${toys})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />
            <div className="relative h-full flex items-end justify-center pb-20">
              <div className="max-w-4xl mx-auto text-center px-4 animate-slide-up">
                <h3 className="text-lg font-semibold text-primary mb-6 tracking-widest">PARA CRIANÇAS</h3>
                <h4 className="text-4xl lg:text-5xl font-bold mb-8 text-foreground">Terapia Infantil</h4>
                <p className="text-lg lg:text-xl leading-relaxed text-foreground/90">
                  A clínica psicológica infantil é um espaço para a criança e a família. Este processo procura oferecer aos 
                  cuidadores ferramentas e condições para entender as demandas da criança. O objetivo da terapia é transformar 
                  as dinâmicas da criança e da família, visando um desenvolvimento e uma relação familiar mais saudável e bem adaptada. 
                  Os focos de trabalho do psicólogo são as habilidades sociais e emocionais da criança, os ambientes em que vive 
                  e orientação parental.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Parallax */}
      <section 
        className="parallax relative h-[500px] overflow-hidden"
        style={{
          backgroundImage: `url(${desk})`,
        }}
      >
        <div className="absolute inset-0 bg-background/75" />
        <div className="relative h-full flex items-center justify-center">
          <Button size="lg" className="text-2xl px-12 py-8 shadow-2xl hover:shadow-3xl transition-all hover:scale-105" asChild>
            <a href="https://api.whatsapp.com/send?phone=5511988802007" target="_blank" rel="noopener noreferrer">
              FALE CONOSCO
            </a>
          </Button>
        </div>
      </section>

      {/* Psychologists Section with Parallax Background */}
      <section 
        id="sobre-nos"
        className="parallax relative py-28 lg:py-36 overflow-hidden"
        style={{
          backgroundImage: `url(${concreteWallBanner})`,
        }}
      >
        <div className="absolute inset-0 bg-background/92" />
        <div className="relative container mx-auto px-4">
          <h2 className="text-4xl lg:text-6xl font-bold text-center mb-6 animate-slide-up">QUEM SOMOS</h2>
          <p className="text-center text-muted-foreground mb-20 text-xl animate-slide-up stagger-1">
            Nossa equipe de psicólogos especializados
          </p>
          
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 max-w-6xl mx-auto">
            {/* Larissa */}
            <Card className="card-hover overflow-hidden shadow-xl hover:shadow-2xl animate-slide-up stagger-2">
              <div className="image-zoom-container">
                <div 
                  className="image-zoom h-[500px] bg-cover bg-top"
                  style={{ backgroundImage: `url(${larissaFull})` }}
                />
              </div>
              <CardContent className="p-8 text-center bg-gradient-to-b from-card to-muted/20">
                <h3 className="text-3xl font-bold mb-3">Larissa Schwarcz Zein</h3>
                <p className="text-sm text-muted-foreground mb-1 font-medium">Psicóloga</p>
                <p className="text-sm text-muted-foreground mb-6 font-medium">CRP 06/124230</p>
                <p className="text-primary font-semibold text-lg leading-relaxed">
                  Psicologia clínica na abordagem Cognitiva e Comportamental (infantil e adulto)
                </p>
              </CardContent>
            </Card>

            {/* João */}
            <Card className="card-hover overflow-hidden shadow-xl hover:shadow-2xl animate-slide-up stagger-3">
              <div className="image-zoom-container">
                <div 
                  className="image-zoom h-[500px] bg-cover bg-top"
                  style={{ backgroundImage: `url(${joaoFull})` }}
                />
              </div>
              <CardContent className="p-8 text-center bg-gradient-to-b from-card to-muted/20">
                <h3 className="text-3xl font-bold mb-3">João Felipe Bernacchio</h3>
                <p className="text-sm text-muted-foreground mb-1 font-medium">Psicólogo</p>
                <p className="text-sm text-muted-foreground mb-6 font-medium">CRP 06/124232</p>
                <p className="text-primary font-semibold text-lg leading-relaxed">
                  Psicólogo clínico na abordagem da psicologia analítica junguiana
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Room Rental Section */}
      <section id="espaco" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-8 animate-slide-up">SALAS PARA ALUGUEL MENSAL</h2>
            <h3 className="text-2xl font-semibold text-primary mb-12 animate-slide-up stagger-1">
              PARA PROFISSIONAIS DA SAÚDE
            </h3>
            <Card className="shadow-xl">
              <CardContent className="p-12 lg:p-16">
                <p className="text-lg lg:text-xl text-muted-foreground mb-10 leading-relaxed">
                  O Espaço Mindware oferece salas para locação mensal para profissionais da saúde. 
                  Nosso espaço conta com consultórios totalmente equipados e preparados para atendimentos, 
                  em um ambiente acolhedor e profissional.
                </p>
                <Button size="lg" className="text-lg px-10 py-6" asChild>
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
      <section id="contato" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-6">REDES SOCIAIS</h2>
          <p className="text-center text-muted-foreground mb-16 text-xl">Entre em contato conosco</p>
          
          <div className="max-w-5xl mx-auto">
            <Card className="shadow-xl">
              <CardContent className="p-10 lg:p-14">
                <div className="grid md:grid-cols-2 gap-10 mb-12">
                  <div className="flex items-start gap-5 group">
                    <MessageCircle className="w-8 h-8 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-semibold mb-2 text-lg">WhatsApp</p>
                      <a href="https://api.whatsapp.com/send?phone=5511988802007" target="_blank" rel="noopener noreferrer" 
                        className="text-muted-foreground hover:text-primary transition-colors text-lg">
                        (11) 98880-2007
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-5 group">
                    <Mail className="w-8 h-8 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-semibold mb-2 text-lg">E-mail</p>
                      <a href="mailto:contato@espacomindware.com.br" 
                        className="text-muted-foreground hover:text-primary transition-colors text-lg">
                        contato@espacomindware.com.br
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-5 group">
                    <MapPin className="w-8 h-8 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-semibold mb-2 text-lg">Endereço</p>
                      <p className="text-muted-foreground text-lg">Pompeia, Zona Oeste<br />São Paulo - SP</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-5 group">
                    <Instagram className="w-8 h-8 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-semibold mb-2 text-lg">Instagram</p>
                      <a href="https://www.instagram.com/espacomindware" target="_blank" rel="noopener noreferrer" 
                        className="text-muted-foreground hover:text-primary transition-colors text-lg">
                        @espacomindware
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-8 border-t">
                  <Button size="lg" className="text-lg px-10 py-6" asChild>
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
      <footer className="bg-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-4">
              <img src={mindwareLogo} alt="Mindware" className="w-14 h-14 object-contain" />
              <span className="text-2xl font-bold tracking-wide">ESPAÇO MINDWARE</span>
            </div>
            <div className="flex gap-6">
              <a href="https://api.whatsapp.com/send?phone=5511988802007" target="_blank" rel="noopener noreferrer" 
                className="p-4 rounded-full hover:bg-primary/10 transition-all hover:scale-110">
                <MessageCircle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
              </a>
              <a href="https://www.instagram.com/espacomindware" target="_blank" rel="noopener noreferrer" 
                className="p-4 rounded-full hover:bg-primary/10 transition-all hover:scale-110">
                <Instagram className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
              </a>
              <a href="https://www.facebook.com/espacomindware" target="_blank" rel="noopener noreferrer" 
                className="p-4 rounded-full hover:bg-primary/10 transition-all hover:scale-110">
                <Facebook className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
              </a>
              <a href="https://www.youtube.com/@espacomindware" target="_blank" rel="noopener noreferrer" 
                className="p-4 rounded-full hover:bg-primary/10 transition-all hover:scale-110">
                <Youtube className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
              </a>
            </div>
            <p className="text-muted-foreground">
              © 2025 Espaço Mindware Psicologia. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
