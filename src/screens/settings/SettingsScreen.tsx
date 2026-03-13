import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { computeCycleSummary } from "@/features/cycle/cycleCalculator";
import { useSettingsScreen } from "@/features/settings/hooks/useSettingsScreen";
import { signOut } from "@/services/supabase/authService";
import { useThemeColors } from "@/theme/ThemeProvider";
import { getColorsForPhase, radius, spacing, type ThemeColors } from "@/theme/tokens";
import { asDate, toIsoDate } from "@/utils/date";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const menstrualColors = getColorsForPhase("menstrual");
const ovulationColors = getColorsForPhase("ovulation");

function parseLength(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildCalendarDays(monthDate: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 })
  });
}

function chunkIntoWeeks(days: Date[]): Date[][] {
  const weeks: Date[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}

function formatSyncMessage(syncStatus: "synced" | "pending", lastSyncedAt: string | null): string {
  if (syncStatus === "pending") {
    return "Saved on this device. Sync resumes automatically when you're back online.";
  }

  if (!lastSyncedAt) {
    return "Saved locally and ready to sync.";
  }

  return `Synced ${new Date(lastSyncedAt).toLocaleString()}.`;
}

export function SettingsScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    profile,
    cycleState,
    cycleSettings,
    loading,
    updateProfile,
    updateCycleSettings,
    restorePurchases,
    openCustomerCenter,
    deletingAccount,
    deleteAccount,
    restoring,
    openingCustomerCenter,
    savingProfile,
    savingCycleSettings
  } = useSettingsScreen();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [profileSavedMessage, setProfileSavedMessage] = useState<string | null>(null);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [cycleError, setCycleError] = useState<string | null>(null);
  const [draftLastPeriodDate, setDraftLastPeriodDate] = useState(cycleSettings?.last_period_date ?? toIsoDate(new Date()));
  const [draftCycleLengthDays, setDraftCycleLengthDays] = useState(String(cycleSettings?.cycle_length_days ?? 28));
  const [draftPeriodLengthDays, setDraftPeriodLengthDays] = useState(String(cycleSettings?.period_length_days ?? 5));
  const [visibleMonth, setVisibleMonth] = useState(asDate(cycleSettings?.last_period_date ?? toIsoDate(new Date())));
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const modalScrollRef = useRef<ScrollView | null>(null);
  const keyboardOffset = keyboardHeight > 0 ? keyboardHeight + spacing.sm : spacing.md;
  const modalMaxHeight = Math.max(Math.min(windowHeight - spacing.xl * 2 - keyboardOffset, 760), 360);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
  }, [profile?.display_name]);

  useEffect(() => {
    const nextDate = cycleSettings?.last_period_date ?? toIsoDate(new Date());
    setDraftLastPeriodDate(nextDate);
    setDraftCycleLengthDays(String(cycleSettings?.cycle_length_days ?? 28));
    setDraftPeriodLengthDays(String(cycleSettings?.period_length_days ?? 5));
    setVisibleMonth(asDate(nextDate));
  }, [cycleSettings?.cycle_length_days, cycleSettings?.last_period_date, cycleSettings?.period_length_days]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(Math.max(event.endCoordinates.height, 0));
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const summary = useMemo(() => {
    if (!cycleSettings) {
      return null;
    }

    return computeCycleSummary(cycleSettings);
  }, [cycleSettings]);

  const draftCycleLengthValue = parseLength(draftCycleLengthDays);
  const draftPeriodLengthValue = parseLength(draftPeriodLengthDays);
  const selectedStartDate = asDate(draftLastPeriodDate);
  const selectedPeriodDates = useMemo(() => {
    const periodLength = draftPeriodLengthValue && draftPeriodLengthValue > 0 ? draftPeriodLengthValue : 1;
    return Array.from({ length: periodLength }, (_, index) => addDays(selectedStartDate, index));
  }, [draftPeriodLengthValue, selectedStartDate]);
  const selectedNextPeriodDates = useMemo(() => {
    const cycleLength = draftCycleLengthValue && draftCycleLengthValue > 0 ? draftCycleLengthValue : 28;
    const periodLength = draftPeriodLengthValue && draftPeriodLengthValue > 0 ? draftPeriodLengthValue : 1;
    const nextPeriodStartDate = addDays(selectedStartDate, cycleLength);

    return Array.from({ length: periodLength }, (_, index) => addDays(nextPeriodStartDate, index));
  }, [draftCycleLengthValue, draftPeriodLengthValue, selectedStartDate]);
  const selectedOvulationDates = useMemo(() => {
    const cycleLength = draftCycleLengthValue && draftCycleLengthValue > 0 ? draftCycleLengthValue : 28;
    const periodLength = draftPeriodLengthValue && draftPeriodLengthValue > 0 ? draftPeriodLengthValue : 5;
    const ovulationCenter = Math.min(Math.max(cycleLength - 14, periodLength + 1), cycleLength);
    const ovulationStartDay = Math.max(ovulationCenter - 1, periodLength + 1);
    const ovulationEndDay = Math.min(ovulationCenter + 1, cycleLength);

    return Array.from({ length: ovulationEndDay - ovulationStartDay + 1 }, (_, index) =>
      addDays(selectedStartDate, ovulationStartDay - 1 + index)
    );
  }, [draftCycleLengthValue, draftPeriodLengthValue, selectedStartDate]);
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const calendarWeeks = useMemo(() => chunkIntoWeeks(calendarDays), [calendarDays]);

  function openCycleModal(): void {
    const nextDate = cycleSettings?.last_period_date ?? toIsoDate(new Date());
    setDraftLastPeriodDate(nextDate);
    setDraftCycleLengthDays(String(cycleSettings?.cycle_length_days ?? 28));
    setDraftPeriodLengthDays(String(cycleSettings?.period_length_days ?? 5));
    setVisibleMonth(new Date());
    setCycleError(null);
    setIsCycleModalOpen(true);
  }

  function closeCycleModal(): void {
    setIsCycleModalOpen(false);
    setCycleError(null);
  }

  function scrollModalToInputs(): void {
    setTimeout(() => {
      modalScrollRef.current?.scrollToEnd({ animated: true });
    }, Platform.OS === "ios" ? 260 : 220);
  }

  async function handleProfileSave(): Promise<void> {
    await updateProfile({
      display_name: displayName.trim() || null
    });
    setProfileSavedMessage("Profile updated.");
  }

  async function handleCycleSave(): Promise<void> {
    const nextCycleLength = parseLength(draftCycleLengthDays);
    const nextPeriodLength = parseLength(draftPeriodLengthDays);

    if (!nextCycleLength || nextCycleLength < 15 || nextCycleLength > 60) {
      setCycleError("Cycle length needs to be between 15 and 60 days.");
      return;
    }

    if (!nextPeriodLength || nextPeriodLength < 1 || nextPeriodLength > 15) {
      setCycleError("Period length needs to be between 1 and 15 days.");
      return;
    }

    if (nextPeriodLength >= nextCycleLength) {
      setCycleError("Period length needs to be shorter than the full cycle length.");
      return;
    }

    setCycleError(null);
    await updateCycleSettings({
      last_period_date: draftLastPeriodDate,
      cycle_length_days: nextCycleLength,
      period_length_days: nextPeriodLength
    });
    closeCycleModal();
  }

  if (loading) {
    return (
      <ScreenContainer includeBottomInset={false} contentContainerStyle={styles.content}>
        <AppText>Loading settings...</AppText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer includeBottomInset={false} contentContainerStyle={styles.content}>
      <AppText variant="title">Settings</AppText>

      <AppCard style={styles.card}>
        <AppText variant="subtitle">Profile</AppText>
        <View style={styles.fieldBlock}>
          <AppText variant="caption" muted>
            Display name
          </AppText>
          <TextInput
            style={styles.input}
            value={displayName}
            placeholder="Display name"
            placeholderTextColor={colors.textMuted}
            onChangeText={(value) => {
              setDisplayName(value);
              setProfileSavedMessage(null);
            }}
          />
        </View>
        {profileSavedMessage ? (
          <AppText variant="caption" muted>
            {profileSavedMessage}
          </AppText>
        ) : null}
        <AppButton label={savingProfile ? "Saving..." : "Save profile"} onPress={() => void handleProfileSave()} />
      </AppCard>

      <AppCard style={styles.cycleOverviewCard}>
        <View style={styles.cycleOverviewHeader}>
          <View style={styles.cycleOverviewText}>
            <AppText variant="subtitle">Cycle tracking</AppText>
            <AppText variant="caption" muted>
              {formatSyncMessage(cycleState.syncStatus, cycleState.lastSyncedAt)}
            </AppText>
          </View>
          {summary ? (
            <View style={styles.phaseBadge}>
              <AppText variant="caption" style={styles.phaseBadgeText}>
                {summary.phaseLabel}
              </AppText>
            </View>
          ) : null}
        </View>

        {summary ? (
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCell}>
              <AppText variant="caption" muted>
                Day
              </AppText>
              <AppText variant="bodyStrong">{summary.dayInCycle}</AppText>
            </View>
            <View style={styles.overviewCell}>
              <AppText variant="caption" muted>
                Next period
              </AppText>
              <AppText variant="bodyStrong">{summary.nextPeriodDate}</AppText>
            </View>
            <View style={styles.overviewCell}>
              <AppText variant="caption" muted>
                Last logged
              </AppText>
              <AppText variant="bodyStrong">{cycleSettings?.last_period_date}</AppText>
            </View>
            <View style={styles.overviewCell}>
              <AppText variant="caption" muted>
                Length
              </AppText>
              <AppText variant="bodyStrong">
                {cycleSettings?.cycle_length_days} / {cycleSettings?.period_length_days} days
              </AppText>
            </View>
          </View>
        ) : (
          <AppText muted>Add your cycle details to personalize training and recovery across the app.</AppText>
        )}

        <AppButton label="Change cycle" variant="outline" onPress={openCycleModal} />
      </AppCard>

      <AppCard style={styles.card}>
        <AppText variant="subtitle">Subscription</AppText>
        <AppText muted>Restore purchases and sync entitlement status.</AppText>
        <AppButton
          label={openingCustomerCenter ? "Opening..." : "Manage subscription"}
          variant="outline"
          onPress={() => void openCustomerCenter()}
        />
        <AppButton label={restoring ? "Restoring..." : "Restore purchases"} onPress={() => void restorePurchases()} />
      </AppCard>

      <AppCard style={styles.card}>
        <AppText variant="subtitle">Account</AppText>
        <AppButton label="Sign out" variant="outline" onPress={() => void signOut()} />
        <AppButton label={deletingAccount ? "Deleting..." : "Delete account"} variant="ghost" onPress={() => void deleteAccount()} />
      </AppCard>

      <Modal
        visible={isCycleModalOpen}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={closeCycleModal}
      >
        <Pressable style={[styles.modalBackdrop, { paddingBottom: keyboardOffset }]} onPress={closeCycleModal}>
          <View style={styles.modalKeyboard}>
            <Pressable style={[styles.modalCard, { maxHeight: modalMaxHeight }]} onPress={(event) => event.stopPropagation()}>
              <View style={styles.modalHeader}>
                <AppText variant="subtitle">Update cycle</AppText>
                <Pressable style={styles.modalCloseButton} onPress={closeCycleModal}>
                  <AppText variant="bodyStrong">Close</AppText>
                </Pressable>
              </View>

              <ScrollView
                ref={modalScrollRef}
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
                keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.calendarHeader}>
                  <Pressable style={styles.calendarNavButton} onPress={() => setVisibleMonth((current) => subMonths(current, 1))}>
                    <AppText variant="bodyStrong">Prev</AppText>
                  </Pressable>
                  <AppText variant="bodyStrong">{format(visibleMonth, "MMMM yyyy")}</AppText>
                  <Pressable style={styles.calendarNavButton} onPress={() => setVisibleMonth((current) => addMonths(current, 1))}>
                    <AppText variant="bodyStrong">Next</AppText>
                  </Pressable>
                </View>

                <View style={styles.weekdayRow}>
                  {weekdayLabels.map((label) => (
                    <View key={label} style={styles.weekdayCell}>
                      <AppText variant="caption" muted style={styles.weekdayLabel}>
                        {label}
                      </AppText>
                    </View>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {calendarWeeks.map((week, weekIndex) => (
                    <View key={`${format(week[0], "yyyy-MM-dd")}-${weekIndex}`} style={styles.calendarWeekRow}>
                      {week.map((day, dayIndex) => {
                        const isSelectedStart = isSameDay(day, selectedStartDate);
                        const isInPeriod = selectedPeriodDates.some((selectedDay) => isSameDay(selectedDay, day));
                        const isInNextPeriod = selectedNextPeriodDates.some((selectedDay) => isSameDay(selectedDay, day));
                        const isInOvulation = selectedOvulationDates.some((selectedDay) => isSameDay(selectedDay, day));
                        const isCurrentMonth = isSameMonth(day, visibleMonth);
                        const isPeriodStart =
                          isInPeriod && !selectedPeriodDates.some((selectedDay) => isSameDay(selectedDay, addDays(day, -1)));
                        const isPeriodEnd =
                          isInPeriod && !selectedPeriodDates.some((selectedDay) => isSameDay(selectedDay, addDays(day, 1)));
                        const isNextPeriodStart =
                          isInNextPeriod && !selectedNextPeriodDates.some((selectedDay) => isSameDay(selectedDay, addDays(day, -1)));
                        const isNextPeriodEnd =
                          isInNextPeriod && !selectedNextPeriodDates.some((selectedDay) => isSameDay(selectedDay, addDays(day, 1)));
                        const isOvulationStart =
                          isInOvulation && !selectedOvulationDates.some((selectedDay) => isSameDay(selectedDay, addDays(day, -1)));
                        const isOvulationEnd =
                          isInOvulation && !selectedOvulationDates.some((selectedDay) => isSameDay(selectedDay, addDays(day, 1)));

                        return (
                          <Pressable
                            key={day.toISOString()}
                            style={[
                              styles.calendarDayCell,
                              dayIndex < 6 ? styles.calendarDayCellBorder : undefined,
                              weekIndex < calendarWeeks.length - 1 ? styles.calendarDayRowBorder : undefined,
                              !isCurrentMonth ? styles.calendarDayOutsideMonth : undefined
                            ]}
                            onPress={() => setDraftLastPeriodDate(toIsoDate(day))}
                          >
                            {isInPeriod ? (
                              <View
                                style={[
                                  styles.periodFill,
                                  isPeriodStart ? styles.periodFillStart : undefined,
                                  isPeriodEnd ? styles.periodFillEnd : undefined
                                ]}
                              />
                            ) : isInNextPeriod ? (
                              <View
                                style={[
                                  styles.nextPeriodFill,
                                  isNextPeriodStart ? styles.nextPeriodFillStart : undefined,
                                  isNextPeriodEnd ? styles.nextPeriodFillEnd : undefined
                                ]}
                              />
                            ) : isInOvulation ? (
                              <View
                                style={[
                                  styles.ovulationFill,
                                  isOvulationStart ? styles.ovulationFillStart : undefined,
                                  isOvulationEnd ? styles.ovulationFillEnd : undefined
                                ]}
                              />
                            ) : null}
                            <View style={[styles.dayNumberWrap, isSelectedStart ? styles.dayNumberWrapSelected : undefined]}>
                              <AppText
                                variant="caption"
                                style={[
                                  styles.dayNumberText,
                                  !isCurrentMonth ? styles.calendarDayTextMuted : undefined,
                                  isInPeriod ? styles.calendarDayTextInPeriod : undefined,
                                  isInNextPeriod ? styles.calendarDayTextInNextPeriod : undefined,
                                  isInOvulation ? styles.calendarDayTextInOvulation : undefined,
                                  isSelectedStart ? styles.calendarDayTextSelected : undefined
                                ]}
                              >
                                {format(day, "d")}
                              </AppText>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </View>

                <View style={styles.row}>
                  <View style={[styles.fieldBlock, styles.halfField]}>
                    <AppText variant="caption" muted>
                      Cycle length
                    </AppText>
                    <TextInput
                      style={styles.input}
                      value={draftCycleLengthDays}
                      placeholder="28"
                      placeholderTextColor={colors.textMuted}
                      onChangeText={setDraftCycleLengthDays}
                      onFocus={scrollModalToInputs}
                      keyboardType="number-pad"
                    />
                  </View>

                  <View style={[styles.fieldBlock, styles.halfField]}>
                    <AppText variant="caption" muted>
                      Period length
                    </AppText>
                    <TextInput
                      style={styles.input}
                      value={draftPeriodLengthDays}
                      placeholder="5"
                      placeholderTextColor={colors.textMuted}
                      onChangeText={setDraftPeriodLengthDays}
                      onFocus={scrollModalToInputs}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                {cycleError ? <AppText style={styles.error}>{cycleError}</AppText> : null}
              </ScrollView>

              <View style={styles.modalFooter}>
                <View style={styles.actionRow}>
                  <AppButton label="Cancel" variant="ghost" onPress={closeCycleModal} style={styles.actionButton} />
                  <AppButton
                    label={savingCycleSettings ? "Saving..." : "Save"}
                    onPress={() => void handleCycleSave()}
                    style={styles.actionButton}
                  />
                </View>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingTop: spacing.md,
      gap: spacing.lg
    },
    card: {
      gap: spacing.md
    },
    cycleOverviewCard: {
      gap: spacing.md,
      backgroundColor: colors.surface
    },
    fieldBlock: {
      gap: spacing.xs
    },
    input: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      paddingHorizontal: spacing.md
    },
    cycleOverviewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.sm
    },
    cycleOverviewText: {
      flex: 1,
      gap: spacing.xs
    },
    phaseBadge: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm
    },
    phaseBadgeText: {
      color: colors.primary
    },
    overviewGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    overviewCell: {
      width: "47%",
      gap: 2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
      padding: spacing.md
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.24)",
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md
    },
    modalKeyboard: {
      flex: 1,
      width: "100%",
      alignItems: "center",
      justifyContent: "center"
    },
    modalCard: {
      width: "100%",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      overflow: "hidden"
    },
    modalScroll: {
      width: "100%",
      flexGrow: 0,
      flexShrink: 1
    },
    modalScrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.md
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md
    },
    modalCloseButton: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm
    },
    modalFooter: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      backgroundColor: colors.surface
    },
    calendarHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    calendarNavButton: {
      minWidth: 52
    },
    weekdayRow: {
      flexDirection: "row",
      marginBottom: spacing.xs
    },
    weekdayCell: {
      flex: 1,
      alignItems: "center"
    },
    weekdayLabel: {
      textAlign: "center"
    },
    calendarGrid: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      overflow: "hidden",
      backgroundColor: colors.surface
    },
    calendarWeekRow: {
      flexDirection: "row"
    },
    calendarDayCell: {
      flex: 1,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      backgroundColor: colors.surface
    },
    calendarDayCellBorder: {
      borderRightWidth: 1,
      borderRightColor: colors.border
    },
    calendarDayRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    calendarDayOutsideMonth: {
      backgroundColor: colors.surfaceMuted
    },
    periodFill: {
      position: "absolute",
      top: 6,
      bottom: 6,
      left: 0,
      right: 0,
      backgroundColor: colors.sage
    },
    periodFillStart: {
      left: 6,
      borderTopLeftRadius: radius.sm,
      borderBottomLeftRadius: radius.sm
    },
    periodFillEnd: {
      right: 6,
      borderTopRightRadius: radius.sm,
      borderBottomRightRadius: radius.sm
    },
    nextPeriodFill: {
      position: "absolute",
      top: 9,
      bottom: 9,
      left: 0,
      right: 0,
      backgroundColor: menstrualColors.surfaceMuted,
      borderWidth: 1,
      borderColor: menstrualColors.border
    },
    nextPeriodFillStart: {
      left: 7,
      borderTopLeftRadius: radius.sm,
      borderBottomLeftRadius: radius.sm
    },
    nextPeriodFillEnd: {
      right: 7,
      borderTopRightRadius: radius.sm,
      borderBottomRightRadius: radius.sm
    },
    ovulationFill: {
      position: "absolute",
      top: 12,
      bottom: 12,
      left: 0,
      right: 0,
      backgroundColor: ovulationColors.sage
    },
    ovulationFillStart: {
      left: 10,
      borderTopLeftRadius: radius.full,
      borderBottomLeftRadius: radius.full
    },
    ovulationFillEnd: {
      right: 10,
      borderTopRightRadius: radius.full,
      borderBottomRightRadius: radius.full
    },
    dayNumberWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center"
    },
    dayNumberWrapSelected: {
      backgroundColor: colors.primary
    },
    dayNumberText: {
      color: colors.textPrimary
    },
    calendarDayTextMuted: {
      color: colors.textMuted
    },
    calendarDayTextInPeriod: {
      color: colors.primary
    },
    calendarDayTextInNextPeriod: {
      color: menstrualColors.primary
    },
    calendarDayTextInOvulation: {
      color: ovulationColors.primary
    },
    calendarDayTextSelected: {
      color: colors.surface
    },
    row: {
      flexDirection: "row",
      gap: spacing.sm
    },
    halfField: {
      flex: 1
    },
    actionRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    actionButton: {
      flex: 1
    },
    error: {
      color: colors.error
    }
  });
