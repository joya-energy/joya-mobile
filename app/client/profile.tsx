import { Pressable, Text, View } from "react-native";
import { Card, CardContent } from "@/components/ui/card";
import { ClientScreenScaffold } from "@/components/client/screen-scaffold";
import { useAuth } from "@/contexts/auth-context";
import { authApi } from "@/lib/auth/api";
import { toast } from "@/lib/toast";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const onDelete = async () => {
    try {
      await authApi.deleteAccount();
      toast.success("Compte supprimé");
      logout();
    } catch {
      toast.error("Suppression impossible pour le moment.");
    }
  };

  return (
    <ClientScreenScaffold eyebrow="Compte" title="Profil">
      <Card className="mb-3 rounded-2xl">
        <CardContent className="gap-1 p-5">
          <Text className="text-sm text-ink-muted">Nom</Text>
          <Text className="text-base font-semibold text-navy">
            {user?.full_name || "—"}
          </Text>
          <Text className="mt-3 text-sm text-ink-muted">E-mail</Text>
          <Text className="text-base font-semibold text-navy">
            {user?.email || "—"}
          </Text>
          <Text className="mt-3 text-sm text-ink-muted">Rôle</Text>
          <Text className="text-base font-semibold text-navy">
            {user?.role || "—"}
          </Text>
        </CardContent>
      </Card>

      <View className="gap-2">
        <Pressable
          onPress={logout}
          className="rounded-2xl border border-line bg-white px-4 py-3.5"
        >
          <Text className="text-center font-semibold text-navy">
            Déconnexion
          </Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3.5"
        >
          <Text className="text-center font-semibold text-danger-strong">
            Supprimer mon compte
          </Text>
        </Pressable>
      </View>
    </ClientScreenScaffold>
  );
}
