import { useSync } from "@/contexts/SyncContext";
import { syncPhotos } from "@/utils/syncPhotos";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ActivityIndicator, Alert, TouchableOpacity } from "react-native";

export default function TabLayout() {
  const { syncing, setSyncing, triggerRefresh } = useSync();

  const showSyncOptions = () => {
    if (syncing) return;

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
  };

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

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          href: null,
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
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: syncing ? '#ccc' : '#007AFF',
                marginHorizontal: 10,
                marginVertical: 5,
                borderRadius: 25,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
              activeOpacity={0.7}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="add" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}