import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
    Bell,
    Camera,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    CreditCard,
    Edit3,
    HelpCircle,
    LogOut,
    MapPin,
    Plus,
    Shield,
    Star,
    Trash2,
    Users,
    X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/auth-context";
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

type Address = {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
};
type PaymentMethod = {
  id: string;
  type: "momo" | "card";
  label: string;
  last4: string;
  isDefault: boolean;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_ADDRESSES: Address[] = [
  {
    id: "1",
    label: "Home",
    address: "14 Accra Ring Road, East Legon, Accra",
    isDefault: true,
  },
  {
    id: "2",
    label: "Office",
    address: "5 Liberation Road, Airport City, Accra",
    isDefault: false,
  },
];

const INITIAL_PAYMENTS: PaymentMethod[] = [
  { id: "1", type: "momo", label: "MTN MoMo", last4: "4567", isDefault: true },
  {
    id: "2",
    type: "card",
    label: "Visa Card",
    last4: "8821",
    isDefault: false,
  },
];

// ─── Address Modal ────────────────────────────────────────────────────────────

function AddressModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [addr, setAddr] = useState("");

  const addAddress = () => {
    if (!label.trim() || !addr.trim()) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    setAddresses((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        label: label.trim(),
        address: addr.trim(),
        isDefault: false,
      },
    ]);
    setLabel("");
    setAddr("");
    setAdding(false);
  };

  const removeAddress = (id: string) =>
    setAddresses((prev) => prev.filter((a) => a.id !== id));

  const setDefault = (id: string) =>
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: "85%" }}>
          <View className="w-10 h-1 bg-gray-200 rounded-full self-center mt-3 mb-2" />
          <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">
              Saved Addresses
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <X size={16} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
            {addresses.map((a) => (
              <View
                key={a.id}
                className="bg-gray-50 rounded-2xl p-4 flex-row items-start gap-3"
              >
                <View className="w-9 h-9 rounded-full bg-green-100 items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={16} color="#2A7A4F" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-0.5">
                    <Text className="text-sm font-bold text-gray-900">
                      {a.label}
                    </Text>
                    {a.isDefault && (
                      <View className="bg-green-100 rounded-full px-2 py-0.5">
                        <Text className="text-xs font-semibold text-green-700">
                          Default
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-500 leading-4">
                    {a.address}
                  </Text>
                  {!a.isDefault && (
                    <TouchableOpacity
                      className="mt-1.5"
                      onPress={() => setDefault(a.id)}
                    >
                      <Text className="text-xs font-semibold text-green-700">
                        Set as default
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => removeAddress(a.id)}
                  className="p-1"
                >
                  <Trash2 size={15} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            {adding ? (
              <View className="bg-gray-50 rounded-2xl p-4 gap-3">
                <Text className="text-sm font-bold text-gray-900">
                  New Address
                </Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900"
                  placeholder="Label (e.g. Home, Office)"
                  placeholderTextColor="#9ca3af"
                  value={label}
                  onChangeText={setLabel}
                />
                <TextInput
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900"
                  placeholder="Full address"
                  placeholderTextColor="#9ca3af"
                  value={addr}
                  onChangeText={setAddr}
                  multiline
                />
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 border border-gray-200 rounded-xl py-2.5 items-center"
                    onPress={() => {
                      setAdding(false);
                      setLabel("");
                      setAddr("");
                    }}
                  >
                    <Text className="text-sm font-semibold text-gray-500">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 rounded-xl py-2.5 items-center"
                    style={{ backgroundColor: "#2A7A4F" }}
                    onPress={addAddress}
                  >
                    <Text className="text-sm font-bold text-white">Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                className="border-2 border-dashed border-gray-200 rounded-2xl py-4 items-center gap-1.5"
                onPress={() => setAdding(true)}
              >
                <Plus size={18} color="#9ca3af" />
                <Text className="text-sm font-semibold text-gray-400">
                  Add New Address
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

function PaymentModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [methods, setMethods] = useState<PaymentMethod[]>(INITIAL_PAYMENTS);
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<"momo" | "card">("momo");
  const [label, setLabel] = useState("");
  const [number, setNumber] = useState("");

  const addMethod = () => {
    if (!label.trim() || number.length < 4) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    setMethods((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type,
        label: label.trim(),
        last4: number.slice(-4),
        isDefault: false,
      },
    ]);
    setLabel("");
    setNumber("");
    setAdding(false);
  };

  const removeMethod = (id: string) =>
    setMethods((prev) => prev.filter((m) => m.id !== id));
  const setDefault = (id: string) =>
    setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: "85%" }}>
          <View className="w-10 h-1 bg-gray-200 rounded-full self-center mt-3 mb-2" />
          <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">
              Payment Methods
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <X size={16} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
            {methods.map((m) => (
              <View
                key={m.id}
                className="bg-gray-50 rounded-2xl p-4 flex-row items-center gap-3"
              >
                <View
                  className="w-10 h-10 rounded-2xl items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: m.type === "momo" ? "#FEF3C7" : "#EFF6FF",
                  }}
                >
                  <CreditCard
                    size={18}
                    color={m.type === "momo" ? "#D97706" : "#2563EB"}
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-bold text-gray-900">
                      {m.label}
                    </Text>
                    {m.isDefault && (
                      <View className="bg-green-100 rounded-full px-2 py-0.5">
                        <Text className="text-xs font-semibold text-green-700">
                          Default
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-500">•••• {m.last4}</Text>
                  {!m.isDefault && (
                    <TouchableOpacity
                      className="mt-1"
                      onPress={() => setDefault(m.id)}
                    >
                      <Text className="text-xs font-semibold text-green-700">
                        Set as default
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => removeMethod(m.id)}
                  className="p-1"
                >
                  <Trash2 size={15} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            {adding ? (
              <View className="bg-gray-50 rounded-2xl p-4 gap-3">
                <Text className="text-sm font-bold text-gray-900">
                  Add Payment Method
                </Text>
                <View className="flex-row gap-2">
                  {(["momo", "card"] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      className="flex-1 rounded-xl py-2.5 items-center border-2"
                      style={{
                        borderColor: type === t ? "#2A7A4F" : "#e5e7eb",
                        backgroundColor: type === t ? "#EAF5EE" : "#fff",
                      }}
                      onPress={() => setType(t)}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: type === t ? "#2A7A4F" : "#6b7280" }}
                      >
                        {t === "momo" ? "Mobile Money" : "Card"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900"
                  placeholder={
                    type === "momo"
                      ? "Provider (e.g. MTN MoMo)"
                      : "Card label (e.g. Visa)"
                  }
                  placeholderTextColor="#9ca3af"
                  value={label}
                  onChangeText={setLabel}
                />
                <TextInput
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900"
                  placeholder={type === "momo" ? "Phone number" : "Card number"}
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  value={number}
                  onChangeText={setNumber}
                />
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 border border-gray-200 rounded-xl py-2.5 items-center"
                    onPress={() => {
                      setAdding(false);
                      setLabel("");
                      setNumber("");
                    }}
                  >
                    <Text className="text-sm font-semibold text-gray-500">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 rounded-xl py-2.5 items-center"
                    style={{ backgroundColor: "#2A7A4F" }}
                    onPress={addMethod}
                  >
                    <Text className="text-sm font-bold text-white">Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                className="border-2 border-dashed border-gray-200 rounded-2xl py-4 items-center gap-1.5"
                onPress={() => setAdding(true)}
              >
                <Plus size={18} color="#9ca3af" />
                <Text className="text-sm font-semibold text-gray-400">
                  Add Payment Method
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

function EditProfileModal({
  visible,
  name,
  phone,
  onClose,
  onSave,
}: {
  visible: boolean;
  name: string;
  phone: string;
  onClose: () => void;
  onSave: (name: string, phone: string) => void;
}) {
  const [n, setN] = useState(name);
  const [p, setP] = useState(phone);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6 pt-3">
          <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-4" />
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-lg font-bold text-gray-900">
              Edit Profile
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <X size={16} color="#374151" />
            </TouchableOpacity>
          </View>
          <Text className="text-sm font-semibold text-gray-700 mb-1.5">
            Full Name
          </Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-4"
            value={n}
            onChangeText={setN}
            placeholderTextColor="#9ca3af"
          />
          <Text className="text-sm font-semibold text-gray-700 mb-1.5">
            Phone Number
          </Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-6"
            value={p}
            onChangeText={setP}
            keyboardType="phone-pad"
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: "#2A7A4F" }}
            onPress={() => {
              onSave(n, p);
              onClose();
            }}
          >
            <Text className="text-base font-bold text-white">Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Menu Row ─────────────────────────────────────────────────────────────────

function MenuRow({
  icon,
  label,
  sublabel,
  onPress,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center gap-4 px-5 py-4"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        className="w-9 h-9 rounded-full items-center justify-center"
        style={{ backgroundColor: danger ? "#FEF2F2" : "#f3f4f6" }}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text
          className="text-sm font-semibold"
          style={{ color: danger ? "#ef4444" : "#1a1a1a" }}
        >
          {label}
        </Text>
        {sublabel && (
          <Text className="text-xs text-gray-400 mt-0.5">{sublabel}</Text>
        )}
      </View>
      {!danger && <ChevronRight size={16} color="#9ca3af" />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [nhisActive] = useState(true);

  // Update state when user data changes
  useEffect(() => {
    if (user) {
      setName(`${user.firstName} ${user.lastName}`);
      setPhone(user.phone || "");
    }
  }, [user]);

  const [showEdit, setShowEdit] = useState(false);
  const [showAddresses, setShowAddresses] = useState(false);
  const [showPayments, setShowPayments] = useState(false);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Allow photo access to change your avatar.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setAvatar(result.assets[0].uri);
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="px-4 py-3 items-center">
          <Text className="text-base font-bold text-gray-900">Profile</Text>
        </View>

        {/* Profile card */}
        <View className="bg-white mx-4 rounded-3xl px-6 py-8 items-center mb-4 shadow-sm">
          {/* Avatar */}
          <TouchableOpacity
            className="relative mb-4"
            onPress={pickAvatar}
            activeOpacity={0.85}
          >
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                className="w-24 h-24 rounded-full"
                style={{ width: 96, height: 96, borderRadius: 48 }}
              />
            ) : (
              <View
                className="w-24 h-24 rounded-full items-center justify-center"
                style={{ backgroundColor: "#d1e8db" }}
              >
                <Text className="text-3xl font-extrabold text-green-800">
                  {initials}
                </Text>
              </View>
            )}
            {/* Camera badge */}
            <View
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full items-center justify-center border-2 border-white"
              style={{ backgroundColor: "#2A7A4F" }}
            >
              <Camera size={13} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Name + edit */}
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-2xl font-extrabold text-gray-900">
              {name}
            </Text>
            <TouchableOpacity onPress={() => setShowEdit(true)} className="p-1">
              <Edit3 size={15} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <Text className="text-sm text-gray-500 mb-1">{phone}</Text>
          {user?.email && (
            <Text className="text-sm text-gray-400 mb-3">{user.email}</Text>
          )}

          {/* NHIS badge */}
          <View
            className="flex-row items-center gap-1.5 border rounded-full px-4 py-1.5"
            style={{ borderColor: "#2A7A4F" }}
          >
            <CheckCircle2 size={13} color="#2A7A4F" />
            <Text className="text-xs font-bold text-green-700">
              NHIS {nhisActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        {/* Menu sections */}
        <View className="bg-white mx-4 rounded-3xl overflow-hidden mb-4 shadow-sm">
          <MenuRow
            icon={<ClipboardList size={18} color="#2A7A4F" />}
            label="My Orders"
            sublabel="Track and manage your orders"
            onPress={() => router.push("/(tabs)/orders")}
          />
          <View className="h-px bg-gray-50 ml-16" />
          <MenuRow
            icon={<Users size={18} color="#7C5CBF" />}
            label="Family Cabinet"
            sublabel="Manage family medications"
            onPress={() => router.push("/(tabs)/meds")}
          />
          <View className="h-px bg-gray-50 ml-16" />
          <MenuRow
            icon={<MapPin size={18} color="#2563EB" />}
            label="Saved Addresses"
            sublabel="Manage delivery addresses"
            onPress={() => setShowAddresses(true)}
          />
          <View className="h-px bg-gray-50 ml-16" />
          <MenuRow
            icon={<CreditCard size={18} color="#D97706" />}
            label="Payment Methods"
            sublabel="Cards & mobile money"
            onPress={() => setShowPayments(true)}
          />
        </View>

        <View className="bg-white mx-4 rounded-3xl overflow-hidden mb-4 shadow-sm">
          <MenuRow
            icon={<Bell size={18} color="#2A7A4F" />}
            label="Notifications"
            sublabel="Reminders & order updates"
            onPress={() =>
              Alert.alert("Notifications", "Notification settings coming soon.")
            }
          />
          <View className="h-px bg-gray-50 ml-16" />
          <MenuRow
            icon={<Shield size={18} color="#6b7280" />}
            label="Privacy & Security"
            onPress={() =>
              Alert.alert("Privacy", "Privacy settings coming soon.")
            }
          />
          <View className="h-px bg-gray-50 ml-16" />
          <MenuRow
            icon={<Star size={18} color="#F59E0B" />}
            label="Rate the App"
            onPress={() =>
              Alert.alert("Rate Us", "Thank you for your support!")
            }
          />
          <View className="h-px bg-gray-50 ml-16" />
          <MenuRow
            icon={<HelpCircle size={18} color="#6b7280" />}
            label="Help & Support"
            onPress={() =>
              Alert.alert("Support", "Contact support@pharmago.com")
            }
          />
        </View>

        {/* Log Out */}
        <View className="bg-white mx-4 rounded-3xl overflow-hidden shadow-sm">
          <MenuRow
            icon={<LogOut size={18} color="#ef4444" />}
            label="Log Out"
            onPress={handleLogout}
            danger
          />
        </View>
      </ScrollView>

      <EditProfileModal
        visible={showEdit}
        name={name}
        phone={phone}
        onClose={() => setShowEdit(false)}
        onSave={(n, p) => {
          setName(n);
          setPhone(p);
        }}
      />
      <AddressModal
        visible={showAddresses}
        onClose={() => setShowAddresses(false)}
      />
      <PaymentModal
        visible={showPayments}
        onClose={() => setShowPayments(false)}
      />
    </SafeAreaView>
  );
}
