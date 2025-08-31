import { useUserContext } from "@/hooks/useUser";
import { useRouter } from "expo-router";
import { Image, ImageBackground, TouchableOpacity, useWindowDimensions, View } from "react-native";

const STORAGE_KEYS = {
  IS_FIRST_LAUNCH: '@user_is_first_launch'
};

export default function onBoardingScreen() {
    const { width, height } = useWindowDimensions();
    const { completeOnboarding } = useUserContext();
    const router = useRouter();
    
    const backgroundImage =
        width > 768
            ? require("@/assets/images/onboarding_desktop.png")
            : require("@/assets/images/Onboarding.png");

    const handleGetStarted = async () => {
        try {
            await completeOnboarding();
            router.replace("/login");
        } catch (error) {
            console.error("Error completing onboarding:", error);
        }
    };

    return (
        <View>
            <ImageBackground
                source={backgroundImage}
                style={{height: height, width: width}}
            >
                <TouchableOpacity onPress={handleGetStarted} style={{position: 'absolute', bottom: 40, right: 40}}>
                    <Image source={require("@/assets/images/stat.png")} />
                </TouchableOpacity>
            </ImageBackground>
        </View>
    );
}