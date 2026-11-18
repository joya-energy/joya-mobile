"use client";

import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const inputClass =
  "h-10 sm:h-11 rounded-xl bg-muted/50 border-border/60 focus-visible:ring-primary/30 transition-colors";

export function StepContactFields({
  control,
  onEmailChange,
  emailLabel = "Votre email",
  emailPlaceholder = "Votre email",
  phoneLabel = "Numéro de téléphone",
  showPersonNames = true,
  showCompanyName = false,
  contactOptional = false,
}: {
  // Shared by landing + installer; RHF Control is invariant across zod I/O types.
  control: any;
  onEmailChange?: () => void;
  emailLabel?: string;
  emailPlaceholder?: string;
  phoneLabel?: string;
  showPersonNames?: boolean;
  showCompanyName?: boolean;
  /** When true, phone & email labels show "(optionnel)". */
  contactOptional?: boolean;
}) {
  const optionalSuffix = contactOptional ? " (optionnel)" : "";

  return (
    <div className="grid gap-3 sm:gap-4">
      {showCompanyName ? (
        <FormField
          control={control}
          name="companyName"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel>Nom de l&apos;entreprise du client</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nom de l'entreprise du client"
                  className={inputClass}
                  {...field}
                  value={typeof field.value === "string" ? field.value : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      {showPersonNames ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={control}
            name="lastName"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Votre Nom"
                    className={inputClass}
                    {...field}
                    value={typeof field.value === "string" ? field.value : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Votre Prénom"
                    className={inputClass}
                    {...field}
                    value={typeof field.value === "string" ? field.value : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ) : null}
      <FormField
        control={control}
        name="phone"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel>
              {phoneLabel}
              {optionalSuffix}
            </FormLabel>
            <FormControl>
              <Input
                type="tel"
                placeholder="+216 XXX XXX XXX"
                className={inputClass}
                {...field}
                value={typeof field.value === "string" ? field.value : ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel>
              {emailLabel}
              {optionalSuffix}
            </FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder={emailPlaceholder}
                className={inputClass}
                {...field}
                value={typeof field.value === "string" ? field.value : ""}
                onChange={(event) => {
                  field.onChange(event);
                  onEmailChange?.();
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
