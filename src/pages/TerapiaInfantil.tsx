import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const TerapiaInfantil = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Spacing */}
      <div className="h-[50px]" />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Column - Text Content */}
          <div className="space-y-8">
            <h1 
              className="font-normal leading-tight text-[#6A7567]"
              style={{ fontSize: '39.2px' }}
            >
              TERAPIA INFANTIL
            </h1>
            
            <div className="space-y-6">
              <p 
                className="text-[#6A7567] leading-relaxed"
                style={{ fontSize: '16px' }}
              >
                A Psicoterapia Infantil é uma abordagem especializada que auxilia crianças 
                a compreenderem e expressarem suas emoções, pensamentos e comportamentos de 
                forma saudável. Utilizamos técnicas lúdicas e apropriadas para cada faixa 
                etária, respeitando o universo infantil.
              </p>
              
              <p 
                className="text-[#6A7567] leading-relaxed"
                style={{ fontSize: '16px' }}
              >
                O trabalho terapêutico com crianças envolve também orientação aos pais, 
                criando um ambiente de apoio e compreensão. Através do brincar, da arte e 
                da conversa, a criança desenvolve recursos emocionais para lidar com seus 
                desafios e promover seu desenvolvimento saudável.
              </p>
            </div>
          </div>
          
          {/* Right Column - Image */}
          <div className="relative">
            <img 
              src="/images/toys-wix.jpg" 
              alt="Ambiente de terapia infantil"
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>
        
        {/* Call to Action Section */}
        <div className="mt-20 text-center max-w-4xl mx-auto space-y-8">
          <h2 
            className="text-[#6A7567] font-normal leading-relaxed"
            style={{ fontSize: '28px' }}
          >
            Agende uma entrevista e entenda como podemos ajudar seu filho em seu desenvolvimento.
          </h2>
          
          <p 
            className="text-[#6A7567]"
            style={{ fontSize: '20px' }}
          >
            Conheça melhor o que a terapia pode oferecer para sua família!
          </p>
          
          <Button
            size="lg"
            className="bg-[#7F8D7C] hover:bg-[#6A7567] text-white px-8 py-6 text-lg"
            onClick={() => window.open('https://api.whatsapp.com/send?phone=5511988802007', '_blank')}
          >
            <Phone className="w-5 h-5 mr-2" />
            Agendar Consulta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TerapiaInfantil;
