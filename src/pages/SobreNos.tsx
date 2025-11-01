import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import PublicHeader from "@/components/PublicHeader";

const SobreNos = () => {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      
      {/* First Section - Larissa with beige background */}
      <section className="grid md:grid-cols-2" style={{ minHeight: '448px' }}>
        {/* Image Left */}
        <div style={{ backgroundColor: '#FAFAFA' }}>
          <img 
            src="/images/larissa-wix.jpg" 
            alt="Larissa Schwarcz Zein" 
            className="w-full h-full object-cover"
            style={{ height: '448px' }}
          />
        </div>
        
        {/* Content Right - Beige background */}
        <div style={{ backgroundColor: '#E8E4D9' }} className="flex items-center px-12 py-8">
          <div style={{ maxWidth: '653px' }}>
            <h1 style={{ 
              fontFamily: 'Inter', 
              fontWeight: 700, 
              fontSize: '30px', 
              lineHeight: '30px',
              color: '#6A7567',
              marginBottom: '8px'
            }}>
              Larissa Schwarcz Zein
            </h1>
            
            <h2 style={{ 
              fontFamily: 'Inter', 
              fontWeight: 400, 
              fontSize: '16px', 
              lineHeight: '19px',
              color: '#6A7567',
              letterSpacing: '-0.8px',
              marginBottom: '32px'
            }}>
              CRP 06/124230
            </h2>
            
            <div style={{ 
              fontFamily: 'Inter', 
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: '19px',
              lineHeight: '24px',
              color: '#6A7567',
              letterSpacing: '-1px'
            }}>
              <p>Co-criadora do Espaço Mindware, e responsável pela atuação infantil no Espaço. Com quase 10 anos de experiência clínica, atua na abordagem cognitiva comportamental, com um projeto que engloba criança, família e escola.</p>
              <p style={{ marginTop: '26px' }}>Em seu projeto terapêutico, propõe uma psicoterapia voltada para o desenvolvimento de recursos, visando o bem-estar nas diversas áreas da vida. A abordagem Cognitiva e Comportamental explora pensamentos, emoções e comportamentos e como esses aspectos estão relacionados as nossas vidas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Section - Larissa */}
      <section style={{ backgroundColor: '#D1CBBA', padding: '60px 0' }}>
        <div className="container mx-auto px-12" style={{ maxWidth: '1200px' }}>
          <h2 style={{ 
            fontFamily: 'Inter', 
            fontWeight: 700, 
            fontSize: '30px', 
            lineHeight: '30px',
            color: '#6A7567',
            marginBottom: '32px'
          }}>
            Larissa Schwarcz Zein
          </h2>
          
          <h3 style={{ 
            fontFamily: 'Inter', 
            fontWeight: 700, 
            fontSize: '24px', 
            lineHeight: '29px',
            color: '#6A7567',
            marginBottom: '24px'
          }}>
            Currículo
          </h3>
          
          <div style={{ 
            fontFamily: 'Inter', 
            fontWeight: 700,
            fontSize: '17px',
            lineHeight: '26px',
            color: '#6A7567'
          }}>
            <p style={{ marginBottom: '16px' }}>• Formada em Psicologia pela Pontifícia Universidade Católica - SP (PUC-SP).</p>
            <p style={{ marginBottom: '16px' }}>• Especialista em Psicologia Cognitiva e Comportamental pelo Instituto de Terapia Cognitiva (ITC).</p>
            <p style={{ marginBottom: '16px' }}>• Pós-graduada em clínica adolescente e infantil com base na terapia cognitiva (CETCC)</p>
            <p style={{ marginBottom: '16px' }}>• Ampla experiência em atendimento psicológico infantil e orientação psico-educativa para pais</p>
            <p style={{ marginBottom: '16px' }}>• Ampla experiência em atendimento de jovens e adultos na abordagem Cognitiva Comportamental</p>
            <p style={{ marginBottom: '16px' }}>• Membro da coordenação pedagógica do Ensino Fundamental - Colégio Palmares</p>
            <p style={{ marginBottom: '16px' }}>• Educadora responsável pelo desenvolvimento de atividades com crianças com dificuldade de aprendizagem em processo de alfabetização na Escola Gimbernau</p>
          </div>
        </div>
      </section>

      {/* Second Section - João with beige background */}
      <section className="grid md:grid-cols-2" style={{ minHeight: '448px' }}>
        {/* Image Left */}
        <div style={{ backgroundColor: '#FAFAFA' }}>
          <img 
            src="/images/joao-wix.jpg" 
            alt="João Felipe Bernacchio" 
            className="w-full h-full object-cover"
            style={{ height: '448px' }}
          />
        </div>
        
        {/* Content Right - Beige background */}
        <div style={{ backgroundColor: '#E8E4D9' }} className="flex items-center px-12 py-8">
          <div style={{ maxWidth: '653px' }}>
            <h1 style={{ 
              fontFamily: 'Inter', 
              fontWeight: 700, 
              fontSize: '30px', 
              lineHeight: '30px',
              color: '#6A7567',
              marginBottom: '8px'
            }}>
              João Felipe Bernacchio
            </h1>
            
            <h2 style={{ 
              fontFamily: 'Inter', 
              fontWeight: 400, 
              fontSize: '16px', 
              lineHeight: '19px',
              color: '#6A7567',
              letterSpacing: '-0.8px',
              marginBottom: '32px'
            }}>
              CRP 06/100930
            </h2>
            
            <div style={{ 
              fontFamily: 'Inter', 
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: '19px',
              lineHeight: '24px',
              color: '#6A7567',
              letterSpacing: '-1px'
            }}>
              <p>Co-criador do Espaço Mindware, e responsável pela atuação com adultos no Espaço. Com quase 10 anos de experiência clínica, atua nas abordagens Cognitiva Comportamental e Junguiana, com um projeto que propõe um desenvolvimento individual dos processos internos do paciente.</p>
              <p style={{ marginTop: '26px' }}>Em seu projeto terapêutico, propõe a construção de processos internos que levem ao bem-estar nas diversas áreas da vida. A psicoterapia é um importante instrumento que viabiliza a construção dos processos de autorrealização e individuação.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Section - João */}
      <section style={{ backgroundColor: '#D1CBBA', padding: '60px 0' }}>
        <div className="container mx-auto px-12" style={{ maxWidth: '1200px' }}>
          <h2 style={{ 
            fontFamily: 'Inter', 
            fontWeight: 700, 
            fontSize: '30px', 
            lineHeight: '30px',
            color: '#6A7567',
            marginBottom: '32px'
          }}>
            João Felipe Bernacchio
          </h2>
          
          <h3 style={{ 
            fontFamily: 'Inter', 
            fontWeight: 700, 
            fontSize: '24px', 
            lineHeight: '29px',
            color: '#6A7567',
            marginBottom: '24px'
          }}>
            Currículo
          </h3>
          
          <div style={{ 
            fontFamily: 'Inter', 
            fontWeight: 700,
            fontSize: '17px',
            lineHeight: '26px',
            color: '#6A7567'
          }}>
            <p style={{ marginBottom: '16px' }}>• Formado em Psicologia pelo Centro Universitário São Camilo.</p>
            <p style={{ marginBottom: '16px' }}>• Especialista em Psicologia Clínica pela Universidade Paulista (Unip).</p>
            <p style={{ marginBottom: '16px' }}>• Formação em Psicologia Junguiana pelo Instituto Junguiano de São Paulo (IJUSP).</p>
            <p style={{ marginBottom: '16px' }}>• Formação em Terapia Cognitiva Comportamental pelo Instituto de Terapia Cognitiva (ITC).</p>
            <p style={{ marginBottom: '16px' }}>• Ampla experiência em atendimento psicológico de jovens e adultos na abordagem cognitiva comportamental e junguiana.</p>
            <p style={{ marginBottom: '16px' }}>• Psicólogo responsável pela Orientação Vocacional e Profissional do COGEAE da PUC-SP</p>
          </div>
        </div>
      </section>

      {/* CTA Section with WhatsApp */}
      <section style={{ backgroundColor: '#FAFAFA', padding: '80px 0', textAlign: 'center' }}>
        <div className="container mx-auto px-6">
          <Button
            asChild
            style={{
              backgroundColor: 'white',
              color: '#6A7567',
              padding: '16px 48px',
              fontSize: '16px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              minWidth: '200px',
              cursor: 'pointer'
            }}
          >
            <a 
              href="https://api.whatsapp.com/send?phone=5511988802007" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Agendar Consulta
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SobreNos;
