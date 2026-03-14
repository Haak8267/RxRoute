import { useRouter } from "expo-router";
import {
    AlertCircle,
    ArrowLeft,
    Bell,
    CheckCircle2,
    ChevronRight,
    Clock,
    Pill,
    Plus,
    Settings,
    Trash2,
    X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

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
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MEMBERS: Member[] = [
  { id: "me", name: "Me", label: "Me", color: "#2A7A4F", initials: "ME" },
  { id: "mum", name: "Mum", label: "Mum", color: "#7C5CBF", initials: "MU" },
  { id: "dad", name: "Dad", label: "Dad", color: "#2563EB", initials: "DA" },
  { id: "ama", name: "Ama", label: "Ama", color: "#D97706", initials: "AM" },
];

const INITIAL_MEDS: Medication[] = [
  {
    id: "1",
    memberId: "me",
    name: "Paracetamol",
    dose: "1000mg",
    frequency: "2x Daily",
    refillInDays: 5,
    takenToday: false,
    color: "#2A7A4F",
    times: ["8:00 AM", "8:00 PM"],
  },
  {
    id: "2",
    memberId: "me",
    name: "Vitamin C",
    dose: "500mg",
    frequency: "1x Daily",
    refillInDays: 12,
    takenToday: false,
    color: "#2563EB",
    times: ["9:00 AM"],
  },
  {
    id: "3",
    memberId: "mum",
    name: "Metformin",
    dose: "500mg",
    frequency: "2x Daily",
    refillInDays: 3,
    takenToday: false,
    color: "#7C5CBF",
    times: ["7:00 AM", "7:00 PM"],
  },
  {
    id: "4",
    memberId: "dad",
    name: "Lisinopril",
    dose: "10mg",
    frequency: "1x Daily",
    refillInDays: 8,
    takenToday: false,
    color: "#2563EB",
    times: ["7:00 AM"],
  },
  {
    id: "5",
    memberId: "ama",
    name: "Folic Acid",
    dose: "400mcg",
    frequency: "1x Daily",
    refillInDays: 20,
    takenToday: false,
    color: "#D97706",
    times: ["8:00 AM"],
  },
];

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
}: {
  med: Medication;
  onToggleTaken: (id: string) => void;
  onDelete: (id: string) => void;
  onRefill: (med: Medication) => void;
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
    });
    setName("");
    setDose("");
    setFreq(FREQUENCIES[0]);
    setRefill("30");
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
  const [activeMember, setActiveMember] = useState("me");
  const [meds, setMeds] = useState<Medication[]>(INITIAL_MEDS);
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = meds.filter((m) => m.memberId === activeMember);
  const takenCount = filtered.filter((m) => m.takenToday).length;
  const urgent = filtered.filter((m) => m.refillInDays <= 5 && !m.takenToday);
  const activeMemberData = MEMBERS.find((m) => m.id === activeMember)!;

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
              <Text style={styles.progressTitle}>Today&apos;s Progress</Text>
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
            />
          ))
        )}

        {/* Reminder card */}
        <TouchableOpacity style={styles.reminderCard} activeOpacity={0.8}>
          <Bell size={18} color="#2A7A4F" />
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTitle}>Set Medication Reminders</Text>
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
});
