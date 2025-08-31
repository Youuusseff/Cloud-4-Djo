import { useUserContext } from "@/hooks/useUser";
import { getList, uploadPhotosBatch } from "@/utils/api";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { Alert, Button, FlatList, Image, Pressable, Text, View } from "react-native";

export default function HomeScreen() {
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [syncing, setSyncing] = useState(false);
  const { logOut } = useUserContext();

  const startSync = async () => {
    setSyncing(true);
    
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'This app needs access to your photo library to select photos.',
          [{ text: 'OK' }]
        );
        setSyncing(false);
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      console.log("ImagePicker result:", result);

      if (!result.canceled && result.assets) {
        console.log("Assets:", result.assets);
        
        // Convert expo-image-picker assets to your expected format
        const assets = result.assets.map(asset => ({
          uri: asset.uri,
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          fileSize: asset.fileSize,
        }));
        
        await uploadPhotosBatch(assets);
        setPhotos(prev => [...prev, ...result.assets]);
      }
    } catch (error) {
      console.error("Error selecting images:", error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getList();

        if (res.status === "success" && Array.isArray(res.files)) {
          setPhotos(res.files);
          console.log("Photos: ", photos);
        }
      } catch (error) {
        console.error("Error fetching list:", error);
      }
    };

    fetchData();
  }, []);


  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title={syncing ? "Syncing..." : "Start Sync"} onPress={startSync} />
      <FlatList
        data={photos}
        keyExtractor={(item, index) => item.uri ?? item.assetId ?? index.toString()}
        renderItem={({ item }) => (
          <View style={{ margin: 5 }}>
            <Image source={{ uri: item.uri }} style={{ width: 100, height: 100 }} />
            <Text style={{ width: 100, textAlign: "center" }}>
              {item.fileName || 'Unknown'}
            </Text>
          </View>
        )}
        numColumns={3}
      />
      <Pressable onPress={() => logOut()}>
        <Text>LogOut</Text>
      </Pressable>
    </View>
  );
}
