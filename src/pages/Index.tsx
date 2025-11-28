import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddVocabularyDialog } from "@/components/AddVocabularyDialog";
import { VocabularyCard } from "@/components/VocabularyCard";
import { FilterPanel } from "@/components/FilterPanel";
import { CategoryManager } from "@/components/CategoryManager";
import { Auth } from "@/components/Auth";
import { useVocabulary, VocabularyEntry } from "@/hooks/useVocabulary";
import { FormalityLevel, SpecializedRegister } from "@/types/vocabulary";
import { BookOpen, TrendingUp, Filter, LogOut, FolderOpen } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFormality, setSelectedFormality] = useState<FormalityLevel[]>([]);
  const [selectedRegisters, setSelectedRegisters] = useState<SpecializedRegister[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [editingEntry, setEditingEntry] = useState<VocabularyEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: entries = [], isLoading } = useVocabulary();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.definition.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFormality =
      selectedFormality.length === 0 ||
      selectedFormality.includes(entry.formality_level as FormalityLevel);

    const matchesRegister =
      selectedRegisters.length === 0 ||
      selectedRegisters.some(reg => entry.specialized_registers.includes(reg));

    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(entry.category_id);

    return matchesSearch && matchesFormality && matchesRegister && matchesCategory;
  });

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedFormality([]);
    setSelectedRegisters([]);
    setSelectedCategories([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-5xl font-serif font-bold text-foreground">
                RegisterVault
              </h1>
              <AddVocabularyDialog
                entry={editingEntry}
                open={isEditDialogOpen}
                onOpenChange={(open) => {
                  setIsEditDialogOpen(open);
                  if (!open) setEditingEntry(null);
                }}
              />
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
          <p className="text-xl text-muted-foreground">
            Master vocabulary through tone, register, and context
          </p>
        </header>

        <Tabs defaultValue="vocabulary" className="mb-12">
          <TabsList>
            <TabsTrigger value="vocabulary">
              <BookOpen className="w-4 h-4 mr-2" />
              Vocabulary
            </TabsTrigger>
            <TabsTrigger value="categories">
              <FolderOpen className="w-4 h-4 mr-2" />
              Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vocabulary" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="gradient-card shadow-elegant">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Total Entries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-serif font-bold text-foreground">{entries.length}</p>
                </CardContent>
              </Card>

              <Card className="gradient-card shadow-elegant">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    This Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-serif font-bold text-foreground">0</p>
                </CardContent>
              </Card>

              <Card className="gradient-card shadow-elegant">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-serif font-bold text-foreground">{filteredEntries.length}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <FilterPanel
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedFormality={selectedFormality}
                  onFormalityToggle={(level) => {
                    setSelectedFormality(prev =>
                      prev.includes(level)
                        ? prev.filter(l => l !== level)
                        : [...prev, level]
                    );
                  }}
                  selectedRegisters={selectedRegisters}
                  onRegisterToggle={(register) => {
                    setSelectedRegisters(prev =>
                      prev.includes(register)
                        ? prev.filter(r => r !== register)
                        : [...prev, register]
                    );
                  }}
                  selectedCategories={selectedCategories}
                  onCategoryToggle={(categoryId) => {
                    setSelectedCategories(prev =>
                      prev.includes(categoryId)
                        ? prev.filter(c => c !== categoryId)
                        : [...prev, categoryId]
                    );
                  }}
                  onClearFilters={handleClearFilters}
                />
              </div>

              <div className="lg:col-span-2">
                <div className="space-y-4">
                  {isLoading ? (
                    <Card className="gradient-card shadow-elegant">
                      <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">Loading vocabulary...</p>
                      </CardContent>
                    </Card>
                  ) : filteredEntries.length === 0 ? (
                    <Card className="gradient-card shadow-elegant">
                      <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">
                          {entries.length === 0
                            ? "No vocabulary entries yet. Create a category and add your first entry!"
                            : "No entries match your filters. Try adjusting your search criteria."}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredEntries.map((entry) => (
                      <VocabularyCard
                        key={entry.id}
                        entry={entry}
                        onClick={() => {
                          setEditingEntry(entry);
                          setIsEditDialogOpen(true);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
