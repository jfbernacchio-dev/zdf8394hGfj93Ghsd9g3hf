import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileText, Download, Trash2, FileAudio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PatientFilesProps {
  patientId: string;
}

const FILE_CATEGORIES = [
  'Consentimentos',
  'Documentos',
  'Anamnese',
  'Encaminhamento Médico',
  'Laudo Psicológico',
  'Relatórios',
  'Materiais e Produções',
  'Relato de Sessões',
  'Anotações Clínicas',
  'Transcrições de Sessões',
  'NFSe'
];

export const PatientFiles = ({ patientId }: PatientFilesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<any[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [patientId]);

  const loadFiles = async () => {
    console.log('Loading files for patient:', patientId);
    const { data, error } = await supabase
      .from('patient_files')
      .select('*')
      .eq('patient_id', patientId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error loading files:', error);
      return;
    }

    console.log('Files loaded:', data);
    setFiles(data || []);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'audio/mpeg',
        'audio/wav',
        'audio/mp3',
        'audio/m4a',
        'audio/x-m4a'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Tipo de arquivo não permitido',
          description: 'Apenas PDF, DOCX, imagens (JPEG, PNG) e áudios (MP3, WAV, M4A) são aceitos.',
          variant: 'destructive'
        });
        return;
      }

      // Validate file size (50MB)
      if (file.size > 52428800) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O tamanho máximo permitido é 50MB.',
          variant: 'destructive'
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCategory || !user) return;

    setUploading(true);

    try {
      // Upload to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${patientId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('patient-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('patient_files')
        .insert([{
          patient_id: patientId,
          file_path: filePath,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          category: selectedCategory,
          uploaded_by: user.id
        }]);

      if (dbError) throw dbError;

      toast({ title: 'Arquivo enviado com sucesso!' });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedCategory('');
      loadFiles();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro ao enviar arquivo',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('patient-files')
        .download(file.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Erro ao baixar arquivo',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (file: any) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('patient-files')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('patient_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast({ title: 'Arquivo excluído com sucesso!' });
      loadFiles();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Erro ao excluir arquivo',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('audio/')) {
      return <FileAudio className="w-5 h-5 text-purple-500" />;
    }
    return <FileText className="w-5 h-5 text-primary" />;
  };

  const filesByCategory = FILE_CATEGORIES.map(category => ({
    category,
    files: files.filter(f => f.category.toLowerCase() === category.toLowerCase())
  })).filter(group => group.files.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Arquivos do Paciente</h2>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Enviar Arquivo
        </Button>
      </div>

      {filesByCategory.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Nenhum arquivo enviado ainda</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {filesByCategory.map(group => (
            <Card key={group.category} className="p-4">
              <h3 className="font-semibold text-lg mb-3 text-foreground">{group.category}</h3>
              <div className="space-y-2">
                {group.files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      {getFileIcon(file.file_type)}
                      <div>
                        <p className="font-medium text-sm text-foreground">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(file.uploaded_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(file)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Arquivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {FILE_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Arquivo</Label>
              <Input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.docx,.jpg,.jpeg,.png,.mp3,.wav,.m4a"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selecionado: {selectedFile.name}
                </p>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !selectedCategory || uploading}
              className="w-full"
            >
              {uploading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
