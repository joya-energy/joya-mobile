import { Pressable, Text } from "react-native";
import { Link } from "expo-router";
import { Card, CardContent } from "@/components/ui/card";
import { ClientScreenScaffold } from "@/components/client/screen-scaffold";

export default function WelcomeScreen() {
  return (
    <ClientScreenScaffold
      eyebrow="Bienvenue"
      title="Votre projet solaire Joya"
      description="Suivez l'intégration, le chantier puis le monitoring de votre installation."
    >
      <Card className="rounded-2xl">
        <CardContent className="gap-3 p-5">
          <Text className="text-sm leading-relaxed text-ink-muted">
            Même parcours que sur le web mobile. Continuez vers l&apos;intégration
            lorsque votre dossier est prêt.
          </Text>
          <Link href="/client/onboarding" asChild>
            <Pressable className="rounded-2xl bg-coral px-4 py-3.5">
              <Text className="text-center font-semibold text-white">
                Continuer
              </Text>
            </Pressable>
          </Link>
        </CardContent>
      </Card>
    </ClientScreenScaffold>
  );
}
