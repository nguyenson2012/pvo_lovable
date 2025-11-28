import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { FormalityLevel, SpecializedRegister } from "@/types/vocabulary";
import { Search, X, FolderOpen, Info } from "lucide-react";

interface FilterPanelProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedFormality: FormalityLevel[];
  onFormalityToggle: (level: FormalityLevel) => void;
  selectedRegisters: SpecializedRegister[];
  onRegisterToggle: (register: SpecializedRegister) => void;
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
  onClearFilters: () => void;
}

export const FilterPanel = ({
  searchTerm,
  onSearchChange,
  selectedFormality,
  onFormalityToggle,
  selectedRegisters,
  onRegisterToggle,
  selectedCategories,
  onCategoryToggle,
  onClearFilters,
}: FilterPanelProps) => {
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  
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

  const filteredCategories = categories.filter((cat: any) =>
    cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
    cat.description?.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  const hasActiveFilters =
    searchTerm || 
    selectedFormality.length > 0 || 
    selectedRegisters.length > 0 ||
    selectedCategories.length > 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-elegant">
      <div className="flex items-center justify-between">
        <h3 className="font-serif font-semibold text-lg">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search words, definitions..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label>Formality Level</Label>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button className="inline-flex items-center justify-center">
                <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Intimacy/Formality Scale (I/F Scale)</h4>
                <p className="text-sm text-muted-foreground">Tags covering the spectrum from:</p>
                <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                  <li>• <span className="font-medium">very I</span> (very informal)</li>
                  <li>• <span className="font-medium">I</span> (informal)</li>
                  <li>• <span className="font-medium">more I</span> (slightly informal)</li>
                  <li>• <span className="font-medium">N</span> (neutral)</li>
                  <li>• <span className="font-medium">more F</span> (slightly formal)</li>
                  <li>• <span className="font-medium">F</span> (formal)</li>
                  <li>• <span className="font-medium">very F</span> (very formal)</li>
                </ul>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["very I", "I", "more I", "N", "more F", "F", "very F"] as FormalityLevel[]).map((level) => (
            <Badge
              key={level}
              variant={selectedFormality.includes(level) ? "default" : "outline"}
              className="cursor-pointer transition-smooth hover:scale-105"
              onClick={() => onFormalityToggle(level)}
            >
              {level}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label>Specialized Registers</Label>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button className="inline-flex items-center justify-center">
                <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Specialized Register</h4>
                <p className="text-sm text-muted-foreground">Tags for specific professional or stylistic contexts:</p>
                <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                  <li>• <span className="font-medium">A</span> (academic)</li>
                  <li>• <span className="font-medium">L</span> (literary)</li>
                  <li>• <span className="font-medium">LEG</span> (legal)</li>
                  <li>• <span className="font-medium">BUS</span> (business)</li>
                  <li>• <span className="font-medium">JNL</span> (journalism)</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">(Optional tags: <span className="font-medium">S</span> spoken, <span className="font-medium">W</span> written)</p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["A", "L", "LEG", "BUS", "JNL"] as SpecializedRegister[]).map((reg) => (
            <Badge
              key={reg}
              variant={selectedRegisters.includes(reg) ? "default" : "outline"}
              className="cursor-pointer transition-smooth hover:scale-105"
              onClick={() => onRegisterToggle(reg)}
            >
              {reg}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Categories</Label>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={categorySearchTerm}
            onChange={(e) => setCategorySearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filteredCategories.map((cat: any) => (
            <Badge
              key={cat.id}
              variant={selectedCategories.includes(cat.id) ? "default" : "outline"}
              className="cursor-pointer transition-smooth hover:scale-105"
              style={
                selectedCategories.includes(cat.id)
                  ? { backgroundColor: cat.color || undefined }
                  : { borderColor: `${cat.color}50`, color: cat.color || undefined }
              }
              onClick={() => onCategoryToggle(cat.id)}
            >
              <FolderOpen className="w-3 h-3 mr-1" />
              {cat.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};
