import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VocabularyEntry {
  id: string;
  word: string;
  definition: string;
  part_of_speech: string;
  context: string | null;
  cultural_note: string | null;
  formality_level: string;
  specialized_registers: string[];
  attitude: string;
  dialect: string | null;
  category_id: string;
  category?: {
    id: string;
    name: string;
    color: string | null;
  };
  alternatives?: Array<{
    id: string;
    word: string;
    register: string;
    definition: string;
  }>;
}

export const useVocabulary = () => {
  return useQuery({
    queryKey: ["vocabulary"],
    queryFn: async () => {
      const { data: entries, error: entriesError } = await supabase
        .from("vocabulary_entries")
        .select(`
          *,
          category:categories(id, name, color)
        `)
        .order("created_at", { ascending: false });

      if (entriesError) throw entriesError;

      const { data: alternatives, error: altError } = await supabase
        .from("alternative_words")
        .select("*");

      if (altError) throw altError;

      return entries.map((entry) => ({
        ...entry,
        alternatives: alternatives?.filter((alt) => alt.vocabulary_entry_id === entry.id) || [],
      })) as VocabularyEntry[];
    },
  });
};
