// utils/syncPhotos.ts
import { uploadPhotosBatch } from "@/utils/api";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

export const syncPhotos = async (
  onSuccess?: (newPhotos: ImagePicker.ImagePickerAsset[]) => void, 
  syncAll = false
) => {
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

    let result: ImagePicker.ImagePickerResult;

    if (syncAll) {
      // Request media library permissions for accessing all photos
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      if (mediaLibraryPermission.status !== "granted") {
        Alert.alert(
          "Permission Required",
          "This app needs access to your media library to sync all photos.",
          [{ text: "OK" }]
        );
        return;
      }

      // Get all photos from the device
      const albumAssets = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        first: 1000,
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      if (albumAssets.assets.length === 0) {
        Toast.show({
          type: "info",
          text1: "No Photos Found",
          text2: "No photos found in your library.",
        });
        return;
      }

      // Convert MediaLibrary assets to ImagePicker format
      const convertedAssets: ImagePicker.ImagePickerAsset[] = await Promise.all(
        albumAssets.assets.map(async (asset) => {
          const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
          
          // Get file extension and determine proper type
          const fileExtension = asset.filename.split('.').pop()?.toLowerCase();
          let mediaType: "image" | "video" | "livePhoto" | "pairedVideo" | undefined;
          
          if (fileExtension && ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
            mediaType = "image";
          } else {
            mediaType = "image"; // Default to image
          }

          return {
            assetId: asset.id,
            uri: assetInfo.localUri || assetInfo.uri,
            fileName: asset.filename,
            type: mediaType,
            fileSize: undefined, // AssetInfo doesn't have fileSize property
            width: asset.width,
            height: asset.height,
            exif: null,
            base64: null,
          };
        })
      );

      // Create a mock result object similar to ImagePicker result
      result = {
        canceled: false,
        assets: convertedAssets,
      };

      Toast.show({
        type: "info",
        text1: "Syncing All Photos",
        text2: `Found ${convertedAssets.length} photos to sync...`,
      });

    } else {
      // Launch image picker for manual selection
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });
    }

    console.log("ImagePicker result:", result);

    if (!result.canceled && result.assets) {
      console.log("Assets:", result.assets);
      
      // Convert assets to your expected format
      const assets = result.assets.map((asset) => ({
        uri: asset.uri,
        fileName: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.type || "image/jpeg",
        fileSize: asset.fileSize,
      }));

      // Upload in batches if there are many photos
      const batchSize = 10; // Upload 10 photos at a time
      const batches = [];
      for (let i = 0; i < assets.length; i += batchSize) {
        batches.push(assets.slice(i, i + batchSize));
      }

      let totalUploaded = 0;
      for (const batch of batches) {
        await uploadPhotosBatch(batch);
        totalUploaded += batch.length;
        
        // Show progress for sync all
        if (syncAll && batches.length > 1) {
          Toast.show({
            type: "info",
            text1: "Upload Progress",
            text2: `Uploaded ${totalUploaded} of ${assets.length} photos...`,
          });
        }
      }

      // Call success callback with the new assets
      if (onSuccess) {
        onSuccess(result.assets);
      }

      Toast.show({
        type: "success",
        text1: "Upload Successful",
        text2: `Successfully uploaded ${result.assets.length} photos!`,
      });
    }
  } catch (error) {
    console.error("Error selecting/syncing images:", error);
    Toast.show({
      type: "error",
      text1: "Upload Failed",
      text2: "An error occurred while uploading photos. Please try again.",
    });
    throw error;
  }
};