import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SessionFileUploadProps {
  sessionId: string;
  sessionDate: string;
  patientId: string;
  onUploadComplete: () => void;
}

const FILE_CATEGORIES = [
  { value: 'audio', label: 'Áudio' },
  { value: 'video', label: 'Vídeo' },
  { value: 'documento', label: 'Documento' },
  { value: 'imagem', label: 'Imagem' },
  { value: 'teste', label: 'Teste Psicológico' },
  { value: 'relatorio', label: 'Relatório' },
  { value: 'outro', label: 'Outro' }
];

export function SessionFileUpload({ sessionId, sessionDate, patientId, onUploadComplete }: SessionFileUploadProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !category) {
      toast.error('Selecione um arquivo e uma categoria');
      return;
    }

    setUploading(true);

    try {
      // Format session date for filename
      const formattedDate = format(parseISO(sessionDate), 'dd-MM-yy', { locale: ptBR });
      
      // Get file extension
      const fileExtension = selectedFile.name.split('.').pop();
      
      // Create filename with category and session date
      const categoryLabel = FILE_CATEGORIES.find(c => c.value === category)?.label || 'Arquivo';
      const fileName = `${categoryLabel}Sessão${formattedDate}.${fileExtension}`;
      
      // Upload to Supabase Storage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const filePath = `${user.id}/${patientId}/${sessionId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('patient-files')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Save file record to database
      const { error: dbError } = await supabase
        .from('patient_files')
        .insert({
          patient_id: patientId,
          file_name: fileName,
          file_path: filePath,
          file_type: selectedFile.type,
          category: category,
          is_clinical: true,
          uploaded_by: user.id
        });

      if (dbError) throw dbError;

      toast.success('Arquivo enviado com sucesso');
      setOpen(false);
      setSelectedFile(null);
      setCategory('');
      onUploadComplete();
    } catch (error: any) {
      console.error('Erro ao enviar arquivo:', error);
      toast.error(error.message || 'Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Adicionar Arquivo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Arquivo à Sessão</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Arquivo</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {FILE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Arquivo</label>
            <input
              type="file"
              onChange={handleFileSelect}
              className="w-full text-sm"
            />
            {selectedFile && (
              <p className="text-xs text-muted-foreground mt-2">
                Arquivo selecionado: {selectedFile.name}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !selectedFile || !category}>
              {uploading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
