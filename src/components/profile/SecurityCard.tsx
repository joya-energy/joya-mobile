"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChangePassDrawer } from "./changePass-drawer";
import { JoyaSectionHeader } from "@/components/joya";

function SecurityRow({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-slate-100 text-navy [&_svg]:h-[18px] [&_svg]:w-[18px]" aria-hidden>
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold text-navy">{title}</p>
          <p className="text-[13px] text-ink-muted">{description}</p>
        </div>
      </div>
      <div className="shrink-0 sm:ml-4">{action}</div>
    </div>
  );
}

export function SecurityCard() {
  const [openPasswordModal, setOpenDrawerPassword] = useState(false);
  return (
    <Card>
      <CardHeader className="border-b border-line">
        <JoyaSectionHeader
          icon={<ShieldCheck />}
          title="Sécurité"
          description="Protégez l'accès à votre espace Joya."
        />
      </CardHeader>
      <CardContent className="divide-y divide-line pt-5 sm:pt-5">
        <SecurityRow
          icon={<KeyRound />}
          title="Mot de passe"
          description="Modifiez votre mot de passe régulièrement."
          action={
            <Button size="sm" onClick={() => setOpenDrawerPassword(true)}>
              Modifier
            </Button>
          }
        />
        <SecurityRow
          icon={<Smartphone />}
          title="Authentification à deux facteurs"
          description="Ajoutez une couche de sécurité supplémentaire."
          action={
            <Badge tone="neutral" dot>
              Non activée
            </Badge>
          }
        />
        <ChangePassDrawer open={openPasswordModal} onOpenChange={setOpenDrawerPassword} />
      </CardContent>
    </Card>
  );
}
