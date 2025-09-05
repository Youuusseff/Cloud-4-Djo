// utils/syncPhotos.ts
import { uploadPhotosBatch } from "@/utils/api";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

export const syncPhotos = async (
  onSuccess?: (newAssets: ImagePicker.ImagePickerAsset[]) => void,
  syncAll = false
) => {
  try {
    // Request permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "This app needs access to your media library.",
        [{ text: "OK" }]
      );
      return;
    }

    let result: ImagePicker.ImagePickerResult;

    if (syncAll) {
      // Request Media Library permissions
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      if (mediaLibraryPermission.status !== "granted") {
        Alert.alert(
          "Permission Required",
          "This app needs access to your media library to sync all photos & videos.",
          [{ text: "OK" }]
        );
        return;
      }

      // Fetch both photos and videos
      const albumAssets = await MediaLibrary.getAssetsAsync({
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        first: 1000,
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      if (albumAssets.assets.length === 0) {
        Toast.show({
          type: "info",
          text1: "No Media Found",
          text2: "No photos or videos found in your library.",
        });
        return;
      }

      // Convert MediaLibrary assets to ImagePicker format
      const convertedAssets: ImagePicker.ImagePickerAsset[] = await Promise.all(
        albumAssets.assets.map(async (asset) => {
          const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);

          const fileExtension = asset.filename.split(".").pop()?.toLowerCase();
          let mediaType: "image" | "video" = "image";

          if (asset.mediaType === MediaLibrary.MediaType.video) {
            mediaType = "video";
          } else if (fileExtension && ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(fileExtension)) {
            mediaType = "image";
          }

          return {
            assetId: asset.id,
            uri: assetInfo.localUri || assetInfo.uri,
            fileName: asset.filename,
            type: mediaType,
            fileSize: undefined,
            width: asset.width,
            height: asset.height,
            exif: null,
            base64: null,
            duration: asset.duration, // useful for videos
          };
        })
      );

      result = {
        canceled: false,
        assets: convertedAssets,
      };

      Toast.show({
        type: "info",
        text1: "Syncing All Media",
        text2: `Found ${convertedAssets.length} photos/videos to sync...`,
      });

    } else {
      // Manual selection of both photos and videos
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // ✅ includes both images & videos
        allowsMultipleSelection: true,
        quality: 1,
      });
    }

    if (!result.canceled && result.assets) {
      const assets = result.assets.map((asset) => {
        let mimeType = "application/octet-stream";

        if (asset.type === "image") {
          mimeType = "image/jpeg"; // default
        } else if (asset.type === "video") {
          mimeType = "video/mp4"; // default for videos
        }

        return {
          uri: asset.uri,
          fileName: asset.fileName || `${asset.type}_${Date.now()}`,
          type: mimeType,
          fileSize: asset.fileSize,
        };
      });

      // Upload in batches
      const batchSize = 5; // videos are heavier, use smaller batch size
      const batches = [];
      for (let i = 0; i < assets.length; i += batchSize) {
        batches.push(assets.slice(i, i + batchSize));
      }

      let totalUploaded = 0;
      for (const batch of batches) {
        await uploadPhotosBatch(batch);
        totalUploaded += batch.length;

        if (syncAll && batches.length > 1) {
          Toast.show({
            type: "info",
            text1: "Upload Progress",
            text2: `Uploaded ${totalUploaded} of ${assets.length} media...`,
          });
        }
      }

      if (onSuccess) {
        onSuccess(result.assets);
      }

      Toast.show({
        type: "success",
        text1: "Upload Successful",
        text2: `Uploaded ${result.assets.length} photos/videos!`,
      });
    }
  } catch (error) {
    console.error("Error selecting/syncing media:", error);
    Toast.show({
      type: "error",
      text1: "Upload Failed",
      text2: "An error occurred while uploading media. Please try again.",
    });
    throw error;
  }
};
