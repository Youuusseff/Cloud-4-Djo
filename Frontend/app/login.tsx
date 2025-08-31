import CustomInput from "@/components/CustomInput";
import { useUserContext } from "@/hooks/useUser";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { Image } from "react-native";
import Toast from "react-native-toast-message";

export default function LoginScreen() {
  const router = useRouter();
  const { logIn } = useUserContext();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({});

  const onSubmit = (data: any) => {
    logIn(data.username, data.password)
      .then(() => {
        console.log("Login successful");
        Toast.show({
          type: "success",
          text1: "Login Successful",
          text2: `Welcome back, ${data.username}!`,
        });
      })
      .catch((error) => {
        Toast.show({
          type: "error",
          text1: "Login failed",
          text2: "Please check your credentials and try again.",
        });
      });
  };
  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <Image
        source={require("../assets/images/onboarding_desktop.png")}
        style={{ width: "70%", height: "100%", borderRadius: 10 }}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "50%", height: "100%" }}>
        <Image
          source={require("../assets/images/logoCloud.png")}
          style={{ width: 200, height: 100, marginBottom: 10 }}
        />
        <CustomInput
          name="username"
          control={control}
          placeholder="Username"
          rules={{ required: "Username is required" }}
          secureTextEntry={false}
        />
        <CustomInput
          name="password"
          control={control}
          placeholder="Password"
          secureTextEntry
          rules={{ required: "Password is required" }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: "#007BFF",
            color: "white",
            width: 100,
            padding: 10,
            borderRadius: 5,
            textAlign: "center",
            marginTop: 15,
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
}
