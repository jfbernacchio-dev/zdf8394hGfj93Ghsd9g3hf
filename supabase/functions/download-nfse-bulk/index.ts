import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { nfseIds } = await req.json();

    if (!nfseIds || !Array.isArray(nfseIds) || nfseIds.length === 0) {
      throw new Error('Lista de IDs de NFSe é obrigatória');
    }

    // Fetch NFSe data
    const { data: nfseList, error: fetchError } = await supabaseClient
      .from('nfse_issued')
      .select('id, pdf_url, nfse_number, issue_date, patients(name)')
      .in('id', nfseIds)
      .eq('status', 'issued')
      .not('pdf_url', 'is', null);

    if (fetchError) throw fetchError;

    if (!nfseList || nfseList.length === 0) {
      throw new Error('Nenhuma NFSe encontrada com os IDs fornecidos');
    }

    // Import JSZip
    const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
    const zip = new JSZip();
    const folder = zip.folder('NFSes');

    // Download all PDFs and add to ZIP
    for (const nfse of nfseList) {
      try {
        const response = await fetch(nfse.pdf_url);
        if (!response.ok) {
          console.error(`Erro ao baixar PDF ${nfse.id}: ${response.statusText}`);
          continue;
        }
        
        const pdfData = await response.arrayBuffer();
        
        // Create filename
        const issueDate = new Date(nfse.issue_date);
        const dateStr = issueDate.toISOString().split('T')[0].replace(/-/g, '-');
        const patientName = nfse.patients?.name?.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 30) || 'SemNome';
        const fileName = `NFSe_${nfse.nfse_number || 'SN'}_${patientName}_${dateStr}.pdf`;
        
        folder?.file(fileName, pdfData);
      } catch (error) {
        console.error(`Error processing NFSe ${nfse.id}:`, error);
      }
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'arraybuffer' });

    return new Response(zipBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="NFSes.zip"',
      },
    });

  } catch (error: any) {
    console.error('Error in download-nfse-bulk:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
