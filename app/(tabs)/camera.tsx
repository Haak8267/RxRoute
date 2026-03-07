import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Camera,
    CheckCircle,
    FileText,
    FileUp,
    ImageIcon,
    X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { uploadImageFromRN, uploadPdfFromRN } from "../../services/cloudinary";

type SelectedFile =
  | { type: "image"; uri: string; fileName: string }
  | { type: "pdf"; uri: string; fileName: string };

export default function UploadPrescription() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Camera ──────────────────────────────────────────────────────────────
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Permission Required",
        "Please allow camera access in your device settings to take prescription photos.",
        [{ text: "OK" }],
      );
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          type: "image",
          uri: asset.uri,
          fileName: asset.fileName ?? `photo_${Date.now()}.jpg`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Gallery ─────────────────────────────────────────────────────────────
  const handleUploadGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Gallery Permission Required",
        "Please allow photo library access in your device settings.",
        [{ text: "OK" }],
      );
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          type: "image",
          uri: asset.uri,
          fileName: asset.fileName ?? `image_${Date.now()}.jpg`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── File / PDF picker ────────────────────────────────────────────────────
  const handleFileUpload = async () => {
    setLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const isPdf = asset.mimeType === "application/pdf";
        setSelectedFile({
          type: isPdf ? "pdf" : "image",
          uri: asset.uri,
          fileName: asset.name,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      let uploadResult;

      if (selectedFile.type === "image") {
        uploadResult = await uploadImageFromRN(
          selectedFile.uri,
          "rxroute/prescriptions",
        );
      } else {
        uploadResult = await uploadPdfFromRN(
          selectedFile.uri,
          "rxroute/prescriptions",
        );
      }

      Alert.alert(
        "Prescription Uploaded",
        `Your prescription "${selectedFile.fileName}" has been uploaded successfully.`,
        [
          { text: "OK", onPress: () => router.back() },
          { text: "View Order", onPress: () => router.push("/(tabs)/orders") },
        ],
      );
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert(
        "Upload Failed",
        "Failed to upload prescription. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTypeManually = () => {
    // Navigate to a manual entry screen — replace with your route
    Alert.alert("Type Manually", "Navigate to manual entry screen.");
  };

  const clearFile = () => setSelectedFile(null);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Prescription</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text style={styles.title}>What do you need?</Text>
        <Text style={styles.subtitle}>
          Upload a valid doctor&apos;s prescription and our pharmacists will
          process your order immediately.
        </Text>

        {/* Top two options */}
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleTakePhoto}
            activeOpacity={0.8}
            disabled={loading}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#EAF5EE" }]}>
              <Camera size={26} color="#2A7A4F" />
            </View>
            <Text style={styles.optionLabel}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleUploadGallery}
            activeOpacity={0.8}
            disabled={loading}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#FFF8EC" }]}>
              <ImageIcon size={26} color="#E8A020" />
            </View>
            <Text style={styles.optionLabel}>Upload Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* File drop zone / preview */}
        {selectedFile ? (
          <View style={styles.previewContainer}>
            {/* Remove button */}
            <TouchableOpacity style={styles.removeButton} onPress={clearFile}>
              <X size={16} color="#fff" />
            </TouchableOpacity>

            {selectedFile.type === "image" ? (
              <Image
                source={{ uri: selectedFile.uri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.pdfPreview}>
                <FileText size={48} color="#2A7A4F" />
                <Text style={styles.pdfFileName} numberOfLines={2}>
                  {selectedFile.fileName}
                </Text>
                <Text style={styles.pdfLabel}>PDF Document</Text>
              </View>
            )}

            {/* File name bar */}
            <View style={styles.fileNameBar}>
              <CheckCircle size={14} color="#2A7A4F" />
              <Text style={styles.fileNameText} numberOfLines={1}>
                {selectedFile.fileName}
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.dropZone}
            onPress={handleFileUpload}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#2A7A4F" />
            ) : (
              <>
                <FileUp size={32} color="#9ca3af" />
                <Text style={styles.dropZoneTitle}>No file selected</Text>
                <Text style={styles.dropZoneSubtitle}>
                  Supported formats: JPG, PNG, PDF
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* OR divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Action button — Submit if file selected, else Type Manually */}
        {selectedFile ? (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.submitButtonText}>Submit Prescription</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.manualButton}
            onPress={handleTypeManually}
            activeOpacity={0.85}
          >
            <Text style={styles.manualButtonText}>Type Manually</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8faf9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 24,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  optionCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
  },

  // Drop zone
  dropZone: {
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 40,
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    marginBottom: 24,
  },
  dropZoneTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginTop: 4,
  },
  dropZoneSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
  },

  // Preview
  previewContainer: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  previewImage: {
    width: "100%",
    height: 200,
  },
  pdfPreview: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f0faf4",
  },
  pdfFileName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  pdfLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  fileNameBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  fileNameText: {
    flex: 1,
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  removeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
  },

  // Buttons
  manualButton: {
    borderWidth: 1.5,
    borderColor: "#2A7A4F",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  manualButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2A7A4F",
  },
  submitButton: {
    backgroundColor: "#2A7A4F",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#2A7A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
});
