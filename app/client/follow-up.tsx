import { Text } from "react-native";
import { Card, CardContent } from "@/components/ui/card";
import { ClientScreenScaffold } from "@/components/client/screen-scaffold";

export default function FollowUpScreen() {
  return (
    <ClientScreenScaffold
      eyebrow="Chantier"
      title="Suivi du projet"
      description="Timeline de suivi — même logique que follow-up-timeline web."
    >
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <Text className="text-sm text-ink-muted">
            La timeline détaillée sera branchée ensuite.
          </Text>
        </CardContent>
      </Card>
    </ClientScreenScaffold>
  );
}
