export type PartOfSpeech = 
  | "Noun" 
  | "Verb" 
  | "Adjective" 
  | "Adverb" 
  | "Pronoun" 
  | "Preposition" 
  | "Conjunction" 
  | "Interjection" 
  | "Phrase/Idiom";

export type FormalityLevel = 
  | "very I" 
  | "I" 
  | "more I" 
  | "N" 
  | "more F" 
  | "F" 
  | "very F";

export type SpecializedRegister = 
  | "A" 
  | "L" 
  | "LEG" 
  | "BUS" 
  | "JNL" 
  | "S" 
  | "W";

export type Attitude = 
  | "positive" 
  | "negative" 
  | "neutral" 
  | "O" 
  | "H";

export type Dialect = "BR" | "AM" | "AUS" | "CA" | "Other";

export interface AlternativeWord {
  id: string;
  word: string;
  register: FormalityLevel;
  definition: string;
}

export interface VocabularyEntry {
  id: string;
  word: string;
  definition: string;
  partOfSpeech: PartOfSpeech;
  context: string;
  culturalNote?: string;
  formalityLevel: FormalityLevel;
  specializedRegisters: SpecializedRegister[];
  attitude: Attitude;
  dialect?: Dialect;
  alternatives: AlternativeWord[];
  createdAt: Date;
  updatedAt: Date;
}
