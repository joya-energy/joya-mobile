"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, ButtonPuck } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { JoyaEyebrow } from "@/components/joya";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authApi } from "@/lib/auth/api";
import { useAuth } from "@/contexts/auth-context";
import { getRoleAwareHomePath, isInstaller } from "@/lib/auth/roles";
import { journeyApi } from "@/lib/journey/api";
import type { LoginRequest, LoginResponse } from "@/types/auth";
import { toast } from "sonner";
import { ArrowLeft, UserRound } from "lucide-react";
import { PasswordField } from "@/components/auth/password-field";

function isValidLoginIdentifier(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes("@")) {
    return z.string().email().safeParse(trimmed).success;
  }
  const digits = trimmed.replace(/\D/g, "");
  return (
    digits.length === 8 ||
    (digits.length >= 10 && digits.length <= 15) ||
    (digits.length === 11 && digits.startsWith("216"))
  );
}

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "E-mail ou numéro de téléphone requis")
    .refine(
      isValidLoginIdentifier,
      "Saisissez un e-mail valide ou un numéro de téléphone (8 chiffres, ou +216…)",
    ),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      // Drop any previous session first so a stale refresh cannot overwrite
      // the new login cookies (shared localhost cookie jar).
      try {
        await Promise.race([
          authApi.logout(),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("logout-timeout")), 2500);
          }),
        ]);
      } catch {
        // ignore — may already be logged out or API still starting
      }

      const credentials = {
        ...data,
        email: data.email.trim(),
      };
      let response: LoginResponse;
      try {
        response = await authApi.login(credentials);
      } catch (firstErr: unknown) {
        const code = (firstErr as { code?: string }).code;
        const message = (firstErr as { message?: string }).message;
        const isNetwork =
          code === "ERR_NETWORK" ||
          message?.includes("Network Error");
        if (!isNetwork) throw firstErr;
        await new Promise((r) => setTimeout(r, 800));
        response = await authApi.login(credentials);
      }
      if (!response.is_verified && typeof window !== "undefined") {
        if (!response.user.email) {
          setError(
            "Compte non vérifié. Contactez le support ou utilisez le lien d'invitation reçu.",
          );
          return;
        }
        toast.warning(
          "Veuillez vérifier votre email pour accéder à votre compte",
        );
        sessionStorage.setItem(
          `verify_email_${response.user.id}`,
          response.user.email,
        );
        router.push(`/auth/emailVerification/${response.user.id}`);
        await authApi.resendEmailVerification(response.user.id);
        toast.success("Code de vérification envoyé à votre email");
        return;
      }

      try {
        await login({
          id: response.user.id,
          email: response.user.email,
          role: response.user.role as import("@/types/auth").User["role"],
          full_name: response.user.full_name ?? undefined,
        });

        const { user: currentUser } = await authApi.getCurrentUser();
        const role = currentUser.role ?? response.user.role;

        if (isInstaller(role)) {
          router.replace("/installateur");
        } else {
          let homePath = getRoleAwareHomePath(role, "welcome");
          try {
            const journey = await journeyApi.getJourney();
            homePath = getRoleAwareHomePath(role, journey.phase);
          } catch {
            // Fall back to welcome for client accounts; journey provider will correct.
          }
          router.replace(homePath);
        }
        toast.success("Connexion réussie");
      } catch (sessionErr: unknown) {
        const status = (sessionErr as { response?: { status?: number } })
          ?.response?.status;
        if (status === 401 || status === 403) {
          setError(
            "Identifiants acceptés, mais la session n’a pas pu être enregistrée. Réessayez, ou utilisez un autre navigateur si la navigation privée bloque les cookies.",
          );
          return;
        }
        throw sessionErr;
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
        code?: string;
      };

      // Handle network errors
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("Network Error")
      ) {
        setError(
          "Erreur réseau : Impossible de se connecter au serveur. Veuillez vérifier si le backend est en cours d'exécution.",
        );
        console.error("Network error:", err);
        return;
      }
      if (error.response?.status === 401 || error.response?.status === 400) {
        setError("Identifiants incorrects");
        return;
      }

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Échec de la connexion. Veuillez réessayer.";
      setError(errorMessage);
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full rounded-2xl border-line shadow-joya-lg">
      <CardHeader className="gap-2 pb-2 sm:px-8 sm:pt-8">
        <JoyaEyebrow>Espace Joya</JoyaEyebrow>
        <CardTitle className="text-[1.75rem] font-bold leading-tight tracking-[-0.03em]">
          Connexion
        </CardTitle>
        <CardDescription>
          Connectez-vous avec votre e-mail ou votre numéro de téléphone.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form method="post" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-5 pt-4 sm:px-8">
            {error && (
              <Alert tone="danger" title="Connexion impossible">
                {error}
              </Alert>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail ou téléphone</FormLabel>
                  <div className="relative">
                    <UserRound
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="email"
                        autoComplete="username"
                        placeholder="vous@exemple.com ou +216…"
                        className="pl-10"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <PasswordField
                control={form.control}
                name="password"
                label="Mot de passe"
                autoComplete="current-password"
              />
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="rounded-sm text-[13px] font-semibold text-coral-dark underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full pr-2.5"
              loading={isLoading}
            >
              <span className="flex-1 text-center">
                {isLoading ? "Connexion en cours…" : "Se connecter"}
              </span>
              {!isLoading ? <ButtonPuck /> : null}
            </Button>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4 border-t-0 px-5 pb-6 pt-2 sm:px-8 sm:pb-8">
            <div className="rounded-xl border border-line bg-cream/70 p-4 text-[13px] leading-relaxed text-ink-muted">
              Pas encore de compte ? La création de compte s&apos;effectue uniquement
              via la page de{" "}
              <Link href="/" className="font-semibold text-coral-dark underline-offset-4 hover:underline">
                demande de financement solaire
              </Link>
              .
            </div>
            <Button variant="ghost" size="sm" className="self-center" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Retour à la demande de financement
              </Link>
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
