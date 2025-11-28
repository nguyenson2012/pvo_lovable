import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VocabularyEntry } from "@/hooks/useVocabulary";
import { BookOpen, MessageSquare, Globe, FolderOpen } from "lucide-react";

interface VocabularyCardProps {
  entry: VocabularyEntry;
  onClick?: () => void;
}

const getFormalityColor = (level: string) => {
  const colors: Record<string, string> = {
    "very I": "bg-tag-informal/20 text-tag-informal border-tag-informal/30",
    "I": "bg-tag-informal/15 text-tag-informal border-tag-informal/25",
    "more I": "bg-tag-informal/10 text-tag-informal border-tag-informal/20",
    "N": "bg-tag-neutral/20 text-tag-neutral border-tag-neutral/30",
    "more F": "bg-tag-formal/10 text-tag-formal border-tag-formal/20",
    "F": "bg-tag-formal/15 text-tag-formal border-tag-formal/25",
    "very F": "bg-tag-formal/20 text-tag-formal border-tag-formal/30",
  };
  return colors[level] || colors["N"];
};

const getRegisterColor = (register: string) => {
  const colors: Record<string, string> = {
    "A": "bg-tag-academic/20 text-tag-academic border-tag-academic/30",
    "L": "bg-tag-literary/20 text-tag-literary border-tag-literary/30",
    "LEG": "bg-tag-legal/20 text-tag-legal border-tag-legal/30",
    "BUS": "bg-tag-business/20 text-tag-business border-tag-business/30",
    "JNL": "bg-tag-journalism/20 text-tag-journalism border-tag-journalism/30",
  };
  return colors[register] || "bg-muted text-muted-foreground";
};

export const VocabularyCard = ({ entry, onClick }: VocabularyCardProps) => {
  return (
    <Card 
      className="gradient-card shadow-elegant hover:shadow-lg transition-smooth cursor-pointer border-border/50 hover:border-primary/30"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {entry.category && (
                <Badge
                  variant="outline"
                  className="border"
                  style={{
                    backgroundColor: `${entry.category.color}20`,
                    borderColor: `${entry.category.color}50`,
                    color: entry.category.color || undefined,
                  }}
                >
                  <FolderOpen className="w-3 h-3 mr-1" />
                  {entry.category.name}
                </Badge>
              )}
            </div>
            <h3 className="text-2xl font-serif font-semibold text-foreground mb-1">
              {entry.word}
            </h3>
            <p className="text-sm text-muted-foreground">{entry.part_of_speech}</p>
          </div>
          <Badge 
            variant="outline" 
            className={`${getFormalityColor(entry.formality_level)} border font-medium`}
          >
            {entry.formality_level}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-foreground/90">{entry.definition}</p>
        
        {entry.context && (
          <div className="flex gap-2 items-start bg-accent/30 rounded-lg p-3">
            <MessageSquare className="w-4 h-4 mt-0.5 text-primary shrink-0" />
            <p className="text-sm text-foreground/80 italic">{entry.context}</p>
          </div>
        )}

        {entry.specialized_registers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.specialized_registers.map((reg) => (
              <Badge 
                key={reg} 
                variant="outline"
                className={`${getRegisterColor(reg)} border text-xs`}
              >
                {reg}
              </Badge>
            ))}
          </div>
        )}

        {entry.alternatives.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Alternative Forms
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.alternatives.map((alt) => (
                <div 
                  key={alt.id}
                  className="text-xs bg-secondary/10 text-secondary-foreground px-2 py-1 rounded-md border border-secondary/20"
                >
                  {alt.word} <span className="text-muted-foreground">({alt.register})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {entry.cultural_note && (
          <div className="flex gap-2 items-start bg-secondary/10 rounded-lg p-3">
            <Globe className="w-4 h-4 mt-0.5 text-secondary shrink-0" />
            <p className="text-sm text-foreground/80">{entry.cultural_note}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
