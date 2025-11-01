import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import PublicHeader from "@/components/PublicHeader";

const TerapiaInfantil = () => {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      
      {/* Two Column Layout - Main Section */}
      <div className="grid md:grid-cols-2" style={{ minHeight: '838px' }}>
        {/* Left Column - Text Content with Background #E8E4D9 */}
        <div className="bg-[#E8E4D9] p-12 md:p-16 lg:px-[235px] lg:py-[157px] flex flex-col justify-start">
          <div className="space-y-8 max-w-[490px]">
            <p 
              className="text-[#6A7567] leading-relaxed"
              style={{ fontSize: '18.9px', lineHeight: '26px' }}
            >
              O Espaço Mindware conta com psicólogos que atuam na clínica infantil na abordagem Cognitiva Comportamental.
            </p>
            
            <p 
              className="text-[#6A7567] leading-relaxed"
              style={{ fontSize: '18.9px', lineHeight: '26px' }}
            >
              Os objetivos terapêuticos são definidos conjuntamente com a família, cuidadores e o terapeuta após às primeiras sessões de avaliação da criança.
            </p>
            
            <p 
              className="text-[#6A7567] leading-relaxed"
              style={{ fontSize: '18.9px', lineHeight: '26px' }}
            >
              Para os objetivos terapêuticos serem alcançados, é necessário fazer da psicoterapia infantil um encontro acolhedor entre a criança com o terapeuta. Nosso olhar está sempre voltado para a individualidade da criança e como esta manifesta suas questões emocionais, afetivas e comportamentais em seu meio social.
            </p>
            
            <p 
              className="text-[#6A7567] leading-relaxed"
              style={{ fontSize: '18.9px', lineHeight: '26px' }}
            >
              O processo terapêutico com as crianças está ligado ao desenvolvimento de habilidades cognitivas e comportamentais que sejam facilitadoras para que se adaptem ao mundo de forma saudável. Para os pais e cuidadores, trata-se de um espaço que busca instrumentalizar os para estarem aprendendo sobre o desenvolvimento da criança.
            </p>
          </div>
        </div>
        
        {/* Right Column - Image */}
        <div className="relative min-h-[400px] md:min-h-full">
          <img 
            src="/images/toys-wix.jpg" 
            alt="Ambiente de terapia infantil"
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

export default TerapiaInfantil;
