import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email('Email inválido'),
});

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = emailSchema.safeParse({ email });
    
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (!error) {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[var(--gradient-soft)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 shadow-[var(--shadow-card)]">
          <h1 className="text-3xl font-bold text-center mb-2 text-foreground">Email Enviado!</h1>
          <p className="text-center text-muted-foreground mb-6">
            Verifique sua caixa de entrada para redefinir sua senha.
          </p>
          <Link to="/login">
            <Button className="w-full">
              Voltar para Login
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-[var(--shadow-card)]">
        <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Link>
        
        <h1 className="text-3xl font-bold text-center mb-2 text-foreground">Recuperar Senha</h1>
        <p className="text-center text-muted-foreground mb-6">
          Digite seu email para receber as instruções
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Email'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ForgotPassword;
