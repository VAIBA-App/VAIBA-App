import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/theme-context";
import { useToast } from "@/hooks/use-toast";

export default function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const applyTheme = () => {
    setTheme(theme === "light" ? "light" : "dark");
    toast({
      title: "Design geändert",
      description: `Das App-Design wurde auf ${theme === 'light' ? 'Light' : 'Dark'} Mode umgestellt.`,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold mb-8">Erscheinungsbild</h1>
      <Card>
        <CardHeader>
          <CardTitle>Theme auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              className="w-full flex-1 py-8"
              onClick={() => setTheme("light")}
            >
              <Sun className="mr-2 h-5 w-5" />
              Light Mode
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              className="w-full flex-1 py-8"
              onClick={() => setTheme("dark")}
            >
              <Moon className="mr-2 h-5 w-5" />
              Dark Mode
            </Button>
          </div>
          <Button 
            onClick={applyTheme} 
            className="mt-6"
          >
            Aktivieren
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}