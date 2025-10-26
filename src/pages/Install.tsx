import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Download, Share, MoreVertical, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>App Instalado!</CardTitle>
            <CardDescription>
              O Mindware Clinic está instalado no seu dispositivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Abrir Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-primary flex items-center justify-center">
            <Smartphone className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Instalar App</h1>
          <p className="text-muted-foreground">
            Use o Mindware Clinic como um app no seu celular
          </p>
        </div>

        {/* Android/Desktop Install */}
        {!isIOS && deferredPrompt && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Instalação Rápida</CardTitle>
              <CardDescription>
                Clique no botão abaixo para instalar o app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleInstallClick} className="w-full" size="lg">
                <Download className="mr-2 h-5 w-5" />
                Instalar App
              </Button>
            </CardContent>
          </Card>
        )}

        {/* iOS Instructions */}
        {isIOS && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Instruções para iPhone</CardTitle>
              <CardDescription>
                Siga os passos abaixo para instalar o app na tela inicial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Toque no botão Compartilhar</p>
                  <p className="text-sm text-muted-foreground">
                    Procure o ícone <Share className="inline w-4 h-4" /> na parte inferior da tela do Safari
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Adicionar à Tela Inicial</p>
                  <p className="text-sm text-muted-foreground">
                    Role para baixo e toque em "Adicionar à Tela Inicial"
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Confirmar</p>
                  <p className="text-sm text-muted-foreground">
                    Toque em "Adicionar" no canto superior direito
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Nota:</strong> Esta funcionalidade está disponível apenas no Safari. 
                  Se você estiver usando outro navegador, abra esta página no Safari.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Android Manual Instructions */}
        {!isIOS && !deferredPrompt && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Instruções para Android</CardTitle>
              <CardDescription>
                Se o botão de instalação não aparecer, siga estes passos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Abra o Menu</p>
                  <p className="text-sm text-muted-foreground">
                    Toque no ícone <MoreVertical className="inline w-4 h-4" /> no canto superior direito do navegador
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Instalar App</p>
                  <p className="text-sm text-muted-foreground">
                    Procure por "Instalar app" ou "Adicionar à tela inicial"
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Confirmar</p>
                  <p className="text-sm text-muted-foreground">
                    Toque em "Instalar" para adicionar à tela inicial
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Benefícios do App</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Acesso rápido direto da tela inicial</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Funciona mesmo sem internet (modo offline)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Experiência completa em tela cheia</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Carregamento mais rápido</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Pular e usar no navegador
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
