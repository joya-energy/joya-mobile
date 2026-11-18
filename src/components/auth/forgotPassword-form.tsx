"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
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

import { toast } from "sonner";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Veuillez entrer une adresse email valide")
    .regex(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      "Veuillez entrer une adresse email valide",
    ),
});

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<{ email: string }>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    try {
      const response = await authApi.requestPasswordReset(data.email);
      toast.success(response.message);
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full rounded-2xl border-line shadow-joya-lg">
      <CardHeader className="gap-2 sm:px-8 sm:pt-8">
        <CardTitle className="text-2xl font-bold tracking-[-0.03em]">Réinitialisez votre mot de passe</CardTitle>
        <CardDescription>
          Entrez votre email pour recevoir un lien pour réinitialiser votre mot
          de passe
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form
          method="post"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <CardContent>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden
                      />
                      <Input
                        type="email"
                        placeholder="vous@exemple.com"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormMessage />
          </CardContent>

          <CardFooter className="border-t-0 pb-6 pt-1 sm:px-8 sm:pb-8">
            <Button
              type="submit"
              size="lg" className="w-full"
              disabled={isLoading}
            >
              {isLoading
                ? "Envoi en cours..."
                : "Envoyer le lien de réinitialisation de mot de passe"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
