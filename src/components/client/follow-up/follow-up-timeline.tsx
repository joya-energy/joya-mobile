import { useRef, useState, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Svg, { Circle, G } from "react-native-svg";
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  MessageSquare,
  Pencil,
  Sparkles,
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { JoyaEyebrow, JoyaStatusBadge } from "@/components/joya";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { joyaColors, joyaShadows } from "@/theme/colors";

type StageStatus = "completed" | "active" | "pending";

export type FollowUpStage = {
  id: number;
  title: string;
  description: string;
  responsible: string;
  duration: string;
  estimated_date: string | null;
  date_editable: boolean;
  insights: string[];
  sub_steps: { label: string; status: "done" | "in_progress" | "pending" }[];
  status: StageStatus;
};

export type FollowUpDateRequest = {
  _id: string;
  stage_id: number;
  requested_date: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  admin_comment?: string;
};

const FR_MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses `yyyy-mm-dd` as a local date (no timezone shift), else any date string. */
function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const match = DATE_ONLY.exec(iso);
  const d = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(iso: string | null | undefined) {
  const d = parseDate(iso);
  if (!d) return "—";
  return `${String(d.getDate()).padStart(2, "0")} ${FR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Local pill (RN port of the web Badge). */
function Pill({
  tone,
  dot = false,
  children,
}: {
  tone: "coral" | "outline";
  dot?: boolean;
  children: ReactNode;
}) {
  const isCoral = tone === "coral";
  return (
    <View
      className={cn(
        "h-5 flex-row items-center gap-1.5 self-start rounded-full border px-2",
        isCoral
          ? "border-coral/20 bg-coral-soft"
          : "border-line-strong bg-white",
      )}
    >
      {dot ? (
        <View
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            isCoral ? "bg-coral-dark" : "bg-navy",
          )}
        />
      ) : null}
      <Text
        numberOfLines={1}
        className={cn(
          "text-[11px] font-medium",
          isCoral ? "text-coral-dark" : "text-navy",
        )}
      >
        {children}
      </Text>
    </View>
  );
}

const RING_RADIUS = 22;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ProgressRing({ percent }: { percent: number }) {
  const offset = RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE;
  return (
    <View className="h-16 w-16 items-center justify-center">
      <Svg width="100%" height="100%" viewBox="0 0 52 52">
        <G rotation={-90} origin="26, 26">
          <Circle
            cx={26}
            cy={26}
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(23,59,94,0.12)"
            strokeWidth={4}
          />
          <Circle
            cx={26}
            cy={26}
            r={RING_RADIUS}
            fill="none"
            stroke={joyaColors.coral}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </G>
      </Svg>
      <Text className="absolute font-display text-sm font-bold text-navy">
        {percent}%
      </Text>
    </View>
  );
}

export default function FollowUpTimeline({
  stages,
  requests,
  onSubmitDateRequest,
  requestSubmitting = false,
  onEditPanelLayout,
}: {
  stages: FollowUpStage[];
  requests: FollowUpDateRequest[];
  onSubmitDateRequest: (payload: {
    stageId: number;
    requestedDate: string;
    message: string;
  }) => Promise<void>;
  requestSubmitting?: boolean;
  /** Called with the edit panel's y offset (relative to this component) when it opens. */
  onEditPanelLayout?: (y: number) => void;
}) {
  const [editingStage, setEditingStage] = useState<FollowUpStage | null>(null);
  const [newDate, setNewDate] = useState("");
  const [message, setMessage] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const scrollOnLayoutRef = useRef(false);

  const sortedStages = [...stages].sort((a, b) => a.id - b.id);

  const currentStage =
    sortedStages.find((s) => s.status === "active") ||
    sortedStages.find((s) => s.status !== "completed");
  const completedCount = sortedStages.filter((s) => s.status === "completed").length;
  const followUpProgress = sortedStages.length
    ? Math.round((completedCount / sortedStages.length) * 100)
    : 0;

  function openEdit(stage: FollowUpStage) {
    scrollOnLayoutRef.current = true;
    setEditingStage(stage);
    setNewDate(stage.estimated_date?.slice(0, 10) || "");
    setMessage("");
    setPickerOpen(false);
  }

  function handlePanelLayout(event: LayoutChangeEvent) {
    if (!scrollOnLayoutRef.current) return;
    scrollOnLayoutRef.current = false;
    onEditPanelLayout?.(event.nativeEvent.layout.y);
  }

  function handleDateChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === "android") setPickerOpen(false);
    if (event.type === "set" && date) setNewDate(toIsoDate(date));
  }

  async function submitRequest() {
    if (!editingStage || !newDate) return;
    try {
      await onSubmitDateRequest({
        stageId: editingStage.id,
        requestedDate: newDate,
        message,
      });
      toast.success("Demande envoyée à l'administrateur", {
        description: "Vous serez notifié dès qu'elle sera examinée.",
      });
      setEditingStage(null);
      setMessage("");
    } catch {
      toast.error("Impossible d'envoyer la demande.");
    }
  }

  const pickerValue = parseDate(newDate) ?? new Date();

  return (
    <View className="gap-6">
      {/* Hero */}
      <View
        className="gap-4 rounded-2xl border border-line bg-white p-5"
        style={joyaShadows.sm}
      >
        <View className="gap-2">
          <JoyaEyebrow className="mb-0">Installation solaire</JoyaEyebrow>
          <Text className="font-display text-[26px] font-bold leading-tight text-navy">
            Suivi du projet
          </Text>
          <Text className="text-[15px] text-ink-muted">
            Visualisez l&apos;avancement de votre installation solaire étape par étape
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5 self-start rounded-full border border-coral/25 bg-white px-3.5 py-1.5">
          <Sparkles size={14} color={joyaColors.coralDark} />
          <Text className="text-sm font-semibold text-coral-dark">Projet approuvé</Text>
        </View>

        <View className="flex-row gap-3">
          <View
            className="flex-1 rounded-xl border border-line bg-white p-4"
            style={joyaShadows.xs}
          >
            <Text className="mb-1 font-data text-[10.5px] uppercase tracking-[0.1em] text-slate-400">
              Étape actuelle
            </Text>
            <Text className="text-base font-semibold leading-tight text-navy">
              {currentStage?.title ?? "—"}
            </Text>
            <View className="mt-2 flex-row items-center gap-1.5 self-start rounded-full bg-coral-soft px-2.5 py-1">
              <Calendar size={14} color={joyaColors.coralDark} />
              <Text className="font-data text-[11.5px] text-coral-dark">
                {currentStage ? formatDate(currentStage.estimated_date) : "—"}
              </Text>
            </View>
          </View>
          <View
            className="items-center rounded-xl border border-line bg-white px-3 py-3"
            style={joyaShadows.xs}
          >
            <Text className="mb-2 text-center font-data text-[10.5px] uppercase tracking-[0.1em] text-slate-400">
              Avancement
            </Text>
            <ProgressRing percent={followUpProgress} />
          </View>
        </View>
      </View>

      {/* Timeline */}
      <View
        className="rounded-2xl border border-line bg-white p-4"
        style={joyaShadows.sm}
      >
        {sortedStages.length === 0 ? (
          <View className="rounded-2xl border border-coral/25 bg-coral-wash p-6">
            <Text className="text-sm text-navy/70">
              Aucune étape de suivi n&apos;est configurée pour le moment. Votre conseiller
              Joya Energy mettra à jour le planning très prochainement.
            </Text>
          </View>
        ) : null}

        {sortedStages.map((stage, index) => {
          const request = requests.find(
            (r) => r.stage_id === stage.id && r.status === "pending",
          );
          const isLast = index === sortedStages.length - 1;

          return (
            <View key={stage.id} className="flex-row items-stretch gap-3">
              {/* Rail */}
              <View className="w-10 items-center">
                <View
                  className={cn(
                    "h-10 w-10 items-center justify-center rounded-full border-4 border-white",
                    stage.status === "completed" && "bg-coral",
                    stage.status === "active" && "bg-navy",
                    stage.status === "pending" && "bg-slate-100",
                  )}
                  style={[
                    joyaShadows.sm,
                    stage.status === "active"
                      ? { borderColor: "rgba(227,112,81,0.3)" }
                      : null,
                  ]}
                >
                  {stage.status === "completed" ? (
                    <Check
                      size={20}
                      strokeWidth={3}
                      color="#fff"
                      accessibilityLabel="Terminée"
                    />
                  ) : (
                    <Text
                      className={cn(
                        "font-data text-sm font-medium",
                        stage.status === "active" ? "text-white" : "text-slate-500",
                      )}
                    >
                      {stage.id}
                    </Text>
                  )}
                </View>
                {!isLast ? (
                  <View
                    className="mt-1 w-0.5 flex-1 rounded-full"
                    style={{ backgroundColor: "rgba(227,112,81,0.35)" }}
                  />
                ) : null}
              </View>

              {/* Card */}
              <View className={cn("min-w-0 flex-1", !isLast && "pb-6")}>
                <View
                  className={cn(
                    "rounded-xl border bg-white",
                    stage.status === "active"
                      ? "border-coral/40 bg-coral-wash"
                      : "border-line",
                  )}
                  style={stage.status === "active" ? joyaShadows.sm : joyaShadows.xs}
                >
                  <View className="p-4">
                    <View className="mb-3 gap-2">
                      <View className="flex-row flex-wrap items-center gap-2">
                        <Text className="font-data text-[11px] uppercase tracking-[0.1em] text-slate-400">
                          Étape {String(stage.id).padStart(2, "0")}
                        </Text>
                        {stage.status === "completed" ? (
                          <JoyaStatusBadge status="success" label="Terminée" size="sm" />
                        ) : null}
                        {stage.status === "active" ? (
                          <Pill tone="coral" dot>
                            En cours
                          </Pill>
                        ) : null}
                        {stage.status === "pending" ? (
                          <JoyaStatusBadge status="neutral" label="À venir" size="sm" />
                        ) : null}
                        <Pill tone="outline">{stage.responsible}</Pill>
                      </View>
                      <Text className="font-display text-lg font-bold tracking-tight text-navy">
                        {stage.title}
                      </Text>
                    </View>

                    <View className="mb-3 flex-row flex-wrap items-center gap-2">
                      <View className="rounded-lg bg-cream px-3 py-2">
                        <Text className="font-data text-[10px] uppercase tracking-[0.1em] text-slate-400">
                          Date planifiée
                        </Text>
                        <Text className="text-sm font-semibold text-navy">
                          {formatDate(stage.estimated_date)}
                        </Text>
                      </View>
                      {stage.date_editable && stage.status !== "completed" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => openEdit(stage)}
                          className="gap-1.5"
                        >
                          <Pencil size={12} color={joyaColors.navy} />
                          <Text className="text-xs font-semibold text-navy">Modifier</Text>
                        </Button>
                      ) : null}
                    </View>

                    <Text className="mb-3 text-sm leading-relaxed text-ink-muted">
                      {stage.description}
                    </Text>

                    {request ? (
                      <View className="mb-3 flex-row items-start gap-3 rounded-lg border border-warning/25 bg-warning-soft p-3">
                        <AlertCircle
                          size={16}
                          color={joyaColors.warning}
                          style={{ marginTop: 2 }}
                        />
                        <View className="flex-1">
                          <Text className="text-sm font-medium text-navy">
                            Nouvelle date proposée : {formatDate(request.requested_date)}
                          </Text>
                          <Text className="mt-0.5 text-xs text-ink-muted">
                            En attente de validation par l&apos;administrateur
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    <View className="gap-3 border-t border-line pt-3">
                      <View className="flex-row flex-wrap gap-x-4 gap-y-1.5">
                        {stage.sub_steps.map((sub, i) => (
                          <View key={i} className="flex-row items-center gap-1.5">
                            <View
                              className={cn(
                                "h-2 w-2 rounded-full",
                                sub.status === "done" && "bg-coral",
                                sub.status === "in_progress" && "bg-navy",
                                sub.status === "pending" && "bg-slate-300",
                              )}
                              style={
                                sub.status === "in_progress"
                                  ? {
                                      borderWidth: 2,
                                      borderColor: "rgba(227,112,81,0.3)",
                                      width: 12,
                                      height: 12,
                                      borderRadius: 6,
                                    }
                                  : undefined
                              }
                            />
                            <Text
                              className={cn(
                                "text-xs",
                                sub.status === "done" && "text-navy",
                                sub.status === "in_progress" && "font-medium text-navy",
                                sub.status === "pending" && "text-ink-muted",
                              )}
                            >
                              {sub.label}
                            </Text>
                          </View>
                        ))}
                      </View>
                      <View className="flex-row items-center gap-1.5">
                        <Clock size={14} color={joyaColors.blue} />
                        <Text className="text-xs text-ink-muted">
                          Durée : {stage.duration}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Edit panel */}
      {editingStage ? (
        <View
          onLayout={handlePanelLayout}
          className="rounded-2xl border border-coral/30 bg-white p-5"
          style={joyaShadows.md}
        >
          <JoyaEyebrow>Demande de modification</JoyaEyebrow>
          <Text className="font-display text-lg font-bold text-navy">
            Proposer une nouvelle date
          </Text>
          <Text className="mt-1 text-sm text-ink-muted">
            Étape {editingStage.id} — {editingStage.title}. Votre proposition sera examinée
            par un administrateur Joya Energy.
          </Text>

          <View className="mt-4 gap-4">
            <View>
              <Label>Date actuelle</Label>
              <View className="h-11 justify-center rounded-xl border border-line bg-slate-50 px-3 opacity-70">
                <Text className="text-base text-navy">
                  {formatDate(editingStage.estimated_date)}
                </Text>
              </View>
            </View>

            <View>
              <Label>Nouvelle date souhaitée</Label>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choisir la nouvelle date"
                onPress={() => setPickerOpen((open) => !open)}
                className="h-11 flex-row items-center justify-between rounded-xl border border-line bg-white px-3 active:opacity-80"
              >
                <Text
                  className={cn(
                    "text-base",
                    newDate ? "text-navy" : "text-navy/40",
                  )}
                >
                  {newDate ? formatDate(newDate) : "Choisir une date"}
                </Text>
                <Calendar size={18} color={joyaColors.blue} />
              </Pressable>
              {pickerOpen ? (
                <DateTimePicker
                  value={pickerValue}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  accentColor={joyaColors.coral}
                  onChange={handleDateChange}
                />
              ) : null}
            </View>

            <View>
              <View className="mb-1.5 flex-row items-center gap-1.5">
                <MessageSquare size={14} color={joyaColors.navy} />
                <Text className="text-sm font-medium text-navy">Message (optionnel)</Text>
              </View>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Expliquez la raison de votre demande..."
                placeholderTextColor="rgba(23,59,94,0.4)"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="min-h-[96px] rounded-xl border border-line bg-white px-3 py-3 text-base leading-relaxed text-navy"
              />
            </View>

            <View className="gap-2">
              <Button
                onPress={() => void submitRequest()}
                disabled={!newDate}
                loading={requestSubmitting}
              >
                Envoyer la demande
              </Button>
              <Button variant="outline" onPress={() => setEditingStage(null)}>
                Annuler
              </Button>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
