import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const TerapiaCognitivaComportamental = () => {
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
              PSICOTERAPIA COGNITIVA E COMPORTAMENTAL
            </h1>
            
            <div className="space-y-6">
              <p 
                className="text-[#6A7567] leading-relaxed"
                style={{ fontSize: '16px' }}
              >
                A Psicoterapia cognitiva e comportamental é uma abordagem dentro do campo da 
                Psicologia Clínica. Durante a sessão serão explorados os significados dos 
                pensamentos e as funções dos comportamentos do indivíduo e como estes dois 
                aspectos da pessoa (pensar e se comportar) estão ligados ao nosso dia a dia.
              </p>
              
              <p 
                className="text-[#6A7567] leading-relaxed"
                style={{ fontSize: '16px' }}
              >
                Todo o processo terapêutico é construído colaborativamente entre o paciente 
                e o terapeuta e tem como objetivo construir um espaço de segurança e 
                acolhimento que seja propício para a pessoa se desenvolver.
              </p>
            </div>
          </div>
          
          {/* Right Column - Image */}
          <div className="relative">
            <img 
              src="/images/desk-wix.jpg" 
              alt="Ambiente terapêutico"
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
            Agende sua entrevista e entenda o trabalho e a proposta terapêutica em maiores detalhes.
          </h2>
          
          <p 
            className="text-[#6A7567]"
            style={{ fontSize: '20px' }}
          >
            Conheça melhor o que a terapia pode oferecer à você!
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

export default TerapiaCognitivaComportamental;
