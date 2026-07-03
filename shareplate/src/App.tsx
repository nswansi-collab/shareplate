import { useEffect } from "react";
import { supabase } from "./lib/supabase";

export default function App() {

  useEffect(() => {

    async function testConnection() {

      const { data, error } = await supabase
        .from("profiles")
        .select("*");

      console.log("DATA:", data);
      console.log("ERROR:", error);

    }

    testConnection();

  }, []);

  return (
    <h1>SharePlate Connected Successfully 🚀</h1>
  );
}