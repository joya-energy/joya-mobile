import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { UserRound } from "lucide-react-native";
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
import { toast } from "@/lib/toast";
import { PasswordField } from "@/components/auth/password-field";
import { Link } from "expo-router";
import { sessionStorage } from "@/platform/storage";
import { joyaColors } from "@/theme/colors";

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
      try {
        await Promise.race([
          authApi.logout(),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("logout-timeout")), 2500);
          }),
        ]);
      } catch {
        // ignore
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
          code === "ERR_NETWORK" || message?.includes("Network Error");
        if (!isNetwork) throw firstErr;
        await new Promise((r) => setTimeout(r, 800));
        response = await authApi.login(credentials);
      }

      if (!response.is_verified) {
        if (!response.user.email) {
          setError(
            "Compte non vérifié. Contactez le support ou utilisez le lien d'invitation reçu.",
          );
          return;
        }
        toast.info(
          "Veuillez vérifier votre email pour accéder à votre compte",
        );
        sessionStorage.setItem(
          `verify_email_${response.user.id}`,
          response.user.email,
        );
        router.push(
          `/auth/email-verification/${response.user.id}` as never,
        );
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
          // Installer portal out of v1 scope — send to client home for now
          router.replace("/client" as never);
        } else {
          let homePath = getRoleAwareHomePath(role, "welcome");
          try {
            const journey = await journeyApi.getJourney();
            homePath = getRoleAwareHomePath(role, journey.phase);
          } catch {
            // Fall back to welcome
          }
          router.replace(homePath as never);
        }
        toast.success("Connexion réussie");
      } catch (sessionErr: unknown) {
        const status = (sessionErr as { response?: { status?: number } })
          ?.response?.status;
        if (status === 401 || status === 403) {
          setError(
            "Identifiants acceptés, mais la session n’a pas pu être enregistrée. Réessayez.",
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

      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("Network Error")
      ) {
        setError(
          "Erreur réseau : Impossible de se connecter au serveur. Vérifiez EXPO_PUBLIC_API_URL et que core-api tourne.",
        );
        return;
      }
      if (error.response?.status === 401 || error.response?.status === 400) {
        setError("Identifiants incorrects");
        return;
      }

      setError(
        error.response?.data?.message ||
          error.message ||
          "Échec de la connexion. Veuillez réessayer.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full rounded-2xl border-line">
      <CardHeader className="gap-2 pb-2">
        <JoyaEyebrow>Espace Joya</JoyaEyebrow>
        <CardTitle className="text-[1.75rem] font-bold">Connexion</CardTitle>
        <CardDescription>
          Connectez-vous avec votre e-mail ou votre numéro de téléphone.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <View>
          <CardContent className="gap-5 pt-4">
            {error ? (
              <Alert tone="danger" title="Connexion impossible">
                {error}
              </Alert>
            ) : null}

            <FormField
              control={form.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormItem>
                  <FormLabel>E-mail ou téléphone</FormLabel>
                  <View>
                    <View className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2">
                      <UserRound size={16} color={joyaColors.blueLight} />
                    </View>
                    <FormControl>
                      <Input
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="username"
                        placeholder="vous@exemple.com ou +216…"
                        className="pl-10"
                      />
                    </FormControl>
                  </View>
                  <FormMessage />
                </FormItem>
              )}
            />

            <View className="gap-2">
              <PasswordField
                control={form.control}
                name="password"
                label="Mot de passe"
                autoComplete="current-password"
              />
              <Link
                href="/auth/forgot-password"
                className="self-end text-[13px] font-semibold text-coral-dark"
              >
                Mot de passe oublié ?
              </Link>
            </View>

            <Button
              size="lg"
              className="w-full pr-2.5"
              loading={isLoading}
              onPress={() => {
                void form.handleSubmit(onSubmit)();
              }}
            >
              <Text className="flex-1 text-center font-semibold text-white">
                {isLoading ? "Connexion en cours…" : "Se connecter"}
              </Text>
              {!isLoading ? <ButtonPuck /> : null}
            </Button>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4 border-t-0 px-5 pb-6 pt-2">
            <View className="rounded-xl border border-line bg-cream p-4">
              <Text className="text-[13px] leading-relaxed text-ink-muted">
                Pas encore de compte ? La création s&apos;effectue via la demande
                de financement solaire.
              </Text>
            </View>
            <Link href="/" asChild>
              <Text className="self-center text-sm font-medium text-navy">
                ← Retour
              </Text>
            </Link>
          </CardFooter>
        </View>
      </Form>
    </Card>
  );
}
