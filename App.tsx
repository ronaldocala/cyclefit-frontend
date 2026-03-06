import "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";

import { useAppBootstrap } from "@/hooks/useAppBootstrap";
import { AppNavigator } from "@/navigation/AppNavigator";
import { ThemeProvider } from "@/theme/ThemeProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1
    }
  }
});

function Root() {
  useAppBootstrap();

  return (
    <ThemeProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Root />
    </QueryClientProvider>
  );
}

