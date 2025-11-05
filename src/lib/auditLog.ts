import { supabase } from '@/integrations/supabase/client';

export type AccessType = 
  | 'view_patient'
  | 'edit_patient'
  | 'view_sessions'
  | 'delete_patient'
  | 'export_patient_data'
  | 'create_therapist'
  | 'view_whatsapp_media';

export async function logAdminAccess(
  accessType: AccessType,
  accessedUserId?: string,
  accessedPatientId?: string,
  accessReason?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user is admin (only admins should be logged)
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) return; // Not an admin, skip logging

    await supabase.from('admin_access_log').insert({
      admin_id: user.id,
      access_type: accessType,
      accessed_user_id: accessedUserId,
      accessed_patient_id: accessedPatientId,
      access_reason: accessReason || `Admin accessed ${accessType.replace(/_/g, ' ')}`
    });
  } catch (error) {
    // Silent fail - don't break app if logging fails
    console.warn('Audit log failed:', error);
  }
}
