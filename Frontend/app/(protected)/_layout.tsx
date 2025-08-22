import { useUserContext } from "@/hooks/useUser";
import { Redirect, Stack } from "expo-router";



export default function ProtectedLayout() {
    const { token } = useUserContext();
    const isLoggedIn = !!token;
    if (!isLoggedIn) {
        return <Redirect href="/login" />;
    }

    return (
        <Stack>
            <Stack.Screen
                name="(tabs)"
                options={{
                    headerShown: false,
                }}
            />
        </Stack>
    )
}