import * as ImagePicker from "expo-image-picker";
import { Camera, Image as ImageIcon, X } from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { uploadImageFromRN } from "../services/cloudinary";

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageUpdate: (imageUrl: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export default function ProfileImageUpload({
  currentImage,
  onImageUpdate,
  isVisible,
  onClose,
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Permission Required",
        "Please allow camera access to take a profile photo.",
        [{ text: "OK" }],
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const handleChooseFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Gallery Permission Required",
        "Please allow photo library access to select a profile photo.",
        [{ text: "OK" }],
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Gallery error:", error);
      Alert.alert("Error", "Failed to select photo. Please try again.");
    }
  };

  const uploadImage = async (imageUri: string) => {
    setUploading(true);
    try {
      const result = await uploadImageFromRN(imageUri, "rxroute/profiles");
      onImageUpdate(result.secure_url);
      onClose();
      Alert.alert("Success", "Profile photo updated successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert(
        "Upload Failed",
        "Failed to upload profile photo. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl" style={{ height: "60%" }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">
              Update Profile Photo
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView className="flex-1 px-5 py-6">
            {/* Current Image Preview */}
            <View className="items-center mb-8">
              <View className="w-32 h-32 rounded-full bg-gray-100 items-center justify-center overflow-hidden">
                {currentImage ? (
                  <Image
                    source={{ uri: currentImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <ImageIcon size={48} color="#9CA3AF" />
                )}
              </View>
              <Text className="text-sm text-gray-500 mt-3">
                Current Profile Photo
              </Text>
            </View>

            {/* Upload Options */}
            <View className="space-y-4">
              <TouchableOpacity
                className="flex-row items-center gap-4 bg-green-50 p-4 rounded-2xl"
                onPress={handleTakePhoto}
                disabled={uploading}
              >
                <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center">
                  <Camera size={24} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    Take Photo
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Use camera to take a new photo
                  </Text>
                </View>
                {uploading && (
                  <ActivityIndicator size="small" color="#10B981" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center gap-4 bg-blue-50 p-4 rounded-2xl"
                onPress={handleChooseFromGallery}
                disabled={uploading}
              >
                <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center">
                  <ImageIcon size={24} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    Choose from Gallery
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Select photo from your library
                  </Text>
                </View>
                {uploading && (
                  <ActivityIndicator size="small" color="#3B82F6" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center gap-4 bg-gray-50 p-4 rounded-2xl"
                onPress={onClose}
                disabled={uploading}
              >
                <View className="w-12 h-12 bg-gray-400 rounded-full items-center justify-center">
                  <X size={24} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    Cancel
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Close without changes
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Help Text */}
            <View className="mt-8 p-4 bg-gray-50 rounded-2xl">
              <Text className="text-sm text-gray-600 text-center">
                For best results, use a clear, well-lit photo where your face is
                clearly visible.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
