import AsyncStorage from "@react-native-async-storage/async-storage";
import { SplashScreen, useRouter } from "expo-router";
import React, { useEffect } from "react";
import Toast from "react-native-toast-message";
import { loginUser } from "../utils/api";

SplashScreen.preventAutoHideAsync();

type userContextType = {
  username: string;
  email: string;
  token: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  isFirstLaunch: boolean;
  logIn: (username: string, password: string) => Promise<void>;
  logOut: () => void;
  completeOnboarding: () => Promise<void>; // New method
}

export const UserContext = React.createContext<userContextType | null>(null);

export interface Props {
  children: React.ReactNode;
}

const STORAGE_KEYS = {
  TOKEN: '@user_token',
  USERNAME: '@user_username',
  EMAIL: '@user_email',
  IS_FIRST_LAUNCH: '@user_is_first_launch'
};

export const MyUserContextProvider: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [token, setToken] = React.useState("");
  const [isFirstLaunch, setIsFirstLaunch] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Load stored data on component mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        console.log("Loading stored data...");
        const [storedToken, storedUsername, storedEmail, storedIsFirstLaunch] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.USERNAME),
          AsyncStorage.getItem(STORAGE_KEYS.EMAIL),
          AsyncStorage.getItem(STORAGE_KEYS.IS_FIRST_LAUNCH),
        ]);

        console.log("Stored token:", storedToken ? "Found" : "Not found");

        if (storedToken && storedToken.trim() !== "") {
          setToken(storedToken);
          setUsername(storedUsername || "");
          setEmail(storedEmail || "");
        }
        
        // Handle first launch flag
        if (storedIsFirstLaunch !== null) {
          setIsFirstLaunch(storedIsFirstLaunch === 'true');
        } else {
          // If no stored value, it's the first launch
          setIsFirstLaunch(true);
        }
        
        console.log("User data restored from storage");
      } catch (error) {
        console.error("Error loading stored data:", error);
        // Clear potentially corrupted data
        await clearStoredData();
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadStoredData();
  }, []);

  // Handle navigation after initialization
  useEffect(() => {
    if (!isInitialized) return;

    if (isFirstLaunch) {
      SplashScreen.hideAsync();
      console.log("First launch, showing onboarding");
      router.replace("/onboarding");
    } else if (token) {
      SplashScreen.hideAsync();
      console.log("Token found, navigating to home");
      router.replace("/");
    } else {
      SplashScreen.hideAsync();
      console.log("No token found, navigating to login");
      router.replace("/login");
    }
  }, [isInitialized, token, isFirstLaunch, router]);

  const storeUserData = async (tokenData: string, usernameData: string, emailData: string) => {
    try {
      console.log("Storing user data...");
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, tokenData),
        AsyncStorage.setItem(STORAGE_KEYS.USERNAME, usernameData),
        AsyncStorage.setItem(STORAGE_KEYS.EMAIL, emailData),
      ]);
      console.log("User data stored successfully");
    } catch (error) {
      console.error("Error storing user data:", error);
    }
  };

  const clearStoredData = async () => {
    try {
      console.log("Clearing stored data...");
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USERNAME),
        AsyncStorage.removeItem(STORAGE_KEYS.EMAIL),
      ]);
      console.log("Stored data cleared successfully");
    } catch (error) {
      console.error("Error clearing stored data:", error);
    }
  };

  const completeOnboarding = async (): Promise<void> => {
    try {
      console.log("Completing onboarding...");
      await AsyncStorage.setItem(STORAGE_KEYS.IS_FIRST_LAUNCH, 'false');
      setIsFirstLaunch(false);
      console.log("Onboarding completed successfully");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  };

  const logIn = async (usernameParam: string, passwordParam: string): Promise<void> => {
    try {
      setIsLoading(true);
      const data = await loginUser(usernameParam, passwordParam);
      if (data && data.access_token) {
        const userToken = data.access_token;
        const userUsername = data.username || usernameParam;
        const userEmail = data.email || "";

        // Update state
        setToken(userToken);
        setUsername(userUsername);
        setEmail(userEmail);

        // Store in AsyncStorage
        await storeUserData(userToken, userUsername, userEmail);

        Toast.show({
          type: "success",
          text1: "Login Successful",
          text2: `Welcome back, ${userUsername}!`,
        });
        
        // Navigation will be handled by useEffect
      } else {
        throw new Error("Invalid response from login API");
      }
    } catch (error) {
      console.error("Login failed:", error);
      Toast.show({
        type: "error",
        text1: "Login failed",
        text2: "Please check your credentials and try again.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Clear AsyncStorage first (but keep first launch flag)
      await clearStoredData();

      // Then clear state
      setUsername("");
      setEmail("");
      setToken("");

      Toast.show({
        type: "info",
        text1: "Logged out",
        text2: "You have been logged out successfully.",
      });
      
      // Navigation will be handled by useEffect
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: userContextType = {
    username,
    email,
    token,
    isLoading,
    isAuthenticated: !!token,
    isFirstLaunch,
    logIn,
    logOut,
    completeOnboarding, // Add the new method
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): userContextType => {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a MyUserContextProvider");
  }
  return context;
};