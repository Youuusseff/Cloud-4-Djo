import { useSync } from "@/contexts/SyncContext";
import { useUserContext } from "@/hooks/useUser";
import { getList } from "@/utils/api";
import formatBytes from "@/utils/formatBytes";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";


export default function HomeScreen() {
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { logOut, username } = useUserContext();
  const [usedStorage, setUsedStorage] = useState("0 Mb");
  const { refreshTrigger } = useSync();

  useEffect(() => {
    let total = 0;
    photos.forEach((photo) => {
      if (photo.fileSize) {
        total += photo.fileSize;
      }
    });
    const formattedTotal = formatBytes(total);
    setUsedStorage(formattedTotal);
  }, [photos]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await getList();

      if (res.status === "success" && Array.isArray(res.files)) {
        setPhotos(res.files);
      }
    } catch (error) {
      console.error("Error fetching list:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch photos when screen first loads
  useEffect(() => {
    fetchPhotos();
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchPhotos();
    }
  }, [refreshTrigger]);

  // Refresh photos when screen comes into focus (after uploading from tab button)
  useFocusEffect(
    useCallback(() => {
      fetchPhotos();
    }, [])
  );
  console.log("Used Storage: ", usedStorage);
  console.log("total size : ", usedStorage);

  return (
    <View style={{ flex: 1, backgroundColor: "#336df3" }}>
      <ImageBackground source={require("@/assets/images/nav-background.png")}>
        <View
          style={{
            height: 180,
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        ></View>
      </ImageBackground>
      <View style={{ alignItems: "center", marginTop: 0 }}>
        <Text
          style={{
            fontSize: 30,
            fontWeight: "bold",
            textAlign: "center",
            marginTop: 0,
            color: "#fff",
          }}
        >
          Welcome, {username}!
        </Text>
        <Text
          style={{
            fontSize: 16,
            textAlign: "center",
            marginTop: 15,
            color: "#fff",
          }}
        >
          Used Storage: {usedStorage}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: "#fff",
          flex: 1,
          marginTop: 20,
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          padding: 10,
        }}
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={{ marginTop: 10 }}>Loading photos...</Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            keyExtractor={(item, index) =>
              item.uri ?? item.assetId ?? index.toString()
            }
            renderItem={({ item }) => (
              <View style={{ margin: 5 }}>
                <Image
                  source={{ uri: item.uri }}
                  style={{ width: 100, height: 100, borderRadius: 10 }}
                />
                <Text style={{ width: 100, textAlign: "center" }}>
                  {item.fileName || "Unknown"}
                </Text>
              </View>
            )}
            numColumns={3}
            refreshing={loading}
            onRefresh={fetchPhotos}
          />
        )}
        <Pressable onPress={() => logOut()}>
          <Text>LogOut</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#007BFF",
    width: 150,
    padding: 10,
    borderRadius: 5,
    textAlign: "center",
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
});