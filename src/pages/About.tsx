import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <header className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-foreground">About RegisterVault</h1>
          <p className="mt-2 text-muted-foreground">
            RegisterVault helps you master vocabulary through tone, register, and context. Organize entries,
            categorize them, and filter by formality and specialized registers to focus your learning.
          </p>
        </header>

        <div className="space-y-6">
          <Card className="gradient-card shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">What you can do</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc pl-6 text-sm text-muted-foreground">
                <li>Add, edit, and manage vocabulary entries</li>
                <li>Create categories to group related vocabulary</li>
                <li>Filter by search, formality level, specialized registers, and categories</li>
                <li>Use a clean, focused UI powered by shadcn/ui and Tailwind</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tech stack</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Built with React, Vite, TypeScript, Tailwind CSS, shadcn/ui components, and Supabase for authentication and data.</p>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;