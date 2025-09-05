import { useSync } from "@/contexts/SyncContext";
import { useUserContext } from "@/hooks/useUser";
import { syncPhotos } from "@/utils/syncPhotos";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ActivityIndicator, Alert, Platform, TouchableOpacity } from "react-native";

export default function TabLayout() {
  const { syncing, setSyncing, triggerRefresh } = useSync();
  const { logOut } = useUserContext();

  const showSyncOptions = () => {
    if (syncing) return;
    if (Platform.OS != "web"){
      Alert.alert(
        "Sync Photos",
        "Choose sync option:",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Sync New Only",
            onPress: () => handleSync(false),
          },
          {
            text: "Sync All Photos",
            onPress: () => handleSync(true),
            style: "destructive", // Optional: makes it stand out
          },
        ],
        { cancelable: true }
      );
    }
    else{
      handleSync(false);
    }
  }

  const handleSync = async (syncAll = false) => {
    setSyncing(true);
    try {
      await syncPhotos((newPhotos) => {
        console.log(`${syncAll ? 'All' : 'New'} photos synced:`, newPhotos);
      }, syncAll);
      triggerRefresh();
    } catch (error) {
      console.error("Sync error:", error);
      Alert.alert("Sync Error", "Failed to sync photos. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const showLogoutConfirmation = () => {
    if (Platform.OS != "web"){
      Alert.alert(
        "Logout",
        "Are you sure you want to logout?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Logout",
            onPress: logOut,
            style: "destructive",
          },
        ],
        { cancelable: true }
      );}
      else{
        logOut();
      }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        }
      }}
    >
      {/* Home/Photos Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Photos",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="actionButton"
        options={{
          title: "",
          tabBarButton: () => (
            <TouchableOpacity
              onPress={showSyncOptions}
              disabled={syncing}
              style={{
                position: 'absolute',
                top: -15,
                left: '50%',
                transform: [{ translateX: -30 }], // Half of width (60/2)
                width: 60,
                height: 60,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: syncing ? '#ccc' : '#007AFF',
                borderRadius: 30,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
                borderWidth: 3,
                borderColor: '#fff',
              }}
              activeOpacity={0.7}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="sync" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          ),
        }}
      />

      {/* Logout Tab */}
      <Tabs.Screen
        name="logoutButton"
        options={{
          title: "Logout",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-out-outline" size={size} color={color} />
          ),
          tabBarButton: () => (
            <TouchableOpacity
              onPress={showLogoutConfirmation}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 10,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}