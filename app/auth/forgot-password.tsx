import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { authApi } from "@/lib/auth/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JoyaEyebrow } from "@/components/joya";
import { toast } from "@/lib/toast";

const schema = z.object({
  email: z.string().email("E-mail invalide"),
});

export default function ForgotPasswordScreen() {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setLoading(true);
    try {
      await authApi.requestPasswordReset(data.email.trim().toLowerCase());
      setDone(true);
      toast.success("Si un compte existe, un e-mail a été envoyé.");
    } catch {
      toast.error("Impossible d'envoyer la demande. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          className="px-5"
          keyboardShouldPersistTaps="handled"
        >
          <Card className="rounded-2xl">
            <CardHeader>
              <JoyaEyebrow>Sécurité</JoyaEyebrow>
              <CardTitle>Mot de passe oublié</CardTitle>
              <CardDescription>
                Entrez votre e-mail pour recevoir un lien de réinitialisation.
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              {done ? (
                <Alert tone="success" title="Demande envoyée">
                  Vérifiez votre boîte mail (et les spams).
                </Alert>
              ) : (
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            placeholder="vous@exemple.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    loading={loading}
                    onPress={() => {
                      void form.handleSubmit(onSubmit)();
                    }}
                  >
                    Envoyer le lien
                  </Button>
                </Form>
              )}
              <Link href="/auth/login" asChild>
                <Text className="mt-2 text-center text-sm font-medium text-coral-dark">
                  Retour à la connexion
                </Text>
              </Link>
            </CardContent>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
