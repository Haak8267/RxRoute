import { Medicine, useCart } from "@/context/cart-context";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
    Bell,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Clock,
    FileText,
    Keyboard,
    MapPin,
    Minus,
    Pill,
    Plus,
    RefreshCw,
    Search,
    ShoppingCart,
    SlidersHorizontal,
    Star,
    Trash2,
    Users,
    X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/auth-context";
import { orderAPI } from "../../services/api";
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

export const ALL_MEDICINES: Medicine[] = [
  {
    _id: "1",
    name: "Paracetamol",
    description: "Pain reliever and fever reducer",
    category: "Pain Relief",
    dose: "500mg",
    quantity: "10 tabs",
    price: 15,
    originalPrice: 20,
    rating: 4.8,
    reviews: [],
    inStock: true,
    requiresPrescription: false,
    tags: ["pain", "fever", "headache"],
    activeIngredients: ["Paracetamol"],
    sideEffects: ["Rare allergic reactions"],
    manufacturer: "PharmaCorp",
  },
  {
    _id: "2",
    name: "Vitamin C",
    description: "Immune system support supplement",
    category: "Vitamins",
    dose: "1000mg",
    quantity: "30 effer",
    price: 45,
    rating: 4.6,
    reviews: [],
    inStock: true,
    requiresPrescription: false,
    tags: ["vitamin", "immune", "supplement"],
    activeIngredients: ["Ascorbic Acid"],
    sideEffects: ["Generally well tolerated"],
    manufacturer: "HealthPlus",
  },
  {
    _id: "3",
    name: "Amoxicillin",
    description: "Antibiotic for bacterial infections",
    category: "Antibiotics",
    dose: "250mg",
    quantity: "20 caps",
    price: 38,
    rating: 4.5,
    reviews: [],
    inStock: true,
    requiresPrescription: true,
    tags: ["antibiotic", "bacterial", "infection"],
    activeIngredients: ["Amoxicillin"],
    sideEffects: ["Nausea", "Diarrhea", "Allergic reactions"],
    manufacturer: "MediTech",
  },
  {
    _id: "4",
    name: "Ibuprofen",
    description: "Anti-inflammatory pain reliever",
    category: "Pain Relief",
    dose: "400mg",
    quantity: "16 tabs",
    price: 22,
    originalPrice: 28,
    rating: 4.7,
    reviews: [],
    inStock: true,
    requiresPrescription: false,
    tags: ["pain", "inflammation", "fever"],
    activeIngredients: ["Ibuprofen"],
    sideEffects: ["Stomach upset", "Dizziness"],
    manufacturer: "PainAway",
  },
  {
    _id: "5",
    name: "Zinc Sulphate",
    description: "Immune system support supplement",
    category: "Vitamins",
    dose: "200mg",
    quantity: "30 tabs",
    price: 18,
    rating: 4.3,
    reviews: [],
    inStock: true,
    requiresPrescription: false,
    tags: ["zinc", "immune", "supplement"],
    activeIngredients: ["Zinc Sulphate"],
    sideEffects: ["Generally well tolerated"],
    manufacturer: "HealthPlus",
  },
  {
    _id: "6",
    name: "Folic Acid",
    description: "Essential B vitamin for cell growth",
    category: "Vitamins",
    dose: "400mcg",
    quantity: "60 tabs",
    price: 12,
    rating: 4.9,
    reviews: [],
    inStock: true,
    requiresPrescription: false,
    tags: ["folic acid", "vitamin b", "pregnancy"],
    activeIngredients: ["Folic Acid"],
    sideEffects: ["Generally well tolerated"],
    manufacturer: "VitaLife",
  },
  {
    _id: "7",
    name: "Metformin",
    description: "Diabetes medication for blood sugar control",
    category: "Diabetes",
    dose: "500mg",
    quantity: "30 tabs",
    price: 28,
    rating: 4.4,
    reviews: [],
    inStock: true,
    requiresPrescription: true,
    tags: ["diabetes", "blood sugar", "metformin"],
    activeIngredients: ["Metformin"],
    sideEffects: ["Nausea", "Diarrhea", "Stomach upset"],
    manufacturer: "DiaCare",
  },
  {
    _id: "8",
    name: "Lisinopril",
    description: "Blood pressure medication",
    category: "Heart",
    dose: "10mg",
    quantity: "28 tabs",
    price: 35,
    rating: 4.6,
    reviews: [],
    inStock: true,
    requiresPrescription: true,
    tags: ["blood pressure", "heart", "ace inhibitor"],
    activeIngredients: ["Lisinopril"],
    sideEffects: ["Dizziness", "Dry cough", "Fatigue"],
    manufacturer: "CardioCare",
  },
  {
    _id: "9",
    name: "Cetirizine",
    description: "Antihistamine for allergy relief",
    category: "Allergy",
    dose: "10mg",
    quantity: "14 tabs",
    price: 16,
    originalPrice: 20,
    rating: 4.5,
    reviews: [],
    inStock: true,
    requiresPrescription: false,
    tags: ["allergy", "antihistamine", "hay fever"],
    activeIngredients: ["Cetirizine"],
    sideEffects: ["Drowsiness", "Dry mouth", "Headache"],
    manufacturer: "AllerFree",
  },
  {
    _id: "10",
    name: "Retinol Cream",
    description: "Anti-aging skincare treatment",
    category: "Skincare",
    dose: "0.5%",
    quantity: "30ml tube",
    price: 55,
    rating: 4.7,
    reviews: [],
    inStock: true,
    requiresPrescription: false,
    tags: ["skincare", "anti-aging", "retinol"],
    activeIngredients: ["Retinol"],
    sideEffects: ["Skin irritation", "Dryness", "Sun sensitivity"],
    manufacturer: "SkinCare Pro",
  },
  {
    _id: "11",
    name: "Aspirin",
    description: "Blood thinner and pain reliever",
    category: "Heart",
    dose: "75mg",
    quantity: "28 tabs",
    price: 10,
    rating: 4.2,
    reviews: [],
    inStock: true,
    requiresPrescription: false,
    tags: ["blood thinner", "pain", "heart"],
    activeIngredients: ["Aspirin"],
    sideEffects: ["Stomach upset", "Bleeding risk"],
    manufacturer: "CardioCare",
  },
  {
    _id: "12",
    name: "Omeprazole",
    description: "Proton pump inhibitor for acid reflux",
    category: "Digestive",
    dose: "20mg",
    quantity: "14 caps",
    price: 24,
    rating: 4.6,
    reviews: [],
    inStock: true,
    requiresPrescription: true,
    tags: ["acid reflux", "heartburn", "stomach"],
    activeIngredients: ["Omeprazole"],
    sideEffects: ["Headache", "Nausea", "Diarrhea"],
    manufacturer: "GastroCare",
  },
];

const CATEGORIES = [
  "All",
  "Vitamins",
  "Antibiotics",
  "Pain Relief",
  "Skincare",
  "Diabetes",
  "Heart",
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  All: { bg: "#2A7A4F", text: "#fff" },
  Vitamins: { bg: "#FEF3C7", text: "#D97706" },
  Antibiotics: { bg: "#EFF6FF", text: "#2563EB" },
  "Pain Relief": { bg: "#FEF2F2", text: "#EF4444" },
  Skincare: { bg: "#F3EEFF", text: "#7C5CBF" },
  Diabetes: { bg: "#EAF5EE", text: "#2A7A4F" },
  Heart: { bg: "#FFF0F3", text: "#E11D48" },
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Order Dispatched",
    body: "Your order #RX-10294 is on the way!",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    title: "Refill Reminder",
    body: "Paracetamol running low — refill soon.",
    time: "1 hr ago",
    read: false,
  },
  {
    id: "3",
    title: "Order Delivered",
    body: "Order #RX-09211 has been delivered.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "4",
    title: "New Promo Available",
    body: "Get 20% off Vitamins this week!",
    time: "2 days ago",
    read: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(hour: number) {
  if (hour < 12) return { text: "Good morning", emoji: "👋" };
  if (hour < 17) return { text: "Good afternoon", emoji: "☀️" };
  return { text: "Good evening", emoji: "🌙" };
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Cart Sheet ───────────────────────────────────────────────────────────────

function CartSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { items, updateQty, clearCart, totalPrice } = useCart();
  const router = useRouter();
  const { user } = useAuth();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      Alert.alert("Login Required", "Please login to place an order.");
      return;
    }

    if (items.length === 0) {
      Alert.alert("Cart Empty", "Your cart is empty.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderData = {
        items: items.map((item) => ({
          // Send the medicine _id as `medication` for DB lookup
          // Backend will fall back to inline price if ID is not a valid ObjectId
          medication: item.medicine._id,
          name: item.medicine.name,
          quantity: item.qty,
          price: item.medicine.price,
          dose: item.medicine.dose,
        })),
        deliveryAddress: {
          street: typeof user.address === "string"
            ? user.address
            : user.address?.street || "Default Street",
          city: user.address?.city || "Accra",
          region: user.address?.region || "Greater Accra",
          country: user.address?.country || "Ghana",
        },
        phoneNumber: user.phone || "",
        totalAmount: totalPrice,
      };

      const response = await orderAPI.create(orderData);

      if (response.success) {
        onClose();
        clearCart();
        const orderNum =
          response.data?.orderNumber ||
          response.data?.order?.orderNumber ||
          "—";
        Alert.alert(
          "Order Placed! 🎉",
          `Your order #${orderNum} has been placed successfully.`,
          [
            {
              text: "Track Order",
              onPress: () => router.push("/(tabs)/orders"),
            },
            { text: "OK" },
          ],
        );
      } else {
        throw new Error(response.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Order placement error:", error);
      Alert.alert(
        "Order Failed",
        "Failed to place your order. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: "85%" }}>
          {/* Handle */}
          <View className="w-10 h-1 bg-gray-200 rounded-full self-center mt-3 mb-2" />

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-100">
            <View className="flex-row items-center gap-2">
              <ShoppingCart size={20} color="#2A7A4F" />
              <Text className="text-lg font-bold text-gray-900">My Cart</Text>
              {items.length > 0 && (
                <View className="bg-green-100 rounded-full px-2 py-0.5">
                  <Text className="text-xs font-bold text-green-700">
                    {items.length} item{items.length > 1 ? "s" : ""}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <X size={16} color="#374151" />
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <View className="items-center py-16 gap-3">
              <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center">
                <ShoppingCart size={36} color="#d1d5db" />
              </View>
              <Text className="text-base font-bold text-gray-700">
                Your cart is empty
              </Text>
              <Text className="text-sm text-gray-400 text-center px-8">
                Add medicines from the home screen to get started
              </Text>
              <TouchableOpacity
                className="mt-2 bg-green-700 rounded-xl px-6 py-3"
                onPress={onClose}
              >
                <Text className="text-sm font-bold text-white">
                  Browse Medicines
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView
                className="flex-1 px-5"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 12 }}
              >
                {items.map((item, i) => (
                  <View
                    key={item.medicine._id}
                    className="flex-row items-center gap-3 py-3"
                    style={{
                      borderBottomWidth: i < items.length - 1 ? 1 : 0,
                      borderBottomColor: "#f3f4f6",
                    }}
                  >
                    {/* Icon */}
                    <View
                      className="w-12 h-12 rounded-2xl items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#2A7A4F25" }}
                    >
                      <Pill size={22} color="#2A7A4F" />
                    </View>

                    {/* Info */}
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-900">
                        {item.medicine.name}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {item.medicine.dose} • {item.medicine.quantity}
                      </Text>
                      <Text className="text-sm font-extrabold text-green-700 mt-0.5">
                        GHS {item.medicine.price * item.qty}.00
                      </Text>
                    </View>

                    {/* Qty controls */}
                    <View className="flex-row items-center gap-2 bg-gray-50 rounded-xl px-2 py-1">
                      <TouchableOpacity
                        className="w-7 h-7 rounded-full items-center justify-center"
                        style={{
                          backgroundColor:
                            item.qty <= 1 ? "#fee2e2" : "#f3f4f6",
                        }}
                        onPress={() =>
                          updateQty(item.medicine._id, item.qty - 1)
                        }
                      >
                        {item.qty <= 1 ? (
                          <Trash2 size={13} color="#ef4444" />
                        ) : (
                          <Minus size={13} color="#374151" />
                        )}
                      </TouchableOpacity>
                      <Text className="text-sm font-bold text-gray-900 w-5 text-center">
                        {item.qty}
                      </Text>
                      <TouchableOpacity
                        className="w-7 h-7 rounded-full items-center justify-center"
                        style={{ backgroundColor: "#2A7A4F" }}
                        onPress={() =>
                          updateQty(item.medicine._id, item.qty + 1)
                        }
                      >
                        <Plus size={13} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Summary + Checkout */}
              <View className="px-5 pb-8 pt-3 border-t border-gray-100">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-gray-500">Subtotal</Text>
                  <Text className="text-sm font-semibold text-gray-700">
                    GHS {totalPrice}.00
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-gray-500">Delivery fee</Text>
                  <Text className="text-sm font-semibold text-green-600">
                    Free
                  </Text>
                </View>
                <View className="h-px bg-gray-100 my-2" />
                <View className="flex-row justify-between mb-4">
                  <Text className="text-base font-bold text-gray-900">
                    Total
                  </Text>
                  <Text className="text-base font-extrabold text-green-700">
                    GHS {totalPrice}.00
                  </Text>
                </View>
                <TouchableOpacity
                  className="rounded-2xl py-4 items-center flex-row justify-center gap-2"
                  style={{ backgroundColor: "#2A7A4F" }}
                  onPress={handleCheckout}
                >
                  <CheckCircle size={18} color="#fff" />
                  <Text className="text-base font-bold text-white">
                    Place Order
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="mt-2 py-2 items-center"
                  onPress={() => {
                    clearCart();
                  }}
                >
                  <Text className="text-xs text-red-400 font-semibold">
                    Clear cart
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── See All Modal ────────────────────────────────────────────────────────────

function SeeAllModal({
  visible,
  title,
  medicines,
  onClose,
}: {
  visible: boolean;
  title: string;
  medicines: Medicine[];
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState<string[]>([]);

  const handleAdd = (med: Medicine) => {
    addItem(med);
    setAdded((prev) => [...prev, med._id]);
    setTimeout(
      () => setAdded((prev) => prev.filter((id) => id !== med._id)),
      1500,
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl" style={{ height: "88%" }}>
          <View className="w-10 h-1 bg-gray-200 rounded-full self-center mt-3 mb-2" />
          <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <X size={16} color="#374151" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={medicines}
            keyExtractor={(m) => m._id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            renderItem={({ item: med }) => {
              const isAdded = added.includes(med._id);
              return (
                <View className="flex-row items-center gap-3 bg-gray-50 rounded-2xl p-3">
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#2A7A4F25" }}
                  >
                    <Pill size={22} color="#2A7A4F" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900">
                      {med.name}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {med.dose} • {med.quantity}
                    </Text>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Star size={10} color="#F59E0B" fill="#F59E0B" />
                      <Text className="text-xs text-gray-500">
                        {med.rating}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="text-sm font-extrabold text-green-700">
                      GHS {med.price}.00
                    </Text>
                    {med.originalPrice && (
                      <Text className="text-xs text-gray-400 line-through">
                        GHS {med.originalPrice}.00
                      </Text>
                    )}
                    <TouchableOpacity
                      className="rounded-xl px-3 py-1.5 mt-1"
                      style={{
                        backgroundColor: isAdded ? "#d1fae5" : "#2A7A4F",
                      }}
                      onPress={() => !isAdded && handleAdd(med)}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{ color: isAdded ? "#065f46" : "#fff" }}
                      >
                        {isAdded ? "Added ✓" : "Add"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Notification Panel ───────────────────────────────────────────────────────

function NotificationPanel({
  notifications,
  onClose,
  onMarkRead,
}: {
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}) {
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <View
      className="absolute top-0 right-0 left-0 z-50 bg-white rounded-b-3xl"
      style={{
        elevation: 20,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 12,
      }}
    >
      <View className="flex-row items-center justify-between px-5 pt-12 pb-3 border-b border-gray-100">
        <View>
          <Text className="text-lg font-bold text-gray-900">Notifications</Text>
          {unread > 0 && (
            <Text className="text-xs text-green-700 font-semibold">
              {unread} unread
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={onClose}
          className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
        >
          <X size={16} color="#374151" />
        </TouchableOpacity>
      </View>
      <ScrollView style={{ maxHeight: 340 }}>
        {notifications.map((n) => (
          <TouchableOpacity
            key={n.id}
            className="flex-row gap-3 px-5 py-4 border-b border-gray-50"
            style={{ backgroundColor: n.read ? "#fff" : "#f0faf4" }}
            onPress={() => onMarkRead(n.id)}
          >
            <View
              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
              style={{ backgroundColor: n.read ? "transparent" : "#2A7A4F" }}
            />
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-900">{n.title}</Text>
              <Text className="text-xs text-gray-500 mt-0.5">{n.body}</Text>
              <Text className="text-xs text-gray-400 mt-1">{n.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity className="py-4 items-center" onPress={onClose}>
        <Text className="text-sm font-semibold text-green-700">Close</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Quick Action ─────────────────────────────────────────────────────────────

function QuickAction({
  icon,
  label,
  bg,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="items-center gap-2 flex-1"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        className="w-14 h-14 rounded-2xl items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        {icon}
      </View>
      <Text className="text-xs font-semibold text-gray-700 text-center">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Medicine Card ────────────────────────────────────────────────────────────

function MedCard({ med }: { med: Medicine }) {
  const { addItem, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const cartQty = items.find((i) => i.medicine._id === med._id)?.qty ?? 0;

  const handleAdd = () => {
    addItem(med);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl mr-3 overflow-hidden shadow-sm"
      style={{ width: 148 }}
      activeOpacity={0.9}
    >
      <View
        className="w-full h-28 items-center justify-center relative"
        style={{ backgroundColor: "#2A7A4F25" }}
      >
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: "#2A7A4F" }}
        >
          <Pill size={28} color="#fff" />
        </View>
        {med.tags && med.tags.length > 0 && (
          <View className="absolute top-2 left-2 bg-white/90 rounded-full px-2 py-0.5">
            <Text className="text-xs font-bold text-gray-700">
              {med.tags[0]}
            </Text>
          </View>
        )}
        {cartQty > 0 && (
          <View
            className="absolute top-2 right-2 w-5 h-5 rounded-full items-center justify-center"
            style={{ backgroundColor: "#2A7A4F" }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 10 }}>
              {cartQty}
            </Text>
          </View>
        )}
      </View>
      <View className="p-3">
        <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
          {med.name}
        </Text>
        <Text className="text-xs text-gray-400 mb-1.5">
          {med.dose} • {med.quantity}
        </Text>
        <View className="flex-row items-center gap-1 mb-2">
          <Star size={10} color="#F59E0B" fill="#F59E0B" />
          <Text className="text-xs text-gray-500">{med.rating}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-extrabold text-green-700">
              GHS {med.price}.00
            </Text>
            {med.originalPrice && (
              <Text className="text-xs text-gray-400 line-through">
                GHS {med.originalPrice}.00
              </Text>
            )}
          </View>
          <TouchableOpacity
            className="w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: justAdded ? "#d1fae5" : "#2A7A4F" }}
            onPress={handleAdd}
          >
            {justAdded ? (
              <CheckCircle size={14} color="#065f46" />
            ) : (
              <Plus size={14} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { totalCount } = useCart();
  const { user } = useAuth();

  // Time
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const { text: greetText, emoji: greetEmoji } = getGreeting(now.getHours());

  // Location
  const [locationLabel, setLocationLabel] = useState("Locating…");
  const [locationLoading, setLocationLoading] = useState(true);

  const fetchLocation = async () => {
    setLocationLoading(true);
    setLocationLabel("Locating…");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationLabel("Location unavailable");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (place) {
        const city = place.city ?? place.subregion ?? place.region ?? "";
        const country = place.country ?? "";
        setLocationLabel(
          `${city}${city && country ? ", " : ""}${country}` ||
            "Unknown location",
        );
      } else {
        setLocationLabel("Unknown location");
      }
    } catch {
      setLocationLabel("Location unavailable");
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  // Notifications
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

  // Search & filter
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const popularMeds = ALL_MEDICINES.slice(0, 4);
  const recentMeds = ALL_MEDICINES.slice(4, 6);

  const searchResults =
    search.trim().length > 1
      ? ALL_MEDICINES.filter((m) =>
          m.name.toLowerCase().includes(search.toLowerCase()),
        )
      : [];

  const filteredByCategory =
    activeCategory === "All"
      ? ALL_MEDICINES
      : ALL_MEDICINES.filter((m) => m.category === activeCategory);

  // Cart
  const [showCart, setShowCart] = useState(false);

  // See all modals
  const [seeAllConfig, setSeeAllConfig] = useState<{
    title: string;
    meds: Medicine[];
  } | null>(null);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {showNotifs && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowNotifs(false)}
          onMarkRead={markRead}
        />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Top bar ── */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-1">
          <View>
            <Text className="text-xs text-gray-400">Deliver to</Text>
            <TouchableOpacity
              className="flex-row items-center gap-1 mt-0.5"
              onPress={fetchLocation}
              activeOpacity={0.7}
            >
              {locationLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#2A7A4F"
                  style={{ marginRight: 4 }}
                />
              ) : (
                <MapPin size={13} color="#2A7A4F" />
              )}
              <Text
                className="text-sm font-bold text-gray-900"
                numberOfLines={1}
                style={{ maxWidth: 190 }}
              >
                {user?.address
                  ? typeof user.address === "string"
                    ? user.address
                    : user.address.city || "Your Address"
                  : locationLabel}
              </Text>
              <ChevronDown size={13} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-2">
            {/* Cart button */}
            <TouchableOpacity
              className="h-10 rounded-full bg-white items-center justify-center shadow-sm flex-row gap-1.5 px-3 relative"
              onPress={() => setShowCart(true)}
            >
              <ShoppingCart size={18} color="#2A7A4F" />
              {totalCount > 0 && (
                <View
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#2A7A4F" }}
                >
                  <Text
                    className="text-white font-bold"
                    style={{ fontSize: 10 }}
                  >
                    {totalCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Bell */}
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm relative"
              onPress={() => setShowNotifs((v) => !v)}
            >
              <Bell size={20} color="#1a1a1a" />
              {unreadCount > 0 && (
                <View className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 items-center justify-center">
                  <Text
                    className="text-white font-bold"
                    style={{ fontSize: 9 }}
                  >
                    {unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Live time */}
        <Text className="px-4 text-xs text-gray-400 mb-1">
          {formatTime(now)}
        </Text>

        {/* Greeting */}
        <View className="px-4 mb-5">
          <Text className="text-3xl font-extrabold text-gray-900 leading-tight">
            {greetText},{"\n"}
            {user ? `${user.firstName} ${user.lastName}` : "Guest"} {greetEmoji}
          </Text>
        </View>

        {/* Search */}
        <View className="flex-row items-center gap-3 px-4 mb-5">
          <View className="flex-1 flex-row items-center gap-2.5 bg-white rounded-2xl px-4 py-3 shadow-sm">
            <Search size={17} color="#9ca3af" />
            <TextInput
              className="flex-1 text-sm text-gray-900"
              placeholder="Search medicines..."
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <X size={15} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            className="w-11 h-11 rounded-2xl items-center justify-center"
            style={{
              backgroundColor: activeCategory !== "All" ? "#1A5C38" : "#2A7A4F",
            }}
            onPress={() =>
              setSeeAllConfig({
                title: "Filter by Category",
                meds: filteredByCategory,
              })
            }
          >
            <SlidersHorizontal size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search results */}
        {search.trim().length > 1 ? (
          <View className="mx-4 bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
            {searchResults.length > 0 ? (
              searchResults.map((med, i) => (
                <View
                  key={med._id}
                  className="flex-row items-center gap-3 px-4 py-3"
                  style={{
                    borderTopWidth: i > 0 ? 1 : 0,
                    borderTopColor: "#f3f4f6",
                  }}
                >
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: "#2A7A4F30" }}
                  >
                    <Pill size={16} color="#2A7A4F" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      {med.name}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {med.dose} • {med.quantity}
                    </Text>
                  </View>
                  <Text className="text-sm font-bold text-green-700 mr-2">
                    GHS {med.price}.00
                  </Text>
                  <MedCard med={med} />
                </View>
              ))
            ) : (
              <View className="p-5 items-center">
                <Text className="text-sm text-gray-400">
                  No results for &quot;{search}&quot;
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Category filter strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-5"
              contentContainerStyle={{
                paddingHorizontal: 16,
                gap: 8,
                flexDirection: "row",
              }}
            >
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                const colors = CATEGORY_COLORS[cat];
                return (
                  <TouchableOpacity
                    key={cat}
                    className="rounded-full px-4 py-2"
                    style={{
                      backgroundColor: isActive ? "#2A7A4F" : colors.bg,
                    }}
                    onPress={() => setActiveCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: isActive ? "#fff" : colors.text }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Filtered results (when not All) */}
            {activeCategory !== "All" && (
              <View className="mb-6">
                <View className="flex-row items-center justify-between px-4 mb-3">
                  <Text className="text-base font-bold text-gray-900">
                    {activeCategory}
                  </Text>
                  <TouchableOpacity
                    className="flex-row items-center gap-0.5"
                    onPress={() =>
                      setSeeAllConfig({
                        title: activeCategory,
                        meds: filteredByCategory,
                      })
                    }
                  >
                    <Text className="text-sm font-semibold text-green-700">
                      See All
                    </Text>
                    <ChevronRight size={14} color="#2A7A4F" />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  {filteredByCategory.map((med) => (
                    <MedCard key={med._id} med={med} />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Quick actions */}
            <View className="flex-row px-4 gap-2 mb-6">
              <QuickAction
                icon={<FileText size={24} color="#2A7A4F" />}
                label={"Upload\nRx"}
                bg="#EAF5EE"
                onPress={() => router.push("/(tabs)/camera")}
              />
              <QuickAction
                icon={<Keyboard size={24} color="#D97706" />}
                label={"Type\nMeds"}
                bg="#FEF3C7"
                onPress={() =>
                  Alert.alert("Type Meds", "Navigate to manual entry.")
                }
              />
              <QuickAction
                icon={<RefreshCw size={24} color="#2563EB" />}
                label="Reorder"
                bg="#EFF6FF"
                onPress={() => router.push("/(tabs)/orders")}
              />
              <QuickAction
                icon={<Users size={24} color="#7C5CBF" />}
                label="Family"
                bg="#F3EEFF"
                onPress={() => router.push("/(tabs)/meds")}
              />
            </View>

            {/* Promo Banner */}
            <View
              className="mx-4 rounded-2xl overflow-hidden mb-6"
              style={{ backgroundColor: "#1A5C38" }}
            >
              <View className="p-4 flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-xs font-semibold text-green-300 mb-1">
                    LIMITED OFFER
                  </Text>
                  <Text className="text-base font-bold text-white leading-5">
                    Get your first order{"\n"}delivered free! 🛵
                  </Text>
                  <TouchableOpacity
                    className="mt-3 bg-white rounded-full px-4 py-1.5 self-start"
                    activeOpacity={0.85}
                  >
                    <Text className="text-xs font-bold text-green-800">
                      Shop Now
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  className="w-20 h-20 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                >
                  <ShoppingCart size={36} color="#fff" />
                </View>
              </View>
            </View>

            {/* Popular */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between px-4 mb-3">
                <Text className="text-base font-bold text-gray-900">
                  Popular Medicines
                </Text>
                <TouchableOpacity
                  className="flex-row items-center gap-0.5"
                  onPress={() =>
                    setSeeAllConfig({
                      title: "Popular Medicines",
                      meds: popularMeds,
                    })
                  }
                >
                  <Text className="text-sm font-semibold text-green-700">
                    See All
                  </Text>
                  <ChevronRight size={14} color="#2A7A4F" />
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                {popularMeds.map((med) => (
                  <MedCard key={med._id} med={med} />
                ))}
              </ScrollView>
            </View>

            {/* Recently Viewed */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between px-4 mb-3">
                <View className="flex-row items-center gap-1.5">
                  <Clock size={15} color="#6b7280" />
                  <Text className="text-base font-bold text-gray-900">
                    Recently Viewed
                  </Text>
                </View>
                <TouchableOpacity
                  className="flex-row items-center gap-0.5"
                  onPress={() =>
                    setSeeAllConfig({
                      title: "Recently Viewed",
                      meds: recentMeds,
                    })
                  }
                >
                  <Text className="text-sm font-semibold text-green-700">
                    See All
                  </Text>
                  <ChevronRight size={14} color="#2A7A4F" />
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                {recentMeds.map((med) => (
                  <MedCard key={med._id} med={med} />
                ))}
              </ScrollView>
            </View>
          </>
        )}
      </ScrollView>

      {/* Cart sheet */}
      <CartSheet visible={showCart} onClose={() => setShowCart(false)} />

      {/* See All sheet */}
      {seeAllConfig && (
        <SeeAllModal
          visible
          title={seeAllConfig.title}
          medicines={seeAllConfig.meds}
          onClose={() => setSeeAllConfig(null)}
        />
      )}
    </SafeAreaView>
  );
}
