import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  reportId: string;
  type: "assignment" | "status_change";
  workerId?: string;
  newStatus?: string;
  email?: string;
  complaintId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    // If no Resend API key, log and return success (email notifications are optional)
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured - skipping email notification");
      return new Response(
        JSON.stringify({ message: "Email notifications not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: NotificationRequest = await req.json();
    const { reportId, type, workerId, newStatus, email, complaintId } = body;

    if (type === "assignment" && workerId) {
      // Get worker's email from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", workerId)
        .single();

      // Get report details
      const { data: report } = await supabase
        .from("reports")
        .select("complaint_id, location, damage_type, severity")
        .eq("id", reportId)
        .single();

      if (profile?.email && report) {
        await resend.emails.send({
          from: "Road Damage System <noreply@lovable.app>",
          to: [profile.email],
          subject: `New Report Assigned: ${report.complaint_id}`,
          html: `
            <h2>New Report Assignment</h2>
            <p>Hello ${profile.full_name || "Worker"},</p>
            <p>A new road damage report has been assigned to you:</p>
            <ul>
              <li><strong>Complaint ID:</strong> ${report.complaint_id}</li>
              <li><strong>Location:</strong> ${report.location}</li>
              <li><strong>Damage Type:</strong> ${report.damage_type}</li>
              <li><strong>Severity:</strong> ${report.severity}</li>
            </ul>
            <p>Please log in to your worker dashboard to view and address this report.</p>
            <p>Thank you for your service!</p>
          `,
        });
        console.log("Assignment notification sent to:", profile.email);
      }
    } else if (type === "status_change" && email && newStatus) {
      const statusMessages: Record<string, string> = {
        "pending": "is pending review",
        "in-progress": "is now being addressed by our team",
        "resolved": "has been resolved",
      };

      await resend.emails.send({
        from: "Road Damage System <noreply@lovable.app>",
        to: [email],
        subject: `Report ${complaintId} Status Update`,
        html: `
          <h2>Report Status Update</h2>
          <p>Your road damage report <strong>${complaintId}</strong> ${statusMessages[newStatus] || `status changed to ${newStatus}`}.</p>
          ${newStatus === "resolved" ? `
            <p>Thank you for helping keep our roads safe! Your report has been addressed and the repair work has been completed.</p>
          ` : `
            <p>We will continue to keep you updated on the progress of your report.</p>
          `}
          <p>You can track your report at any time using your complaint ID.</p>
          <p>Thank you for using our Road Damage Reporting System!</p>
        `,
      });
      console.log("Status notification sent to:", email);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending notification:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
