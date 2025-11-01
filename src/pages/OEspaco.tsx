import Footer from "@/components/Footer";
import PublicHeader from "@/components/PublicHeader";
import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useEffect } from "react";

const OEspaco = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const carouselImages = [
    "/images/espaco-1.jpg",
    "/images/espaco-2.jpg",
    "/images/espaco-3.jpg",
    "/images/espaco-4.jpg",
    "/images/espaco-5.jpg",
    "/images/espaco-6.jpg",
    "/images/espaco-7.jpg",
    "/images/espaco-8.jpg",
    "/images/espaco-9.jpg",
    "/images/espaco-10.jpg",
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      
      {/* Top Section - Beige background with title and description */}
      <section style={{ backgroundColor: '#E8E4D9', padding: '60px 0', minHeight: '462px' }}>
        <div className="container mx-auto px-12" style={{ maxWidth: '1920px' }}>
          <div className="max-w-[980px] mx-auto text-center">
            <h1 style={{ 
              fontFamily: 'Inter', 
              fontWeight: 700, 
              fontSize: '30px', 
              lineHeight: '30px',
              color: '#6A7567',
              marginBottom: '50px',
              marginTop: '11px'
            }}>
              NOSSO ESPAÇO
            </h1>
            
            <div style={{ 
              fontFamily: 'Inter', 
              fontWeight: 400,
              color: '#6A7567',
              letterSpacing: '-1.5px'
            }}>
              <p style={{ 
                fontSize: '30px', 
                lineHeight: '36px',
                marginBottom: '3px'
              }}>
                O Espaço Mindware foi construído pensando primeiramente no conforto e
              </p>
              <p style={{ 
                fontSize: '27.9px', 
                lineHeight: '36px',
                marginBottom: '78px'
              }}>
                privacidade, como demandam nossos serviços.
              </p>
              <p style={{ 
                fontSize: '29.4px', 
                lineHeight: '36px',
                marginBottom: '3px'
              }}>
                Criamos nosso ambiente pensando em proporcionar o máximo de bem estar e
              </p>
              <p style={{ 
                fontSize: '27.8px', 
                lineHeight: '36px'
              }}>
                comodidade para pessoas de todas as faixas etárias.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Carousel Section - Green background */}
      <section style={{ backgroundColor: '#7F8D7C', padding: '0', minHeight: '519px' }}>
        <div className="w-full" style={{ maxWidth: '100vw', overflow: 'hidden' }}>
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {carouselImages.map((image, index) => (
                <CarouselItem key={index} className="pl-0">
                  <div className="relative" style={{ height: '384px', width: '100vw' }}>
                    <img
                      src={image}
                      alt={`Espaço Mindware - Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                      style={{ height: '384px' }}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </div>

        {/* Thumbnails Section */}
        <div className="w-full py-4 px-4" style={{ backgroundColor: '#7F8D7C' }}>
          <div className="flex gap-4 overflow-x-auto justify-center items-center" style={{ scrollbarWidth: 'thin' }}>
            {carouselImages.map((image, index) => (
              <div
                key={index}
                onClick={() => api?.scrollTo(index)}
                className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  width: '120px',
                  height: '120px',
                  border: current === index ? '5px solid white' : '5px solid rgba(255, 255, 255, 0.6)',
                  backgroundColor: 'white',
                  opacity: current === index ? 1 : 0.6
                }}
              >
                <img
                  src={image}
                  alt={`Miniatura ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with WhatsApp - background image */}
      <section 
        style={{ 
          backgroundImage: 'url(/images/books-background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '60px 0 80px',
          minHeight: '255px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div className="container mx-auto px-6 text-center">
          <a 
            href="https://api.whatsapp.com/send?phone=5511988802007" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3"
            style={{
              fontFamily: 'Inter',
              fontWeight: 400,
              fontSize: '30px',
              lineHeight: '30px',
              color: '#6A7567',
              textDecoration: 'none'
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="#6A7567"/>
              <path d="M28.944 18.764c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" fill="white"/>
            </svg>
            CONHEÇA NOSSO ESPAÇO
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OEspaco;
