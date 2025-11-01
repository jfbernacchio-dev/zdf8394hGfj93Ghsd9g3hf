import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Instagram, Youtube, Phone, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-wix.jpg";
import plantsImage from "@/assets/plants-wix.jpg";
import mothersImage from "@/assets/mothers-wix.jpg";
import toysImage from "@/assets/toys-wix.jpg";
import deskImage from "@/assets/desk-wix.jpg";
import concreteImage from "@/assets/concrete-wix.jpg";
import larissaImage from "@/assets/larissa-wix.jpg";
import joaoImage from "@/assets/joao-wix.jpg";
import mindwareLogo from "@/assets/mindware-logo.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={mindwareLogo} alt="Espaço Mindware" className="h-12" />
            <div>
              <h1 className="text-xl font-semibold text-primary">ESPAÇO</h1>
              <h2 className="text-xl font-semibold text-primary">MINDWARE</h2>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#inicio" className="text-primary hover:text-primary/80 transition-colors text-sm font-medium">INÍCIO</a>
            <a href="#servicos" className="text-primary hover:text-primary/80 transition-colors text-sm font-medium">SERVIÇOS</a>
            <a href="#sobre" className="text-primary hover:text-primary/80 transition-colors text-sm font-medium">SOBRE NÓS</a>
            <a href="#curso" className="text-primary hover:text-primary/80 transition-colors text-sm font-medium">CURSO DE MÃES</a>
            <a href="#contato" className="text-primary hover:text-primary/80 transition-colors text-sm font-medium">CONTATO</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="https://wa.me/5511988802007" target="_blank" rel="noopener noreferrer">
              <Phone className="w-5 h-5 text-primary hover:text-primary/80 transition-colors" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <Instagram className="w-5 h-5 text-primary hover:text-primary/80 transition-colors" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
              <Youtube className="w-5 h-5 text-primary hover:text-primary/80 transition-colors" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="relative h-[915px] mt-[80px]">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-primary/10" />
      </section>

      {/* Location Section */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <p className="text-primary text-2xl leading-relaxed mb-6">
            Localizados no coração Zona Oeste de São Paulo, no bairro da Pompéia, nossos psicólogos contam com um Espaço acolhedor, confortável e com toda privacidade que nossa atuação requer.
          </p>
          <p className="text-primary text-2xl leading-relaxed">
            Conheça nosso Espaço, nossa equipe de psicólogos e nosso trabalho!
          </p>
        </div>
      </section>

      {/* Banner with Plants */}
      <section 
        className="relative h-[400px] flex items-center justify-center"
        style={{ backgroundImage: `url(${plantsImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="text-center space-y-6 px-6">
          <h2 className="text-4xl font-normal text-primary">
            Psicologia Clínica e Psicologia Educacional
          </h2>
          <div className="w-4 h-4 mx-auto bg-primary rounded-full" />
          <p className="text-3xl text-primary">
            Cultivando consciência, bem estar, saúde e autoconhecimento.
          </p>
        </div>
      </section>

      {/* Course Section */}
      <section id="curso" className="grid md:grid-cols-2">
        <div 
          className="h-[500px] bg-cover bg-center"
          style={{ backgroundImage: `url(${mothersImage})` }}
        />
        <div className="bg-secondary h-[500px] flex flex-col items-center justify-center p-12">
          <h3 className="text-2xl font-semibold text-primary mb-8 text-center">
            CURSO DE MÃES, PAIS E CUIDADORES
          </h3>
          <Button 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-12"
            onClick={() => window.open('https://chat.whatsapp.com/DkUrLuuixmk1cfvkzW9k2A', '_blank')}
          >
            Participe do grupo!
          </Button>
        </div>
      </section>

      {/* Adult Services */}
      <section id="servicos" className="py-20">
        <div className="container mx-auto px-6">
          <h3 className="text-3xl font-semibold text-primary text-center mb-12">PARA ADULTOS</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-8 text-center space-y-4 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold text-primary">Terapia Cognitiva e Comportamental</h4>
              <p className="text-primary/80 text-sm leading-relaxed">
                É uma abordagem da psicologia clínica que procura promover um espaço terapêutico voltado à reflexão e reconstrução dos pensamentos, emoções e comportamentos do paciente. Nossos pensamentos, e os significados que damos às nossas experiências, é o que nos leva a vivenciar as nossas emoções e comportamentos, que serão explorados ao longo das sessões pelo paciente e psicólogo.
              </p>
            </Card>
            <Card className="p-8 text-center space-y-4 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold text-primary">Terapia Junguiana</h4>
              <p className="text-primary/80 text-sm leading-relaxed">
                Abordagem da psicologia clínica na qual os símbolos presentes na vida do paciente são a chave para a compreensão do sentido de suas escolhas. Este é um espaço terapêutico de vínculo entre o paciente e o psicólogo, para que as pessoas possam pensar sobre a própria vida. O espaço de escuta e acolhimento pretende oferecer reflexão, sensibilização e consciência a respeito de si e do mundo à sua volta.
              </p>
            </Card>
            <Card className="p-8 text-center space-y-4 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold text-primary">Terapia Online</h4>
              <p className="text-primary/80 text-sm leading-relaxed">
                O Espaço Mindware agora oferece a possibilidade da terapia online. Não importando a abordagem escolhida, a experiência terapêutica é a mesma de quando realizada presencialmente, mas com você no conforto da sua casa. Basta escolher uma abordagem, entrar em contato conosco por um de nossos canais de comunicação e agendar um horário para sua terapia virtual!
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Children Section */}
      <section 
        className="relative h-[600px] flex items-center justify-center"
        style={{ backgroundImage: `url(${toysImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <Card className="relative z-10 max-w-2xl mx-6 p-10 text-center space-y-6 bg-white/95">
          <h3 className="text-3xl font-semibold text-primary">PARA CRIANÇAS</h3>
          <h4 className="text-2xl font-semibold text-primary">Terapia Infantil</h4>
          <p className="text-primary/80 leading-relaxed">
            A clínica psicológica infantil é um espaço para a criança e a família. Este processo procura oferecer aos cuidadores ferramentas e condições para entender as demandas a criança. O objetivo da terapia é transformar as dinâmicas da criança e da família, visando um desenvolvimento e uma relação familiar mais saudável e bem adaptada. Os focos de trabalho do psicólogo são as habilidades sociais e emocionais da criança, os ambientes em que vive e orientação parental.
          </p>
        </Card>
      </section>

      {/* CTA Section */}
      <section 
        className="relative h-[400px] flex items-center justify-center"
        style={{ backgroundImage: `url(${deskImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <Button 
          size="lg"
          className="relative z-10 bg-white text-primary hover:bg-white/90 px-16 py-6 text-xl"
          onClick={() => window.open('https://wa.me/5511988802007', '_blank')}
        >
          FALE CONOSCO
        </Button>
      </section>

      {/* Team Section */}
      <section 
        id="sobre"
        className="relative py-20"
        style={{ backgroundImage: `url(${concreteImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-white/80" />
        <div className="container mx-auto px-6 relative z-10">
          <h3 className="text-4xl font-semibold text-primary text-center mb-16">QUEM SOMOS</h3>
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <Card className="p-6 text-center space-y-4">
              <img src={larissaImage} alt="Larissa Schwarcz Zein" className="w-full h-[400px] object-cover rounded" />
              <h4 className="text-2xl font-semibold text-primary">Larissa Schwarcz Zein</h4>
              <p className="text-primary font-medium">Psicóloga</p>
              <p className="text-primary">CRP 06/124230</p>
              <p className="text-primary/80 text-sm">
                Psicologia clínica na abordagem Cognitiva e Comportamental (infantil e adulto)
              </p>
            </Card>
            <Card className="p-6 text-center space-y-4">
              <img src={joaoImage} alt="João Felipe Bernacchio" className="w-full h-[400px] object-cover rounded" />
              <h4 className="text-2xl font-semibold text-primary">João Felipe Bernacchio</h4>
              <p className="text-primary font-medium">Psicólogo</p>
              <p className="text-primary">CRP 06/124232</p>
              <p className="text-primary/80 text-sm">
                Psicólogo clínico na abordagem da psicologia analítica junguiana.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-secondary py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h4 className="text-xl font-semibold text-primary mb-4">REDES SOCIAIS</h4>
              <div className="flex gap-4 justify-center md:justify-start">
                <a href="https://wa.me/5511988802007" target="_blank" rel="noopener noreferrer">
                  <Phone className="w-6 h-6 text-primary hover:text-primary/80 transition-colors" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                  <Instagram className="w-6 h-6 text-primary hover:text-primary/80 transition-colors" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                  <Youtube className="w-6 h-6 text-primary hover:text-primary/80 transition-colors" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-primary mb-4">CONTATO</h4>
              <div className="space-y-2 text-primary/80">
                <p className="flex items-center gap-2 justify-center md:justify-start">
                  <Phone className="w-4 h-4" />
                  (11) 98880-2007
                </p>
                <p className="flex items-center gap-2 justify-center md:justify-start">
                  <MapPin className="w-4 h-4" />
                  Pompéia, São Paulo - SP
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-primary mb-4">SALAS PARA ALUGUEL</h4>
              <Button 
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-white"
                onClick={() => window.open('https://wa.me/5511988802007', '_blank')}
              >
                Para Profissionais da Saúde
              </Button>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-primary/20 text-center">
            <p className="text-primary/60 text-sm">
              © 2025 Espaço Mindware Psicologia. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
