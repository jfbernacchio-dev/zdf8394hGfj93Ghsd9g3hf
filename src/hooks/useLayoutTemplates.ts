import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  listUserTemplates,
  saveTemplateToDatabase,
  loadTemplateFromDatabase,
  setTemplateAsDefault,
  duplicateTemplate,
  deleteTemplate,
  getDefaultTemplate,
  applyLayoutSnapshot,
} from '@/lib/layoutStorage';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type LayoutTemplate = Database['public']['Tables']['user_layout_templates']['Row'];

export const useLayoutTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Carrega templates do usuário
  useEffect(() => {
    if (!user?.id) return;

    const loadTemplates = async () => {
      setLoading(true);
      try {
        const data = await listUserTemplates(user.id);
        setTemplates(data);
      } catch (error) {
        console.error('Erro ao carregar templates:', error);
        toast.error('Erro ao carregar templates');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [user?.id, refreshTrigger]);

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  const saveTemplate = async (name: string, isDefault: boolean = false) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      await saveTemplateToDatabase(user.id, name, isDefault);
      toast.success(`Template "${name}" salvo com sucesso!`);
      refresh();
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      if (error.message?.includes('unique constraint')) {
        toast.error('Já existe um template com esse nome');
      } else {
        toast.error('Erro ao salvar template');
      }
    }
  };

  const loadTemplate = async (templateId: string) => {
    try {
      const template = await loadTemplateFromDatabase(templateId);
      toast.success(`Template "${template.template_name}" carregado!`);
      // Recarrega a página para aplicar o layout
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Erro ao carregar template:', error);
      toast.error('Erro ao carregar template');
    }
  };

  const setAsDefault = async (templateId: string) => {
    if (!user?.id) return;

    try {
      await setTemplateAsDefault(user.id, templateId);
      toast.success('Template definido como padrão!');
      refresh();
    } catch (error) {
      console.error('Erro ao definir template como padrão:', error);
      toast.error('Erro ao definir template como padrão');
    }
  };

  const duplicate = async (templateId: string, newName: string) => {
    try {
      await duplicateTemplate(templateId, newName);
      toast.success(`Template duplicado como "${newName}"!`);
      refresh();
    } catch (error: any) {
      console.error('Erro ao duplicar template:', error);
      if (error.message?.includes('unique constraint')) {
        toast.error('Já existe um template com esse nome');
      } else {
        toast.error('Erro ao duplicar template');
      }
    }
  };

  const deleteTemplateById = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      toast.success('Template excluído com sucesso!');
      refresh();
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
    }
  };

  const loadDefaultTemplate = async () => {
    if (!user?.id) return;

    try {
      const defaultTemplate = await getDefaultTemplate(user.id);
      if (defaultTemplate) {
        applyLayoutSnapshot(defaultTemplate.layout_snapshot as Record<string, string>);
        console.log('[useLayoutTemplates] Template padrão aplicado:', defaultTemplate.template_name);
      }
    } catch (error) {
      console.error('Erro ao carregar template padrão:', error);
    }
  };

  return {
    templates,
    loading,
    saveTemplate,
    loadTemplate,
    setAsDefault,
    duplicate,
    deleteTemplate: deleteTemplateById,
    refresh,
    loadDefaultTemplate,
  };
};
