import { MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#7F8D7C] text-white py-16 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Contato */}
          <div>
            <h3 className="text-xl font-semibold mb-6">CONTATO</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <p>Rua Ribeiro de Barros, 310</p>
                  <p>Pompéia, São Paulo/SP</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <p>11.98880.2007</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <p>11.3871.2894</p>
              </div>
            </div>
          </div>

          {/* Navegação */}
          <div>
            <h3 className="text-xl font-semibold mb-6">NAVEGAÇÃO</h3>
            <nav className="space-y-2">
              <Link to="/" className="block hover:underline">Início</Link>
              <Link to="/servicos/terapia-cognitiva-comportamental" className="block hover:underline">Terapia Cognitiva</Link>
              <Link to="/servicos/terapia-junguiana" className="block hover:underline">Terapia Junguiana</Link>
              <Link to="/terapia-online" className="block hover:underline">Terapia Online</Link>
              <Link to="/servicos/terapia-infantil" className="block hover:underline">Psicoterapia Infantil</Link>
              <Link to="/apoio-escolar" className="block hover:underline">Apoio Escolar</Link>
              <Link to="/sobre-nos" className="block hover:underline">Sobre Nós</Link>
              <Link to="/o-espaco" className="block hover:underline">O Espaço</Link>
              <Link to="/curso-de-maes" className="block hover:underline">Curso de Mães</Link>
            </nav>
          </div>

          {/* Local */}
          <div>
            <h3 className="text-xl font-semibold mb-6">LOCAL</h3>
            <div className="w-full h-48 bg-gray-300 rounded-lg overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.0897285863846!2d-46.69168!3d-23.5631!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce57f3b4f4d3f7%3A0x3a3e3e3e3e3e3e3e!2sRua%20Ribeiro%20de%20Barros%2C%20310%20-%20Pompeia%2C%20S%C3%A3o%20Paulo%20-%20SP!5e0!3m2!1spt-BR!2sbr!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização Espaço Mindware"
              />
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-white/20 text-center text-sm">
          <p>© Espaço Mindware 2025 Criado com Lovable | Todos os direitos reservados</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
