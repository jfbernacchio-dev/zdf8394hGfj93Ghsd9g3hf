import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const TerapiaJunguiana = () => {
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
              TERAPIA JUNGUIANA
            </h1>
            
            <div className="space-y-6">
              <p 
                className="text-[#6A7567] leading-relaxed"
                style={{ fontSize: '16px' }}
              >
                A Psicoterapia Junguiana é uma abordagem terapêutica baseada na psicologia 
                analítica de Carl Gustav Jung. Esta forma de terapia busca compreender o 
                indivíduo em sua totalidade, explorando tanto os aspectos conscientes quanto 
                os inconscientes da psique.
              </p>
              
              <p 
                className="text-[#6A7567] leading-relaxed"
                style={{ fontSize: '16px' }}
              >
                O processo terapêutico junguiano enfatiza a individuação - o desenvolvimento 
                do self verdadeiro - através da análise de sonhos, símbolos e arquétipos. 
                É um caminho de autoconhecimento profundo que visa integrar os diferentes 
                aspectos da personalidade.
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
            src="/images/plants-wix.jpg" 
            alt="Ambiente terapêutico"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default TerapiaJunguiana;
