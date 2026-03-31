import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren, type ReactNode } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type KeyboardEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type NativeTouchEvent,
  type StyleProp,
  type ViewStyle
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeColors } from "@/theme/ThemeProvider";
import { spacing, type ThemeColors } from "@/theme/tokens";

type ScreenContainerProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  includeBottomInset?: boolean;
  keyboardAccessory?: ReactNode;
  stickyHeaderIndices?: number[];
}>;

const safeAreaEdgesWithBottom = ["top", "right", "bottom", "left"] as const;
const safeAreaEdgesWithoutBottom = ["top", "right", "left"] as const;
const FOCUSED_INPUT_CLEARANCE = spacing.xxxl + spacing.lg;
const EXTRA_SCROLL_OFFSET = spacing.xxl;

export function ScreenContainer({
  children,
  contentContainerStyle,
  includeBottomInset = true,
  keyboardAccessory,
  stickyHeaderIndices
}: ScreenContainerProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffsetYRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const lastFocusedInputRef = useRef<unknown>(null);

  const ensureFocusedInputIsVisible = useCallback((animated = true) => {
    const focusedInput = TextInput.State.currentlyFocusedInput?.();
    const keyboardSpace = keyboardHeightRef.current;

    if (!focusedInput || !scrollViewRef.current || keyboardSpace <= 0 || typeof focusedInput.measureInWindow !== "function") {
      return;
    }

    focusedInput.measureInWindow((_x, y, _width, height) => {
      const keyboardTopY = Dimensions.get("window").height - keyboardSpace;
      const desiredInputBottomY = keyboardTopY - FOCUSED_INPUT_CLEARANCE;
      const inputBottomY = y + height;

      if (inputBottomY <= desiredInputBottomY) {
        return;
      }

      const deltaY = inputBottomY - desiredInputBottomY + EXTRA_SCROLL_OFFSET;
      const nextY = Math.max(0, scrollOffsetYRef.current + deltaY);
      scrollOffsetYRef.current = nextY;
      scrollViewRef.current?.scrollTo({ y: nextY, animated });
    });
  }, []);

  const getKeyboardHeightFromEvent = useCallback((event: KeyboardEvent) => {
    if (typeof event.endCoordinates.screenY === "number") {
      return Math.max(0, Dimensions.get("window").height - event.endCoordinates.screenY);
    }

    return Math.max(0, event.endCoordinates.height);
  }, []);

  const applyKeyboardFrame = useCallback(
    (event: KeyboardEvent) => {
      const height = getKeyboardHeightFromEvent(event);
      keyboardHeightRef.current = height;
      setKeyboardHeight(height);
      setIsKeyboardVisible(height > 0);
    },
    [getKeyboardHeightFromEvent]
  );

  const onKeyboardShow = useCallback(
    (event: KeyboardEvent) => {
      applyKeyboardFrame(event);

      requestAnimationFrame(() => ensureFocusedInputIsVisible(true));
      setTimeout(() => ensureFocusedInputIsVisible(true), 120);
      setTimeout(() => ensureFocusedInputIsVisible(true), 260);
    },
    [applyKeyboardFrame, ensureFocusedInputIsVisible]
  );

  const onKeyboardFrameChange = useCallback(
    (event: KeyboardEvent) => {
      applyKeyboardFrame(event);
    },
    [applyKeyboardFrame]
  );

  const onKeyboardHide = useCallback(() => {
    keyboardHeightRef.current = 0;
    lastFocusedInputRef.current = null;
    setIsKeyboardVisible(false);
    setKeyboardHeight(0);
  }, []);

  const onTouchEnd = useCallback(
    (_event: NativeSyntheticEvent<NativeTouchEvent>) => {
      if (!isKeyboardVisible) {
        return;
      }

      setTimeout(() => ensureFocusedInputIsVisible(true), 110);
    },
    [ensureFocusedInputIsVisible, isKeyboardVisible]
  );

  const onScrollViewResponderRelease = useCallback(() => {
    if (!isKeyboardVisible) {
      return;
    }

    const focusedInput = TextInput.State.currentlyFocusedInput?.();
    if (!focusedInput || focusedInput === lastFocusedInputRef.current) {
      return;
    }

    lastFocusedInputRef.current = focusedInput;
    setTimeout(() => ensureFocusedInputIsVisible(true), 80);
  }, [ensureFocusedInputIsVisible, isKeyboardVisible]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  useEffect(() => {
    const subscriptions =
      Platform.OS === "ios"
        ? [
            Keyboard.addListener("keyboardWillShow", onKeyboardShow),
            Keyboard.addListener("keyboardWillHide", onKeyboardHide),
            Keyboard.addListener("keyboardWillChangeFrame", onKeyboardFrameChange),
            Keyboard.addListener("keyboardDidHide", onKeyboardHide)
          ]
        : [Keyboard.addListener("keyboardDidShow", onKeyboardShow), Keyboard.addListener("keyboardDidHide", onKeyboardHide)];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [onKeyboardFrameChange, onKeyboardHide, onKeyboardShow]);

  const keyboardButtonBottom = Math.max(spacing.lg, keyboardHeight + spacing.md);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={includeBottomInset ? safeAreaEdgesWithBottom : safeAreaEdgesWithoutBottom}
    >
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        stickyHeaderIndices={stickyHeaderIndices}
        contentContainerStyle={[
          styles.content,
          isKeyboardVisible ? { paddingBottom: spacing.xxxl + keyboardHeight + spacing.xl } : undefined,
          contentContainerStyle
        ]}
        onTouchEnd={onTouchEnd}
        onResponderRelease={onScrollViewResponderRelease}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>
      {isKeyboardVisible ? (
        <>
          {keyboardAccessory ? <View style={[styles.keyboardAccessoryLeft, { bottom: keyboardButtonBottom }]}>{keyboardAccessory}</View> : null}
          <Pressable
            style={[styles.hideKeyboardButton, { bottom: keyboardButtonBottom }]}
            onPressIn={Keyboard.dismiss}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Hide keyboard"
          >
            <MaterialIcons name="keyboard-hide" size={16} color={colors.onPrimary} />
          </Pressable>
        </>
      ) : null}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background
    },
    content: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxxl,
      gap: spacing.lg
    },
    hideKeyboardButton: {
      position: "absolute",
      right: spacing.xl,
      zIndex: 1000,
      borderRadius: 20,
      width: 40,
      height: 40,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000000",
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6
    },
    keyboardAccessoryLeft: {
      position: "absolute",
      left: spacing.xl,
      zIndex: 1000,
      shadowColor: "#000000",
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6
    }
  });
