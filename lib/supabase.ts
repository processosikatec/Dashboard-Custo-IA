import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lxgmimpevdgkyeycvdwf.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Z21pbXBldmRna3lleWN2ZHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE0OTI2MSwiZXhwIjoyMDc0NzI1MjYxfQ.wYVy6_2okNiIk95BIV575s9Loy64UdYGAgYMTkY2z4Q';

export const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});
