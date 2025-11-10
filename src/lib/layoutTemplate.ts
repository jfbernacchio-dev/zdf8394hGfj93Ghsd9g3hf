// Arquivo stub para compatibilidade com LayoutTemplateManager
// Este arquivo será reimplementado futuramente

export type LayoutType = 'dashboard' | 'patient_detail' | 'evolution';

export interface LayoutTemplate {
  name: string;
  description: string;
  layoutType: LayoutType;
  config: any;
  version: string;
  createdAt: string;
}

export async function exportLayoutTemplate(
  userId: string,
  layoutType: LayoutType,
  templateName: string,
  templateDescription: string
): Promise<Blob> {
  // Stub implementation - será implementado futuramente
  const template: LayoutTemplate = {
    name: templateName,
    description: templateDescription,
    layoutType,
    config: {},
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  };
  
  const jsonStr = JSON.stringify(template, null, 2);
  return new Blob([jsonStr], { type: 'application/json' });
}

export async function importLayoutTemplate(
  userId: string,
  file: File
): Promise<{ success: boolean; layoutType: LayoutType; message: string }> {
  // Stub implementation - será implementado futuramente
  return {
    success: false,
    layoutType: 'dashboard',
    message: 'Funcionalidade de importação será implementada em breve',
  };
}
