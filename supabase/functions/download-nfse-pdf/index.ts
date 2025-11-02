import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfUrl } = await req.json();

    if (!pdfUrl) {
      throw new Error('URL do PDF é obrigatória');
    }

    console.log('Downloading PDF from:', pdfUrl);

    // Fetch the PDF from the URL
    const response = await fetch(pdfUrl);
    
    if (!response.ok) {
      throw new Error(`Erro ao baixar PDF: ${response.statusText}`);
    }

    const pdfData = await response.arrayBuffer();

    return new Response(pdfData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
      },
    });

  } catch (error: any) {
    console.error('Error in download-nfse-pdf:', error);
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
