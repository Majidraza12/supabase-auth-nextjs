"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ClientComponent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function getUser() {
      const supabase = await createClient();      
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();  
  }, []);

  return <h2>{`Hello ${user?.email}` || "No user"}</h2>;
}
