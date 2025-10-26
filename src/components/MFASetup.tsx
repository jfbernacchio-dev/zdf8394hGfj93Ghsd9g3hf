import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Shield, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MFASetupProps {
  userEmail: string;
  onSuccess?: () => void;
}

export function MFASetup({ userEmail, onSuccess }: MFASetupProps) {
  const { toast } = useToast();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  const enrollMFA = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Email MFA para ${userEmail}`
      });

      if (error) throw error;

      if (data) {
        setFactorId(data.id);
        setShowVerification(true);
        
        toast({
          title: 'MFA Iniciado',
          description: 'Verifique seu email para o código de verificação.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao configurar MFA',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const verifyMFA = async () => {
    if (!factorId) return;

    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode
      });

      if (error) throw error;

      toast({
        title: 'MFA Ativado!',
        description: 'Autenticação de dois fatores configurada com sucesso.',
      });

      onSuccess?.();
      setShowVerification(false);
    } catch (error: any) {
      toast({
        title: 'Código inválido',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (showVerification) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold">Verificar MFA</h3>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Digite o código de verificação enviado para {userEmail}
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="mfa-code">Código de Verificação</Label>
            <Input
              id="mfa-code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={verifyMFA} className="flex-1">
              Verificar e Ativar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowVerification(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-6 h-6 text-primary" />
        <h3 className="text-lg font-semibold">Autenticação de Dois Fatores</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Adicione uma camada extra de segurança à sua conta. Será necessário um código 
        enviado por email para fazer login.
      </p>

      <Button 
        onClick={enrollMFA} 
        disabled={isEnrolling}
        className="w-full"
      >
        <Mail className="w-4 h-4 mr-2" />
        {isEnrolling ? 'Configurando...' : 'Ativar MFA via Email'}
      </Button>
    </Card>
  );
}
