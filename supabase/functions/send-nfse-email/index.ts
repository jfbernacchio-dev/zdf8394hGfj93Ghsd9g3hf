import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendNFSeEmailRequest {
  nfseId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { nfseId }: SendNFSeEmailRequest = await req.json();

    if (!nfseId) {
      throw new Error("NFSe ID is required");
    }

    console.log("Fetching NFSe data for:", nfseId);

    // Fetch NFSe data with patient information
    const { data: nfseData, error: nfseError } = await supabase
      .from("nfse_issued")
      .select(`
        *,
        patient:patients (
          name,
          email,
          cpf
        )
      `)
      .eq("id", nfseId)
      .single();

    if (nfseError || !nfseData) {
      console.error("Error fetching NFSe:", nfseError);
      throw new Error("NFSe not found");
    }

    // Check if NFSe is issued and has a PDF URL
    if (nfseData.status !== "issued" && nfseData.status !== "processing") {
      throw new Error("NFSe is not in a valid state for email sending");
    }

    if (!nfseData.pdf_url) {
      throw new Error("NFSe PDF URL not available");
    }

    if (!nfseData.patient?.email) {
      throw new Error("Patient email not found");
    }

    console.log("Downloading PDF from:", nfseData.pdf_url);

    // Download PDF from FocusNFe
    let pdfBuffer: ArrayBuffer;
    try {
      const pdfResponse = await fetch(nfseData.pdf_url);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`);
      }
      pdfBuffer = await pdfResponse.arrayBuffer();
    } catch (downloadError) {
      console.error("Error downloading PDF:", downloadError);
      throw new Error("Failed to download PDF from FocusNFe");
    }

    // Convert ArrayBuffer to base64
    const pdfBase64 = btoa(
      new Uint8Array(pdfBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    const patientName = nfseData.patient.name;
    const nfseNumber = nfseData.nfse_number || "Pendente";
    const issueDate = new Date(nfseData.issue_date).toLocaleDateString("pt-BR");
    const serviceValue = Number(nfseData.service_value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    console.log("Sending email to:", nfseData.patient.email);

    // Send email with PDF attachment
    const emailResponse = await resend.emails.send({
      from: "Espaço Mindware <onboarding@resend.dev>",
      to: [nfseData.patient.email],
      subject: `Nota Fiscal de Serviço Eletrônica - ${nfseNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8B9D83;">Nota Fiscal Eletrônica Emitida</h1>
          
          <p>Olá, <strong>${patientName}</strong>!</p>
          
          <p>Sua Nota Fiscal de Serviço Eletrônica foi emitida com sucesso.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #8B9D83;">Detalhes da NF-e</h3>
            <p><strong>Número:</strong> ${nfseNumber}</p>
            <p><strong>Data de Emissão:</strong> ${issueDate}</p>
            <p><strong>Valor do Serviço:</strong> ${serviceValue}</p>
            ${nfseData.verification_code ? `<p><strong>Código de Verificação:</strong> ${nfseData.verification_code}</p>` : ""}
          </div>
          
          <p>O arquivo PDF da nota fiscal está anexado a este email.</p>
          
          ${nfseData.xml_url ? `<p>Você também pode acessar o XML da nota fiscal <a href="${nfseData.xml_url}" style="color: #8B9D83;">clicando aqui</a>.</p>` : ""}
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            Este é um email automático. Em caso de dúvidas, entre em contato com o Espaço Mindware Psicologia.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `NFSe_${nfseNumber}_${patientName.replace(/\s+/g, "_")}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-nfse-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
