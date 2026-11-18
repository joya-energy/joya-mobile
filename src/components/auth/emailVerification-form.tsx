"use client";

import { Button } from "../ui/button";
import { FormControl } from "../ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authApi } from "@/lib/auth/api";
import { useRouter } from "next/navigation";
import { Mail, RefreshCw } from "lucide-react";
import {
  computeRemainingSeconds,
  computeResendCooldownSeconds,
  formatCountdown,
  formatExpiryDateTime,
  maskEmail,
  parseOtpDigits,
  readStoredVerificationWindow,
  RESEND_COOLDOWN_SECONDS,
  storeVerificationWindow,
  VERIFICATION_CODE_TTL_SECONDS,
} from "@/lib/auth/verification-code";
import {
  readLeadFacture,
  storePasswordSetupToken,
} from "@/lib/auth/signup-flow";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;

const otpInputClassName = (opts: {
  hasDigit: boolean;
  isFocused: boolean;
  isExpired: boolean;
}) =>
  cn(
    "h-12 w-11 rounded-lg border bg-white text-center text-xl font-semibold tabular-nums text-stone-900 sm:h-[3.25rem] sm:w-12",
    "shadow-none ring-0 ring-offset-0 outline-none",
    "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
    opts.isExpired && "opacity-50",
    opts.isFocused
      ? "border-landing-primary shadow-[0_0_0_3px_rgba(217,108,78,0.18)]"
      : opts.hasDigit
        ? "border-landing-primary/40"
        : "border-stone-200",
  );

const formSchema = z.object({
  code: z
    .string()
    .length(OTP_LENGTH, "Le code de vérification doit contenir 6 chiffres")
    .regex(/^\d{6}$/, "Le code doit contenir uniquement des chiffres"),
});

type VerificationWindow = {
  expiresAt: Date;
  createdAt: Date;
};

function applyServerClockSkew(
  expiresAt: Date,
  createdAt: Date,
  serverNow?: string,
): VerificationWindow {
  if (!serverNow) return { expiresAt, createdAt };
  const serverMs = new Date(serverNow).getTime();
  if (Number.isNaN(serverMs)) return { expiresAt, createdAt };
  const skewMs = serverMs - Date.now();
  return {
    expiresAt: new Date(expiresAt.getTime() - skewMs),
    createdAt: new Date(createdAt.getTime() - skewMs),
  };
}

export function EmailVerificationForm({
  user_id,
  email,
}: {
  user_id: string;
  email?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [verificationWindow, setVerificationWindow] =
    useState<VerificationWindow | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(
    RESEND_COOLDOWN_SECONDS,
  );
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const otpContainerRef = useRef<HTMLDivElement | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: "" },
  });

  const displayEmail = email?.trim() || null;
  const isExpired = remainingSeconds <= 0 && !isStatusLoading;

  const applyVerificationWindow = useCallback((window: VerificationWindow) => {
    setVerificationWindow(window);
    storeVerificationWindow(user_id, window.expiresAt, window.createdAt);
    setRemainingSeconds(computeRemainingSeconds(window.expiresAt));
    setResendCooldownSeconds(computeResendCooldownSeconds(window.createdAt));
  }, [user_id]);

  const loadVerificationStatus = useCallback(async () => {
    setIsStatusLoading(true);
    try {
      const status = await authApi.getVerificationCodeStatus(user_id);

      if (status.is_verified) {
        if (status.decision === "rejected") {
          const query = new URLSearchParams({ decision: "rejected" });
          if (displayEmail) query.set("email", displayEmail);
          router.replace(`/approval?${query.toString()}`);
          return;
        }
        if (status.already_has_password) {
          const query = new URLSearchParams({
            decision: "approved",
            signup: "complete",
          });
          if (displayEmail) query.set("email", displayEmail);
          router.replace(`/approval?${query.toString()}`);
          return;
        }
        // Verified but password not claimed — resume devis; password link is
        // delivered by email only (status must not expose password_setup_token).
        if (status.approval_email_sent) {
          toast.success(
            "Un lien de création de mot de passe vous a été envoyé par e-mail.",
          );
        }
        const facture =
          status.monthly_electricity_bill ??
          readLeadFacture(user_id) ??
          900;
        const devisQuery = new URLSearchParams({
          facture: String(facture),
        });
        if (displayEmail) devisQuery.set("email", displayEmail);
        router.replace(`/devis-estimatif?${devisQuery.toString()}`);
        return;
      }

      if (
        status.has_active_code &&
        status.expires_at &&
        status.created_at
      ) {
        applyVerificationWindow(
          applyServerClockSkew(
            new Date(status.expires_at),
            new Date(status.created_at),
            status.server_now,
          ),
        );
        return;
      }

      const stored = readStoredVerificationWindow(user_id);
      if (stored.expiresAt && stored.createdAt) {
        applyVerificationWindow({
          expiresAt: stored.expiresAt,
          createdAt: stored.createdAt,
        });
        return;
      }

      setVerificationWindow(null);
      setRemainingSeconds(0);
      setResendCooldownSeconds(0);
    } catch {
      const stored = readStoredVerificationWindow(user_id);
      if (stored.expiresAt && stored.createdAt) {
        applyVerificationWindow({
          expiresAt: stored.expiresAt,
          createdAt: stored.createdAt,
        });
      } else {
        setRemainingSeconds(0);
        setResendCooldownSeconds(0);
      }
    } finally {
      setIsStatusLoading(false);
    }
  }, [applyVerificationWindow, displayEmail, router, user_id]);

  useEffect(() => {
    void loadVerificationStatus();
  }, [loadVerificationStatus]);

  useEffect(() => {
    if (!verificationWindow) return;

    const tick = () => {
      setRemainingSeconds(
        computeRemainingSeconds(verificationWindow.expiresAt),
      );
      setResendCooldownSeconds(
        computeResendCooldownSeconds(verificationWindow.createdAt),
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [verificationWindow]);

  const syncCodeFromDigits = (nextDigits: string[]) => {
    const code = nextDigits.join("");
    form.setValue("code", code, { shouldValidate: true, shouldDirty: true });
    if (code.length === OTP_LENGTH) setError(null);
  };

  const applyDigits = (nextDigits: string[], focusIndex?: number) => {
    setDigits(nextDigits);
    syncCodeFromDigits(nextDigits);
    const idx =
      focusIndex ??
      Math.min(nextDigits.findIndex((d) => !d), OTP_LENGTH - 1);
    requestAnimationFrame(() => {
      inputRefs.current[idx]?.focus();
    });
  };

  const handlePaste = (event: React.ClipboardEvent, startIndex = 0) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text");
    const parsed = parseOtpDigits(pasted, OTP_LENGTH);
    const nextDigits = [...digits];
    for (let i = 0; i < OTP_LENGTH; i++) {
      const targetIndex = startIndex + i;
      if (targetIndex >= OTP_LENGTH) break;
      if (parsed[i]) nextDigits[targetIndex] = parsed[i];
    }
    const lastFilled = Math.min(
      startIndex + parsed.filter(Boolean).length - 1,
      OTP_LENGTH - 1,
    );
    applyDigits(nextDigits, Math.max(startIndex, lastFilled));
  };

  const handleDigitChange = (index: number, value: string) => {
    const numericOnly = value.replace(/\D/g, "");

    if (numericOnly.length > 1) {
      const parsed = parseOtpDigits(numericOnly, OTP_LENGTH);
      const nextDigits = [...digits];
      for (let i = 0; i < OTP_LENGTH; i++) {
        const targetIndex = index + i;
        if (targetIndex >= OTP_LENGTH) break;
        nextDigits[targetIndex] = parsed[i] ?? "";
      }
      const filledCount = parsed.filter(Boolean).length;
      applyDigits(
        nextDigits,
        Math.min(index + Math.max(filledCount - 1, 0), OTP_LENGTH - 1),
      );
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = numericOnly.slice(-1);
    applyDigits(
      nextDigits,
      numericOnly && index < OTP_LENGTH - 1 ? index + 1 : index,
    );
  };

  const handleDigitKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
      return;
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
      return;
    }
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      const prevIndex = index - 1;
      const nextDigits = [...digits];
      nextDigits[prevIndex] = "";
      applyDigits(nextDigits, prevIndex);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authApi.verifyEmail({
        user_id,
        code: data.code,
      });
      toast.success(response.message);

      if (response.decision === "rejected") {
        const query = new URLSearchParams();
        if (displayEmail) query.set("email", displayEmail);
        query.set("decision", "rejected");
        router.push(`/approval?${query.toString()}`);
        return;
      }

      if (response.already_has_password) {
        const query = new URLSearchParams({ decision: "approved", signup: "complete" });
        if (displayEmail) query.set("email", displayEmail);
        router.push(`/approval?${query.toString()}`);
        return;
      }

      if (response.approval_email_sent === false) {
        toast.error(
          "Lien de création de mot de passe indisponible. Vérifiez votre email ou contactez le support.",
        );
      }

      const facture =
        response.monthly_electricity_bill ??
        readLeadFacture(user_id) ??
        900;
      const devisQuery = new URLSearchParams({
        facture: String(facture),
      });
      if (displayEmail) {
        devisQuery.set("email", displayEmail);
      }
      if (response.password_setup_token) {
        storePasswordSetupToken(response.password_setup_token);
        devisQuery.set("token", response.password_setup_token);
      }
      router.push(`/devis-estimatif?${devisQuery.toString()}`);
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { message?: string } };
        message?: string;
        code?: string;
      };
      const errorMessage =
        apiError.response?.data?.message ||
        apiError.message ||
        "Échec de la vérification de l'email. Veuillez réessayer.";

      if (
        errorMessage.toLowerCase().includes("expired") ||
        errorMessage.toLowerCase().includes("expir")
      ) {
        setError("Ce code a expiré. Demandez un nouveau code.");
        setRemainingSeconds(0);
      } else if (apiError.code === "ERR_BAD_REQUEST") {
        setError("Code de vérification incorrect");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onResendEmailVerification = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authApi.resendEmailVerification(user_id);
      toast.success(response.message);

      if (response.expires_at && response.created_at) {
        applyVerificationWindow(
          applyServerClockSkew(
            new Date(response.expires_at),
            new Date(response.created_at),
            response.server_now,
          ),
        );
      } else {
        await loadVerificationStatus();
      }

      applyDigits(Array(OTP_LENGTH).fill(""), 0);
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        apiError.response?.data?.message ||
          apiError.message ||
          "Impossible de renvoyer le code.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const totalDurationSeconds = verificationWindow
    ? Math.max(
        1,
        Math.round(
          (verificationWindow.expiresAt.getTime() -
            verificationWindow.createdAt.getTime()) /
            1000,
        ),
      )
    : VERIFICATION_CODE_TTL_SECONDS;

  const progressPercent = verificationWindow
    ? Math.min(
        100,
        Math.max(0, (remainingSeconds / totalDurationSeconds) * 100),
      )
    : 0;

  const canResend = resendCooldownSeconds <= 0 && !isLoading;
  const expiresAtFullLabel = verificationWindow
    ? formatExpiryDateTime(verificationWindow.expiresAt)
    : null;

  return (
    <Card className="w-full rounded-2xl border-line shadow-joya-lg">
      <CardHeader className="space-y-4 text-center sm:text-left">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-soft text-coral sm:mx-0">
          <Mail className="h-6 w-6" aria-hidden />
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-xl font-semibold text-stone-900">
            Vérifiez votre email
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {displayEmail ? (
              <>
                Code envoyé à{" "}
                <span className="font-medium text-stone-800">
                  {maskEmail(displayEmail)}
                </span>
                . Saisissez les 6 chiffres ci-dessous.
              </>
            ) : (
              "Saisissez le code à 6 chiffres reçu par email."
            )}
          </CardDescription>
        </div>
      </CardHeader>

      <Form {...form}>
        <form method="post" onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-5">
            {error ? (
              <div
                role="alert"
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isStatusLoading
                    ? "Chargement…"
                    : isExpired
                      ? "Code expiré"
                      : "Temps restant"}
                </span>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    isExpired ? "text-warning" : "text-landing-primary",
                  )}
                >
                  {isStatusLoading ? "—" : formatCountdown(remainingSeconds)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-1000 ease-linear",
                    isExpired ? "bg-warning" : "bg-landing-primary",
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {!isStatusLoading && expiresAtFullLabel && verificationWindow ? (
                <p className="text-xs text-muted-foreground">
                  Valable jusqu&apos;au{" "}
                  <time dateTime={verificationWindow.expiresAt.toISOString()}>
                    {expiresAtFullLabel}
                  </time>
                </p>
              ) : null}
            </div>

            <FormField
              control={form.control}
              name="code"
              render={() => (
                <FormItem>
                  <FormLabel>Code de vérification</FormLabel>
                  <FormControl>
                    <div
                      ref={otpContainerRef}
                      className="flex justify-center gap-2 sm:gap-2.5"
                      onPaste={(e) => handlePaste(e, 0)}
                    >
                      {digits.map((digit, index) => (
                        <Input
                          key={index}
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          autoComplete={
                            index === 0 ? "one-time-code" : "off"
                          }
                          aria-label={`Chiffre ${index + 1}`}
                          maxLength={6}
                          disabled={isLoading || isStatusLoading}
                          className={otpInputClassName({
                            hasDigit: Boolean(digit),
                            isFocused: focusedIndex === index,
                            isExpired,
                          })}
                          value={digit}
                          onChange={(e) =>
                            handleDigitChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleDigitKeyDown(index, e)}
                          onPaste={(e) => handlePaste(e, index)}
                          onFocus={(e) => {
                            setFocusedIndex(index);
                            e.target.select();
                          }}
                          onBlur={() => setFocusedIndex(-1)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <p className="text-center text-xs text-muted-foreground sm:text-left">
                    Coller le code entier fonctionne (Ctrl+V).
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t-0 pb-6 pt-1 sm:px-8 sm:pb-8">
            <Button
              type="submit"
              size="lg" className="w-full"
              disabled={
                isLoading ||
                isStatusLoading ||
                isExpired ||
                digits.join("").length !== OTP_LENGTH
              }
            >
              {isLoading ? "Vérification en cours…" : "Vérifier l'email"}
            </Button>
            <button
              type="button"
              onClick={() => void onResendEmailVerification()}
              disabled={!canResend || isLoading || isStatusLoading}
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-coral-dark underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
              />
              {resendCooldownSeconds > 0
                ? `Renvoyer dans ${formatCountdown(resendCooldownSeconds)}`
                : "Renvoyer le code"}
            </button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
