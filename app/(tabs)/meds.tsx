import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
    AlertCircle,
    ArrowLeft,
    Bell,
    Camera,
    CheckCircle,
    CheckCircle2,
    ChevronRight,
    Clock,
    FileText,
    FileUp,
    ImageIcon,
    Pill,
    Plus,
    Settings,
    Trash2,
    X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/auth-context";
import { orderAPI } from "../../services/api";
import { uploadImageFromRN, uploadPdfFromRN } from "../../services/cloudinary";

// ─── Types ────────────────────────────────────────────────────────────────────

type Member = {
  id: string;
  name: string;
  label: string;
  color: string;
  initials: string;
};

type Medication = {
  id: string;
  memberId: string;
  name: string;
  dose: string;
  frequency: string;
  refillInDays: number;
  takenToday: boolean;
  color: string;
  times: string[];
  price?: number; // Add optional price field
};

type SelectedFile =
  | { type: "image"; uri: string; fileName: string }
  | { type: "pdf"; uri: string; fileName: string };

// ─── Mock data ────────────────────────────────────────────────────────────────

const MEMBERS: Member[] = [
  { id: "me", name: "Me", label: "Me", color: "#2A7A4F", initials: "ME" },
  { id: "mum", name: "Mum", label: "Mum", color: "#7C5CBF", initials: "MU" },
  { id: "dad", name: "Dad", label: "Dad", color: "#2563EB", initials: "DA" },
  { id: "ama", name: "Ama", label: "Ama", color: "#D97706", initials: "AM" },
];

const INITIAL_MEDS: Medication[] = [];

const FREQUENCIES = ["1x Daily", "2x Daily", "3x Daily", "Weekly", "As Needed"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function refillColor(days: number) {
  if (days <= 5) return "#EF4444";
  if (days <= 10) return "#F59E0B";
  return "#2A7A4F";
}

function refillLabel(days: number) {
  if (days <= 0) return "Refill now!";
  return `Refill in ${days}d`;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  member,
  active,
  onPress,
}: {
  member: Member;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.avatarWrapper}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.avatarCircle,
          {
            backgroundColor: member.color + "22",
            borderColor: active ? member.color : "transparent",
            borderWidth: active ? 2.5 : 0,
          },
        ]}
      >
        <Text style={[styles.avatarInitials, { color: member.color }]}>
          {member.initials}
        </Text>
      </View>
      <Text
        style={[
          styles.avatarLabel,
          active && { color: member.color, fontWeight: "700" },
        ]}
      >
        {member.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Med Card ─────────────────────────────────────────────────────────────────

function MedCard({
  med,
  onToggleTaken,
  onDelete,
  onRefill,
  onOrderNow,
}: {
  med: Medication;
  onToggleTaken: (id: string) => void;
  onDelete: (id: string) => void;
  onRefill: (med: Medication) => void;
  onOrderNow: (med: Medication) => void;
}) {
  return (
    <View style={styles.medCard}>
      {/* Left accent */}
      <View style={[styles.medAccent, { backgroundColor: med.color }]} />

      {/* Icon */}
      <View style={[styles.medIconWrap, { backgroundColor: med.color + "15" }]}>
        <Pill size={20} color={med.color} />
      </View>

      {/* Info */}
      <View style={styles.medInfo}>
        <Text style={styles.medName}>{med.name}</Text>
        <Text style={styles.medDose}>
          {med.dose} • {med.frequency}
        </Text>

        {/* Times */}
        <View style={styles.timesRow}>
          {med.times.map((t) => (
            <View key={t} style={styles.timeChip}>
              <Clock size={10} color="#6b7280" />
              <Text style={styles.timeText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Right side */}
      <View style={styles.medRight}>
        {/* Refill badge */}
        <TouchableOpacity onPress={() => onRefill(med)}>
          <Text
            style={[
              styles.refillBadge,
              { color: refillColor(med.refillInDays) },
            ]}
          >
            {refillLabel(med.refillInDays)}
          </Text>
        </TouchableOpacity>

        {/* Taken toggle */}
        <TouchableOpacity
          style={[styles.takenBtn, med.takenToday && styles.takenBtnActive]}
          onPress={() => onToggleTaken(med.id)}
        >
          <CheckCircle2 size={14} color={med.takenToday ? "#fff" : "#9ca3af"} />
          <Text
            style={[styles.takenText, med.takenToday && styles.takenTextActive]}
          >
            {med.takenToday ? "Taken" : "Take"}
          </Text>
        </TouchableOpacity>

        {/* Order Now */}
        <TouchableOpacity
          onPress={() => onOrderNow(med)}
          style={styles.orderNowBtn}
        >
          <Text style={styles.orderNowBtnText}>Order</Text>
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity
          onPress={() => onDelete(med.id)}
          style={styles.deleteBtn}
        >
          <Trash2 size={14} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Add Med Modal ────────────────────────────────────────────────────────────

function AddMedModal({
  visible,
  memberId,
  onClose,
  onAdd,
}: {
  visible: boolean;
  memberId: string;
  onClose: () => void;
  onAdd: (med: Omit<Medication, "id" | "takenToday">) => void;
}) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [freq, setFreq] = useState(FREQUENCIES[0]);
  const [refill, setRefill] = useState("30");
  const [price, setPrice] = useState("15"); // Add price state
  const member = MEMBERS.find((m) => m.id === memberId)!;

  const submit = () => {
    if (!name.trim() || !dose.trim()) {
      Alert.alert("Missing fields", "Please enter medication name and dosage.");
      return;
    }
    const count = freq.startsWith("1")
      ? 1
      : freq.startsWith("2")
        ? 2
        : freq.startsWith("3")
          ? 3
          : 1;
    const times = Array.from({ length: count }, (_, i) => {
      const hour = 8 + i * (12 / count);
      const h = Math.floor(hour);
      const ampm = h < 12 ? "AM" : "PM";
      return `${h <= 12 ? h : h - 12}:00 ${ampm}`;
    });
    onAdd({
      memberId,
      name: name.trim(),
      dose: dose.trim(),
      frequency: freq,
      refillInDays: parseInt(refill) || 30,
      color: member.color,
      times,
      price: parseFloat(price) || 15, // Add price to medication
    });
    setName("");
    setDose("");
    setFreq(FREQUENCIES[0]);
    setRefill("30");
    setPrice("15"); // Reset price
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Medication</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalFor}>
            For:{" "}
            <Text style={{ color: member.color, fontWeight: "700" }}>
              {member.name}
            </Text>
          </Text>

          <Text style={styles.inputLabel}>Medication Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Paracetamol"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.inputLabel}>Dosage</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 500mg"
            placeholderTextColor="#9ca3af"
            value={dose}
            onChangeText={setDose}
          />

          <Text style={styles.inputLabel}>Frequency</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
          >
            <View style={{ flexDirection: "row", gap: 8 }}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.freqChip,
                    freq === f && { backgroundColor: member.color },
                  ]}
                  onPress={() => setFreq(f)}
                >
                  <Text
                    style={[
                      styles.freqChipText,
                      freq === f && { color: "#fff" },
                    ]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.inputLabel}>Days until refill needed</Text>
          <TextInput
            style={styles.input}
            placeholder="30"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            value={refill}
            onChangeText={setRefill}
          />

          <Text style={styles.inputLabel}>Price (GHS)</Text>
          <TextInput
            style={styles.input}
            placeholder="15"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            value={price}
            onChangeText={setPrice}
          />

          <TouchableOpacity
            style={[styles.addMedBtn, { backgroundColor: member.color }]}
            onPress={submit}
          >
            <Text style={styles.addMedBtnText}>Add Medication</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MedsScreen() {
  const router = useRouter();
  const { user } = useAuth(); // Add useAuth hook here
  const [activeMember, setActiveMember] = useState("me");
  const [meds, setMeds] = useState<Medication[]>(INITIAL_MEDS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrescriptionUpload, setShowPrescriptionUpload] = useState(false);

  const filtered = meds.filter((m) => m.memberId === activeMember);
  const takenCount = filtered.filter((m) => m.takenToday).length;
  const urgent = filtered.filter((m) => m.refillInDays <= 5 && !m.takenToday);
  const activeMemberData = MEMBERS.find((m) => m.id === activeMember)!;

  // ── Camera Functions ──────────────────────────────────────────────────────
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
          {
            text: "OK",
            onPress: () => {
              setSelectedFile(null);
              setShowPrescriptionUpload(false);
            },
          },
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

  const clearFile = () => setSelectedFile(null);

  // ── Medication Functions ───────────────────────────────────────────────────
  const toggleTaken = (id: string) =>
    setMeds((prev) =>
      prev.map((m) => (m.id === id ? { ...m, takenToday: !m.takenToday } : m)),
    );

  const deleteMed = (id: string) =>
    Alert.alert(
      "Remove Medication",
      "Are you sure you want to remove this medication?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => setMeds((prev) => prev.filter((m) => m.id !== id)),
        },
      ],
    );

  const addMed = (med: Omit<Medication, "id" | "takenToday">) =>
    setMeds((prev) => [
      ...prev,
      { ...med, id: Date.now().toString(), takenToday: false },
    ]);

  const handleRefill = (med: Medication) =>
    Alert.alert("Refill Request", `Send refill request for ${med.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send Request",
        style: "default",
        onPress: () => Alert.alert("Sent!", "Refill request submitted."),
      },
    ]);

  const handleOrderNow = async (med: Medication) => {
    Alert.alert(
      "Order Medication",
      `Create an order for ${med.name} (${med.dose})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Order Now",
          style: "default",
          onPress: async () => {
            try {
              // Check if user is authenticated
              if (!user) {
                Alert.alert(
                  "Login Required",
                  "Please login to create orders.",
                  [
                    { text: "Cancel" },
                    {
                      text: "Login",
                      onPress: () => router.push("/(auth)/Login"),
                    },
                  ],
                );
                return;
              }

              console.log("Creating order for user:", user._id);

              // Create actual order using API
              const medicationPrice = med.price || 15; // Use medication price or default
              const orderData = {
                items: [
                  {
                    name: med.name,
                    quantity: 1, // Default quantity
                    price: medicationPrice,
                    dose: med.dose,
                  },
                ],
                totalAmount: medicationPrice,
                deliveryAddress: "User Address", // You might want to collect this
              };

              console.log("Creating order with data:", orderData);
              const response = await orderAPI.create(orderData);
              console.log("Order creation response:", response);

              if (response && (response.data || response._id)) {
                Alert.alert(
                  "Order Created!",
                  `Your order for ${med.name} has been placed successfully. Order #${response.data?._id || response._id}`,
                  [
                    { text: "OK" },
                    {
                      text: "View Orders",
                      onPress: () => router.push("/(tabs)/orders"),
                    },
                  ],
                );
              } else {
                throw new Error("Invalid response from server");
              }
            } catch (error: any) {
              console.error("Order creation error:", error);
              Alert.alert(
                "Order Failed",
                `Failed to create order: ${error?.message || "Please check your connection and try again."}`,
                [{ text: "OK" }],
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {!showPrescriptionUpload ? (
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={22} color="#1a1a1a" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Family Cabinet</Text>
            <TouchableOpacity style={styles.settingsBtn}>
              <Settings size={22} color="#1a1a1a" />
            </TouchableOpacity>
          </View>

          {/* Members row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.membersScroll}
            contentContainerStyle={styles.membersContent}
          >
            {MEMBERS.map((m) => (
              <Avatar
                key={m.id}
                member={m}
                active={activeMember === m.id}
                onPress={() => setActiveMember(m.id)}
              />
            ))}
          </ScrollView>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {/* Urgent refill banner */}
            {urgent.length > 0 && (
              <View style={styles.urgentBanner}>
                <AlertCircle size={16} color="#EF4444" />
                <Text style={styles.urgentText}>
                  {urgent.length} medication{urgent.length > 1 ? "s" : ""} need
                  {urgent.length === 1 ? "s" : ""} refill soon
                </Text>
                <ChevronRight size={14} color="#EF4444" />
              </View>
            )}

            {/* Progress */}
            {filtered.length > 0 && (
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>
                    Today&apos;s Progress
                  </Text>
                  <Text
                    style={[
                      styles.progressCount,
                      { color: activeMemberData.color },
                    ]}
                  >
                    {takenCount}/{filtered.length}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${filtered.length ? (takenCount / filtered.length) * 100 : 0}%`,
                        backgroundColor: activeMemberData.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressSub}>
                  {takenCount === filtered.length
                    ? "🎉 All medications taken today!"
                    : `${filtered.length - takenCount} remaining`}
                </Text>
              </View>
            )}

            {/* Medications list */}
            <Text style={styles.sectionTitle}>
              My Medications ({filtered.length})
            </Text>

            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Pill size={48} color="#d1d5db" />
                <Text style={styles.emptyTitle}>No medications added</Text>
                <Text style={styles.emptySubtitle}>
                  Tap + to add a medication for {activeMemberData.name}
                </Text>
              </View>
            ) : (
              filtered.map((med) => (
                <MedCard
                  key={med.id}
                  med={med}
                  onToggleTaken={toggleTaken}
                  onDelete={deleteMed}
                  onRefill={handleRefill}
                  onOrderNow={handleOrderNow}
                />
              ))
            )}

            {/* Prescription Upload Card */}
            <TouchableOpacity
              style={styles.prescriptionUploadCard}
              activeOpacity={0.8}
              onPress={() => setShowPrescriptionUpload(true)}
            >
              <Camera size={20} color="#2A7A4F" />
              <View style={{ flex: 1 }}>
                <Text style={styles.prescriptionUploadTitle}>
                  Upload Prescription
                </Text>
                <Text style={styles.prescriptionUploadSub}>
                  Upload a valid doctor&apos;s prescription
                </Text>
              </View>
              <ChevronRight size={16} color="#2A7A4F" />
            </TouchableOpacity>

            {/* Reminder card */}
            <TouchableOpacity style={styles.reminderCard} activeOpacity={0.8}>
              <Bell size={18} color="#2A7A4F" />
              <View style={{ flex: 1 }}>
                <Text style={styles.reminderTitle}>
                  Set Medication Reminders
                </Text>
                <Text style={styles.reminderSub}>
                  Get notified when it&apos;s time to take your meds
                </Text>
              </View>
              <ChevronRight size={16} color="#2A7A4F" />
            </TouchableOpacity>
          </ScrollView>

          {/* FAB */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.85}
          >
            <Plus size={28} color="#fff" />
          </TouchableOpacity>

          {/* Add Med Modal */}
          <AddMedModal
            visible={showAddModal}
            memberId={activeMember}
            onClose={() => setShowAddModal(false)}
            onAdd={addMed}
          />
        </>
      ) : (
        /* Prescription Upload View */
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setShowPrescriptionUpload(false)}
              style={styles.backButton}
            >
              <ArrowLeft size={22} color="#1a1a1a" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Upload Prescription</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.uploadContent}
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
                <View
                  style={[styles.iconCircle, { backgroundColor: "#EAF5EE" }]}
                >
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
                <View
                  style={[styles.iconCircle, { backgroundColor: "#FFF8EC" }]}
                >
                  <ImageIcon size={26} color="#E8A020" />
                </View>
                <Text style={styles.optionLabel}>Upload Gallery</Text>
              </TouchableOpacity>
            </View>

            {/* File drop zone / preview */}
            {selectedFile ? (
              <View style={styles.previewContainer}>
                {/* Remove button */}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={clearFile}
                >
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
                onPress={() =>
                  Alert.alert(
                    "Type Manually",
                    "Navigate to manual entry screen.",
                  )
                }
                activeOpacity={0.85}
              >
                <Text style={styles.manualButtonText}>Type Manually</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  settingsBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a1a" },

  // Members
  membersScroll: { flexGrow: 0, marginBottom: 4 },
  membersContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 16,
    flexDirection: "row",
  },
  avatarWrapper: { alignItems: "center", gap: 4 },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 14, fontWeight: "800" },
  avatarLabel: { fontSize: 12, color: "#6b7280", fontWeight: "500" },

  scroll: { flex: 1, paddingHorizontal: 16 },

  urgentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  urgentText: { flex: 1, fontSize: 13, color: "#EF4444", fontWeight: "600" },

  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressTitle: { fontSize: 14, fontWeight: "600", color: "#374151" },
  progressCount: { fontSize: 14, fontWeight: "700" },
  progressBar: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: { height: "100%", borderRadius: 3 },
  progressSub: { fontSize: 12, color: "#6b7280" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },

  medCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medAccent: { width: 4, alignSelf: "stretch" },
  medIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    margin: 12,
  },
  medInfo: { flex: 1, paddingVertical: 12 },
  medName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  medDose: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
  timesRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timeText: { fontSize: 10, color: "#6b7280" },
  medRight: { alignItems: "flex-end", gap: 6, paddingHorizontal: 12 },
  refillBadge: { fontSize: 11, fontWeight: "700" },
  takenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  takenBtnActive: { backgroundColor: "#2A7A4F" },
  takenText: { fontSize: 11, color: "#6b7280", fontWeight: "600" },
  takenTextActive: { color: "#fff" },
  deleteBtn: { padding: 4 },

  emptyState: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: "#374151" },
  emptySubtitle: { fontSize: 13, color: "#9ca3af", textAlign: "center" },

  prescriptionUploadCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#EAF5EE",
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  prescriptionUploadTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  prescriptionUploadSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#EAF5EE",
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  reminderTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  reminderSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2A7A4F",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2A7A4F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },

  // Upload styles
  uploadContent: {
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  modalFor: { fontSize: 13, color: "#6b7280", marginBottom: 16 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1a1a1a",
    marginBottom: 16,
  },
  freqChip: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  freqChipText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  addMedBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  addMedBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  orderNowBtn: {
    backgroundColor: "#2A7A4F",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  orderNowBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
});
