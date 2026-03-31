import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, LayoutAnimation, Modal, Platform, Pressable, StyleSheet, TextInput, UIManager, View } from "react-native";
import Svg, { Circle, Ellipse, Line, Rect } from "react-native-svg";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { getReferenceWorkoutById, type ReferenceWorkout, type ReferenceWorkoutEntry } from "@/features/workouts/data/referenceWorkoutsCatalog";
import { useWorkoutSession } from "@/features/workout-session/hooks/useWorkoutSession";
import { asyncStorageService } from "@/services/storage/asyncStorage";
import { useAppStore, type ActiveWorkout, type WorkoutSessionDraft } from "@/store/appStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import { radius, spacing, type ThemeColors } from "@/theme/tokens";

import type { RootStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "WorkoutSession">;
type IconName = keyof typeof MaterialIcons.glyphMap;
type Intensity = "Low" | "Moderate" | "High";
type SetLoggingMode = "weight_reps" | "seconds";
type ExerciseSchematicType =
  | "squat"
  | "shoulder_press"
  | "row"
  | "chest_press"
  | "plank_tap"
  | "mobility"
  | "lunge"
  | "child_pose"
  | "hamstring_stretch";

type SimpleExercise = {
  id: string;
  name: string;
  details: string;
  exampleSchematic: ExerciseSchematicType;
  icon: IconName;
  exampleDetail?: string | null;
};

type MainSet = {
  id: string;
  name: string;
  target: string;
  sets: number;
  reps: string;
  loggingMode: SetLoggingMode;
  timeUnit?: "mins" | "seconds";
  exampleSchematic: ExerciseSchematicType;
  icon: IconName;
  exampleDetail?: string | null;
  hideSetCount?: boolean;
};

type SetLogEntry = {
  weightKg: string;
  reps: string;
  seconds: string;
};
type CustomLogField = "durationInput" | "weightKg" | "reps";

type LastExerciseLog = {
  weightKg?: string;
  reps?: string;
  seconds?: string;
  updatedAtIso: string;
};

type LastExerciseLogMap = Record<string, Array<LastExerciseLog | null>>;

type ExerciseExample = {
  name: string;
  schematicType: ExerciseSchematicType;
  detail?: string | null;
};

type PremiumWorkoutMeta = {
  title: string;
  durationMinutes: number;
  phaseLabel: string;
};

const CUSTOM_FIELD_IDS: Record<CustomLogField, string> = {
  durationInput: "custom:durationInput",
  weightKg: "custom:weightKg",
  reps: "custom:reps"
};

const freeExercises: SimpleExercise[] = [
  {
    id: "free-1",
    name: "Goblet Squats",
    details: "Lower Body - Strength",
    exampleSchematic: "squat",
    icon: "fitness-center"
  },
  {
    id: "free-2",
    name: "Shoulder Press",
    details: "Upper Body - Power",
    exampleSchematic: "shoulder_press",
    icon: "sports-handball"
  },
  {
    id: "free-3",
    name: "Single-Arm Rows",
    details: "Upper Back - Strength",
    exampleSchematic: "row",
    icon: "sports-gymnastics"
  }
];

const warmupExercises: SimpleExercise[] = [
  {
    id: "warm-1",
    name: "Neck and Shoulder Circles",
    details: "1 minute",
    exampleSchematic: "mobility",
    icon: "sync-alt"
  },
  {
    id: "warm-2",
    name: "Dynamic Side Lunges",
    details: "2 minutes",
    exampleSchematic: "lunge",
    icon: "directions-run"
  },
  {
    id: "warm-3",
    name: "Arm Swings and Reach",
    details: "2 minutes",
    exampleSchematic: "mobility",
    icon: "accessibility-new"
  }
];

const mainSets: MainSet[] = [
  {
    id: "set-1",
    name: "Goblet Squats",
    target: "Target: Quads and Glutes",
    sets: 3,
    reps: "12 Reps",
    loggingMode: "weight_reps",
    exampleSchematic: "squat",
    icon: "fitness-center"
  },
  {
    id: "set-2",
    name: "Dumbbell Chest Press",
    target: "Target: Chest and Triceps",
    sets: 3,
    reps: "10 Reps",
    loggingMode: "weight_reps",
    exampleSchematic: "chest_press",
    icon: "front-hand"
  },
  {
    id: "set-3",
    name: "Single-Arm Rows",
    target: "Target: Upper Back",
    sets: 3,
    reps: "12 Reps",
    loggingMode: "weight_reps",
    exampleSchematic: "row",
    icon: "sports-gymnastics"
  },
  {
    id: "set-4",
    name: "Plank to Alternating Tap",
    target: "Target: Core Stability",
    sets: 3,
    reps: "45 Sec",
    loggingMode: "seconds",
    timeUnit: "seconds",
    exampleSchematic: "plank_tap",
    icon: "self-improvement"
  }
];

const cooldownExercises: SimpleExercise[] = [
  {
    id: "cool-1",
    name: "Child's Pose",
    details: "2 minutes",
    exampleSchematic: "child_pose",
    icon: "self-improvement"
  },
  {
    id: "cool-2",
    name: "Hamstring Stretch (L/R)",
    details: "4 minutes total",
    exampleSchematic: "hamstring_stretch",
    icon: "airline-seat-flat"
  }
];

const intensityOptions: Intensity[] = ["Low", "Moderate", "High"];
const LAST_EXERCISE_LOGS_STORAGE_KEY = "workout:lastExerciseLogs:v1";
const PREMIUM_WORKOUT_LENGTH_MINUTES = 35;
const DEFAULT_TIMER_SECONDS = 90;
const TIMER_PRESET_SECONDS = [60, 120, 180];
const premiumWorkoutMetaById: Record<string, PremiumWorkoutMeta> = {
  "demo-premium-menstrual-1": {
    title: "Cycle Reset Flow",
    durationMinutes: 25,
    phaseLabel: "Menstrual Phase"
  },
  "demo-premium-follicular-1": {
    title: "Progressive Strength Ladder",
    durationMinutes: 40,
    phaseLabel: "Follicular Phase"
  },
  "demo-premium-ovulation-1": {
    title: "Peak Power Intervals",
    durationMinutes: 35,
    phaseLabel: "Ovulation Phase"
  },
  "demo-premium-luteal-1": {
    title: "Steady Engine Builder",
    durationMinutes: 30,
    phaseLabel: "Luteal Phase"
  },
  "demo-premium-1": {
    title: "VO2 Max Builder",
    durationMinutes: 42,
    phaseLabel: "Ovulation Phase"
  },
  "demo-premium-2": {
    title: "Threshold Climb Session",
    durationMinutes: 36,
    phaseLabel: "Luteal Phase"
  },
  "demo-premium-ui-test": {
    title: "Strength & Toning",
    durationMinutes: 35,
    phaseLabel: "Follicular Phase"
  }
};

const DEFAULT_SET_LOG_ENTRY: SetLogEntry = { weightKg: "", reps: "", seconds: "" };
const DEFAULT_WORKOUT_DRAFT: WorkoutSessionDraft = {
  intensity: "Moderate",
  durationInput: "45",
  weightKg: "",
  reps: "",
  expandedSetIds: {},
  setLogsByExercise: {}
};

function toExerciseKey(exerciseName: string): string {
  return exerciseName.trim().toLowerCase();
}

function normalizeLastExerciseLog(value: unknown): LastExerciseLog | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const weightKg = typeof candidate.weightKg === "string" ? candidate.weightKg : undefined;
  const reps = typeof candidate.reps === "string" ? candidate.reps : undefined;
  const seconds = typeof candidate.seconds === "string" ? candidate.seconds : undefined;
  const updatedAtIso = typeof candidate.updatedAtIso === "string" ? candidate.updatedAtIso : new Date().toISOString();

  if (!weightKg && !reps && !seconds) {
    return null;
  }

  return {
    weightKg,
    reps,
    seconds,
    updatedAtIso
  };
}

function normalizeLastExerciseLogs(value: unknown): LastExerciseLogMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const normalized: LastExerciseLogMap = {};
  for (const [exerciseKey, entry] of Object.entries(value as Record<string, unknown>)) {
    if (Array.isArray(entry)) {
      const normalizedEntry = entry.map((setEntry) => normalizeLastExerciseLog(setEntry));
      if (normalizedEntry.some(Boolean)) {
        normalized[exerciseKey] = normalizedEntry;
      }
      continue;
    }

    const legacyEntry = normalizeLastExerciseLog(entry);
    if (legacyEntry) {
      normalized[exerciseKey] = [legacyEntry];
    }
  }

  return normalized;
}

function isSameWorkoutSession(
  activeWorkout: ActiveWorkout | null,
  sourceType: RootStackParamList["WorkoutSession"]["sourceType"],
  sourceId?: string
): boolean {
  if (!activeWorkout) {
    return false;
  }

  return activeWorkout.sourceType === sourceType && activeWorkout.sourceId === sourceId;
}

function isSetComplete(loggingMode: SetLoggingMode, entry: SetLogEntry): boolean {
  if (loggingMode === "seconds") {
    return entry.seconds.trim().length > 0;
  }

  return entry.weightKg.trim().length > 0 && entry.reps.trim().length > 0;
}

function formatClock(totalSeconds: number): string {
  const boundedSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(boundedSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(boundedSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatReferencePhaseLabel(phase: string): string {
  if (!phase) {
    return "Cycle-Aware Session";
  }

  return `${phase.charAt(0).toUpperCase()}${phase.slice(1)} Phase`;
}

function formatReferenceIntensityLabel(intensity: "low" | "moderate" | "high"): string {
  if (intensity === "low") {
    return "Low";
  }

  if (intensity === "high") {
    return "High";
  }

  return "Moderate";
}

function formatReferenceCategoryLabel(category: string): string {
  if (!category) {
    return "Guided Session";
  }

  return `${category.charAt(0).toUpperCase()}${category.slice(1)}`;
}

function summarizeExampleDetail(detail: string | null | undefined): string {
  if (!detail) {
    return "Guided step";
  }

  const firstSentence = detail.split(/(?<=[.!?])\s+/)[0] ?? detail;
  return firstSentence.length > 72 ? `${firstSentence.slice(0, 69)}...` : firstSentence;
}

function trimExercisePrefix(value: string): string {
  return value.replace(/^\d+\s*[\.\)]\s*/, "").trim();
}

function parseReferenceEntryLabel(title: string): { name: string; meta: string | null } {
  const normalized = trimExercisePrefix(title).replace(/\s+/g, " ").trim();
  const pipeParts = normalized.split(/\s+\|\s+/);
  if (pipeParts.length > 1) {
    return {
      name: pipeParts[0]?.trim() ?? normalized,
      meta: pipeParts.slice(1).join(" | ").trim()
    };
  }

  const dashMatch = normalized.match(/^(.*?)(?:\s+-\s+)(\d+(?:\s*(?:to|-)\s*\d+)?\s*(?:sec|secs|seconds|min|mins|minutes)\b.*)$/i);
  if (dashMatch) {
    return {
      name: dashMatch[1]?.trim() ?? normalized,
      meta: dashMatch[2]?.trim() ?? null
    };
  }

  return {
    name: normalized,
    meta: null
  };
}

function inferReferencePresentation(
  workout: Pick<ReferenceWorkout, "category" | "environment">,
  title: string
): { icon: IconName; exampleSchematic: ExerciseSchematicType; target: string } {
  const haystack = `${workout.category} ${title}`.toLowerCase();

  if (/(squat|leg press|leg curl|glute|quad|hamstring|lower body)/.test(haystack)) {
    return { icon: "fitness-center", exampleSchematic: "squat", target: "Target: Lower Body" };
  }

  if (/(chest|press|tricep|push-up|pushdown)/.test(haystack)) {
    return { icon: "front-hand", exampleSchematic: "chest_press", target: "Target: Push Strength" };
  }

  if (/(row|pulldown|pull-up|back)/.test(haystack)) {
    return { icon: "sports-gymnastics", exampleSchematic: "row", target: "Target: Back and Pulling" };
  }

  if (/(shoulder|arm swing|arm circle|upper body)/.test(haystack)) {
    return { icon: "sports-handball", exampleSchematic: "shoulder_press", target: "Target: Upper Body" };
  }

  if (/(plank|dead bug|core)/.test(haystack)) {
    return { icon: "self-improvement", exampleSchematic: "plank_tap", target: "Target: Core Stability" };
  }

  if (/(rowing machine|rower)/.test(haystack)) {
    return { icon: "directions-run", exampleSchematic: "row", target: "Target: Cardio Endurance" };
  }

  if (/(lunge|walk|treadmill|elliptical|cardio|interval|bike)/.test(haystack)) {
    return { icon: "directions-run", exampleSchematic: "lunge", target: "Target: Cardio Endurance" };
  }

  if (/(yoga|child|savasana|nidra)/.test(haystack)) {
    return { icon: "self-improvement", exampleSchematic: "child_pose", target: "Target: Recovery and Flow" };
  }

  if (/(stretch|hamstring|fold)/.test(haystack)) {
    return { icon: "airline-seat-flat", exampleSchematic: "hamstring_stretch", target: "Target: Flexibility" };
  }

  return { icon: "sync-alt", exampleSchematic: "mobility", target: "Target: Mobility and Control" };
}

function parseMainSetMetadata(workout: ReferenceWorkout, entry: ReferenceWorkoutEntry): {
  sets: number;
  reps: string;
  loggingMode: SetLoggingMode;
  hideSetCount: boolean;
  timeUnit?: "mins" | "seconds";
} {
  const combinedText = `${entry.title} ${entry.detail ?? ""}`;
  const roundsMatch = combinedText.match(/(\d+)\s*rounds?/i);
  const setsMatch = combinedText.match(/(\d+)\s*sets?/i);
  const repsMatch = combinedText.match(/(\d+)\s*reps?/i);
  const timeMatch = combinedText.match(/(\d+(?:\s*(?:to|-)\s*\d+)?)\s*(sec|secs|seconds|min|mins|minutes)\b/i);
  const setsValue = Number.parseInt((setsMatch?.[1] ?? roundsMatch?.[1] ?? "1"), 10);
  const sets = Number.isFinite(setsValue) && setsValue > 0 ? setsValue : 1;
  const normalizedTimeLabel = timeMatch
    ? `${timeMatch[1]} ${timeMatch[2].replace("minutes", "min").replace("minute", "min").replace("seconds", "sec").replace("second", "sec")}`
    : null;
  const normalizedTimeUnit =
    timeMatch && /(min|mins|minute|minutes)/i.test(timeMatch[2]) ? "mins" : timeMatch ? "seconds" : undefined;

  if (repsMatch) {
    return {
      sets,
      reps: `${repsMatch[1]} Reps`,
      loggingMode: "weight_reps",
      hideSetCount: false
    };
  }

  if (workout.category === "strength" && setsMatch) {
    return {
      sets,
      reps: normalizedTimeLabel ?? "10 Reps",
      loggingMode: normalizedTimeLabel ? "seconds" : "weight_reps",
      hideSetCount: Boolean(normalizedTimeLabel),
      timeUnit: normalizedTimeUnit
    };
  }

  if (normalizedTimeLabel) {
    return {
      sets: roundsMatch ? sets : 1,
      reps: normalizedTimeLabel,
      loggingMode: "seconds",
      hideSetCount: true,
      timeUnit: normalizedTimeUnit
    };
  }

  return {
    sets: 1,
    reps: "Timed",
    loggingMode: workout.category === "strength" ? "weight_reps" : "seconds",
    hideSetCount: workout.category !== "strength",
    timeUnit: workout.category === "strength" ? undefined : "seconds"
  };
}

function buildReferenceSimpleExercises(workout: ReferenceWorkout, sectionId: "warmup" | "cooldown"): SimpleExercise[] {
  const section = workout.sections.find((candidate) => candidate.id === sectionId);
  if (!section) {
    return [];
  }

  return section.entries.map((entry, index) => {
    const parsed = parseReferenceEntryLabel(entry.title);
    const presentation = inferReferencePresentation(workout, parsed.name);

    return {
      id: `${workout.id}-${sectionId}-${index}`,
      name: parsed.name,
      details: parsed.meta ?? summarizeExampleDetail(entry.detail),
      exampleSchematic: presentation.exampleSchematic,
      icon: presentation.icon,
      exampleDetail: entry.detail
    };
  });
}

function buildReferenceMainSets(workout: ReferenceWorkout): MainSet[] {
  const section = workout.sections.find((candidate) => candidate.id === "main");
  if (!section) {
    return [];
  }

  return section.entries.map((entry, index) => {
    const parsed = parseReferenceEntryLabel(entry.title);
    const presentation = inferReferencePresentation(workout, parsed.name);
    const metadata = parseMainSetMetadata(workout, entry);

    return {
      id: `${workout.id}-main-${index}`,
      name: parsed.name,
      target: presentation.target,
      sets: metadata.sets,
      reps: metadata.reps,
      loggingMode: metadata.loggingMode,
      exampleSchematic: presentation.exampleSchematic,
      icon: presentation.icon,
      exampleDetail: entry.detail ?? parsed.meta,
      hideSetCount: metadata.hideSetCount,
      timeUnit: metadata.timeUnit
    };
  });
}

function toSetInputId(exerciseId: string, setIndex: number, field: keyof SetLogEntry): string {
  return `set:${exerciseId}:${setIndex}:${field}`;
}

function parseSetInputId(inputId: string): { exerciseId: string; setIndex: number; field: keyof SetLogEntry } | null {
  if (!inputId.startsWith("set:")) {
    return null;
  }

  const [, exerciseId, setIndexValue, fieldValue] = inputId.split(":");
  if (!exerciseId || !setIndexValue || !fieldValue) {
    return null;
  }

  if (fieldValue !== "weightKg" && fieldValue !== "reps" && fieldValue !== "seconds") {
    return null;
  }

  const setIndex = Number.parseInt(setIndexValue, 10);
  if (!Number.isFinite(setIndex) || setIndex < 0) {
    return null;
  }

  return {
    exerciseId,
    setIndex,
    field: fieldValue
  };
}

function ExerciseSchematic({ type }: { type: ExerciseSchematicType }) {
  const stroke = "#1F3F3E";
  const accent = "#B9D2C7";
  const panel = "#F4EFE8";
  const panelBorder = "#D9CEC4";
  const skin = "#E6B691";
  const hair = "#5B4036";
  const top = "#C97263";
  const leggings = "#6E8C89";

  const renderBackdrop = () => <Rect x="12" y="12" width="196" height="196" rx="28" fill={panel} stroke={panelBorder} strokeWidth="2" />;
  const renderHead = ({
    cx,
    cy,
    ponytailCx,
    ponytailCy
  }: {
    cx: number;
    cy: number;
    ponytailCx: number;
    ponytailCy: number;
  }) => (
    <>
      <Circle cx={ponytailCx} cy={ponytailCy} r="5" fill={hair} />
      <Ellipse cx={cx - 1} cy={cy - 5} rx="10" ry="7" fill={hair} />
      <Circle cx={cx} cy={cy} r="10" fill={skin} stroke={stroke} strokeWidth="4" />
    </>
  );

  if (type === "chest_press") {
    return (
      <Svg viewBox="0 0 220 220" width="100%" height="100%">
        {renderBackdrop()}
        <Line x1="20" y1="170" x2="200" y2="170" stroke={stroke} strokeWidth="3" />
        <Rect x="40" y="150" width="140" height="14" rx="7" fill={accent} />
        <Rect x="64" y="92" width="92" height="8" rx="4" fill={accent} />
        <Rect x="92" y="132" width="34" height="14" rx="7" fill={top} opacity="0.85" />
        <Rect x="91" y="145" width="20" height="18" rx="7" fill={leggings} opacity="0.82" />
        {renderHead({ cx: 72, cy: 142, ponytailCx: 63, ponytailCy: 139 })}
        <Line x1="81" y1="142" x2="120" y2="142" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="120" y1="142" x2="150" y2="132" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="120" y1="142" x2="150" y2="150" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="108" y1="142" x2="92" y2="160" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="92" y1="160" x2="76" y2="170" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="138" y1="130" x2="82" y2="130" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
        <Rect x="74" y="124" width="8" height="12" rx="2" fill={stroke} />
        <Rect x="138" y="124" width="8" height="12" rx="2" fill={stroke} />
      </Svg>
    );
  }

  if (type === "plank_tap") {
    return (
      <Svg viewBox="0 0 220 220" width="100%" height="100%">
        {renderBackdrop()}
        <Line x1="20" y1="172" x2="200" y2="172" stroke={stroke} strokeWidth="3" />
        <Rect x="84" y="138" width="44" height="12" rx="6" fill={top} opacity="0.86" />
        <Rect x="126" y="147" width="38" height="10" rx="5" fill={leggings} opacity="0.8" />
        {renderHead({ cx: 58, cy: 134, ponytailCx: 49, ponytailCy: 131 })}
        <Line x1="67" y1="136" x2="124" y2="146" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="124" y1="146" x2="162" y2="160" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="83" y1="140" x2="66" y2="170" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="110" y1="146" x2="114" y2="170" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="102" y1="122" x2="130" y2="106" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
        <Circle cx="136" cy="102" r="4" fill={accent} />
      </Svg>
    );
  }

  if (type === "child_pose") {
    return (
      <Svg viewBox="0 0 220 220" width="100%" height="100%">
        {renderBackdrop()}
        <Line x1="20" y1="174" x2="200" y2="174" stroke={stroke} strokeWidth="3" />
        <Rect x="88" y="136" width="40" height="12" rx="6" fill={top} opacity="0.84" />
        <Rect x="104" y="152" width="34" height="12" rx="6" fill={leggings} opacity="0.8" />
        {renderHead({ cx: 132, cy: 136, ponytailCx: 140, ponytailCy: 132 })}
        <Line x1="125" y1="138" x2="94" y2="142" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="94" y1="142" x2="66" y2="144" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="96" y1="142" x2="108" y2="166" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="108" y1="166" x2="136" y2="170" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="68" y1="144" x2="48" y2="156" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
      </Svg>
    );
  }

  if (type === "hamstring_stretch") {
    return (
      <Svg viewBox="0 0 220 220" width="100%" height="100%">
        {renderBackdrop()}
        <Line x1="20" y1="174" x2="200" y2="174" stroke={stroke} strokeWidth="3" />
        <Rect x="90" y="128" width="30" height="12" rx="6" fill={top} opacity="0.84" />
        <Rect x="120" y="132" width="36" height="10" rx="5" fill={leggings} opacity="0.82" />
        {renderHead({ cx: 74, cy: 108, ponytailCx: 65, ponytailCy: 105 })}
        <Line x1="82" y1="112" x2="104" y2="136" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="104" y1="136" x2="152" y2="136" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="104" y1="136" x2="88" y2="170" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="152" y1="136" x2="180" y2="142" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="94" y1="124" x2="134" y2="126" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
      </Svg>
    );
  }

  if (type === "mobility") {
    return (
      <Svg viewBox="0 0 220 220" width="100%" height="100%">
        {renderBackdrop()}
        <Line x1="20" y1="174" x2="200" y2="174" stroke={stroke} strokeWidth="3" />
        <Rect x="100" y="78" width="20" height="44" rx="10" fill={top} opacity="0.86" />
        <Rect x="88" y="121" width="12" height="50" rx="6" fill={leggings} opacity="0.82" />
        <Rect x="120" y="121" width="12" height="50" rx="6" fill={leggings} opacity="0.82" />
        {renderHead({ cx: 110, cy: 62, ponytailCx: 120, ponytailCy: 60 })}
        <Line x1="110" y1="72" x2="110" y2="122" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="110" y1="88" x2="78" y2="104" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="110" y1="88" x2="148" y2="74" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="110" y1="122" x2="88" y2="172" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="110" y1="122" x2="132" y2="172" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Circle cx="154" cy="70" r="16" fill="none" stroke={accent} strokeWidth="3" />
      </Svg>
    );
  }

  if (type === "lunge") {
    return (
      <Svg viewBox="0 0 220 220" width="100%" height="100%">
        {renderBackdrop()}
        <Line x1="20" y1="174" x2="200" y2="174" stroke={stroke} strokeWidth="3" />
        <Rect x="86" y="78" width="18" height="40" rx="9" fill={top} opacity="0.86" />
        <Rect x="84" y="117" width="12" height="55" rx="6" fill={leggings} opacity="0.82" />
        <Rect x="118" y="141" width="12" height="32" rx="6" fill={leggings} opacity="0.82" />
        {renderHead({ cx: 84, cy: 62, ponytailCx: 74, ponytailCy: 59 })}
        <Line x1="84" y1="72" x2="96" y2="114" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="96" y1="114" x2="122" y2="144" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="122" y1="144" x2="122" y2="172" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="96" y1="114" x2="86" y2="172" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="100" y1="88" x2="132" y2="88" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
      </Svg>
    );
  }

  if (type === "shoulder_press") {
    return (
      <Svg viewBox="0 0 220 220" width="100%" height="100%">
        {renderBackdrop()}
        <Line x1="20" y1="174" x2="200" y2="174" stroke={stroke} strokeWidth="3" />
        <Rect x="99" y="76" width="22" height="42" rx="10" fill={top} opacity="0.86" />
        <Rect x="92" y="117" width="12" height="55" rx="6" fill={leggings} opacity="0.82" />
        <Rect x="116" y="117" width="12" height="55" rx="6" fill={leggings} opacity="0.82" />
        {renderHead({ cx: 110, cy: 58, ponytailCx: 121, ponytailCy: 56 })}
        <Line x1="110" y1="68" x2="110" y2="118" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="110" y1="82" x2="82" y2="56" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="110" y1="82" x2="138" y2="56" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Rect x="72" y="48" width="10" height="10" rx="2" fill={stroke} />
        <Rect x="138" y="48" width="10" height="10" rx="2" fill={stroke} />
        <Line x1="110" y1="118" x2="92" y2="172" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="110" y1="118" x2="128" y2="172" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
      </Svg>
    );
  }

  if (type === "row") {
    return (
      <Svg viewBox="0 0 220 220" width="100%" height="100%">
        {renderBackdrop()}
        <Line x1="20" y1="174" x2="200" y2="174" stroke={stroke} strokeWidth="3" />
        <Rect x="106" y="88" width="22" height="32" rx="10" fill={top} opacity="0.86" />
        <Rect x="111" y="119" width="12" height="54" rx="6" fill={leggings} opacity="0.82" />
        <Rect x="149" y="146" width="12" height="26" rx="6" fill={leggings} opacity="0.82" />
        {renderHead({ cx: 92, cy: 62, ponytailCx: 82, ponytailCy: 60 })}
        <Line x1="96" y1="70" x2="126" y2="110" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="126" y1="110" x2="112" y2="172" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="126" y1="110" x2="154" y2="170" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Line x1="114" y1="92" x2="152" y2="102" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <Rect x="152" y="97" width="12" height="12" rx="2" fill={stroke} />
      </Svg>
    );
  }

  return (
    <Svg viewBox="0 0 220 220" width="100%" height="100%">
      {renderBackdrop()}
      <Line x1="20" y1="174" x2="200" y2="174" stroke={stroke} strokeWidth="3" />
      <Rect x="104" y="76" width="20" height="40" rx="10" fill={top} opacity="0.86" />
      <Rect x="96" y="116" width="12" height="58" rx="6" fill={leggings} opacity="0.82" />
      <Rect x="122" y="137" width="12" height="38" rx="6" fill={leggings} opacity="0.82" />
      {renderHead({ cx: 110, cy: 60, ponytailCx: 100, ponytailCy: 57 })}
      <Line x1="110" y1="70" x2="114" y2="116" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
      <Line x1="114" y1="116" x2="136" y2="138" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
      <Line x1="114" y1="116" x2="92" y2="138" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
      <Line x1="114" y1="116" x2="100" y2="174" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
      <Line x1="136" y1="138" x2="126" y2="174" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
      <Line x1="108" y1="88" x2="82" y2="96" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
      <Line x1="112" y1="88" x2="136" y2="92" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
    </Svg>
  );
}

export function WorkoutSessionScreen({ route, navigation }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { sourceType, sourceId, autoStart = false } = route.params;
  const isPremiumSession = sourceType === "premium_workout";
  const activeWorkout = useAppStore((state) => state.activeWorkout);
  const updateWorkoutDraft = useAppStore((state) => state.updateWorkoutDraft);
  const clearWorkoutSession = useAppStore((state) => state.clearWorkoutSession);
  const savedDraft = activeWorkout && isSameWorkoutSession(activeWorkout, sourceType, sourceId) ? activeWorkout.draft : null;
  const hasMatchingActiveWorkout = isSameWorkoutSession(activeWorkout, sourceType, sourceId);
  const { startSession, startedAtIso, durationSeconds, completeSession, saving } = useWorkoutSession();
  const hasStartedWorkout = Boolean(startedAtIso && hasMatchingActiveWorkout);

  const [intensity, setIntensity] = useState<Intensity>(savedDraft?.intensity ?? DEFAULT_WORKOUT_DRAFT.intensity);
  const [durationInput, setDurationInput] = useState(savedDraft?.durationInput ?? DEFAULT_WORKOUT_DRAFT.durationInput);
  const [weightKg, setWeightKg] = useState(savedDraft?.weightKg ?? DEFAULT_WORKOUT_DRAFT.weightKg);
  const [reps, setReps] = useState(savedDraft?.reps ?? DEFAULT_WORKOUT_DRAFT.reps);
  const [expandedSetIds, setExpandedSetIds] = useState<Record<string, boolean>>(savedDraft?.expandedSetIds ?? DEFAULT_WORKOUT_DRAFT.expandedSetIds);
  const [setLogsByExercise, setSetLogsByExercise] = useState<Record<string, SetLogEntry[]>>(
    savedDraft?.setLogsByExercise ?? DEFAULT_WORKOUT_DRAFT.setLogsByExercise
  );
  const [lastExerciseLogs, setLastExerciseLogs] = useState<LastExerciseLogMap>({});
  const [activeExample, setActiveExample] = useState<ExerciseExample | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(DEFAULT_TIMER_SECONDS);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const autoStartHandledRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadLastExerciseLogs(): Promise<void> {
      try {
        const saved = await asyncStorageService.get<unknown>(LAST_EXERCISE_LOGS_STORAGE_KEY);
        const normalized = normalizeLastExerciseLogs(saved);
        if (isMounted && Object.keys(normalized).length > 0) {
          setLastExerciseLogs(normalized);
        }
      } catch {
        // Ignore local storage failures and keep the UI usable.
      }
    }

    void loadLastExerciseLogs();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (autoStartHandledRef.current || !autoStart) {
      return;
    }

    if (hasStartedWorkout) {
      autoStartHandledRef.current = true;
      return;
    }

    autoStartHandledRef.current = true;
    startSession({ sourceType, sourceId });
  }, [autoStart, hasStartedWorkout, sourceId, sourceType, startSession]);

  useEffect(() => {
    if (!startedAtIso || !hasMatchingActiveWorkout) {
      return;
    }

    updateWorkoutDraft({
      intensity,
      durationInput,
      weightKg,
      reps,
      expandedSetIds,
      setLogsByExercise
    });
  }, [durationInput, expandedSetIds, hasMatchingActiveWorkout, intensity, reps, setLogsByExercise, startedAtIso, updateWorkoutDraft, weightKg]);

  useEffect(() => {
    if (!isTimerRunning) {
      return;
    }

    const interval = setInterval(() => {
      setTimerRemainingSeconds((currentSeconds) => Math.max(0, currentSeconds - 1));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isTimerRunning]);

  useEffect(() => {
    if (timerRemainingSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
  }, [isTimerRunning, timerRemainingSeconds]);

  const selectedPremiumWorkout = useMemo(() => {
    if (!isPremiumSession || !sourceId) {
      return null;
    }

    const importedWorkout = getReferenceWorkoutById(sourceId);
    if (importedWorkout) {
      return {
        title: importedWorkout.name,
        durationMinutes: importedWorkout.estDurationMinutes,
        phaseLabel: formatReferencePhaseLabel(importedWorkout.phase)
      };
    }

    return premiumWorkoutMetaById[sourceId] ?? null;
  }, [isPremiumSession, sourceId]);
  const selectedReferenceWorkout = useMemo(() => {
    if (!isPremiumSession || !sourceId) {
      return null;
    }

    return getReferenceWorkoutById(sourceId);
  }, [isPremiumSession, sourceId]);
  const displayedWarmupExercises = useMemo(
    () => (selectedReferenceWorkout ? buildReferenceSimpleExercises(selectedReferenceWorkout, "warmup") : warmupExercises),
    [selectedReferenceWorkout]
  );
  const displayedMainSets = useMemo(
    () => (selectedReferenceWorkout ? buildReferenceMainSets(selectedReferenceWorkout) : mainSets),
    [selectedReferenceWorkout]
  );
  const displayedCooldownExercises = useMemo(
    () => (selectedReferenceWorkout ? buildReferenceSimpleExercises(selectedReferenceWorkout, "cooldown") : cooldownExercises),
    [selectedReferenceWorkout]
  );
  const warmupMetaLabel = selectedReferenceWorkout ? `${displayedWarmupExercises.length} steps` : "5 mins";
  const mainSetsMetaLabel = selectedReferenceWorkout ? `${displayedMainSets.length} steps` : "20 mins";
  const cooldownMetaLabel = selectedReferenceWorkout ? `${displayedCooldownExercises.length} steps` : "10 mins";
  const premiumIntensityLabel = selectedReferenceWorkout ? formatReferenceIntensityLabel(selectedReferenceWorkout.intensity) : intensity;
  const premiumFocusLabel = selectedReferenceWorkout ? formatReferenceCategoryLabel(selectedReferenceWorkout.category) : "Full Body";

  const workoutLengthMinutes = useMemo(() => {
    if (isPremiumSession) {
      return selectedPremiumWorkout?.durationMinutes ?? PREMIUM_WORKOUT_LENGTH_MINUTES;
    }

    const parsedDuration = Number.parseInt(durationInput, 10);
    if (Number.isFinite(parsedDuration) && parsedDuration > 0) {
      return parsedDuration;
    }

    return 45;
  }, [durationInput, isPremiumSession, selectedPremiumWorkout]);

  const elapsedLabel = useMemo(() => {
    return formatClock(durationSeconds);
  }, [durationSeconds]);

  const timerLabel = useMemo(() => {
    return formatClock(timerRemainingSeconds);
  }, [timerRemainingSeconds]);

  const phaseLabel = selectedPremiumWorkout?.phaseLabel ?? "Cycle-Aware Session";
  const focusableInputOrder = useMemo(() => {
    if (!isPremiumSession) {
      return [CUSTOM_FIELD_IDS.durationInput, CUSTOM_FIELD_IDS.weightKg, CUSTOM_FIELD_IDS.reps];
    }

    const inputIds: string[] = [];
    for (const set of displayedMainSets) {
      if (!expandedSetIds[set.id]) {
        continue;
      }

      for (let setIndex = 0; setIndex < set.sets; setIndex += 1) {
        if (set.loggingMode === "seconds") {
          inputIds.push(toSetInputId(set.id, setIndex, "seconds"));
          continue;
        }

        inputIds.push(toSetInputId(set.id, setIndex, "weightKg"));
        inputIds.push(toSetInputId(set.id, setIndex, "reps"));
      }
    }

    return inputIds;
  }, [displayedMainSets, expandedSetIds, isPremiumSession]);
  const activeSetInput = useMemo(() => (activeInputId ? parseSetInputId(activeInputId) : null), [activeInputId]);
  const activeInputIndex = activeInputId ? focusableInputOrder.indexOf(activeInputId) : -1;
  const canFocusPreviousInput = activeInputIndex > 0;
  const canFocusNextInput = activeInputIndex >= 0 && activeInputIndex < focusableInputOrder.length - 1;
  const canAutofillFocusedInput = useMemo(() => {
    if (!activeSetInput) {
      return false;
    }

    const setDefinition = displayedMainSets.find((set) => set.id === activeSetInput.exerciseId);
    if (!setDefinition) {
      return false;
    }

    const currentEntry = setLogsByExercise[activeSetInput.exerciseId]?.[activeSetInput.setIndex] ?? DEFAULT_SET_LOG_ENTRY;
    if (currentEntry[activeSetInput.field].trim().length > 0) {
      return false;
    }

    const previousValues = lastExerciseLogs[toExerciseKey(setDefinition.name)]?.[activeSetInput.setIndex];
    if (!previousValues) {
      return false;
    }

    if (activeSetInput.field === "seconds") {
      return Boolean(previousValues.seconds);
    }

    if (activeSetInput.field === "weightKg") {
      return Boolean(previousValues.weightKg);
    }

    return Boolean(previousValues.reps);
  }, [activeSetInput, displayedMainSets, lastExerciseLogs, setLogsByExercise]);

  useEffect(() => {
    if (activeInputId && !focusableInputOrder.includes(activeInputId)) {
      setActiveInputId(null);
    }
  }, [activeInputId, focusableInputOrder]);

  function onRegisterInputRef(inputId: string, input: TextInput | null): void {
    if (input) {
      inputRefs.current[inputId] = input;
      return;
    }

    delete inputRefs.current[inputId];
  }

  function onInputBlur(inputId: string): void {
    setActiveInputId((current) => (current === inputId ? null : current));
  }

  function focusInputById(inputId: string): void {
    const input = inputRefs.current[inputId];
    if (!input) {
      return;
    }

    input.focus();
    setActiveInputId(inputId);
  }

  function onFocusPreviousInputPress(): void {
    if (!canFocusPreviousInput) {
      return;
    }

    const previousInputId = focusableInputOrder[activeInputIndex - 1];
    if (previousInputId) {
      focusInputById(previousInputId);
    }
  }

  function onFocusNextInputPress(): void {
    if (!canFocusNextInput) {
      return;
    }

    const nextInputId = focusableInputOrder[activeInputIndex + 1];
    if (nextInputId) {
      focusInputById(nextInputId);
    }
  }

  function onAutofillFocusedInputPress(): void {
    if (!activeSetInput) {
      return;
    }

    const setDefinition = displayedMainSets.find((set) => set.id === activeSetInput.exerciseId);
    if (!setDefinition) {
      return;
    }

    const currentEntry = setLogsByExercise[activeSetInput.exerciseId]?.[activeSetInput.setIndex] ?? DEFAULT_SET_LOG_ENTRY;
    if (currentEntry[activeSetInput.field].trim().length > 0) {
      return;
    }

    const previousValues = lastExerciseLogs[toExerciseKey(setDefinition.name)]?.[activeSetInput.setIndex];
    if (!previousValues) {
      return;
    }

    const nextValue =
      activeSetInput.field === "seconds"
        ? previousValues.seconds
        : activeSetInput.field === "weightKg"
          ? previousValues.weightKg
          : previousValues.reps;

    if (!nextValue) {
      return;
    }

    onSetValueChange(activeSetInput.exerciseId, activeSetInput.setIndex, activeSetInput.field, nextValue);
  }

  function onSetValueChange(exerciseId: string, setIndex: number, field: keyof SetLogEntry, value: string): void {
    setSetLogsByExercise((current) => {
      const existingEntries = current[exerciseId] ?? [];
      const nextEntries = [...existingEntries];
      const existingEntry = nextEntries[setIndex] ?? DEFAULT_SET_LOG_ENTRY;
      nextEntries[setIndex] = { ...existingEntry, [field]: value };
      return { ...current, [exerciseId]: nextEntries };
    });
  }

  function onStartSetPress(exercise: MainSet): void {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setSetLogsByExercise((current) => {
      const existingEntries = current[exercise.id] ?? [];
      if (existingEntries.length === exercise.sets) {
        return current;
      }

      const normalizedEntries = Array.from(
        { length: exercise.sets },
        (_, index) => existingEntries[index] ?? DEFAULT_SET_LOG_ENTRY
      );
      return { ...current, [exercise.id]: normalizedEntries };
    });

    setExpandedSetIds((current) => {
      if (current[exercise.id]) {
        return {};
      }

      return { [exercise.id]: true };
    });
  }

  function onShowExamplePress(exercise: {
    name: string;
    exampleSchematic: ExerciseSchematicType;
    exampleDetail?: string | null;
  }): void {
    setActiveExample({
      name: exercise.name,
      schematicType: exercise.exampleSchematic,
      detail: exercise.exampleDetail
    });
  }

  function onStartWorkoutPress(): void {
    setResultMessage(null);
    startSession({ sourceType, sourceId });
  }

  function onTimerAdjustPress(deltaSeconds: number): void {
    setTimerRemainingSeconds((currentSeconds) => Math.max(0, currentSeconds + deltaSeconds));
  }

  function onTimerPresetPress(seconds: number): void {
    setIsTimerRunning(false);
    setTimerRemainingSeconds(seconds);
  }

  function onTimerTogglePress(): void {
    if (timerRemainingSeconds === 0) {
      setTimerRemainingSeconds(DEFAULT_TIMER_SECONDS);
      setIsTimerRunning(true);
      return;
    }

    setIsTimerRunning((current) => !current);
  }

  function abandonWorkoutAndExit(): void {
    clearWorkoutSession();
    setResultMessage(null);

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Main");
  }

  function onAbandonWorkoutPress(): void {
    setIsHeaderMenuOpen(false);

    Alert.alert("Abandon workout?", "Your current workout progress will be discarded.", [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Abandon Workout",
        style: "destructive",
        onPress: abandonWorkoutAndExit
      }
    ]);
  }

  async function onCompletePress(): Promise<void> {
    if (!hasStartedWorkout) {
      setResultMessage("Tap Start Workout before completing.");
      return;
    }

    const nextExerciseLogs: LastExerciseLogMap = { ...lastExerciseLogs };
    const nowIso = new Date().toISOString();
    let hasExerciseLogUpdates = false;

    for (const set of displayedMainSets) {
      const entries = setLogsByExercise[set.id] ?? [];
      const key = toExerciseKey(set.name);
      const existingBySet = nextExerciseLogs[key] ?? [];
      const nextBySet: Array<LastExerciseLog | null> = Array.from({ length: set.sets }, (_, setIndex) => {
        const existingEntry = existingBySet[setIndex];
        const currentEntry = entries[setIndex] ?? DEFAULT_SET_LOG_ENTRY;

        if (set.loggingMode === "seconds") {
          const secondsInput = currentEntry.seconds.trim();
          const seconds = secondsInput || existingEntry?.seconds;

          if (!seconds) {
            return existingEntry ?? null;
          }

          if (!secondsInput && existingEntry) {
            return existingEntry;
          }

          return {
            weightKg: existingEntry?.weightKg,
            reps: existingEntry?.reps,
            seconds,
            updatedAtIso: nowIso
          };
        }

        const weightInput = currentEntry.weightKg.trim();
        const repsInput = currentEntry.reps.trim();
        const weightKg = weightInput || existingEntry?.weightKg;
        const reps = repsInput || existingEntry?.reps;

        if (!weightKg && !reps) {
          return existingEntry ?? null;
        }

        if (!weightInput && !repsInput && existingEntry) {
          return existingEntry;
        }

        return {
          weightKg,
          reps,
          seconds: existingEntry?.seconds,
          updatedAtIso: nowIso
        };
      });

      const hasAnySetData = nextBySet.some((entry) => Boolean(entry?.seconds || entry?.weightKg || entry?.reps));
      const previousSerialized = JSON.stringify(existingBySet);
      const nextSerialized = hasAnySetData ? JSON.stringify(nextBySet) : "";
      if (previousSerialized !== nextSerialized) {
        hasExerciseLogUpdates = true;
      }

      if (hasAnySetData) {
        nextExerciseLogs[key] = nextBySet;
      } else {
        delete nextExerciseLogs[key];
      }
    }

    if (hasExerciseLogUpdates) {
      setLastExerciseLogs(nextExerciseLogs);
      try {
        await asyncStorageService.set(LAST_EXERCISE_LOGS_STORAGE_KEY, nextExerciseLogs);
      } catch {
        // Ignore local storage failures and still finish session completion.
      }
    }

    const rpe = intensity === "High" ? 9 : intensity === "Moderate" ? 7 : 5;

    const details = isPremiumSession
      ? selectedReferenceWorkout
        ? `${selectedReferenceWorkout.name} complete. Length: ${workoutLengthMinutes} min. Suggested intensity: ${formatReferenceIntensityLabel(selectedReferenceWorkout.intensity)}.`
        : `Premium workout complete. Length: ${workoutLengthMinutes} min. Intensity: ${intensity}.`
      : `Custom session complete. Duration input: ${workoutLengthMinutes} min. Intensity: ${intensity}. Weight: ${weightKg || "0"} kg. Reps: ${reps || "0"}.`;

    const result = await completeSession({
      sourceType,
      sourceId,
      rpe,
      notes: details
    });

    setResultMessage(result === "saved" ? "Session saved" : "No connection, queued for sync");

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Main");
  }

  const keyboardAccessory = (
    <View style={styles.keyboardNavGroup}>
      <Pressable
        style={[styles.keyboardNavButton, !canFocusPreviousInput ? styles.keyboardNavButtonDisabled : undefined]}
        onPress={onFocusPreviousInputPress}
        disabled={!canFocusPreviousInput}
        accessibilityLabel="Previous field"
      >
        <MaterialIcons name="arrow-back" size={18} color={canFocusPreviousInput ? colors.primary : colors.textMuted} />
      </Pressable>
      <Pressable
        style={[styles.keyboardNavButton, styles.keyboardNavButtonSplit, !canFocusNextInput ? styles.keyboardNavButtonDisabled : undefined]}
        onPress={onFocusNextInputPress}
        disabled={!canFocusNextInput}
        accessibilityLabel="Next field"
      >
        <MaterialIcons name="arrow-forward" size={18} color={canFocusNextInput ? colors.primary : colors.textMuted} />
      </Pressable>
      <Pressable
        style={[styles.keyboardNavButton, styles.keyboardNavButtonSplit, !canAutofillFocusedInput ? styles.keyboardNavButtonDisabled : undefined]}
        onPress={onAutofillFocusedInputPress}
        disabled={!canAutofillFocusedInput}
        accessibilityLabel="Autofill current field"
      >
        <MaterialIcons name="check" size={18} color={canAutofillFocusedInput ? colors.primary : colors.textMuted} />
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer contentContainerStyle={styles.content} keyboardAccessory={keyboardAccessory} stickyHeaderIndices={[0]}>
      <View style={styles.stickyHeader}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerIconButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={20} color={colors.primary} />
          </Pressable>

          <View style={styles.headerTitleBlock}>
            <AppText variant="subtitle" style={styles.headerTitle}>
              {isPremiumSession ? selectedPremiumWorkout?.title ?? "Strength & Toning" : "Your Session"}
            </AppText>
            <AppText variant="caption" muted style={styles.headerEstimate}>
              {workoutLengthMinutes} min workout
            </AppText>
          </View>

          <View style={styles.headerActionsRight}>
            <Pressable
              style={[styles.headerActionButton, saving ? styles.headerActionButtonDisabled : undefined]}
              onPress={hasStartedWorkout ? () => void onCompletePress() : onStartWorkoutPress}
              disabled={saving}
            >
              <AppText variant="bodyStrong" style={styles.headerActionButtonText}>
                {saving ? "Saving..." : hasStartedWorkout ? "Finish" : "Start"}
              </AppText>
            </Pressable>
            <Pressable style={styles.headerIconButton} onPress={() => setIsTimerModalOpen(true)}>
              <MaterialIcons name="schedule" size={20} color={colors.primary} />
            </Pressable>
            <Pressable style={styles.headerIconButton} onPress={() => setIsHeaderMenuOpen(true)}>
              <MaterialIcons name="more-horiz" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.headerMeta}>
          <AppText variant="caption" muted>
            Elapsed {hasStartedWorkout ? elapsedLabel : "--:--"}
          </AppText>
        </View>
      </View>

        <View style={styles.phaseBadge}>
          <MaterialIcons name="opacity" size={14} color={colors.onAccent} />
          <AppText variant="caption" style={styles.phaseText}>
            {phaseLabel}
          </AppText>
      </View>

      {isPremiumSession ? (
        <View style={styles.blockGap}>
          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <AppText variant="overline" muted>
                DURATION
              </AppText>
              <AppText variant="subtitle" style={styles.primaryText}>
                {workoutLengthMinutes} mins
              </AppText>
            </View>
            <View style={styles.statCard}>
              <AppText variant="overline" muted>
                INTENSITY
              </AppText>
              <AppText variant="subtitle" style={styles.primaryText}>
                {premiumIntensityLabel}
              </AppText>
            </View>
            <View style={styles.statCard}>
              <AppText variant="overline" muted>
                FOCUS
              </AppText>
              <AppText variant="subtitle" style={styles.primaryText}>
                {premiumFocusLabel}
              </AppText>
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <AppText variant="subtitle">Warm-up</AppText>
              <AppText variant="caption" muted>
                {warmupMetaLabel}
              </AppText>
            </View>
            <View style={styles.listCard}>
              {displayedWarmupExercises.map((exercise) => (
                <View key={exercise.id} style={styles.simpleRow}>
                  <View style={styles.simpleRowIcon}>
                    <ExerciseSchematic type={exercise.exampleSchematic} />
                  </View>
                  <View style={styles.flexGrow}>
                    <AppText variant="bodyStrong">{exercise.name}</AppText>
                    <AppText variant="caption" muted>
                      {exercise.details}
                    </AppText>
                  </View>
                  <Pressable style={styles.exampleButton} onPress={() => onShowExamplePress(exercise)}>
                    <MaterialIcons name="image" size={14} color={colors.primary} />
                    <AppText variant="caption" style={styles.exampleButtonText}>
                      Example
                    </AppText>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <AppText variant="subtitle">Main Sets</AppText>
              <AppText variant="caption" muted>
                {mainSetsMetaLabel}
              </AppText>
            </View>
            <View style={styles.blockGap}>
              {displayedMainSets.map((set) => (
                <View key={set.id} style={styles.mainSetCard}>
                  <View style={styles.mainSetTop}>
                    <View style={styles.mainSetLeft}>
                      <View style={styles.mainSetIconWrap}>
                        <ExerciseSchematic type={set.exampleSchematic} />
                      </View>
                      <View style={styles.flexGrow}>
                        <AppText variant="bodyStrong">{set.name}</AppText>
                        <AppText variant="caption" muted>
                          {set.target}
                        </AppText>
                        <View style={styles.tagRow}>
                          {!set.hideSetCount ? (
                            <View style={styles.smallTag}>
                              <AppText variant="caption">{set.sets} Sets</AppText>
                            </View>
                          ) : null}
                          <View style={styles.smallTag}>
                            <AppText variant="caption">{set.reps}</AppText>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={styles.mainSetActions}>
                      <Pressable style={styles.exampleButton} onPress={() => onShowExamplePress(set)}>
                        <MaterialIcons name="image" size={14} color={colors.primary} />
                        <AppText variant="caption" style={styles.exampleButtonText}>
                          Example
                        </AppText>
                      </Pressable>
                      <AppButton label={expandedSetIds[set.id] ? "Hide Sets" : "Start Set"} style={styles.startSetButton} onPress={() => onStartSetPress(set)} />
                    </View>
                  </View>

                  {expandedSetIds[set.id] ? (
                    <View style={styles.setRowsWrap}>
                      {Array.from({ length: set.sets }).map((_, setIndex) => {
                        const entry = setLogsByExercise[set.id]?.[setIndex] ?? DEFAULT_SET_LOG_ENTRY;
                        const previousValues = lastExerciseLogs[toExerciseKey(set.name)]?.[setIndex] ?? undefined;
                        const weightPlaceholder = previousValues?.weightKg ? `Last: ${previousValues.weightKg} kg` : "kg";
                        const repsPlaceholder = previousValues?.reps ? `Last: ${previousValues.reps}` : "reps";
                        const timeInputLabel = set.timeUnit === "mins" ? "mins" : "seconds";
                        const lastTimeUnitLabel = set.timeUnit === "mins" ? "min" : "sec";
                        const secondsPlaceholder = previousValues?.seconds ? `Last: ${previousValues.seconds} ${lastTimeUnitLabel}` : timeInputLabel;
                        const rowIsComplete = isSetComplete(set.loggingMode, entry);
                        const secondsInputId = toSetInputId(set.id, setIndex, "seconds");
                        const weightInputId = toSetInputId(set.id, setIndex, "weightKg");
                        const repsInputId = toSetInputId(set.id, setIndex, "reps");

                        return (
                          <View key={`${set.id}-row-${setIndex}`} style={[styles.setRow, rowIsComplete ? styles.setRowComplete : undefined]}>
                            <View style={styles.setRowHeader}>
                              <AppText variant="caption" muted style={styles.setRowLabel}>
                                Set {setIndex + 1}
                              </AppText>
                              <View style={[styles.setRowStatus, rowIsComplete ? styles.setRowStatusComplete : undefined]}>
                                <MaterialIcons name={rowIsComplete ? "check-circle" : "radio-button-unchecked"} size={12} color={rowIsComplete ? colors.success : colors.textMuted} />
                                <AppText variant="caption" style={rowIsComplete ? styles.setRowStatusTextComplete : styles.setRowStatusTextPending}>
                                  {rowIsComplete ? "Complete" : "In Progress"}
                                </AppText>
                              </View>
                            </View>
                            <View style={styles.setRowInputs}>
                              {set.loggingMode === "seconds" ? (
                                <TextInput
                                  style={styles.setRowInput}
                                  keyboardType="number-pad"
                                  ref={(input) => onRegisterInputRef(secondsInputId, input)}
                                  value={entry.seconds}
                                  onFocus={() => setActiveInputId(secondsInputId)}
                                  onBlur={() => onInputBlur(secondsInputId)}
                                  onChangeText={(value) => onSetValueChange(set.id, setIndex, "seconds", value)}
                                  placeholder={secondsPlaceholder}
                                  placeholderTextColor={colors.textMuted}
                                />
                              ) : (
                                <>
                                  <TextInput
                                    style={styles.setRowInput}
                                    keyboardType="decimal-pad"
                                    ref={(input) => onRegisterInputRef(weightInputId, input)}
                                    value={entry.weightKg}
                                    onFocus={() => setActiveInputId(weightInputId)}
                                    onBlur={() => onInputBlur(weightInputId)}
                                    onChangeText={(value) => onSetValueChange(set.id, setIndex, "weightKg", value)}
                                    placeholder={weightPlaceholder}
                                    placeholderTextColor={colors.textMuted}
                                  />
                                  <TextInput
                                    style={styles.setRowInput}
                                    keyboardType="number-pad"
                                    ref={(input) => onRegisterInputRef(repsInputId, input)}
                                    value={entry.reps}
                                    onFocus={() => setActiveInputId(repsInputId)}
                                    onBlur={() => onInputBlur(repsInputId)}
                                    onChangeText={(value) => onSetValueChange(set.id, setIndex, "reps", value)}
                                    placeholder={repsPlaceholder}
                                    placeholderTextColor={colors.textMuted}
                                  />
                                </>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <AppText variant="subtitle">Cooldown</AppText>
              <AppText variant="caption" muted>
                {cooldownMetaLabel}
              </AppText>
            </View>
            <View style={styles.listCard}>
              {displayedCooldownExercises.map((exercise) => (
                <View key={exercise.id} style={styles.simpleRow}>
                  <View style={styles.simpleRowIcon}>
                    <ExerciseSchematic type={exercise.exampleSchematic} />
                  </View>
                  <View style={styles.flexGrow}>
                    <AppText variant="bodyStrong">{exercise.name}</AppText>
                    <AppText variant="caption" muted>
                      {exercise.details}
                    </AppText>
                  </View>
                  <Pressable style={styles.exampleButton} onPress={() => onShowExamplePress(exercise)}>
                    <MaterialIcons name="image" size={14} color={colors.primary} />
                    <AppText variant="caption" style={styles.exampleButtonText}>
                      Example
                    </AppText>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.blockGap}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHead}>
              <View>
                <AppText variant="subtitle" style={styles.primaryText}>
                  Custom Strength
                </AppText>
                <AppText variant="caption" muted>
                  Workout Builder
                </AppText>
              </View>
              <View style={styles.summaryIconWrap}>
                  <MaterialIcons name="fitness-center" size={20} color={colors.onAccent} />
                </View>
            </View>

            <View style={styles.summaryFields}>
              <View style={styles.fieldCol}>
                <AppText variant="overline" muted>
                  DURATION (MIN)
                </AppText>
                <TextInput
                  style={styles.durationInput}
                  keyboardType="number-pad"
                  ref={(input) => onRegisterInputRef(CUSTOM_FIELD_IDS.durationInput, input)}
                  value={durationInput}
                  onFocus={() => setActiveInputId(CUSTOM_FIELD_IDS.durationInput)}
                  onBlur={() => onInputBlur(CUSTOM_FIELD_IDS.durationInput)}
                  onChangeText={setDurationInput}
                  placeholder="45"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.fieldCol}>
                <AppText variant="overline" muted>
                  INTENSITY
                </AppText>
                <View style={styles.intensityRow}>
                  {intensityOptions.map((option) => (
                    <Pressable
                      key={option}
                      style={[styles.intensityChip, intensity === option ? styles.intensityChipActive : undefined]}
                      onPress={() => setIntensity(option)}
                    >
                      <AppText variant="caption" style={intensity === option ? styles.intensityTextActive : undefined}>
                        {option}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <AppText variant="subtitle" style={styles.primaryText}>
                Exercise Selection
              </AppText>
              <AppText variant="caption" muted>
                {freeExercises.length} exercises
              </AppText>
            </View>
            <View style={styles.blockGapSmall}>
              {freeExercises.map((exercise) => (
                <View key={exercise.id} style={styles.exerciseRow}>
                  <View style={styles.exerciseIconWrap}>
                    <ExerciseSchematic type={exercise.exampleSchematic} />
                  </View>
                  <View style={styles.flexGrow}>
                    <AppText variant="bodyStrong" style={styles.primaryText}>
                      {exercise.name}
                    </AppText>
                    <AppText variant="caption" muted>
                      {exercise.details}
                    </AppText>
                  </View>
                  <View style={styles.exerciseRowActions}>
                    <Pressable style={styles.exampleButton} onPress={() => onShowExamplePress(exercise)}>
                      <MaterialIcons name="image" size={14} color={colors.primary} />
                      <AppText variant="caption" style={styles.exampleButtonText}>
                        Example
                      </AppText>
                    </Pressable>
                    <MaterialIcons name="drag-indicator" size={18} color={colors.textMuted} />
                  </View>
                </View>
              ))}

              <Pressable style={styles.addExerciseButton}>
                <MaterialIcons name="add-circle-outline" size={18} color={colors.primary} />
                <AppText variant="bodyStrong" style={styles.primaryText}>
                  Add Exercise
                </AppText>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <AppText variant="subtitle" style={styles.primaryText}>
              Log Results
            </AppText>
            <View style={styles.logCard}>
              <View style={styles.logCol}>
                <AppText variant="overline" muted>
                  WEIGHT (KG)
                </AppText>
                <TextInput
                  style={styles.logInput}
                  keyboardType="decimal-pad"
                  ref={(input) => onRegisterInputRef(CUSTOM_FIELD_IDS.weightKg, input)}
                  value={weightKg}
                  onFocus={() => setActiveInputId(CUSTOM_FIELD_IDS.weightKg)}
                  onBlur={() => onInputBlur(CUSTOM_FIELD_IDS.weightKg)}
                  onChangeText={setWeightKg}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.logDivider} />

              <View style={styles.logCol}>
                <AppText variant="overline" muted>
                  REPS
                </AppText>
                <TextInput
                  style={styles.logInput}
                  keyboardType="number-pad"
                  ref={(input) => onRegisterInputRef(CUSTOM_FIELD_IDS.reps, input)}
                  value={reps}
                  onFocus={() => setActiveInputId(CUSTOM_FIELD_IDS.reps)}
                  onBlur={() => onInputBlur(CUSTOM_FIELD_IDS.reps)}
                  onChangeText={setReps}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </View>

          <View style={styles.lockedCard}>
            <View style={styles.lockedBlur}>
              <AppText variant="overline" style={styles.primaryText}>
                STRUCTURED PLAN
              </AppText>
              <AppText variant="caption" muted>
                Optimized progression for your current cycle phase.
              </AppText>
            </View>
            <View style={styles.lockOverlay}>
              <MaterialIcons name="lock" size={18} color={colors.primary} />
              <AppText variant="bodyStrong" style={styles.primaryText}>
                Unlock Pro Features
              </AppText>
              <AppText variant="caption" muted style={styles.lockTextCenter}>
                Get AI-driven recommendations based on your cycle phase.
              </AppText>
              <AppButton label="See Premium" variant="secondary" onPress={() => navigation.navigate("PremiumUpsell")} />
            </View>
          </View>
        </View>
      )}

      {hasStartedWorkout ? (
        <AppButton label={saving ? "Saving..." : isPremiumSession ? "Complete Workout" : "Complete Session"} onPress={() => void onCompletePress()} />
      ) : (
        <AppButton label="Start Workout" onPress={onStartWorkoutPress} />
      )}

      {resultMessage ? (
        <View style={styles.resultBox}>
          <AppText variant="caption" muted>
            {resultMessage}
          </AppText>
        </View>
      ) : null}

      <Modal visible={isHeaderMenuOpen} transparent animationType="fade" onRequestClose={() => setIsHeaderMenuOpen(false)}>
        <Pressable style={styles.headerMenuBackdrop} onPress={() => setIsHeaderMenuOpen(false)}>
          <View style={styles.headerMenuContainer}>
            <Pressable style={styles.headerMenuCard} onPress={(event) => event.stopPropagation()}>
              <Pressable style={styles.headerMenuItem} onPress={onAbandonWorkoutPress}>
                <MaterialIcons name="exit-to-app" size={18} color={colors.error} />
                <AppText variant="bodyStrong" style={styles.headerMenuItemText}>
                  Abandon Workout
                </AppText>
              </Pressable>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={isTimerModalOpen} transparent animationType="slide" onRequestClose={() => setIsTimerModalOpen(false)}>
        <Pressable style={styles.timerModalBackdrop} onPress={() => setIsTimerModalOpen(false)}>
          <Pressable style={styles.timerModalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.timerModalHeader}>
              <AppText variant="subtitle" style={styles.timerModalTitle}>
                Timer
              </AppText>
              <Pressable style={styles.timerCloseButton} onPress={() => setIsTimerModalOpen(false)}>
                <MaterialIcons name="close" size={18} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.timerCircle}>
              <AppText variant="title" style={styles.timerValue}>
                {timerLabel}
              </AppText>
            </View>

            <View style={styles.timerControlRow}>
              <Pressable style={styles.timerAdjustButton} onPress={() => onTimerAdjustPress(-15)}>
                <AppText variant="bodyStrong" style={styles.timerAdjustButtonText}>
                  -15s
                </AppText>
              </Pressable>

              <Pressable style={styles.timerPlayButton} onPress={onTimerTogglePress}>
                <MaterialIcons name={isTimerRunning ? "pause" : "play-arrow"} size={30} color={colors.onPrimary} />
              </Pressable>

              <Pressable style={styles.timerAdjustButton} onPress={() => onTimerAdjustPress(15)}>
                <AppText variant="bodyStrong" style={styles.timerAdjustButtonText}>
                  +15s
                </AppText>
              </Pressable>
            </View>

            <View style={styles.timerPresetBlock}>
              <AppText variant="subtitle" style={styles.timerPresetHeading}>
                Timers
              </AppText>
              <View style={styles.timerPresetRow}>
                {TIMER_PRESET_SECONDS.map((seconds) => (
                    <Pressable
                      key={`preset-${seconds}`}
                      style={[styles.timerPresetButton, timerRemainingSeconds === seconds && !isTimerRunning ? styles.timerPresetButtonActive : undefined]}
                      onPress={() => onTimerPresetPress(seconds)}
                    >
                      <AppText
                        variant="bodyStrong"
                        style={[
                          styles.timerPresetButtonText,
                          timerRemainingSeconds === seconds && !isTimerRunning ? styles.timerPresetButtonTextActive : undefined
                        ]}
                      >
                        {formatClock(seconds)}
                      </AppText>
                    </Pressable>
                ))}
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={activeExample !== null} transparent animationType="fade" onRequestClose={() => setActiveExample(null)}>
        <Pressable style={styles.exampleModalBackdrop} onPress={() => setActiveExample(null)}>
          <Pressable style={styles.exampleModalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.exampleModalHeader}>
              <AppText variant="subtitle" style={styles.primaryText}>
                {activeExample?.name}
              </AppText>
              <Pressable style={styles.headerIconButton} onPress={() => setActiveExample(null)}>
                <MaterialIcons name="close" size={18} color={colors.primary} />
              </Pressable>
            </View>
            {activeExample ? (
              <View style={styles.exampleModalImage}>
                <ExerciseSchematic type={activeExample.schematicType} />
              </View>
            ) : null}
            {activeExample?.detail ? (
              <View style={styles.exampleModalBody}>
                <AppText variant="caption" muted>
                  {activeExample.detail}
                </AppText>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    gap: spacing.lg
  },
  stickyHeader: {
    backgroundColor: colors.background,
    paddingBottom: spacing.sm,
    zIndex: 2
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  headerActionsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginLeft: "auto"
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  headerActionButton: {
    minHeight: 36,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  },
  headerActionButtonDisabled: {
    opacity: 0.45
  },
  headerActionButtonText: {
    color: colors.onPrimary
  },
  headerMeta: {
    gap: 2,
    marginTop: -4
  },
  headerTitleBlock: {
    flex: 1,
    gap: 1
  },
  headerTitle: {
    color: colors.primary
  },
  headerEstimate: {
    lineHeight: 16
  },
  phaseBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.sage
  },
  phaseText: {
    color: colors.onAccent,
    fontWeight: "700"
  },
  blockGap: {
    gap: spacing.lg
  },
  blockGapSmall: {
    gap: spacing.sm
  },
  sectionWrap: {
    gap: spacing.sm
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  primaryText: {
    color: colors.primary
  },

  summaryCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md
  },
  summaryHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center"
  },
  summaryFields: {
    flexDirection: "row",
    gap: spacing.md
  },
  fieldCol: {
    flex: 1,
    gap: 6
  },
  durationInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 4,
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary
  },
  intensityRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap"
  },
  intensityChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface
  },
  intensityChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  intensityTextActive: {
    color: colors.onPrimary
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md
  },
  exerciseRowActions: {
    alignItems: "flex-end",
    gap: 8
  },
  exerciseIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: "hidden"
  },
  addExerciseButton: {
    borderWidth: 2,
    borderColor: colors.sage,
    borderStyle: "dashed",
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  logCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg
  },
  logCol: {
    flex: 1,
    gap: 8,
    alignItems: "center"
  },
  logDivider: {
    width: 1,
    height: "100%",
    backgroundColor: colors.border
  },
  logInput: {
    width: "100%",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary
  },
  lockedCard: {
    position: "relative",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    overflow: "hidden",
    minHeight: 130,
    justifyContent: "center"
  },
  lockedBlur: {
    opacity: 0.45,
    gap: 6
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surfaceOverlay
  },
  lockTextCenter: {
    textAlign: "center"
  },

  statGrid: {
    flexDirection: "row",
    gap: spacing.sm
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4
  },
  listCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden"
  },
  simpleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  simpleRowIcon: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: "hidden"
  },
  flexGrow: {
    flex: 1
  },
  mainSetCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md
  },
  mainSetTop: {
    flexDirection: "row",
    gap: spacing.sm
  },
  mainSetActions: {
    alignItems: "flex-end",
    gap: 8
  },
  mainSetLeft: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm
  },
  mainSetIconWrap: {
    width: 74,
    height: 74,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: "hidden"
  },
  tagRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8
  },
  smallTag: {
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  startSetButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    alignSelf: "flex-start"
  },
  exampleButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  exampleButtonText: {
    color: colors.primary,
    fontWeight: "600"
  },
  setRowsWrap: {
    marginTop: spacing.md,
    gap: spacing.sm
  },
  setRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    gap: 6
  },
  setRowComplete: {
    borderColor: colors.sage,
    backgroundColor: colors.sage
  },
  setRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  setRowLabel: {
    color: colors.primary
  },
  setRowStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  setRowStatusComplete: {
    backgroundColor: colors.sage
  },
  setRowStatusTextPending: {
    color: colors.textMuted
  },
  setRowStatusTextComplete: {
    color: colors.onAccent
  },
  setRowInputs: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center"
  },
  setRowInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    color: colors.primary,
    backgroundColor: colors.surfaceMuted
  },

  resultBox: {
    alignItems: "center"
  },
  headerMenuBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay
  },
  headerMenuContainer: {
    alignItems: "flex-end",
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.xl
  },
  headerMenuCard: {
    minWidth: 190,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden"
  },
  headerMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  headerMenuItemText: {
    color: colors.error
  },
  timerModalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end"
  },
  timerModalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg
  },
  timerModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  timerModalTitle: {
    color: colors.primary
  },
  timerCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border
  },
  timerCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 10,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: colors.surface
  },
  timerValue: {
    color: colors.primary,
    fontSize: 64,
    lineHeight: 72,
    fontWeight: "700"
  },
  timerControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  timerAdjustButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border
  },
  timerAdjustButtonText: {
    color: colors.primary
  },
  timerPlayButton: {
    width: 98,
    height: 98,
    borderRadius: 49,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  },
  timerPresetBlock: {
    gap: spacing.sm
  },
  timerPresetHeading: {
    color: colors.primary
  },
  timerPresetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  timerPresetButton: {
    flex: 1,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center"
  },
  timerPresetButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.sage
  },
  timerPresetButtonText: {
    color: colors.primary
  },
  timerPresetButtonTextActive: {
    color: colors.onAccent
  },
  keyboardNavGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted
  },
  keyboardNavButton: {
    width: 46,
    height: 36,
    alignItems: "center",
    justifyContent: "center"
  },
  keyboardNavButtonSplit: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border
  },
  keyboardNavButtonDisabled: {
    opacity: 0.45
  },
  exampleModalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: spacing.lg
  },
  exampleModalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border
  },
  exampleModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  exampleModalBody: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  exampleModalImage: {
    width: "100%",
    aspectRatio: 1,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted
  }
});
