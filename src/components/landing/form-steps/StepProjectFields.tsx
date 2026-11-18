"use client";

import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ENERGY_PROFILES, SECTORS, TUNISIAN_GOVERNORATES } from "@/types/const";

const inputClass =
  "h-10 sm:h-11 rounded-xl bg-muted/50 border-border/60 focus-visible:ring-primary/30 transition-colors";

export function StepProjectFields({
  control,
  showAnnualConsumption = false,
  showElectricityBill = true,
  showTaxId = true,
  showSector = false,
}: {
  // Shared by landing + installer; RHF Control is invariant across zod I/O types.
  control: any;
  showAnnualConsumption?: boolean;
  showElectricityBill?: boolean;
  showTaxId?: boolean;
  showSector?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:gap-4">
      {showElectricityBill ? (
        <FormField
          control={control}
          name="electricityBillValue"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel>
                Montant de la facture
                {showAnnualConsumption ? (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    (ou conso. annuelle)
                  </span>
                ) : null}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  min={0}
                  placeholder="Montant en TND"
                  className={inputClass}
                  value={
                    field.value === undefined || field.value === ""
                      ? ""
                      : Number(field.value)
                  }
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : "")
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      {showAnnualConsumption ? (
        <FormField
          control={control}
          name="annualConsumptionKwh"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel>
                Consommation annuelle d&apos;électricité du client (kWh/an)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  min={0}
                  placeholder="ex. 24 000"
                  className={inputClass}
                  value={
                    field.value === undefined || field.value === ""
                      ? ""
                      : Number(field.value)
                  }
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : "")
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      <FormField
        control={control}
        name="energyProfile"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel>Profil énergétique</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={typeof field.value === "string" ? field.value : ""}
            >
              <FormControl>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {ENERGY_PROFILES.map((ep) => (
                  <SelectItem key={ep.type} value={ep.type}>
                    {ep.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      {showTaxId ? (
        <FormField
          control={control}
          name="taxId"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel>Matricule fiscal</FormLabel>
              <FormControl>
                <Input
                  placeholder="1234567A"
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
      {showSector ? (
        <FormField
          control={control}
          name="sector"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel>Secteur d&apos;activité</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={typeof field.value === "string" ? field.value : ""}
              >
                <FormControl>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SECTORS.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      <FormField
        control={control}
        name="governorate"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel>Gouvernorat</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={typeof field.value === "string" ? field.value : ""}
            >
              <FormControl>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {TUNISIAN_GOVERNORATES.map((gov) => (
                  <SelectItem key={gov} value={gov}>
                    {gov}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
