import { Text } from "react-native";
import { Card, CardContent } from "@/components/ui/card";
import { ClientScreenScaffold } from "@/components/client/screen-scaffold";

export default function InformationsScreen() {
  return (
    <ClientScreenScaffold
      eyebrow="Dossier"
      title="Mes informations"
      description="Contrats, factures et documents."
    >
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <Text className="text-sm text-ink-muted">
            Cartes infos / PDF seront branchées ensuite (même endpoints files &
            company).
          </Text>
        </CardContent>
      </Card>
    </ClientScreenScaffold>
  );
}
