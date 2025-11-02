import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Download, CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';

interface BulkDownloadNFSeDialogProps {
  nfseList: Array<{
    id: string;
    issue_date: string;
    pdf_url: string | null;
    nfse_number: string | null;
    status: string;
    patients: {
      name: string;
    };
  }>;
  environment: string;
}

export default function BulkDownloadNFSeDialog({ nfseList, environment }: BulkDownloadNFSeDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Datas obrigatórias',
        description: 'Selecione a data inicial e final do período.',
        variant: 'destructive',
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        title: 'Período inválido',
        description: 'A data inicial deve ser anterior à data final.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Filter NFSes by date range and status
      const filteredNFSes = nfseList.filter(nfse => {
        if (nfse.status !== 'issued' || !nfse.pdf_url) return false;
        
        const issueDate = new Date(nfse.issue_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Set times to compare only dates
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        issueDate.setHours(12, 0, 0, 0);
        
        return issueDate >= start && issueDate <= end;
      });

      if (filteredNFSes.length === 0) {
        toast({
          title: 'Nenhuma nota encontrada',
          description: 'Não há notas fiscais emitidas no período selecionado.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Baixando notas fiscais',
        description: `Processando ${filteredNFSes.length} nota(s)...`,
      });

      // Create ZIP file
      const zip = new JSZip();
      const folder = zip.folder('NFSes');

      // Download all PDFs and add to ZIP
      const downloadPromises = filteredNFSes.map(async (nfse, index) => {
        try {
          const response = await fetch(nfse.pdf_url!);
          if (!response.ok) throw new Error('Erro ao baixar PDF');
          
          const blob = await response.blob();
          
          // Create filename: "NFSe_<number>_<patient_name>.pdf"
          const issueDate = new Date(nfse.issue_date);
          const dateStr = format(issueDate, 'dd-MM-yyyy');
          const patientName = nfse.patients.name.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 30);
          const fileName = `NFSe_${nfse.nfse_number || 'SN'}_${patientName}_${dateStr}.pdf`;
          
          folder?.file(fileName, blob);
          
          return true;
        } catch (error) {
          console.error(`Error downloading NFSe ${nfse.id}:`, error);
          return false;
        }
      });

      const results = await Promise.all(downloadPromises);
      const successCount = results.filter(r => r).length;

      if (successCount === 0) {
        throw new Error('Não foi possível baixar nenhuma nota fiscal');
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Create download link
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      
      const startDateStr = format(startDate, 'dd-MM-yyyy');
      const endDateStr = format(endDate, 'dd-MM-yyyy');
      link.download = `NFSes_${environment}_${startDateStr}_a_${endDateStr}.zip`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Download concluído',
        description: `${successCount} nota(s) fiscal(is) baixada(s) com sucesso.`,
      });

      setOpen(false);
      setStartDate(undefined);
      setEndDate(undefined);
    } catch (error: any) {
      console.error('Error downloading NFSes:', error);
      toast({
        title: 'Erro ao baixar notas',
        description: error.message || 'Não foi possível processar o download.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download em Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Download em Lote de NFSes</DialogTitle>
          <DialogDescription>
            Selecione o período das notas fiscais que deseja baixar. 
            Todas as notas emitidas no período serão incluídas no arquivo ZIP.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Inicial</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  locale={ptBR}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Data Final</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  locale={ptBR}
                  initialFocus
                  disabled={(date) => startDate ? date < startDate : false}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {startDate && endDate && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="text-sm">
                <strong>Período selecionado:</strong><br />
                De {format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}<br />
                Até {format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setOpen(false);
              setStartDate(undefined);
              setEndDate(undefined);
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDownload} 
            disabled={loading || !startDate || !endDate}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar ZIP
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
