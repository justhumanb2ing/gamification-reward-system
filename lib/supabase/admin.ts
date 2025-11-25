import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_URL 및 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되어야 합니다.",
  );
}

export const createServiceRoleClient = () =>
  createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
