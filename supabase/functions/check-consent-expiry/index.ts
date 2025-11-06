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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking consent expiry...");

    // Get all consent submissions that haven't been accepted yet
    const { data: pendingSubmissions, error: submissionsError } = await supabase
      .from("consent_submissions")
      .select("id, patient_id, created_at, token")
      .is("accepted_at", null);

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError);
      throw submissionsError;
    }

    if (!pendingSubmissions || pendingSubmissions.length === 0) {
      console.log("No pending consent submissions found");
      return new Response(
        JSON.stringify({ success: true, message: "No pending submissions" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${pendingSubmissions.length} pending submissions`);

    const now = new Date();
    const notifications = [];

    for (const submission of pendingSubmissions) {
      const createdAt = new Date(submission.created_at);
      const expiryDate = new Date(createdAt);
      expiryDate.setDate(expiryDate.getDate() + 7); // Link expires in 7 days

      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`Submission ${submission.id}: created ${createdAt.toISOString()}, expires ${expiryDate.toISOString()}, days until expiry: ${daysUntilExpiry}`);

      // Get patient info
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("id, name, user_id, is_minor, guardian_name")
        .eq("id", submission.patient_id)
        .maybeSingle();

      if (patientError || !patient) {
        console.error(`Patient not found for submission ${submission.id}`);
        continue;
      }

      const recipientName = patient.is_minor && patient.guardian_name 
        ? patient.guardian_name 
        : patient.name;

      let notificationData = null;

      // Check if link has already expired
      if (daysUntilExpiry < 0) {
        // Check if we already sent an expired notification
        const { data: existingNotification } = await supabase
          .from("system_notifications")
          .select("id")
          .eq("user_id", patient.user_id)
          .eq("category", "compliance")
          .eq("action_url", `/patients/${patient.id}`)
          .ilike("message", `%${patient.name}%expirou%`)
          .gte("created_at", createdAt.toISOString())
          .maybeSingle();

        if (!existingNotification) {
          notificationData = {
            user_id: patient.user_id,
            title: "Link de Consentimento Expirado",
            message: `O link enviado para ${recipientName} (${patient.name}) expirou. É necessário enviar um novo link.`,
            category: "compliance",
            severity: "error",
            action_url: `/patients/${patient.id}`,
          };
        }
      } else if (daysUntilExpiry === 1) {
        // 1 day until expiry
        const { data: existingNotification } = await supabase
          .from("system_notifications")
          .select("id")
          .eq("user_id", patient.user_id)
          .eq("category", "compliance")
          .eq("action_url", `/patients/${patient.id}`)
          .ilike("message", `%${patient.name}%1 dia%`)
          .gte("created_at", createdAt.toISOString())
          .maybeSingle();

        if (!existingNotification) {
          notificationData = {
            user_id: patient.user_id,
            title: "Termo de Consentimento Expirando",
            message: `O link enviado para ${recipientName} (${patient.name}) expira em 1 dia. Considere lembrar o responsável.`,
            category: "compliance",
            severity: "warning",
            action_url: `/patients/${patient.id}`,
          };
        }
      } else if (daysUntilExpiry === 3) {
        // 3 days until expiry
        const { data: existingNotification } = await supabase
          .from("system_notifications")
          .select("id")
          .eq("user_id", patient.user_id)
          .eq("category", "compliance")
          .eq("action_url", `/patients/${patient.id}`)
          .ilike("message", `%${patient.name}%3 dias%`)
          .gte("created_at", createdAt.toISOString())
          .maybeSingle();

        if (!existingNotification) {
          notificationData = {
            user_id: patient.user_id,
            title: "Termo de Consentimento Expirando",
            message: `O link enviado para ${recipientName} (${patient.name}) expira em 3 dias.`,
            category: "compliance",
            severity: "info",
            action_url: `/patients/${patient.id}`,
          };
        }
      }

      if (notificationData) {
        notifications.push(notificationData);
      }
    }

    // Insert all notifications at once
    if (notifications.length > 0) {
      console.log(`Creating ${notifications.length} notifications`);
      const { error: notificationError } = await supabase
        .from("system_notifications")
        .insert(notifications);

      if (notificationError) {
        console.error("Error creating notifications:", notificationError);
      } else {
        console.log("Notifications created successfully");
      }
    } else {
      console.log("No notifications to create");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Checked ${pendingSubmissions.length} submissions, created ${notifications.length} notifications` 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in check-consent-expiry:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao verificar validade dos links" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
