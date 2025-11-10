import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  getBackups, 
  getProfiles, 
  saveProfile, 
  loadProfile, 
  deleteProfile, 
  duplicateProfile, 
  exportProfile,
  restoreBackup,
  loadLayout,
  importLayoutTemplate,
  LayoutBackup,
  LayoutProfile,
  LayoutType
} from '@/lib/layoutSync';
import { Clock, Save, Trash2, Copy, Download, Upload, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function LayoutManager() {
  const { user } = useAuth();
  const [backups, setBackups] = useState<LayoutBackup[]>([]);
  const [profiles, setProfiles] = useState<LayoutProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Save profile dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Import dialog state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const [backupsData, profilesData] = await Promise.all([
        getBackups(user.id, 'dashboard'), // Load dashboard backups as representative
        getProfiles(user.id) // Load all profiles (they now contain all layouts)
      ]);
      setBackups(backupsData);
      setProfiles(profilesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !newProfileName.trim()) {
      toast.error('Digite um nome para o profile');
      return;
    }

    setIsSaving(true);
    try {
      await saveProfile(user.id, newProfileName.trim());
      toast.success('Profile salvo com sucesso!', {
        description: 'Todos os layouts foram incluídos neste snapshot.'
      });
      setNewProfileName('');
      setShowSaveDialog(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadProfile = async (profileId: string) => {
    if (!user) return;
    
    try {
      const success = await loadProfile(user.id, profileId);
      if (success) {
        toast.success('Profile carregado! Recarregando página...', {
          description: 'Todos os layouts foram restaurados. Um backup automático foi criado.'
        });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error('Erro ao carregar profile');
      }
    } catch (error) {
      toast.error('Erro ao carregar profile');
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!user) return;
    
    try {
      await deleteProfile(user.id, profileId);
      toast.success('Profile excluído');
      await loadData();
    } catch (error) {
      toast.error('Erro ao excluir profile');
    }
  };

  const handleDuplicateProfile = async (profileId: string) => {
    if (!user) return;
    
    try {
      await duplicateProfile(user.id, profileId);
      toast.success('Profile duplicado com sucesso!');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao duplicar profile');
    }
  };

  const handleExportProfile = async (profileId: string, profileName: string) => {
    if (!user) return;
    
    try {
      const blob = await exportProfile(user.id, profileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `layout-profile-${profileName.toLowerCase().replace(/\s+/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Profile exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar profile');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files?.[0]) return;

    const file = event.target.files[0];
    setIsImporting(true);

    try {
      const text = await file.text();
      const importedData = JSON.parse(text);
      
      // Check if it's a profile (has layout_configs) or old template (has layout_type)
      if (importedData.layout_configs) {
        // New profile format - restore all layouts
        const layoutConfigs = importedData.layout_configs as Record<string, any>;
        const layoutTypes: LayoutType[] = ['dashboard', 'patient-detail', 'evolution'];
        
        for (const layoutType of layoutTypes) {
          if (layoutConfigs[layoutType]) {
            await loadLayout(user.id, layoutType as LayoutType);
          }
        }
        toast.success('Profile importado com sucesso!', {
          description: 'Todos os layouts foram restaurados. Recarregando...'
        });
        setTimeout(() => window.location.reload(), 1500);
      } else if (importedData.layout_type) {
        // Old template format - single layout
        const result = await importLayoutTemplate(user.id, file);
        if (result.success) {
          toast.success('Layout importado com sucesso!', {
            description: 'Recarregando página...'
          });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          toast.error(result.message);
        }
      } else {
        toast.error('Formato de arquivo inválido');
      }
    } catch (error) {
      toast.error('Erro ao importar layout');
    } finally {
      setIsImporting(false);
      setShowImportDialog(false);
      event.target.value = '';
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!user) return;
    
    try {
      await restoreBackup(user.id, backupId);
      toast.success('Backup restaurado! Recarregando página...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error('Erro ao restaurar backup');
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Layouts</CardTitle>
        <CardDescription>
          Gerencie seus profiles salvos e backups automáticos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="profiles" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profiles">
                <Package className="w-4 h-4 mr-2" />
                Profiles ({profiles.length}/5)
              </TabsTrigger>
              <TabsTrigger value="backups">
                <Clock className="w-4 h-4 mr-2" />
                Backups ({backups.length}/5)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profiles" className="space-y-4">
              <div className="flex gap-2">
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex-1" disabled={profiles.length >= 5}>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Layout Atual
                    </Button>
                  </DialogTrigger>
                   <DialogContent>
                     <DialogHeader>
                       <DialogTitle>Salvar Profile</DialogTitle>
                       <DialogDescription>
                         Salve TODOS os seus layouts atuais como um profile nomeado (snapshot completo)
                       </DialogDescription>
                     </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="profile-name">Nome do Profile</Label>
                        <Input
                          id="profile-name"
                          value={newProfileName}
                          onChange={(e) => setNewProfileName(e.target.value)}
                          placeholder="Ex: Layout Minimalista"
                          maxLength={50}
                        />
                      </div>
                      <Button 
                        onClick={handleSaveProfile} 
                        disabled={isSaving || !newProfileName.trim()}
                        className="w-full"
                      >
                        {isSaving ? 'Salvando...' : 'Salvar Profile'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Importar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Importar Layout</DialogTitle>
                      <DialogDescription>
                        Importe um arquivo de layout JSON
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        disabled={isImporting}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {profiles.length === 5 && (
                <p className="text-sm text-muted-foreground">
                  Você atingiu o limite de 5 profiles. Exclua um para criar outro.
                </p>
              )}

              <div className="space-y-2">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Carregando...
                  </p>
                ) : profiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum profile salvo ainda
                  </p>
                ) : (
                  profiles.map((profile) => (
                    <Card key={profile.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{profile.profile_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Criado {formatDistanceToNow(new Date(profile.created_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLoadProfile(profile.id)}
                            >
                              Carregar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDuplicateProfile(profile.id)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleExportProfile(profile.id, profile.profile_name)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteProfile(profile.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="backups" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Os últimos 5 backups automáticos são mantidos por tipo de layout. Um novo backup é criado 
                automaticamente antes de resetar ou carregar um profile. (Exibindo backups do Dashboard)
              </p>

              <div className="space-y-2">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Carregando...
                  </p>
                ) : backups.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum backup automático ainda
                  </p>
                ) : (
                  backups.map((backup) => (
                    <Card key={backup.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">Backup v{backup.version}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(backup.created_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreBackup(backup.id)}
                          >
                            Restaurar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }
