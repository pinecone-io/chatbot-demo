import { createClient } from "@supabase/supabase-js";
import { Database } from "types/supabase";

const supabasePrivateKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabasePrivateKey)
  throw new Error(`Expected env var SUPABASE_SERVICE_ROLE_KEY`);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) throw new Error(`Expected env var NEXT_PUBLIC_SUPABASE_URL`);

const supabaseAdminClient = createClient<Database>(
  supabaseUrl,
  supabasePrivateKey,
  {
    auth: { persistSession: false },
    realtime: {
      params: {
        eventsPerSecond: -1,
      },
    },
  }
);

export { supabaseAdminClient };
