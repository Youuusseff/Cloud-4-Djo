import { MyUserContextProvider } from "@/hooks/useUser";
import { Stack } from "expo-router";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  return (
    <MyUserContextProvider>
      <Stack>
        <Stack.Screen
          name="(protected)"
          options={{
            headerShown: false,
            animation: "none",
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          title: "Login",
          headerShown: true,
          animation: "none",
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: "Register",
          headerShown: true,
          animation: "none",
        }}
      />
    </Stack>
    <Toast topOffset={60} />
  </MyUserContextProvider>
)}
