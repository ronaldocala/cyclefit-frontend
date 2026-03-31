import {
  addDays,
  addMonths,
  differenceInCalendarDays,
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
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { useThemeColors, useThemeMode } from "@/theme/ThemeProvider";
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
  historyValue?: CycleTrackingDraft | null;
  futurePhaseStartDate?: string | null;
  onTrackPeriodToday?: (() => void) | null;
  style?: StyleProp<ViewStyle>;
};

type LengthMenu = "cycle" | "period" | null;
type PhaseDateSets = {
  periodDates: Set<string>;
  ovulationDates: Set<string>;
};

const defaultCycleOptions = Array.from({ length: 15 }, (_, index) => 21 + index);
const defaultPeriodOptions = Array.from({ length: 9 }, (_, index) => 2 + index);
const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
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

function createEmptyPhaseDateSets(): PhaseDateSets {
  return {
    periodDates: new Set<string>(),
    ovulationDates: new Set<string>()
  };
}

function addClampedDateRange(
  dates: Set<string>,
  startDate: Date,
  endDate: Date,
  rangeStart: Date,
  rangeEnd: Date,
  minDate?: Date,
  maxDate?: Date
): void {
  let clampedStart = startDate;
  let clampedEnd = endDate;

  if (rangeStart.getTime() > clampedStart.getTime()) {
    clampedStart = rangeStart;
  }

  if (rangeEnd.getTime() < clampedEnd.getTime()) {
    clampedEnd = rangeEnd;
  }

  if (minDate && minDate.getTime() > clampedStart.getTime()) {
    clampedStart = minDate;
  }

  if (maxDate && maxDate.getTime() < clampedEnd.getTime()) {
    clampedEnd = maxDate;
  }

  if (clampedStart.getTime() > clampedEnd.getTime()) {
    return;
  }

  const daysInRange = differenceInCalendarDays(clampedEnd, clampedStart);

  for (let index = 0; index <= daysInRange; index += 1) {
    dates.add(toIsoDate(addDays(clampedStart, index)));
  }
}

function buildPhaseDateSets({
  anchorDate,
  cycleLength,
  periodLength,
  rangeStart,
  rangeEnd,
  minDate,
  maxDate
}: {
  anchorDate: Date;
  cycleLength: number;
  periodLength: number;
  rangeStart: Date;
  rangeEnd: Date;
  minDate?: Date;
  maxDate?: Date;
}): PhaseDateSets {
  const phaseDates = createEmptyPhaseDateSets();
  const ovulationCenter = Math.min(Math.max(cycleLength - 14, periodLength + 1), cycleLength);
  const ovulationStartOffset = Math.max(ovulationCenter - 1, periodLength + 1) - 1;
  const ovulationEndOffset = Math.min(ovulationCenter + 1, cycleLength) - 1;
  const firstCycleIndex = Math.floor(differenceInCalendarDays(rangeStart, anchorDate) / cycleLength) - 1;
  let cycleStart = addDays(anchorDate, firstCycleIndex * cycleLength);

  while (cycleStart.getTime() <= rangeEnd.getTime()) {
    addClampedDateRange(
      phaseDates.periodDates,
      cycleStart,
      addDays(cycleStart, periodLength - 1),
      rangeStart,
      rangeEnd,
      minDate,
      maxDate
    );
    addClampedDateRange(
      phaseDates.ovulationDates,
      addDays(cycleStart, ovulationStartOffset),
      addDays(cycleStart, ovulationEndOffset),
      rangeStart,
      rangeEnd,
      minDate,
      maxDate
    );

    cycleStart = addDays(cycleStart, cycleLength);
  }

  return phaseDates;
}

export function CycleTrackingEditor({
  value,
  onChange,
  showForecast = false,
  cycleLengthOptions = defaultCycleOptions,
  periodLengthOptions = defaultPeriodOptions,
  historyValue = null,
  futurePhaseStartDate = null,
  onTrackPeriodToday = null,
  style
}: CycleTrackingEditorProps) {
  const colors = useThemeColors();
  const mode = useThemeMode();
  const menstrualColors = useMemo(() => getColorsForPhase("menstrual", mode), [mode]);
  const ovulationColors = useMemo(() => getColorsForPhase("ovulation", mode), [mode]);
  const styles = useMemo(() => createStyles(colors, menstrualColors, ovulationColors), [colors, menstrualColors, ovulationColors]);
  const { lastPeriodDate, cycleLengthDays, periodLengthDays } = value;
  const [visibleMonth, setVisibleMonth] = useState(asDate(lastPeriodDate));
  const [activeLengthMenu, setActiveLengthMenu] = useState<LengthMenu>(null);
  const today = useMemo(() => asDate(toIsoDate(new Date())), []);

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
  const splitStartDate = useMemo(
    () => (futurePhaseStartDate ? asDate(futurePhaseStartDate) : null),
    [futurePhaseStartDate]
  );
  const historyCutoffDate = useMemo(
    () => (splitStartDate ? addDays(splitStartDate, -1) : null),
    [splitStartDate]
  );
  const selectedPeriodDates = useMemo(
    () => Array.from({ length: safePeriodLength }, (_, index) => addDays(selectedStartDate, index)),
    [safePeriodLength, selectedStartDate]
  );
  const selectedPeriodDateKeys = useMemo(
    () => new Set(selectedPeriodDates.map((day) => toIsoDate(day))),
    [selectedPeriodDates]
  );
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const calendarWeeks = useMemo(() => chunkIntoWeeks(calendarDays), [calendarDays]);
  const calendarRangeStart = calendarDays[0] ?? selectedStartDate;
  const calendarRangeEnd = calendarDays[calendarDays.length - 1] ?? selectedStartDate;
  const historicalPhaseDates = useMemo(() => {
    if (!forecastEnabled || !historyValue || !historyCutoffDate) {
      return createEmptyPhaseDateSets();
    }

    return buildPhaseDateSets({
      anchorDate: asDate(historyValue.lastPeriodDate),
      cycleLength: Math.max(historyValue.cycleLengthDays, 1),
      periodLength: Math.max(historyValue.periodLengthDays, 1),
      rangeStart: calendarRangeStart,
      rangeEnd: calendarRangeEnd,
      maxDate: historyCutoffDate
    });
  }, [calendarRangeEnd, calendarRangeStart, forecastEnabled, historyCutoffDate, historyValue]);
  const activePhaseDates = useMemo(() => {
    if (!forecastEnabled) {
      return createEmptyPhaseDateSets();
    }

    return buildPhaseDateSets({
      anchorDate: selectedStartDate,
      cycleLength: safeCycleLength,
      periodLength: safePeriodLength,
      rangeStart: calendarRangeStart,
      rangeEnd: calendarRangeEnd,
      minDate: splitStartDate ?? today
    });
  }, [calendarRangeEnd, calendarRangeStart, forecastEnabled, safeCycleLength, safePeriodLength, selectedStartDate, splitStartDate, today]);
  const forecastPeriodDateKeys = useMemo(() => {
    const dates = new Set<string>(historicalPhaseDates.periodDates);

    activePhaseDates.periodDates.forEach((date) => {
      dates.add(date);
    });

    selectedPeriodDateKeys.forEach((date) => {
      dates.delete(date);
    });

    return dates;
  }, [activePhaseDates.periodDates, historicalPhaseDates.periodDates, selectedPeriodDateKeys]);
  const ovulationDateKeys = useMemo(() => {
    const dates = new Set<string>(historicalPhaseDates.ovulationDates);

    activePhaseDates.ovulationDates.forEach((date) => {
      dates.add(date);
    });

    return dates;
  }, [activePhaseDates.ovulationDates, historicalPhaseDates.ovulationDates]);

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
              const dayKey = toIsoDate(day);
              const previousDayKey = toIsoDate(addDays(day, -1));
              const nextDayKey = toIsoDate(addDays(day, 1));
              const isSelectedStart = isSameDay(day, selectedStartDate);
              const isToday = isSameDay(day, today);
              const isInPeriod = selectedPeriodDateKeys.has(dayKey);
              const isInForecastPeriod = forecastPeriodDateKeys.has(dayKey);
              const isInOvulation = ovulationDateKeys.has(dayKey);
              const isCurrentMonth = isSameMonth(day, visibleMonth);
              const isPeriodStart = isInPeriod && !selectedPeriodDateKeys.has(previousDayKey);
              const isPeriodEnd = isInPeriod && !selectedPeriodDateKeys.has(nextDayKey);
              const isForecastPeriodStart = isInForecastPeriod && !forecastPeriodDateKeys.has(previousDayKey);
              const isForecastPeriodEnd = isInForecastPeriod && !forecastPeriodDateKeys.has(nextDayKey);
              const isOvulationStart = isInOvulation && !ovulationDateKeys.has(previousDayKey);
              const isOvulationEnd = isInOvulation && !ovulationDateKeys.has(nextDayKey);

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
                  ) : isInForecastPeriod ? (
                    <View
                      style={[
                        styles.nextPeriodFill,
                        isForecastPeriodStart ? styles.nextPeriodFillStart : undefined,
                        isForecastPeriodEnd ? styles.nextPeriodFillEnd : undefined
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
                        isInForecastPeriod ? styles.calendarDayTextInNextPeriod : undefined,
                        isInOvulation ? styles.calendarDayTextInOvulation : undefined,
                        isSelectedStart ? styles.calendarDayTextSelected : undefined
                      ]}
                    >
                      {format(day, "d")}
                    </AppText>
                  </View>

                  {isToday ? <View style={[styles.todayDot, isSelectedStart ? styles.todayDotSelected : undefined]} /> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <AppText variant="caption" muted>
        Selected: {lastPeriodDate}
      </AppText>

      {onTrackPeriodToday ? <AppButton label="Track period today" variant="outline" onPress={onTrackPeriodToday} /> : null}

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
                    {selected ? <MaterialIcons name="check" size={18} color={colors.onAccent} /> : null}
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

const createStyles = (colors: ThemeColors, menstrualColors: ThemeColors, ovulationColors: ThemeColors) =>
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
    todayDot: {
      position: "absolute",
      bottom: 8,
      width: 5,
      height: 5,
      borderRadius: radius.full,
      backgroundColor: colors.primary
    },
    todayDotSelected: {
      backgroundColor: colors.surface
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
      color: colors.onPrimary
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
      backgroundColor: colors.overlay,
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
      color: colors.onAccent
    }
  });
