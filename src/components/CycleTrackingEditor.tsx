import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppText } from "@/components/AppText";
import { useThemeColors } from "@/theme/ThemeProvider";
import { getColorsForPhase, radius, spacing, type ThemeColors } from "@/theme/tokens";
import { asDate, toIsoDate } from "@/utils/date";

export type CycleTrackingDraft = {
  lastPeriodDate: string;
  cycleLengthDays: number;
  periodLengthDays: number;
};

type CycleTrackingEditorProps = {
  value: CycleTrackingDraft;
  onChange: (patch: Partial<CycleTrackingDraft>) => void;
  showForecast?: boolean;
  cycleLengthOptions?: readonly number[];
  periodLengthOptions?: readonly number[];
  style?: StyleProp<ViewStyle>;
};

type LengthMenu = "cycle" | "period" | null;

const defaultCycleOptions = Array.from({ length: 15 }, (_, index) => 21 + index);
const defaultPeriodOptions = Array.from({ length: 9 }, (_, index) => 2 + index);
const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const menstrualColors = getColorsForPhase("menstrual");
const ovulationColors = getColorsForPhase("ovulation");

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

function buildLengthOptions(options: readonly number[], currentValue: number): number[] {
  return Array.from(new Set([...options, currentValue])).sort((left, right) => left - right);
}

export function CycleTrackingEditor({
  value,
  onChange,
  showForecast = false,
  cycleLengthOptions = defaultCycleOptions,
  periodLengthOptions = defaultPeriodOptions,
  style
}: CycleTrackingEditorProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { lastPeriodDate, cycleLengthDays, periodLengthDays } = value;
  const [visibleMonth, setVisibleMonth] = useState(asDate(lastPeriodDate));
  const [activeLengthMenu, setActiveLengthMenu] = useState<LengthMenu>(null);

  useEffect(() => {
    setVisibleMonth(asDate(lastPeriodDate));
  }, [lastPeriodDate]);

  const resolvedCycleOptions = useMemo(
    () => buildLengthOptions(cycleLengthOptions, cycleLengthDays),
    [cycleLengthDays, cycleLengthOptions]
  );
  const resolvedPeriodOptions = useMemo(
    () => buildLengthOptions(periodLengthOptions, periodLengthDays),
    [periodLengthDays, periodLengthOptions]
  );

  const selectedStartDate = asDate(lastPeriodDate);
  const safeCycleLength = Math.max(cycleLengthDays, 1);
  const safePeriodLength = Math.max(periodLengthDays, 1);
  const forecastEnabled = showForecast && safePeriodLength < safeCycleLength;
  const selectedPeriodDates = useMemo(
    () => Array.from({ length: safePeriodLength }, (_, index) => addDays(selectedStartDate, index)),
    [safePeriodLength, selectedStartDate]
  );
  const selectedNextPeriodDates = useMemo(() => {
    if (!forecastEnabled) {
      return [];
    }

    const nextPeriodStartDate = addDays(selectedStartDate, safeCycleLength);
    return Array.from({ length: safePeriodLength }, (_, index) => addDays(nextPeriodStartDate, index));
  }, [forecastEnabled, safeCycleLength, safePeriodLength, selectedStartDate]);
  const selectedOvulationDates = useMemo(() => {
    if (!forecastEnabled) {
      return [];
    }

    const ovulationCenter = Math.min(Math.max(safeCycleLength - 14, safePeriodLength + 1), safeCycleLength);
    const ovulationStartDay = Math.max(ovulationCenter - 1, safePeriodLength + 1);
    const ovulationEndDay = Math.min(ovulationCenter + 1, safeCycleLength);

    return Array.from({ length: ovulationEndDay - ovulationStartDay + 1 }, (_, index) =>
      addDays(selectedStartDate, ovulationStartDay - 1 + index)
    );
  }, [forecastEnabled, safeCycleLength, safePeriodLength, selectedStartDate]);
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const calendarWeeks = useMemo(() => chunkIntoWeeks(calendarDays), [calendarDays]);

  const activeLengthOptions = activeLengthMenu === "cycle" ? resolvedCycleOptions : resolvedPeriodOptions;
  const activeLengthValue = activeLengthMenu === "cycle" ? cycleLengthDays : periodLengthDays;

  function closeLengthMenu(): void {
    setActiveLengthMenu(null);
  }

  return (
    <View style={[styles.root, style]}>
      <AppText variant="bodyStrong">Last period start date</AppText>

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
              const isPeriodStart = isInPeriod && !selectedPeriodDates.some((selectedDay) => isSameDay(selectedDay, addDays(day, -1)));
              const isPeriodEnd = isInPeriod && !selectedPeriodDates.some((selectedDay) => isSameDay(selectedDay, addDays(day, 1)));
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
                  onPress={() => onChange({ lastPeriodDate: toIsoDate(day) })}
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

      <AppText variant="caption" muted>
        Selected: {lastPeriodDate}
      </AppText>

      <View style={styles.fieldBlock}>
        <AppText variant="bodyStrong">Average cycle length</AppText>
        <Pressable style={styles.selectField} onPress={() => setActiveLengthMenu("cycle")}>
          <AppText>{cycleLengthDays} days</AppText>
          <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.primarySoft} />
        </Pressable>
      </View>

      <View style={styles.fieldBlock}>
        <AppText variant="bodyStrong">Average period length</AppText>
        <Pressable style={styles.selectField} onPress={() => setActiveLengthMenu("period")}>
          <AppText>{periodLengthDays} days</AppText>
          <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.primarySoft} />
        </Pressable>
      </View>

      <Modal visible={activeLengthMenu !== null} transparent animationType="fade" onRequestClose={closeLengthMenu}>
        <Pressable style={styles.modalBackdrop} onPress={closeLengthMenu}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <AppText variant="subtitle">
                {activeLengthMenu === "cycle" ? "Select cycle length" : "Select period length"}
              </AppText>
            </View>
            <View style={styles.optionList}>
              {activeLengthOptions.map((option) => {
                const selected = option === activeLengthValue;

                return (
                  <Pressable
                    key={`${activeLengthMenu}-${option}`}
                    style={[styles.optionRow, selected ? styles.optionRowSelected : undefined]}
                    onPress={() => {
                      onChange(activeLengthMenu === "cycle" ? { cycleLengthDays: option } : { periodLengthDays: option });
                      closeLengthMenu();
                    }}
                  >
                    <AppText variant="bodyStrong" style={selected ? styles.optionRowSelectedText : undefined}>
                      {option} days
                    </AppText>
                    {selected ? <MaterialIcons name="check" size={18} color={colors.surface} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      gap: spacing.md
    },
    fieldBlock: {
      gap: spacing.xs
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
    selectField: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.24)",
      justifyContent: "center",
      paddingHorizontal: spacing.lg
    },
    modalCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      overflow: "hidden"
    },
    modalHeader: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md
    },
    optionList: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    optionRow: {
      width: "48%",
      minHeight: 46,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      flexDirection: "row",
      gap: spacing.sm
    },
    optionRowSelected: {
      backgroundColor: colors.sage,
      borderColor: colors.primary
    },
    optionRowSelectedText: {
      color: colors.surface
    }
  });
