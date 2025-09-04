// utils/syncPhotos.ts
import { uploadPhotosBatch } from "@/utils/api";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

export const syncPhotos = async (onSuccess?: (newPhotos: ImagePicker.ImagePickerAsset[]) => ImagePicker.ImagePickerAsset[]) => {
  try {
    // Request permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "This app needs access to your photo library to select photos.",
        [{ text: "OK" }]
      );
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
      const assets = result.assets.map((asset) => ({
        uri: asset.uri,
        fileName: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.type || "image/jpeg",
        fileSize: asset.fileSize,
      }));

      await uploadPhotosBatch(assets);
      
      // Call success callback with the new assets
      if (onSuccess) {
        onSuccess(result.assets);
      }

      Toast.show({
        type: "success",
        text1: "Upload Successful",
        text2: `Successfully uploaded ${result.assets.length} photos!`,
      });
      return result.assets;
    }
  } catch (error) {
    console.error("Error selecting images:", error);
    Toast.show({
      type: "error",
      text1: "Upload Failed",
      text2: "An error occurred while uploading photos. Please try again.",
    });
    throw error;
  }

};