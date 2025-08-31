import { useUserContext } from "@/hooks/useUser";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import CustomInput from "../components/CustomInput";

export default function Login() {
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
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

          <TouchableOpacity onPress={handleSubmit(onSubmit)}>
            <Text style={styles.button}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log("Forgot Password")}>
            <Text style={{ color: "#007BFF", marginTop: 20 }}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace("register")}>
            <Text style={{ color: "#007BFF", marginTop: 20 }}>
              Don't have an account? Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
    paddingTop: 100,
    alignItems: "center",
  },
  button: {
    backgroundColor: "#007BFF",
    color: "white",
    width: 100,
    padding: 10,
    borderRadius: 5,
    textAlign: "center",
    marginTop: 15,
  },
});
