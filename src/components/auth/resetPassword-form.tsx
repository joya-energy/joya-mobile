"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authApi } from "@/lib/auth/api";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { useState } from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { PasswordFields } from "@/components/auth/password-field";
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirm_password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});
type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export function ResetPasswordForm({ token }: { token: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: ResetPasswordSchema) => {
    if (data.password !== data.confirm_password) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.resetPassword(token, data.password);
      toast.success(response.message);
      router.push("/auth/login");
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
        code?: string;
      };
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Échec de la réinitialisation du mot de passe. Veuillez réessayer.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Card className="w-full rounded-2xl border-line shadow-joya-lg">
      <CardHeader className="gap-2 sm:px-8 sm:pt-8">
        <CardTitle className="text-2xl font-bold tracking-[-0.03em]">Réinitialiser votre mot de passe</CardTitle>
        <CardDescription>
          Entrez votre nouveau mot de passe pour réinitialiser votre mot de
          passe
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form method="post" onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            {error && (
              <div className="rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-3 text-sm text-danger-strong">
                {error}
              </div>
            )}
            <PasswordFields
              control={form.control}
              passwordName="password"
              passwordLabel="Mot de passe"
              confirmName="confirm_password"
            />
          </CardContent>
          <CardFooter className="border-t-0 pb-6 pt-1 sm:px-8 sm:pb-8">
            <Button
              type="submit"
              size="lg" className="w-full"
              disabled={isLoading}
            >
              {isLoading
                ? "Réinitialisation en cours..."
                : "Réinitialiser le mot de passe"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
