import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const languages = [
  { code: "de", name: "Deutsch" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "it", name: "Italiano" },
  { code: "ar", name: "العربية" },
  { code: "ru", name: "Русский" },
  { code: "pt", name: "Português" },
  { code: "tr", name: "Türkçe" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" }
];

export default function LanguageSettings() {
  const { i18n, t } = useTranslation();
  const { toast } = useToast();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  useEffect(() => {
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = (languageCode: string) => {
    try {
      i18n.changeLanguage(languageCode);
      setCurrentLang(languageCode);

      const langName = languages.find(l => l.code === languageCode)?.name;
      toast({
        title: t("language"),
        description: `${t("settings")} - ${langName}`,
      });
    } catch (error) {
      console.error('Language change error:', error);
      toast({
        title: "Error",
        description: "Language change failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold mb-8">{t("language")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {languages.map((language) => (
              <Button
                key={language.code}
                variant={currentLang === language.code ? "default" : "outline"}
                className="justify-between"
                onClick={() => handleLanguageChange(language.code)}
              >
                {language.name}
                {currentLang === language.code && (
                  <Check className="h-4 w-4 ml-2" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}