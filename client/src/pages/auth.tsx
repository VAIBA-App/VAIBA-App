import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Key, Activity } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Facebook } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  password: z.string().min(6, "Das Passwort muss mindestens 6 Zeichen lang sein"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Der Name muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  password: z.string().min(6, "Das Passwort muss mindestens 6 Zeichen lang sein"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Die Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [_location, navigate] = useLocation();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginForm) => {
    try {
      await loginMutation.mutateAsync(data);
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const onRegisterSubmit = async (data: RegisterForm) => {
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registerData } = data;
      await registerMutation.mutateAsync(registerData);
      navigate("/");
    } catch (error) {
      console.error("Registration failed:", error);
      // Error handling is already done in the auth hook's onError callback
      // which will show the toast with the server's error message
    }
  };

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Authentifizierungs-Formular */}
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Willkommen bei VAIBA</CardTitle>
            <CardDescription>
              Melden Sie sich an, um Ihre KI-gestützte Verkaufsunterstützung zu starten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Anmelden</TabsTrigger>
                <TabsTrigger value="register">Registrieren</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-Mail</FormLabel>
                          <FormControl>
                            <Input placeholder="name@firma.de" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passwort</FormLabel>
                          <FormControl>
                            <Input placeholder="••••••••" type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Anmeldung..." : "Anmelden"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Max Mustermann" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-Mail</FormLabel>
                          <FormControl>
                            <Input placeholder="name@firma.de" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passwort</FormLabel>
                          <FormControl>
                            <Input placeholder="••••••••" type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passwort bestätigen</FormLabel>
                          <FormControl>
                            <Input placeholder="••••••••" type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Registrierung..." : "Registrieren"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Oder fortfahren mit
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="w-full" onClick={() => window.location.href = "/api/auth/google"}>
                <SiGoogle className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = "/api/auth/facebook"}>
                <Facebook className="mr-2 h-4 w-4" />
                Facebook
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hero-Sektion */}
      <div className="hidden md:flex flex-col justify-center p-8 bg-primary text-primary-foreground">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className="text-4xl font-bold">VAIBA - Virtueller AI Business Agent</h1>
          <p className="text-lg">
            Revolutionieren und automatisieren Sie Ihr Unternehmen mit künstlicher Intelligenz. VAIBA unterstützt Sie bei:
          </p>
          <ul className="space-y-4 list-none">
            <li className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Intelligente Kommunikationsanalyse</span>
            </li>
            <li className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Personalisierte Verkaufsstrategien</span>
            </li>
            <li className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Personalisierte Verkaufsstrategien</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}