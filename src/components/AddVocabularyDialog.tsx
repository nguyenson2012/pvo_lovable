import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, FolderOpen, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PartOfSpeech, FormalityLevel, SpecializedRegister, Attitude, Dialect } from "@/types/vocabulary";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { VocabularyEntry } from "@/hooks/useVocabulary";

interface AddVocabularyDialogProps {
  entry?: VocabularyEntry | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AddVocabularyDialog = ({ entry, open: controlledOpen, onOpenChange }: AddVocabularyDialogProps = {}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;
  const isEditMode = !!entry;
  const [word, setWord] = useState(entry?.word || "");
  const [definition, setDefinition] = useState(entry?.definition || "");
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech>((entry?.part_of_speech as PartOfSpeech) || "Noun");
  const [context, setContext] = useState(entry?.context || "");
  const [culturalNote, setCulturalNote] = useState(entry?.cultural_note || "");
  const [formalityLevel, setFormalityLevel] = useState<FormalityLevel>((entry?.formality_level as FormalityLevel) || "N");
  const [specializedRegisters, setSpecializedRegisters] = useState<SpecializedRegister[]>((entry?.specialized_registers as SpecializedRegister[]) || []);
  const [attitude, setAttitude] = useState<Attitude>((entry?.attitude as Attitude) || "neutral");
  const [dialect, setDialect] = useState<Dialect | undefined>((entry?.dialect as Dialect) || undefined);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    entry?.categories?.map(c => c.id) || []
  );
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [alternatives, setAlternatives] = useState<Array<{ word: string; register: FormalityLevel; definition: string }>>(
    entry?.alternatives?.map(alt => ({ 
      word: alt.word, 
      register: alt.register as FormalityLevel, 
      definition: alt.definition 
    })) || []
  );
  const [newAltWord, setNewAltWord] = useState("");
  const [newAltDef, setNewAltDef] = useState("");
  const [newAltReg, setNewAltReg] = useState<FormalityLevel>("N");

  useEffect(() => {
    if (entry) {
      setWord(entry.word);
      setDefinition(entry.definition);
      setPartOfSpeech(entry.part_of_speech as PartOfSpeech);
      setContext(entry.context || "");
      setCulturalNote(entry.cultural_note || "");
      setFormalityLevel(entry.formality_level as FormalityLevel);
      setSpecializedRegisters((entry.specialized_registers as SpecializedRegister[]) || []);
      setAttitude(entry.attitude as Attitude);
      setDialect((entry.dialect as Dialect) || undefined);
      setSelectedCategoryIds(entry.categories?.map(c => c.id) || []);
      setAlternatives(entry.alternatives?.map(alt => ({ 
        word: alt.word, 
        register: alt.register as FormalityLevel, 
        definition: alt.definition 
      })) || []);
    }
  }, [entry]);
  
  // New category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#0EA5E9");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("categories")
        .insert([{
          name: newCategoryName,
          description: newCategoryDescription || null,
          color: newCategoryColor,
          user_id: user.id
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Category created",
        description: "Your category has been created successfully.",
      });
      setSelectedCategoryIds([...selectedCategoryIds, data.id]); // Auto-select the new category
      setNewCategoryName("");
      setNewCategoryDescription("");
      setNewCategoryColor("#0EA5E9");
      setCategoryDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (isEditMode && entry) {
        // Update existing entry
        const { error: updateError } = await supabase
          .from("vocabulary_entries")
          .update({
            word,
            definition,
            part_of_speech: partOfSpeech,
            context: context || null,
            cultural_note: culturalNote || null,
            formality_level: formalityLevel,
            specialized_registers: specializedRegisters,
            attitude,
            dialect: dialect || null,
          })
          .eq("id", entry.id);

        if (updateError) throw updateError;

        // Delete old category relationships
        await supabase.from("vocabulary_categories").delete().eq("vocabulary_entry_id", entry.id);

        // Insert new category relationships
        if (selectedCategoryIds.length > 0) {
          const { error: catError } = await supabase
            .from("vocabulary_categories")
            .insert(
              selectedCategoryIds.map((catId) => ({
                vocabulary_entry_id: entry.id,
                category_id: catId,
              }))
            );
          if (catError) throw catError;
        }

        // Delete old alternatives
        await supabase.from("alternative_words").delete().eq("vocabulary_entry_id", entry.id);

        // Insert new alternatives
        if (alternatives.length > 0) {
          const { error: altError } = await supabase
            .from("alternative_words")
            .insert(
              alternatives.map((alt) => ({
                vocabulary_entry_id: entry.id,
                word: alt.word,
                register: alt.register,
                definition: alt.definition,
              }))
            );
          if (altError) throw altError;
        }

        return entry;
      } else {
        // Create new entry
        const { data: newEntry, error: entryError } = await supabase
          .from("vocabulary_entries")
          .insert([{
            user_id: user.id,
            word,
            definition,
            part_of_speech: partOfSpeech,
            context: context || null,
            cultural_note: culturalNote || null,
            formality_level: formalityLevel,
            specialized_registers: specializedRegisters,
            attitude,
            dialect: dialect || null,
          }])
          .select()
          .single();

        if (entryError) throw entryError;

        // Insert category relationships
        if (selectedCategoryIds.length > 0) {
          const { error: catError } = await supabase
            .from("vocabulary_categories")
            .insert(
              selectedCategoryIds.map((catId) => ({
                vocabulary_entry_id: newEntry.id,
                category_id: catId,
              }))
            );
          if (catError) throw catError;
        }

        // Insert alternatives
        if (alternatives.length > 0) {
          const { error: altError } = await supabase
            .from("alternative_words")
            .insert(
              alternatives.map((alt) => ({
                vocabulary_entry_id: newEntry.id,
                word: alt.word,
                register: alt.register,
                definition: alt.definition,
              }))
            );
          if (altError) throw altError;
        }

        return newEntry;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
      toast({
        title: isEditMode ? "Entry updated" : "Entry added",
        description: isEditMode 
          ? "Your vocabulary entry has been updated successfully."
          : "Your vocabulary entry has been added successfully.",
      });
      
      if (!isEditMode) {
        // Reset form only for new entries
        setWord("");
        setDefinition("");
        setContext("");
        setCulturalNote("");
        setFormalityLevel("N");
        setSpecializedRegisters([]);
        setAttitude("neutral");
        setDialect(undefined);
        setSelectedCategoryIds([]);
        setAlternatives([]);
      }
      
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!word || !definition) {
      toast({
        title: "Missing fields",
        description: "Please fill in word and definition.",
        variant: "destructive",
      });
      return;
    }
    if (selectedCategoryIds.length === 0) {
      toast({
        title: "Category required",
        description: "Please select at least one category for this entry.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  const addAlternative = () => {
    if (!newAltWord || !newAltDef) return;
    
    setAlternatives([
      ...alternatives,
      {
        word: newAltWord,
        register: newAltReg,
        definition: newAltDef,
      },
    ]);
    setNewAltWord("");
    setNewAltDef("");
    setNewAltReg("N");
  };

  const removeAlternative = (index: number) => {
    setAlternatives(alternatives.filter((_, i) => i !== index));
  };

  const toggleRegister = (register: SpecializedRegister) => {
    setSpecializedRegisters(prev =>
      prev.includes(register)
        ? prev.filter(r => r !== register)
        : [...prev, register]
    );
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }
    createCategoryMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditMode && (
        <DialogTrigger asChild>
          <Button className="gradient-hero text-primary-foreground shadow-md hover:shadow-lg transition-smooth">
            <Plus className="w-4 h-4 mr-2" />
            Add Vocabulary
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">
            {isEditMode ? "Edit Vocabulary Entry" : "Add New Vocabulary Entry"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label>Categories * (Select one or more)</Label>
            <div className="space-y-2">
              {/* Selected Categories */}
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-accent/20 min-h-[3rem]">
                {selectedCategoryIds.length === 0 && (
                  <span className="text-sm text-muted-foreground">No categories selected</span>
                )}
                {selectedCategoryIds.map((catId) => {
                  const cat = categories.find((c: any) => c.id === catId);
                  if (!cat) return null;
                  return (
                    <Badge
                      key={cat.id}
                      variant="default"
                      className="cursor-pointer transition-smooth hover:scale-105"
                      style={{ backgroundColor: cat.color || undefined }}
                      onClick={() => {
                        setSelectedCategoryIds(prev => prev.filter(id => id !== catId));
                      }}
                    >
                      <FolderOpen className="w-3 h-3 mr-1" />
                      {cat.name}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  );
                })}
              </div>
              
              {/* Add Category Popover */}
              <div className="flex gap-2">
                <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Search className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-2">
                      <Input
                        placeholder="Search categories..."
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                      {categories
                        .filter((cat: any) => 
                          !selectedCategoryIds.includes(cat.id) &&
                          (cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                          (cat.description && cat.description.toLowerCase().includes(categorySearchQuery.toLowerCase())))
                        )
                        .map((cat: any) => (
                          <div
                            key={cat.id}
                            className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer transition-smooth"
                            onClick={() => {
                              setSelectedCategoryIds(prev => [...prev, cat.id]);
                              setCategorySearchQuery("");
                              setCategoryPopoverOpen(false);
                            }}
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color || undefined }}
                            />
                            <span className="text-sm flex-1">{cat.name}</span>
                          </div>
                        ))}
                      {categories.filter((cat: any) => 
                        !selectedCategoryIds.includes(cat.id) &&
                        (cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                        (cat.description && cat.description.toLowerCase().includes(categorySearchQuery.toLowerCase())))
                      ).length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No categories found
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Button
                  variant="outline"
                  onClick={() => setCategoryDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </div>
            </div>
          </div>

          {/* New Category Dialog */}
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-category-name">Name *</Label>
                  <Input
                    id="new-category-name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Business English"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-category-description">Description (Optional)</Label>
                  <Textarea
                    id="new-category-description"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Describe this category..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-category-color">Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="new-category-color"
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <span className="text-sm text-muted-foreground">{newCategoryColor}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCategory}
                    disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
                  >
                    {createCategoryMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="word">Word/Phrase *</Label>
              <Input
                id="word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="e.g., a bunch of"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pos">Part of Speech</Label>
              <Select value={partOfSpeech} onValueChange={(v) => setPartOfSpeech(v as PartOfSpeech)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Noun">Noun</SelectItem>
                  <SelectItem value="Verb">Verb</SelectItem>
                  <SelectItem value="Adjective">Adjective</SelectItem>
                  <SelectItem value="Adverb">Adverb</SelectItem>
                  <SelectItem value="Pronoun">Pronoun</SelectItem>
                  <SelectItem value="Preposition">Preposition</SelectItem>
                  <SelectItem value="Conjunction">Conjunction</SelectItem>
                  <SelectItem value="Interjection">Interjection</SelectItem>
                  <SelectItem value="Phrase/Idiom">Phrase/Idiom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="definition">Definition *</Label>
            <Textarea
              id="definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Enter the meaning..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Context/Example Sentence</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Provide an example sentence..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cultural">Cultural Note (Optional)</Label>
            <Textarea
              id="cultural"
              value={culturalNote}
              onChange={(e) => setCulturalNote(e.target.value)}
              placeholder="Any cultural context or metaphors..."
              rows={2}
            />
          </div>

          {/* Tone & Register */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-serif font-semibold text-lg">Tone & Register Classification</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Formality Level</Label>
                <Select value={formalityLevel} onValueChange={(v) => setFormalityLevel(v as FormalityLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very I">very I (very informal)</SelectItem>
                    <SelectItem value="I">I (informal)</SelectItem>
                    <SelectItem value="more I">more I (slightly informal)</SelectItem>
                    <SelectItem value="N">N (neutral)</SelectItem>
                    <SelectItem value="more F">more F (slightly formal)</SelectItem>
                    <SelectItem value="F">F (formal)</SelectItem>
                    <SelectItem value="very F">very F (very formal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Attitude/Connotation</Label>
                <Select value={attitude} onValueChange={(v) => setAttitude(v as Attitude)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="O">O (old-fashioned)</SelectItem>
                    <SelectItem value="H">H (humorous)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Specialized Registers</Label>
              <div className="flex flex-wrap gap-2">
                {(["A", "L", "LEG", "BUS", "JNL", "S", "W"] as SpecializedRegister[]).map((reg) => (
                  <Badge
                    key={reg}
                    variant={specializedRegisters.includes(reg) ? "default" : "outline"}
                    className="cursor-pointer transition-smooth"
                    onClick={() => toggleRegister(reg)}
                  >
                    {reg}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dialect (Optional)</Label>
              <Select value={dialect} onValueChange={(v) => setDialect(v as Dialect)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dialect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BR">British (BR)</SelectItem>
                  <SelectItem value="AM">American (AM)</SelectItem>
                  <SelectItem value="AUS">Australian (AUS)</SelectItem>
                  <SelectItem value="CA">Canadian (CA)</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alternatives */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-serif font-semibold text-lg">Alternative Forms (Tri-Fold Approach)</h3>
            
            {alternatives.length > 0 && (
              <div className="space-y-2">
                {alternatives.map((alt, index) => (
                  <div key={index} className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alt.word}</span>
                        <Badge variant="outline" className="text-xs">{alt.register}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alt.definition}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAlternative(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Alternative word"
                value={newAltWord}
                onChange={(e) => setNewAltWord(e.target.value)}
              />
              <Input
                placeholder="Definition"
                value={newAltDef}
                onChange={(e) => setNewAltDef(e.target.value)}
              />
              <Select value={newAltReg} onValueChange={(v) => setNewAltReg(v as FormalityLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="very I">very I</SelectItem>
                  <SelectItem value="I">I</SelectItem>
                  <SelectItem value="more I">more I</SelectItem>
                  <SelectItem value="N">N</SelectItem>
                  <SelectItem value="more F">more F</SelectItem>
                  <SelectItem value="F">F</SelectItem>
                  <SelectItem value="very F">very F</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addAlternative}
              disabled={!newAltWord || !newAltDef}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Alternative
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saveMutation.isPending || !word || !definition || selectedCategoryIds.length === 0}
              className="gradient-hero text-primary-foreground"
            >
              {saveMutation.isPending 
                ? (isEditMode ? "Saving..." : "Adding...") 
                : (isEditMode ? "Save Changes" : "Add Entry")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
