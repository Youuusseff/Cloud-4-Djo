import { useSync } from "@/contexts/SyncContext";
import { useUserContext } from "@/hooks/useUser";
import { getList } from "@/utils/api";
import formatBytes from "@/utils/formatBytes";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";

interface PhotoWithMetadata extends ImagePicker.ImagePickerAsset {
  fileName: string;
  fileSize: number;
  dateTaken: string | null;
}

interface HeaderItem {
  type: 'header';
  id: string;
  title: string;
}

interface PhotoRowItem {
  type: 'photoRow';
  id: string;
  photos: PhotoWithMetadata[];
}

type GroupedItem = HeaderItem | PhotoRowItem;

export default function HomeScreen() {
  const { width, height } = useWindowDimensions(); // Move this inside the component
  const [photos, setPhotos] = useState<PhotoWithMetadata[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { username } = useUserContext();
  const [usedStorage, setUsedStorage] = useState("0 Mb");
  const { refreshTrigger } = useSync();

  const numberToMonth: Record<number, string> = {
    1:'Jan', 2:'Feb', 3:'Mar', 4:'Apr', 5:'May', 6:'Jun', 
    7:'Jul', 8:'Aug', 9:'Sep', 10:'Oct', 11:'Nov', 12:'Dec'
  };

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
    headerContainer: {
      width: "100%",
      paddingVertical: 15,
      paddingHorizontal: 20,
      backgroundColor: "#f8f9fa",
      borderBottomWidth: 1,
      borderBottomColor: "#e9ecef",
    },
    headerText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#333",
    },
    photoRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 0,
      marginBottom: 5,
    },
    photoContainer: {
      width: '33%',
      height: width * 33 / 100,
      alignItems: 'center',
    },
    photo: {
      width: "100%",
      height: "100%",
      borderRadius: 0,
    },
  });

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

  console.log('photos : ', photos)

  const groupedPhotos = useMemo(() => {
    const sortedPhotos = [...photos].sort((a, b) => {
      if (!a.dateTaken && !b.dateTaken) return 0;
      if (!a.dateTaken) return 1;
      if (!b.dateTaken) return -1;
      return b.dateTaken.localeCompare(a.dateTaken);
    });

    const groups: Array<{ month: string | null; photos: PhotoWithMetadata[] }> = [];
    let currentMonth: string | null = null;
    let currentGroupPhotos: PhotoWithMetadata[] = [];

    sortedPhotos.forEach((photo) => {
      const photoMonth = photo.dateTaken;
      
      if (photoMonth !== currentMonth) {
        if (currentGroupPhotos.length > 0) {
          groups.push({
            month: currentMonth,
            photos: [...currentGroupPhotos]
          });
        }
        
        // Start new group
        currentMonth = photoMonth;
        currentGroupPhotos = [photo];
      } else {
        // Add to current group
        currentGroupPhotos.push(photo);
      }
    });

    // Don't forget the last group
    if (currentGroupPhotos.length > 0) {
      groups.push({
        month: currentMonth,
        photos: [...currentGroupPhotos]
      });
    }

    // Convert groups to flat array with headers and photo rows
    const result: GroupedItem[] = [];
    groups.forEach(group => {
      // Add header
      let headerText = "Unknown Date";
      if (group.month) {
        const [year, month] = group.month.split('-');
        const monthName = numberToMonth[parseInt(month)];
        headerText = `${monthName} ${year}`;
      }
      
      result.push({
        type: 'header',
        id: `header-${group.month || 'unknown'}`,
        title: headerText
      });

      // Add photos in rows of 3
      for (let i = 0; i < group.photos.length; i += 3) {
        const rowPhotos = group.photos.slice(i, i + 3);
        result.push({
          type: 'photoRow',
          id: `row-${group.month || 'unknown'}-${i}`,
          photos: rowPhotos
        });
      }
    });

    return result;
  }, [photos, numberToMonth]);

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

  useFocusEffect(
    useCallback(() => {
      fetchPhotos();
    }, [])
  );

  const renderItem = ({ item }: { item: GroupedItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>{item.title}</Text>
        </View>
      );
    }

    if (item.type === 'photoRow') {
      return (
        <View style={styles.photoRow}>
          {item.photos.map((photo) => (
            <View key={photo.uri || photo.assetId} style={styles.photoContainer}>
              <Image
                source={{ uri: photo.uri }}
                style={styles.photo}
              />
            </View>
          ))}
          {/* Fill empty spaces if row has less than 3 photos */}
          {Array(3 - item.photos.length).fill(null).map((_, index) => (
            <View key={`empty-${index}`} style={styles.photoContainer} />
          ))}
        </View>
      );
    }

    return null;
  };

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
          justifyContent: "center",
          alignItems: "center",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 5,
        }}
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={{ marginTop: 10 }}>Loading photos...</Text>
          </View>
        ) : (
          <FlatList
            data={groupedPhotos}
            keyExtractor={(item) => item.id}
            style={{ width: "100%", marginTop: 5, borderTopRightRadius: 20, borderTopLeftRadius: 20 }}
            renderItem={renderItem}
            refreshing={loading}
            onRefresh={fetchPhotos}
          />
        )}
      </View>
    </View>
  );
}