import CustomInput from "@/components/CustomInput";
import { useUserContext } from "@/hooks/useUser";
import { registerUser } from "@/utils/api";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { Image, Text } from "react-native";
import Toast from "react-native-toast-message";

export default function RegisterScreen() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({});

  const onSubmit = (data: any) => {
    registerUser(data.username, data.password, data.email)
      .then(() => {
        Toast.show({
          type: "success",
          text1: "Registration Successful",
          text2: `Welcome aboard, ${data.username}!`,
        });
        router.replace("login");
      })
      .catch((error) => {
        Toast.show({
          type: "error",
          text1: "Registration failed",
          text2: "Please check your details and try again.",
        });
      });
    console.log("Registration data:", data);
  };
  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <Image
        source={require("../assets/images/onboarding_desktop.png")}
        style={{ width: "70%", height: "100%", borderRadius: 10 }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "50%",
          height: "100%",
        }}
      >
        <Image
          source={require("../assets/images/logoCloud.png")}
          style={{ width: 200, height: 100, marginBottom: 10 }}
        />
        <Text style={{ fontSize: 24, marginBottom: 20 }}>Join the Cloud</Text>
        <CustomInput
          name="username"
          control={control}
          placeholder="Username"
          rules={{ required: "Username is required" }}
          secureTextEntry={false}
        />
        <CustomInput
          name="email"
          control={control}
          placeholder="Email"
          rules={{
            required: "Email is required",
            pattern: { value: /^\S+@\S+$/i, message: "Email is invalid" },
          }}
          secureTextEntry={false}
        />
        <CustomInput
          name="password"
          control={control}
          placeholder="Password"
          secureTextEntry
          rules={{
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/,
              message:
                "Password must contain at least one uppercase letter, one lowercase letter, and one number",
            },
          }}
        />
        <CustomInput
          name="confirmPassword"
          control={control}
          placeholder="Confirm Password"
          secureTextEntry
          rules={{
            validate: (value: string) =>
              value === getValues("password") || "Passwords do not match",
          }}
        />
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          style={{
            backgroundColor: "#007BFF",
            color: "white",
            width: 100,
            padding: 10,
            borderRadius: 5,
            textAlign: "center",
            marginTop: 15,
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Register
        </button>
        
        <button
          type="button"
          onClick={() => router.replace("login")}
          style={{
            background: "none",
            border: "none",
            color: "#007BFF",
            marginTop: 20,
            cursor: "pointer",
            textDecoration: "underline",
            fontFamily: "inherit",
            fontSize: "inherit",
          }}
        >
          Already have an account? Sign In
        </button>
      </div>
    </div>
  );
}
