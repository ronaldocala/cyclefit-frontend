import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useWorkoutSession } from "@/features/workout-session/hooks/useWorkoutSession";
import { colors, radius, spacing } from "@/theme/tokens";

import type { RootStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "WorkoutSession">;

export function WorkoutSessionScreen({ route, navigation }: Props) {
  const { sourceType, sourceId } = route.params;
  const { startSession, startedAtIso, durationSeconds, completeSession, saving } = useWorkoutSession();
  const [rpe, setRpe] = useState("6");
  const [notes, setNotes] = useState("");
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="title">Workout Session</AppText>
        <AppText variant="caption" muted>
          Source: {sourceType}
        </AppText>
      </View>

      <AppCard>
        <AppText variant="subtitle">Session timer</AppText>
        <AppText variant="h2">{Math.floor(durationSeconds / 60)} min</AppText>
        <AppText variant="caption" muted>
          {startedAtIso ? `Started at ${new Date(startedAtIso).toISOString()}` : "Start when ready"}
        </AppText>

        {!startedAtIso ? (
          <AppButton
            label="Start session"
            onPress={startSession}
            rightSlot={<MaterialIcons name="play-arrow" size={20} color={colors.surface} />}
          />
        ) : null}
      </AppCard>

      <AppCard>
        <AppText variant="subtitle">Finish details</AppText>
        <TextInput
          style={styles.input}
          value={rpe}
          keyboardType="number-pad"
          onChangeText={setRpe}
          placeholder="RPE (1-10)"
        />
        <TextInput style={[styles.input, styles.notes]} value={notes} onChangeText={setNotes} placeholder="Notes" multiline />

        <AppButton
          label={saving ? "Saving..." : "Mark completed"}
          onPress={async () => {
            const result = await completeSession({
              sourceType,
              sourceId,
              rpe: Number(rpe),
              notes
            });

            setResultMessage(result === "saved" ? "Session saved" : "No connection, queued for sync");
          }}
        />

        <AppButton label="Close" variant="outline" onPress={() => navigation.goBack()} />
      </AppCard>

      {resultMessage ? <AppText muted>{resultMessage}</AppText> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    gap: spacing.lg
  },
  header: {
    gap: 4
  },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md
  },
  notes: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingVertical: spacing.sm
  }
});
