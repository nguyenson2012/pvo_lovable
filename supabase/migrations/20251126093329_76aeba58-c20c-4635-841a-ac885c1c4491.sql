-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, name)
);

-- Create vocabulary entries table
CREATE TABLE IF NOT EXISTS public.vocabulary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  definition TEXT NOT NULL,
  part_of_speech TEXT NOT NULL,
  context TEXT,
  cultural_note TEXT,
  formality_level TEXT NOT NULL,
  specialized_registers TEXT[] DEFAULT '{}',
  attitude TEXT NOT NULL,
  dialect TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create alternative words table
CREATE TABLE IF NOT EXISTS public.alternative_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vocabulary_entry_id UUID REFERENCES public.vocabulary_entries(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  register TEXT NOT NULL,
  definition TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternative_words ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Users can view their own categories"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for vocabulary_entries
CREATE POLICY "Users can view their own vocabulary entries"
  ON public.vocabulary_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vocabulary entries"
  ON public.vocabulary_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vocabulary entries"
  ON public.vocabulary_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vocabulary entries"
  ON public.vocabulary_entries FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for alternative_words
CREATE POLICY "Users can view alternative words for their entries"
  ON public.alternative_words FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vocabulary_entries
      WHERE vocabulary_entries.id = alternative_words.vocabulary_entry_id
      AND vocabulary_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create alternative words for their entries"
  ON public.alternative_words FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vocabulary_entries
      WHERE vocabulary_entries.id = alternative_words.vocabulary_entry_id
      AND vocabulary_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update alternative words for their entries"
  ON public.alternative_words FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vocabulary_entries
      WHERE vocabulary_entries.id = alternative_words.vocabulary_entry_id
      AND vocabulary_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete alternative words for their entries"
  ON public.alternative_words FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.vocabulary_entries
      WHERE vocabulary_entries.id = alternative_words.vocabulary_entry_id
      AND vocabulary_entries.user_id = auth.uid()
    )
  );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vocabulary_entries_updated_at
  BEFORE UPDATE ON public.vocabulary_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();