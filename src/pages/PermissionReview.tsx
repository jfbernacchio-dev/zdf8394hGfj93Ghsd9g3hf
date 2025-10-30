import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Shield, CheckCircle, Users } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  cpf: string;
}

interface PermissionReview {
  id: string;
  review_date: string;
  users_reviewed: number;
  roles_modified: number;
  findings: string | null;
  actions_taken: string | null;
  next_review_date: string;
  created_at: string;
}

export default function PermissionReview() {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [userRoles, setUserRoles] = useState<(UserRole & { profile?: Profile })[]>([]);
  const [reviews, setReviews] = useState<PermissionReview[]>([]);
  const [findings, setFindings] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [rolesModified, setRolesModified] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Acesso negado');
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  const loadData = async () => {
    setLoading(true);

    // Load all user roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });

    // Load profiles for each role
    if (rolesData) {
      const profilesPromises = rolesData.map(async (role) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, cpf')
          .eq('id', role.user_id)
          .single();
        return { ...role, profile };
      });
      const rolesWithProfiles = await Promise.all(profilesPromises);
      setUserRoles(rolesWithProfiles);
    }

    // Load previous reviews
    const { data: reviewsData } = await supabase
      .from('permission_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    setReviews(reviewsData || []);
    setLoading(false);
  };

  const handleSubmitReview = async () => {
    if (!user) return;
    setSubmitting(true);

    const reviewDate = new Date();
    const nextReviewDate = addMonths(reviewDate, 3);

    const { error } = await supabase
      .from('permission_reviews')
      .insert([{
        reviewed_by: user.id,
        review_date: reviewDate.toISOString().split('T')[0],
        users_reviewed: userRoles.length,
        roles_modified: rolesModified,
        findings,
        actions_taken: actionsTaken,
        next_review_date: nextReviewDate.toISOString().split('T')[0],
      }]);

    if (error) {
      toast.error('Erro ao salvar revisão');
      setSubmitting(false);
      return;
    }

    toast.success('Revisão registrada com sucesso');
    setFindings('');
    setActionsTaken('');
    setRolesModified(0);
    loadData();
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  const nextReviewDate = reviews.length > 0 
    ? new Date(reviews[0].next_review_date)
    : addMonths(new Date(), 3);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Revisão de Permissões</h1>
          <p className="text-muted-foreground">Análise trimestral de roles e permissões do sistema</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userRoles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Revisão</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(nextReviewDate, 'dd/MM/yyyy')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revisões Realizadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Review */}
      <Card>
        <CardHeader>
          <CardTitle>Nova Revisão Trimestral</CardTitle>
          <CardDescription>
            Revise as permissões de {userRoles.length} usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Número de Roles Modificados
            </label>
            <input
              type="number"
              min="0"
              value={rolesModified}
              onChange={(e) => setRolesModified(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Achados / Observações
            </label>
            <Textarea
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Descreva quaisquer achados ou observações relevantes..."
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Ações Tomadas
            </label>
            <Textarea
              value={actionsTaken}
              onChange={(e) => setActionsTaken(e.target.value)}
              placeholder="Descreva as ações tomadas (remoções, adições, alterações)..."
              rows={4}
            />
          </div>

          <Button onClick={handleSubmitReview} disabled={submitting}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Registrar Revisão
          </Button>
        </CardContent>
      </Card>

      {/* Current Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Permissões Atuais</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles.map((userRole) => (
                <TableRow key={userRole.id}>
                  <TableCell className="font-medium">
                    {userRole.profile?.full_name || 'N/A'}
                  </TableCell>
                  <TableCell>{userRole.profile?.cpf || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge>{userRole.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(userRole.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Previous Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Revisões Anteriores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma revisão anterior registrada
              </p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">
                        Revisão de {format(new Date(review.review_date), 'dd/MM/yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {review.users_reviewed} usuários revisados • {review.roles_modified} modificações
                      </p>
                    </div>
                    <Badge variant="secondary">
                      Próxima: {format(new Date(review.next_review_date), 'dd/MM/yyyy')}
                    </Badge>
                  </div>
                  {review.findings && (
                    <div className="mt-3">
                      <p className="text-sm font-medium">Achados:</p>
                      <p className="text-sm text-muted-foreground">{review.findings}</p>
                    </div>
                  )}
                  {review.actions_taken && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Ações Tomadas:</p>
                      <p className="text-sm text-muted-foreground">{review.actions_taken}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
