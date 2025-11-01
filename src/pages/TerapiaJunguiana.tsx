import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import Footer from "@/components/Footer";

const TerapiaJunguiana = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Spacing */}
      <div className="h-[50px]" />
      
      {/* Two Column Layout - Main Section */}
      <div className="grid md:grid-cols-2" style={{ minHeight: '838px' }}>
        {/* Left Column - Text Content with Background #E8E4D9 */}
        <div className="bg-[#E8E4D9] p-12 md:p-16 lg:px-[235px] lg:py-[157px] flex flex-col justify-start">
          <div className="space-y-8 max-w-[490px]">
            {/* Main content paragraphs - font-size 18.9px, line-height 26px */}
            <p 
              className="text-[#6A7567] leading-relaxed"
              style={{ fontSize: '18.9px', lineHeight: '26px' }}
            >
              O Espaço Mindware oferece psicoterapia junguiana analítica. Esta é uma 
              abordagem caracterizada como uma psicologia do inconsciente, voltando o 
              olhar para os aspectos simbólicos da vida do paciente, procurando promover 
              abertura e ampliar a consciência.
            </p>
            
            <p 
              className="text-[#6A7567] leading-relaxed"
              style={{ fontSize: '18.9px', lineHeight: '26px' }}
            >
              Procuramos oferecer uma experiência única de contato e intimidade humana, 
              oferecendo um espaço seguro no qual o paciente pode olhar para sua própria vida.
            </p>
            
            <p 
              className="text-[#6A7567] leading-relaxed"
              style={{ fontSize: '18.6px', lineHeight: '26px' }}
            >
              O objetivo da terapia junguiana não é de que o paciente venha receber 
              orientações de como deve guiar a sua vida, mas sim oferecer um espaço 
              para que o paciente possa decidir por si mesmo. Desta maneira, o terapeuta 
              não busca solucionar os problemas da vida do paciente, mas sim o ajuda a 
              entender as escolhas que vem fazendo e a transformar sua própria vida.
            </p>
          </div>
        </div>
        
        {/* Right Column - Image */}
        <div className="relative min-h-[400px] md:min-h-full">
          <img 
            src="/images/plants-wix.jpg" 
            alt="Caderno e lápis - ambiente terapêutico"
            className="w-full h-full object-cover"
            style={{ minHeight: '838px' }}
          />
        </div>
      </div>
      
      {/* Bottom Section - CTA with #FAFAFA background */}
      <section 
        className="flex flex-col items-center justify-center px-6 py-16"
        style={{ backgroundColor: '#FAFAFA', minHeight: '399px' }}
      >
        <div className="text-center max-w-[760px] space-y-4 mb-12">
          <h2 
            className="text-[#6A7567]"
            style={{ 
              fontSize: '28.2px', 
              lineHeight: '33px',
              fontWeight: 400 
            }}
          >
            Agende sua entrevista e entenda o trabalho e a proposta
          </h2>
          <p 
            className="text-[#6A7567]"
            style={{ 
              fontSize: '28.2px', 
              lineHeight: '33px',
              fontWeight: 400 
            }}
          >
            terapêutica em maiores detalhes.
          </p>
          <p 
            className="text-[#6A7567]"
            style={{ 
              fontSize: '28.5px', 
              lineHeight: '33px',
              fontWeight: 400 
            }}
          >
            Conheça melhor o que a terapia pode oferecer à você!
          </p>
        </div>
        
        <Button
          className="bg-white text-[#7F8D7C] hover:bg-gray-50 px-12 py-6 border-none"
          style={{ 
            fontSize: '17.9px',
            boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.6)',
            minWidth: '316px',
            height: '40px'
          }}
          onClick={() => window.open('https://api.whatsapp.com/send?phone=5511988802007', '_blank')}
        >
          Agendar Consulta
        </Button>
      </section>
      
      <Footer />
    </div>
  );
};

export default TerapiaJunguiana;
