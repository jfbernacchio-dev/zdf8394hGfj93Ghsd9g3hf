import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const TerapiaInfantil = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Spacing */}
      <div className="h-[50px]" />
      
      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 min-h-[calc(100vh-50px)]">
        {/* Left Column - Text Content with Background */}
        <div className="bg-[#E8E4D9] p-12 md:p-16 lg:p-20 flex flex-col justify-center">
          <div className="space-y-8 max-w-2xl">
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
            
            <Button
              size="lg"
              className="bg-[#7F8D7C] hover:bg-[#6A7567] text-white px-8 py-6 text-lg mt-8"
              onClick={() => window.open('https://api.whatsapp.com/send?phone=5511988802007', '_blank')}
            >
              <Phone className="w-5 h-5 mr-2" />
              Agendar Consulta
            </Button>
          </div>
        </div>
        
        {/* Right Column - Image */}
        <div className="relative min-h-[400px] md:min-h-full">
          <img 
            src="/images/toys-wix.jpg" 
            alt="Ambiente de terapia infantil"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default TerapiaInfantil;
