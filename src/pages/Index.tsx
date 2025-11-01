import { Button } from "@/components/ui/button";
import { Instagram, Youtube, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import mindwareLogo from "@/assets/mindware-logo.png";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Fixed Header - exactly as CSS specifies */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b" style={{ borderColor: '#E8E4D9' }}>
        <div className="flex items-center justify-between px-6" style={{ height: '80px', maxWidth: '1920px', margin: '0 auto' }}>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={mindwareLogo} alt="Espaço Mindware" style={{ height: '48px' }} />
            <div className="flex flex-col">
              <span style={{ fontSize: '18px', fontWeight: 600, color: '#6A7567', lineHeight: '1.2' }}>ESPAÇO</span>
              <span style={{ fontSize: '18px', fontWeight: 600, color: '#6A7567', lineHeight: '1.2' }}>MINDWARE</span>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <a href="#inicio" style={{ fontSize: '14px', fontWeight: 500, color: '#6A7567' }} className="hover:opacity-80 transition-opacity">INÍCIO</a>
            <div className="relative group">
              <button style={{ fontSize: '14px', fontWeight: 500, color: '#6A7567' }} className="hover:opacity-80 transition-opacity">
                SERVIÇOS
              </button>
              <div className="absolute left-0 mt-2 w-72 bg-white shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <a href="/servicos/terapia-cognitiva-comportamental" className="block px-4 py-3 text-sm hover:bg-gray-50 transition-colors" style={{ color: '#6A7567' }}>
                  Terapia Cognitivo-Comportamental
                </a>
                <a href="/servicos/terapia-junguiana" className="block px-4 py-3 text-sm hover:bg-gray-50 transition-colors" style={{ color: '#6A7567' }}>
                  Terapia Junguiana
                </a>
                <a href="/servicos/terapia-infantil" className="block px-4 py-3 text-sm hover:bg-gray-50 transition-colors" style={{ color: '#6A7567' }}>
                  Terapia Infantil
                </a>
              </div>
            </div>
            <a href="#sobre" style={{ fontSize: '14px', fontWeight: 500, color: '#6A7567' }} className="hover:opacity-80 transition-opacity">SOBRE NÓS</a>
            <a href="#curso" style={{ fontSize: '14px', fontWeight: 500, color: '#6A7567' }} className="hover:opacity-80 transition-opacity">CURSO DE MÃES</a>
            <a href="#contato" style={{ fontSize: '14px', fontWeight: 500, color: '#6A7567' }} className="hover:opacity-80 transition-opacity">CONTATO</a>
          </nav>
          
          {/* Social Icons */}
          <div className="flex items-center gap-3">
            <a href="https://wa.me/5511988802007" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <Phone style={{ width: '20px', height: '20px', color: '#6A7567' }} />
            </a>
            <a href="https://instagram.com/espacomindware" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <Instagram style={{ width: '20px', height: '20px', color: '#6A7567' }} />
            </a>
            <a href="https://youtube.com/@espacomindware" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <Youtube style={{ width: '20px', height: '20px', color: '#6A7567' }} />
            </a>
            <Button variant="ghost" size="sm" asChild className="ml-2">
              <Link to="/login" style={{ color: '#6A7567', fontSize: '14px' }}>Acesso</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - 1920x915px as per CSS */}
      <section id="inicio" className="relative" style={{ height: '915px', marginTop: '80px' }}>
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(/images/hero-wix.jpg)`,
            width: '100%',
            height: '915px'
          }}
        />
      </section>

      {/* Location Section - height 314px, background #E8E4D9 */}
      <section style={{ backgroundColor: '#E8E4D9', paddingTop: '40px', paddingBottom: '40px' }}>
        <div className="container mx-auto px-6 text-center" style={{ maxWidth: '1920px' }}>
          <div style={{ maxWidth: '878px', margin: '0 auto', paddingTop: '42px' }}>
            {/* First paragraph - font-size 23.4px as per CSS line 159 */}
            <p style={{ 
              fontFamily: 'Inter', 
              fontSize: '23.4px', 
              lineHeight: '25px',
              color: '#6A7567',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Localizados no coração Zona Oeste de São Paulo, no bairro da Pompéia, nossos psicólogos contam com um Espaço acolhedor, confortável e com toda privacidade que nossa atuação requer.
            </p>
            
            {/* Second paragraph - font-size 24.4px as per CSS line 182 */}
            <p style={{ 
              fontFamily: 'Inter', 
              fontSize: '24.4px', 
              lineHeight: '25px',
              color: '#6A7567',
              textAlign: 'center'
            }}>
              Conheça nosso Espaço, nossa equipe de psicólogos e nosso trabalho!
            </p>
          </div>
        </div>
      </section>

      {/* Banner with Plants - height 400px exactly */}
      <section 
        className="relative flex items-center justify-center"
        style={{ 
          backgroundImage: `url(/images/plants-wix.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '400px',
          width: '100%'
        }}
      >
        <div className="text-center px-6">
          {/* Title - font-size 39.2px as per CSS line 265 */}
          <h2 style={{ 
            fontFamily: 'Inter',
            fontSize: '39.2px',
            lineHeight: '40px',
            color: '#6A7567',
            fontWeight: 400,
            marginBottom: '20px'
          }}>
            Psicologia Clínica e Psicologia Educacional
          </h2>
          
          {/* Decorative dot - 15x15px as per CSS line 278 */}
          <div style={{ 
            width: '15px', 
            height: '15px', 
            margin: '0 auto 20px',
            backgroundColor: '#6A7567',
            borderRadius: '50%'
          }} />
          
          {/* Subtitle - font-size 27.9px as per CSS line 318 */}
          <p style={{ 
            fontFamily: 'Inter',
            fontSize: '27.9px',
            lineHeight: '30px',
            color: '#6A7567',
            fontWeight: 400
          }}>
            Cultivando consciência, bem estar, saúde e autoconhecimento.
          </p>
        </div>
      </section>

      {/* Course Section - Split 50/50, height 501px as per CSS */}
      <section id="curso" className="grid grid-cols-2" style={{ height: '501px' }}>
        {/* Left side - Image */}
        <div 
          style={{ 
            backgroundImage: `url(/images/mothers-wix.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: '960px',
            height: '501px'
          }}
        />
        
        {/* Right side - Content with exact positioning */}
        <div style={{ backgroundColor: '#E8E4D9', height: '501px', position: 'relative' }}>
          <div className="flex flex-col items-start" style={{ paddingLeft: '235px', paddingTop: '46px' }}>
            {/* Title part 1 - font-size 57px, letter-spacing -4.987px as per CSS line 534 */}
            <h3 style={{ 
              fontFamily: 'Inter',
              fontSize: '57px',
              lineHeight: '57px',
              letterSpacing: '-4.987px',
              color: '#7F8D7C',
              fontWeight: 400,
              marginBottom: '0'
            }}>
              CURSO DE MÃES,
            </h3>
            
            {/* Title part 2 */}
            <h3 style={{ 
              fontFamily: 'Inter',
              fontSize: '57px',
              lineHeight: '57px',
              letterSpacing: '-4.987px',
              color: '#7F8D7C',
              fontWeight: 400
            }}>
              PAIS E CUIDADORES
            </h3>
          </div>
          
          {/* WhatsApp button - positioned exactly as CSS specifies */}
          <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, 23.5px)' }}>
            <a 
              href="https://chat.whatsapp.com/DkUrLuuixmk1cfvkzW9k2A" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center"
              style={{ width: '120px', height: '120px' }}
            >
              {/* WhatsApp icon - color #0DC143 as per CSS line 595 */}
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="60" fill="#0DC143"/>
                <path d="M60 30C43.5 30 30 43.5 30 60C30 65.5 31.5 70.5 34 75L30 90L45.5 86C50 88.5 55 90 60 90C76.5 90 90 76.5 90 60C90 43.5 76.5 30 60 30Z" fill="white"/>
              </svg>
            </a>
          </div>
          
          {/* Link text - font-size 56.9px as per CSS line 620 */}
          <p className="text-center absolute" style={{ 
            fontFamily: 'Inter',
            fontSize: '56.9px',
            lineHeight: '57px',
            letterSpacing: '-4.987px',
            color: '#7F8D7C',
            fontWeight: 400,
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '113px',
            width: '423.81px'
          }}>
            Participe do grupo!
          </p>
        </div>
      </section>

      {/* Adult Services Section - Background #E8E4D9, height 788px */}
      <section id="servicos" style={{ backgroundColor: '#E8E4D9', height: '788px', position: 'relative', paddingTop: '124px' }}>
        <div className="container mx-auto" style={{ maxWidth: '1920px' }}>
          {/* "PARA ADULTOS" title - positioned exactly */}
          <h3 style={{ 
            position: 'absolute',
            left: '505px',
            top: '124px',
            fontFamily: 'Inter',
            fontSize: '40px',
            lineHeight: '40px',
            color: '#6A7567',
            fontWeight: 400
          }}>
            PARA ADULTOS
          </h3>
          
          {/* 3 Cards - each 323px wide, positioned as per CSS */}
          <div style={{ 
            position: 'absolute',
            left: '467.5px',
            right: '467.5px',
            top: '223.5px',
            display: 'flex',
            gap: '5px'
          }}>
            {/* Card 1 - Cognitiva */}
            <div style={{ 
              width: '323px', 
              height: '467.13px',
              backgroundColor: '#D1CDC1',
              padding: '38px 22px',
              textAlign: 'center'
            }}>
              <h4 style={{ 
                fontFamily: 'Inter',
                fontSize: '25.9px',
                lineHeight: '26px',
                letterSpacing: '1.3px',
                color: '#6A7567',
                fontWeight: 400,
                marginBottom: '8px'
              }}>
                Terapia Cognitiva
              </h4>
              <h4 style={{ 
                fontFamily: 'Inter',
                fontSize: '26px',
                lineHeight: '26px',
                letterSpacing: '1.3px',
                color: '#6A7567',
                fontWeight: 400,
                marginBottom: '27px'
              }}>
                e Comportamental
              </h4>
              <p style={{ 
                fontFamily: 'Inter',
                fontSize: '15.1px',
                lineHeight: '18px',
                color: '#6A7567',
                fontWeight: 400
              }}>
                É uma abordagem da psicologia clínica que procura promover um espaço terapêutico voltado à reflexão e reconstrução dos pensamentos, emoções e comportamentos do paciente. Nossos pensamentos, e os significados que damos às nossas experiências, é o que nos leva a vivenciar as nossas emoções e comportamentos, que serão explorados ao longo das sessões pelo paciente e psicólogo.
              </p>
            </div>
            
            {/* Card 2 - Junguiana */}
            <div style={{ 
              width: '323px', 
              height: '467.13px',
              backgroundColor: '#D1CDC1',
              padding: '38px 22px',
              textAlign: 'center'
            }}>
              <h4 style={{ 
                fontFamily: 'Inter',
                fontSize: '25.6px',
                lineHeight: '26px',
                letterSpacing: '1.3px',
                color: '#6A7567',
                fontWeight: 400,
                marginBottom: '8px'
              }}>
                Terapia
              </h4>
              <h4 style={{ 
                fontFamily: 'Inter',
                fontSize: '25.8px',
                lineHeight: '26px',
                letterSpacing: '1.3px',
                color: '#6A7567',
                fontWeight: 400,
                marginBottom: '27px'
              }}>
                Junguiana
              </h4>
              <p style={{ 
                fontFamily: 'Inter',
                fontSize: '15.1px',
                lineHeight: '18px',
                color: '#6A7567',
                fontWeight: 400
              }}>
                Abordagem da psicologia clínica na qual os símbolos presentes na vida do paciente são a chave para a compreensão do sentido de suas escolhas. Este é um espaço terapêutico de vínculo entre o paciente e o psicólogo, para que as pessoas possam pensar sobre a própria vida. O espaço de escuta e acolhimento pretende oferecer reflexão, sensibilização e consciência a respeito de si e do mundo à sua volta.
              </p>
            </div>
            
            {/* Card 3 - Online */}
            <div style={{ 
              width: '323px', 
              height: '465.13px',
              backgroundColor: '#D1CDC1',
              padding: '38px 21px',
              textAlign: 'center'
            }}>
              <h4 style={{ 
                fontFamily: 'Inter',
                fontSize: '25.6px',
                lineHeight: '26px',
                letterSpacing: '1.3px',
                color: '#6A7567',
                fontWeight: 400,
                marginBottom: '8px'
              }}>
                Terapia
              </h4>
              <h4 style={{ 
                fontFamily: 'Inter',
                fontSize: '26px',
                lineHeight: '26px',
                letterSpacing: '1.3px',
                color: '#6A7567',
                fontWeight: 400,
                marginBottom: '26px'
              }}>
                Online
              </h4>
              <p style={{ 
                fontFamily: 'Inter',
                fontSize: '15.1px',
                lineHeight: '18px',
                color: '#6A7567',
                fontWeight: 400
              }}>
                O Espaço Mindware agora oferece a possibilidade da terapia online. Não importando a abordagem escolhida, A experiência terapêutica é a mesma de quando realizada presencialmente, mas com você no conforto da sua casa. Basta escolher uma abordagem, entrar em contato conosco por um de nossos canais de comunicação e agendar um horário para sua terapia virtual!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Children Section - Background #7F8D7C as per CSS line 2070 */}
      <section 
        className="relative flex items-center justify-center"
        style={{ 
          backgroundImage: `url(/images/toys-wix.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '534px'
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />
        
        {/* Card - width 980px, height 244px, background #7F8D7C as per CSS */}
        <div className="relative z-10" style={{ 
          width: '980px',
          backgroundColor: '#7F8D7C',
          padding: '21px 29px',
          textAlign: 'center'
        }}>
          {/* Title - font-size 26px, color #E8E4D9 as per CSS line 2084 */}
          <h3 style={{ 
            fontFamily: 'Inter',
            fontSize: '26px',
            lineHeight: '31px',
            letterSpacing: '1.3px',
            color: '#E8E4D9',
            fontWeight: 400,
            marginBottom: '16px'
          }}>
            Terapia Infantil
          </h3>
          
          {/* Description - color #F6EBE4 as per CSS line 2123 */}
          <p style={{ 
            fontFamily: 'Inter',
            fontSize: '14.9px',
            lineHeight: '18px',
            color: '#F6EBE4',
            fontWeight: 400,
            maxWidth: '922px',
            margin: '0 auto'
          }}>
            A clínica psicológica infantil é um espaço para a criança e a família. Este processo procura oferecer aos cuidadores ferramentas e condições para entender as demandas a criança. O objetivo da terapia é transformar as dinâmicas da criança e da família, visando um desenvolvimento e uma relação familiar mais saudável e bem adaptada. Os focos de trabalho do psicólogo são as habilidades sociais e emocionais da criança, os ambientes em que vive e orientação parental.
          </p>
        </div>
      </section>

      {/* CTA Section - Background #FAFAFA, height 400px */}
      <section 
        className="relative flex items-center justify-center"
        style={{ 
          backgroundImage: `url(/images/desk-wix.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '400px',
          backgroundColor: '#FAFAFA'
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} />
        
        {/* CTA Button - font-size 50px, color #E8E4D9 as per CSS line 2343 */}
        <a 
          href="https://wa.me/5511988802007"
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 hover:opacity-90 transition-opacity"
          style={{ 
            fontFamily: 'Inter',
            fontSize: '50px',
            lineHeight: '50px',
            color: '#E8E4D9',
            fontWeight: 400,
            textDecoration: 'none',
            cursor: 'pointer'
          }}
        >
          FALE CONOSCO
        </a>
      </section>

      {/* Team Section - height 778px, concrete background with opacity 0.25 */}
      <section 
        id="sobre"
        className="relative"
        style={{ height: '778px' }}
      >
        {/* Background with concrete image at 25% opacity as per CSS line 2395 */}
        <div 
          className="absolute inset-0"
          style={{ 
            backgroundImage: `url(/images/concrete-wix.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.25
          }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: '#FAFAFA' }} />
        
        <div className="relative z-10" style={{ maxWidth: '1920px', margin: '0 auto', height: '100%' }}>
          {/* Title - positioned at top 52px, left 504px as per CSS line 2435 */}
          <h3 style={{ 
            position: 'absolute',
            left: '504px',
            top: '52px',
            fontFamily: 'Inter',
            fontSize: '40px',
            lineHeight: '40px',
            color: '#6A7567',
            fontWeight: 400
          }}>
            QUEM SOMOS
          </h3>
          
          {/* Cards container */}
          <div style={{ position: 'relative', height: '100%' }}>
            {/* Larissa Card - left 541px, top 164px, width 390px as per CSS line 2457 */}
            <div 
              className="absolute"
              style={{ 
                left: '541px',
                top: '164px',
                width: '390px',
                height: '558px'
              }}
            >
              {/* Image - 372x464px */}
              <img 
                src="/images/larissa-wix.jpg"
                alt="Larissa Schwarcz Zein"
                style={{ 
                  width: '372px',
                  height: '464px',
                  objectFit: 'cover',
                  margin: '9px'
                }}
              />
              
              {/* Overlay info - background #7F8D7C as per CSS line 2562 */}
              <div style={{ 
                position: 'absolute',
                bottom: '81px',
                left: '9px',
                right: '9px',
                backgroundColor: '#7F8D7C',
                padding: '20px 27px'
              }}>
                {/* Name - font-size 23px, color white as per CSS line 2576 */}
                <h4 style={{ 
                  fontFamily: 'Inter',
                  fontSize: '23px',
                  lineHeight: '28px',
                  color: '#FFFFFF',
                  fontWeight: 400,
                  marginBottom: '4px'
                }}>
                  Larissa Schwarcz Zein
                </h4>
                
                {/* Title - font-size 14.1px as per CSS line 2596 */}
                <p style={{ 
                  fontFamily: 'Inter',
                  fontSize: '14.1px',
                  lineHeight: '17px',
                  color: '#FFFFFF',
                  fontWeight: 400,
                  marginBottom: '20px'
                }}>
                  Psicóloga<br/>CRP 06/124230
                </p>
                
                {/* Description - font-size 11.4px as per CSS line 2616 */}
                <p style={{ 
                  fontFamily: 'Inter',
                  fontSize: '11.4px',
                  lineHeight: '17px',
                  color: '#FFFFFF',
                  fontWeight: 400
                }}>
                  Psicologia clínica na abordagem Cognitiva e Comportamental (infantil e adulto)
                </p>
              </div>
            </div>
            
            {/* João Card - left 993px, top 164px, width 390px as per CSS line 2698 */}
            <div 
              className="absolute"
              style={{ 
                left: '993px',
                top: '164px',
                width: '390px',
                height: '576px'
              }}
            >
              {/* Image - 372x464px */}
              <img 
                src="/images/joao-wix.jpg"
                alt="João Felipe Bernacchio"
                style={{ 
                  width: '372px',
                  height: '464px',
                  objectFit: 'cover',
                  margin: '8px 10px 14px 8px'
                }}
              />
              
              {/* Overlay info - background #7F8D7C */}
              <div style={{ 
                position: 'absolute',
                bottom: '98px',
                left: '8px',
                right: '10px',
                backgroundColor: '#7F8D7C',
                padding: '20px 27px'
              }}>
                {/* Name - font-size 23px */}
                <h4 style={{ 
                  fontFamily: 'Inter',
                  fontSize: '23px',
                  lineHeight: '28px',
                  color: '#FFFFFF',
                  fontWeight: 400,
                  marginBottom: '4px'
                }}>
                  João Felipe Bernacchio
                </h4>
                
                {/* Title */}
                <p style={{ 
                  fontFamily: 'Inter',
                  fontSize: '14.1px',
                  lineHeight: '17px',
                  color: '#FFFFFF',
                  fontWeight: 400,
                  marginBottom: '20px'
                }}>
                  Psicólogo<br/>CRP 06/124232
                </p>
                
                {/* Description - font-size 11.6px as per CSS line 2857 */}
                <p style={{ 
                  fontFamily: 'Inter',
                  fontSize: '11.6px',
                  lineHeight: '17px',
                  color: '#FFFFFF',
                  fontWeight: 400
                }}>
                  Psicólogo clínico na abordagem da psicologia analítica junguiana.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rental Section - height 427px, background #FAFAFA as per CSS line 4899 */}
      <section style={{ backgroundColor: '#FAFAFA', height: '427px', position: 'relative' }}>
        {/* Main title - font-size 50px as per CSS line 4952 */}
        <h3 className="text-center" style={{ 
          fontFamily: 'Inter',
          fontSize: '50px',
          lineHeight: '50px',
          color: '#6A7567',
          fontWeight: 400,
          paddingTop: '70px'
        }}>
          SALAS PARA ALUGUEL MENSAL
        </h3>
        
        {/* Subtitle - font-size 30px as per CSS line 4975 */}
        <p className="text-center" style={{ 
          fontFamily: 'Inter',
          fontSize: '30px',
          lineHeight: '30px',
          color: '#6A7567',
          fontWeight: 400,
          marginTop: '12px'
        }}>
          PARA PROFISSIONAIS DA SAÚDE
        </p>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
