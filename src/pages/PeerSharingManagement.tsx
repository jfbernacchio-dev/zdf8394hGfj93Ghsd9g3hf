import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Share2, Shield, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePeerSharing } from '@/hooks/usePeerSharing';
import { useEffectivePermissions } from '@/hooks/useEffectivePermissions';
import { toast } from 'sonner';
import type { PermissionDomain } from '@/types/permissions';

const DOMAINS: PermissionDomain[] = [
  'financial',
  'administrative',
  'clinical',
  'media',
  'team',
  'charts',
];

const DOMAIN_LABELS: Record<PermissionDomain, string> = {
  financial: 'Financeiro',
  administrative: 'Administrativo',
  clinical: 'Clínico',
  media: 'Marketing',
  marketing: 'Marketing',
  general: 'Geral',
  charts: 'Gráficos',
  team: 'Equipe',
};

export default function PeerSharingManagement() {
  const navigate = useNavigate();
  const {
    loading,
    peerSharings,
    levelSharing,
    peersInLevel,
    shareToPeer,
    removePeerSharing,
    updateLevelSharing,
    removeLevelSharing,
    refresh,
  } = usePeerSharing();

  const { permissions, isOrganizationOwner } = useEffectivePermissions();
  const levelInfo = permissions ? {
    levelId: permissions.levelId,
    levelNumber: permissions.levelNumber
  } : null;

  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<PermissionDomain[]>([]);
  const [isBidirectional, setIsBidirectional] = useState(false);
  const [levelDomains, setLevelDomains] = useState<PermissionDomain[]>(
    levelSharing?.shared_domains || []
  );
  const [saving, setSaving] = useState(false);

  const handleSavePeerSharing = async () => {
    if (!selectedPeer || selectedDomains.length === 0) {
      toast.error('Selecione um peer e ao menos um domínio');
      return;
    }

    try {
      setSaving(true);
      await shareToPeer(selectedPeer, selectedDomains, isBidirectional);
      toast.success('Compartilhamento configurado com sucesso');
      setSelectedPeer(null);
      setSelectedDomains([]);
      setIsBidirectional(false);
    } catch (error: any) {
      console.error('Error saving peer sharing:', error);
      toast.error(error.message || 'Erro ao configurar compartilhamento');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePeerSharing = async (receiverId: string) => {
    try {
      await removePeerSharing(receiverId);
      toast.success('Compartilhamento removido');
    } catch (error: any) {
      console.error('Error removing peer sharing:', error);
      toast.error(error.message || 'Erro ao remover compartilhamento');
    }
  };

  const handleSaveLevelSharing = async () => {
    if (!levelInfo?.levelId) {
      toast.error('Informação do nível não disponível');
      return;
    }

    try {
      setSaving(true);
      if (levelDomains.length === 0) {
        await removeLevelSharing(levelInfo.levelId);
        toast.success('Compartilhamento de nível removido');
      } else {
        await updateLevelSharing(levelInfo.levelId, levelDomains);
        toast.success('Compartilhamento de nível atualizado');
      }
    } catch (error: any) {
      console.error('Error saving level sharing:', error);
      toast.error(error.message || 'Erro ao atualizar compartilhamento de nível');
    } finally {
      setSaving(false);
    }
  };

  const toggleDomain = (domain: PermissionDomain, isLevel: boolean = false) => {
    if (isLevel) {
      setLevelDomains((prev) =>
        prev.includes(domain)
          ? prev.filter((d) => d !== domain)
          : [...prev, domain]
      );
    } else {
      setSelectedDomains((prev) =>
        prev.includes(domain)
          ? prev.filter((d) => d !== domain)
          : [...prev, domain]
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin-settings')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Compartilhamento entre Peers</h1>
            <p className="text-muted-foreground">
              FASE 6 - Configure o compartilhamento de dados entre usuários do mesmo nível
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Sistema Paralelo Ativo
        </Badge>
      </div>

      {/* Info Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Sistema de Compartilhamento:</strong> Usuários do mesmo nível organizacional
          podem compartilhar dados específicos entre si. Configure compartilhamentos globais
          (todo o nível) ou individuais (peer-to-peer).
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="individual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">
            <Users className="h-4 w-4 mr-2" />
            Compartilhamento Individual
          </TabsTrigger>
          <TabsTrigger value="level" disabled={!isOrganizationOwner}>
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhamento do Nível
            {!isOrganizationOwner && ' (Apenas Owners)'}
          </TabsTrigger>
        </TabsList>

        {/* Individual Peer Sharing */}
        <TabsContent value="individual" className="space-y-6">
          {/* Create New Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Novo Compartilhamento
              </CardTitle>
              <CardDescription>
                Compartilhe domínios específicos com um colega do mesmo nível
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Select Peer */}
              <div className="space-y-2">
                <Label>Selecionar Peer</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {peersInLevel.map((peer) => (
                    <Card
                      key={peer.user_id}
                      className={`cursor-pointer transition-all ${
                        selectedPeer === peer.user_id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedPeer(peer.user_id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{peer.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {peer.level_name}
                            </p>
                          </div>
                          {selectedPeer === peer.user_id && (
                            <Badge variant="default">Selecionado</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {peersInLevel.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum peer disponível no seu nível
                  </p>
                )}
              </div>

              {/* Select Domains */}
              {selectedPeer && (
                <>
                  <div className="space-y-2">
                    <Label>Domínios Compartilhados</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {DOMAINS.map((domain) => (
                        <div
                          key={domain}
                          className="flex items-center space-x-2 p-2 border rounded-md"
                        >
                          <Checkbox
                            id={`domain-${domain}`}
                            checked={selectedDomains.includes(domain)}
                            onCheckedChange={() => toggleDomain(domain)}
                          />
                          <Label
                            htmlFor={`domain-${domain}`}
                            className="cursor-pointer"
                          >
                            {DOMAIN_LABELS[domain]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bidirectional */}
                  <div className="flex items-center space-x-2 p-4 bg-muted rounded-md">
                    <Switch
                      id="bidirectional"
                      checked={isBidirectional}
                      onCheckedChange={setIsBidirectional}
                    />
                    <Label htmlFor="bidirectional" className="cursor-pointer">
                      Compartilhamento bidirecional (ambos veem dados um do outro)
                    </Label>
                  </div>

                  <Button
                    onClick={handleSavePeerSharing}
                    disabled={saving || selectedDomains.length === 0}
                    className="w-full"
                  >
                    {saving ? 'Salvando...' : 'Salvar Compartilhamento'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Existing Sharings */}
          <Card>
            <CardHeader>
              <CardTitle>Compartilhamentos Ativos</CardTitle>
              <CardDescription>
                Gerencie seus compartilhamentos existentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {peerSharings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum compartilhamento configurado
                </p>
              ) : (
                <div className="space-y-3">
                  {peerSharings.map((sharing) => {
                    const peer = peersInLevel.find(
                      (p) => p.user_id === sharing.receiver_user_id
                    );
                    return (
                      <Card key={sharing.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="font-medium">
                                {peer?.full_name || 'Usuário'}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {sharing.shared_domains.map((domain) => (
                                  <Badge key={domain} variant="secondary">
                                    {DOMAIN_LABELS[domain as PermissionDomain]}
                                  </Badge>
                                ))}
                              </div>
                              {sharing.is_bidirectional && (
                                <Badge variant="outline">Bidirecional</Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleRemovePeerSharing(sharing.receiver_user_id)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Level Sharing */}
        <TabsContent value="level" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compartilhamento Global do Nível</CardTitle>
              <CardDescription>
                Configure quais domínios todos os usuários deste nível compartilham entre si
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Domínios Compartilhados no Nível</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {DOMAINS.map((domain) => (
                    <div
                      key={domain}
                      className="flex items-center space-x-2 p-2 border rounded-md"
                    >
                      <Checkbox
                        id={`level-domain-${domain}`}
                        checked={levelDomains.includes(domain)}
                        onCheckedChange={() => toggleDomain(domain, true)}
                      />
                      <Label
                        htmlFor={`level-domain-${domain}`}
                        className="cursor-pointer"
                      >
                        {DOMAIN_LABELS[domain]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Importante:</strong> Esta configuração aplica-se a TODOS os usuários
                  do nível {levelInfo?.levelNumber}. Compartilhamentos individuais têm
                  prioridade e complementam esta configuração.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleSaveLevelSharing}
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Salvando...' : 'Salvar Configuração do Nível'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
