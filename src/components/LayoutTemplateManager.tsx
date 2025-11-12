import { useState } from 'react';
import { useLayoutTemplates } from '@/hooks/useLayoutTemplates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Save, 
  Download, 
  Star, 
  Copy, 
  Trash2, 
  MoreVertical,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const LayoutTemplateManager = () => {
  const {
    templates,
    loading,
    saveTemplate,
    loadTemplate,
    setAsDefault,
    duplicate,
    deleteTemplate,
    disableDefault,
  } = useLayoutTemplates();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [setAsDefaultOnSave, setSetAsDefaultOnSave] = useState(false);

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) return;
    await saveTemplate(newTemplateName.trim(), setAsDefaultOnSave);
    setSaveDialogOpen(false);
    setNewTemplateName('');
    setSetAsDefaultOnSave(false);
  };

  const handleDuplicate = async () => {
    if (!selectedTemplateId || !newTemplateName.trim()) return;
    await duplicate(selectedTemplateId, newTemplateName.trim());
    setDuplicateDialogOpen(false);
    setNewTemplateName('');
    setSelectedTemplateId(null);
  };

  const handleDelete = async () => {
    if (!selectedTemplateId) return;
    await deleteTemplate(selectedTemplateId);
    setDeleteDialogOpen(false);
    setSelectedTemplateId(null);
  };

  const openDuplicateDialog = (templateId: string, originalName: string) => {
    setSelectedTemplateId(templateId);
    setNewTemplateName(`${originalName} (Cópia)`);
    setDuplicateDialogOpen(true);
  };

  const openDeleteDialog = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setDeleteDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="w-5 h-5" />
          Gerenciamento de Layouts
        </CardTitle>
        <CardDescription>
          Salve e carregue diferentes configurações de layout para usar em múltiplos dispositivos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => setSaveDialogOpen(true)}
          className="w-full"
          size="lg"
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Layout Atual como Template
        </Button>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum template salvo ainda.</p>
            <p className="text-sm mt-2">Clique no botão acima para salvar seu primeiro template!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Seus Templates:</h4>
            {templates.map((template) => (
              <Card key={template.id} className="relative">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">
                          {template.template_name}
                        </h5>
                        {template.is_default && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                            <Star className="w-3 h-3 fill-current" />
                            Padrão
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Atualizado em {format(new Date(template.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadTemplate(template.id)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Carregar
                        </Button>
                        {template.is_default ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={disableDefault}
                          >
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Desabilitar Padrão
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAsDefault(template.id)}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Definir Padrão
                          </Button>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openDuplicateDialog(template.id, template.template_name)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(template.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog: Salvar Novo Template */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Salvar Layout Atual</DialogTitle>
              <DialogDescription>
                Dê um nome para este template. Você poderá carregá-lo de qualquer dispositivo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Nome do Template</Label>
                <Input
                  id="template-name"
                  placeholder="Ex: Meu Layout Principal"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="set-default"
                  checked={setAsDefaultOnSave}
                  onChange={(e) => setSetAsDefaultOnSave(e.target.checked)}
                  className="rounded border-input"
                />
                <Label htmlFor="set-default" className="font-normal cursor-pointer">
                  Definir como template padrão
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveTemplate} disabled={!newTemplateName.trim()}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Duplicar Template */}
        <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Duplicar Template</DialogTitle>
              <DialogDescription>
                Crie uma cópia deste template com um novo nome.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="duplicate-name">Nome do Novo Template</Label>
              <Input
                id="duplicate-name"
                placeholder="Nome da cópia"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDuplicate()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleDuplicate} disabled={!newTemplateName.trim()}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Confirmar Exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Template</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
