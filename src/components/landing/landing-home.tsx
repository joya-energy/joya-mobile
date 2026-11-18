"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/landing/header";
import {
  RightCard,
  type LandingHeroMode,
} from "@/components/landing/rightCard";
import {
  SteperForm,
  clearSolarRequestFormDraft,
  type SolarRequestFormValues,
} from "@/components/landing/steperForm";
import { InstallateurRegisterFields } from "@/components/installateurs/installateur-register-fields";
import { authApi } from "@/lib/auth/api";
import { storeVerificationWindow } from "@/lib/auth/verification-code";
import { storeLeadFacture } from "@/lib/auth/signup-flow";
import type { RegisterResponse } from "@/types/auth";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { translateUserMessage } from "@/lib/user-messages";

function isAccountExistsMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("compte existe") ||
    lower.includes("connectez-vous") ||
    lower.includes("déjà été acceptée") ||
    lower.includes("numéro de téléphone")
  );
}

function redirectToEmailVerification(
  router: ReturnType<typeof useRouter>,
  email: string,
  response: RegisterResponse,
  electricityBillValue: number,
) {
  const verificationTargetId = response.user?.id ?? response.lead.id;
  sessionStorage.setItem(`verify_email_${verificationTargetId}`, email);
  storeLeadFacture(verificationTargetId, electricityBillValue);

  if (response.verification_expires_at && response.verification_created_at) {
    storeVerificationWindow(
      verificationTargetId,
      new Date(response.verification_expires_at),
      new Date(response.verification_created_at),
    );
  }

  router.push(
    `/auth/emailVerification/${verificationTargetId}?email=${encodeURIComponent(email)}`,
  );
}

function parseLandingMode(raw: string | null): LandingHeroMode {
  return raw === "installateur" ? "installateur" : "client";
}

function LandingHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = parseLandingMode(searchParams.get("view"));
  const [registrationError, setRegistrationError] = useState<string | null>(
    null,
  );

  const setMode = useCallback(
    (next: LandingHeroMode) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "installateur") {
        params.set("view", "installateur");
      } else {
        params.delete("view");
      }
      const query = params.toString();
      router.replace(query ? `/?${query}` : "/", { scroll: false });
    },
    [router, searchParams],
  );

  const handleRequestSubmit = async (form: SolarRequestFormValues) => {
    setRegistrationError(null);

    try {
      const response = await authApi.register({
        email: form.email,
        phone: form.phone,
        full_name: `${form.firstName} ${form.lastName}`,
        leadApp: {
          monthlyElectricityBillValue: form.electricityBillValue,
          energyProfile: form.energyProfile,
          taxId: form.taxId.replace(/\s+/g, "").toUpperCase(),
          governorate: form.governorate,
          contactName: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phoneNumber: form.phone,
        },
      });

      clearSolarRequestFormDraft();

      if (response.resume_verification) {
        notifySuccess(
          response.message ||
            "Un nouveau code de vérification vous a été envoyé.",
        );
      } else {
        notifySuccess("Demande de financement solaire soumise avec succès");
      }

      redirectToEmailVerification(
        router,
        form.email,
        response,
        form.electricityBillValue,
      );
    } catch (error) {
      const apiMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message;
      const message = translateUserMessage(
        apiMessage,
        "Erreur lors de la soumission de la demande",
      );

      setRegistrationError(message);

      if (isAccountExistsMessage(message)) {
        notifyError({
          title: "Compte existant",
          message,
          action: {
            label: "Se connecter",
            onClick: () => router.push("/auth/login"),
          },
        });
      } else {
        notifyError({ message });
      }

      throw error;
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="w-full flex-1">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col justify-center lg:flex-row lg:items-stretch">
          <div className="mx-auto flex w-full min-w-0 flex-1 flex-col px-4 py-6 xs:px-6 sm:px-8 md:px-10 sm:py-8 lg:mx-0 lg:max-w-[800px] lg:py-10 lg:pl-12 lg:pr-10 xl:pl-16 xl:pr-12">
            {mode === "installateur" ? (
              <InstallateurRegisterFields
                key="installateur"
                onSwitchToFinancing={() => setMode("client")}
              />
            ) : (
              <SteperForm
                key="client"
                onRequestSubmit={handleRequestSubmit}
                registrationError={registrationError}
                onClearRegistrationError={() => setRegistrationError(null)}
                onSwitchToInstallateur={() => setMode("installateur")}
              />
            )}
          </div>
          <aside className="relative hidden min-h-[calc(100vh-80px)] min-w-[480px] flex-1 flex-col lg:flex">
            <RightCard mode={mode} />
          </aside>
        </div>
      </main>
    </div>
  );
}

export function LandingHome() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full flex-col">
          <Header />
          <main className="w-full flex-1" />
        </div>
      }
    >
      <LandingHomeContent />
    </Suspense>
  );
}
