import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { TouchableOpacity, ActivityIndicator } from "react-native";
import { syncPhotos } from "@/utils/syncPhotos";
import { useState } from "react";
import { useSync } from "@/contexts/SyncContext";

export default function TabLayout() {
  const { syncing, setSyncing, triggerRefresh } = useSync();

  const handleUpload = async () => {
    if (syncing) return;
    
    setSyncing(true);
    
    await syncPhotos((newPhotos) => {
      // You can handle the new photos here if needed
      console.log("New photos uploaded:", newPhotos);
    });
    
    setSyncing(false);
    triggerRefresh()
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
          href: null, // This hides the tab from the tab bar
        }}
      />
      
      <Tabs.Screen
        name="actionButton"
        options={{
          title: "",
          tabBarButton: () => (
            <TouchableOpacity
              onPress={handleUpload}
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