import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      console.error("No token provided");
      return new Response(
        JSON.stringify({ error: "Token é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find consent submission by token
    const { data: submission, error: submissionError } = await supabase
      .from("consent_submissions")
      .select("patient_id, accepted_at, created_at")
      .eq("token", token)
      .single();

    if (submissionError || !submission) {
      console.error("Submission not found:", submissionError);
      return new Response(
        JSON.stringify({ error: "Link inválido ou expirado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already accepted
    if (submission.accepted_at) {
      return new Response(
        JSON.stringify({ 
          error: "Termos já foram aceitos anteriormente",
          alreadyAccepted: true 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token expired (7 days)
    const createdAt = new Date(submission.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) {
      return new Response(
        JSON.stringify({ error: "Link expirado (válido por 7 dias)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get patient data
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id, name, birth_date, is_minor, guardian_name, guardian_cpf")
      .eq("id", submission.patient_id)
      .single();

    if (patientError || !patient) {
      console.error("Patient not found:", patientError);
      return new Response(
        JSON.stringify({ error: "Paciente não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ patient }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in get-consent-data:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao buscar dados" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
