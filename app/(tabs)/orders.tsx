import { useAuth } from "@/context/auth-context"; // adjust path as needed
import { orderAPI } from "@/services/api"; // adjust path as needed
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    MapPin,
    Package,
    RotateCcw,
    Search,
    Trash2,
    Truck,
    X,
    XCircle,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "In Progress" | "Delivered" | "Cancelled" | "Pending";

type OrderItem = {
  name: string;
  qty: number;
  price: number;
};

type Order = {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
  totalAmount: number;
  deliveryAddress: string;
  estimatedDelivery?: string;
};

type TabFilter = "All" | "Active" | "Completed" | "Cancelled";

const TABS: TabFilter[] = ["All", "Active", "Completed", "Cancelled"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusConfig(status: OrderStatus) {
  switch (status) {
    case "In Progress":
      return { color: "#D97706", bg: "#FEF3C7", icon: Truck };
    case "Pending":
      return { color: "#2563EB", bg: "#EFF6FF", icon: Clock };
    case "Delivered":
      return { color: "#2A7A4F", bg: "#ECFDF5", icon: CheckCircle2 };
    case "Cancelled":
      return { color: "#EF4444", bg: "#FEF2F2", icon: XCircle };
  }
}

function tabMatchesStatus(tab: TabFilter, status: OrderStatus): boolean {
  if (tab === "All") return true;
  if (tab === "Active") return status === "In Progress" || status === "Pending";
  if (tab === "Completed") return status === "Delivered";
  if (tab === "Cancelled") return status === "Cancelled";
  return false;
}

// ─── Track Order Modal ────────────────────────────────────────────────────────

function TrackModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const steps = [
    { label: "Order Placed", done: true, time: order.createdAt },
    { label: "Pharmacy Confirmed", done: true, time: "Processing" },
    {
      label: "Out for Delivery",
      done: order.status === "In Progress",
      time: "En route",
    },
    {
      label: "Delivered",
      done: order.status === "Delivered",
      time: order.estimatedDelivery ?? "—",
    },
  ];

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Track Order #{order.orderNumber}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Address */}
          <View style={styles.trackAddressRow}>
            <MapPin size={14} color="#2A7A4F" />
            <Text style={styles.trackAddressText}>{order.deliveryAddress}</Text>
          </View>

          {/* Steps */}
          <View style={styles.stepsContainer}>
            {steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View
                    style={[styles.stepDot, step.done && styles.stepDotDone]}
                  />
                  {i < steps.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        step.done && styles.stepLineDone,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text
                    style={[
                      styles.stepLabel,
                      step.done && styles.stepLabelDone,
                    ]}
                  >
                    {step.label}
                  </Text>
                  <Text style={styles.stepTime}>{step.time}</Text>
                </View>
              </View>
            ))}
          </View>

          {order.estimatedDelivery && (
            <View style={styles.etaCard}>
              <Clock size={14} color="#2A7A4F" />
              <Text style={styles.etaText}>
                Estimated delivery:{" "}
                <Text style={{ fontWeight: "700", color: "#2A7A4F" }}>
                  {order.estimatedDelivery}
                </Text>
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function DetailModal({
  order,
  onClose,
  onReorder,
}: {
  order: Order;
  onClose: () => void;
  onReorder: () => void;
}) {
  const cfg = statusConfig(order.status);
  const StatusIcon = cfg.icon;

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order #{order.orderNumber}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={[styles.statusPillLarge, { backgroundColor: cfg.bg }]}>
            <StatusIcon size={14} color={cfg.color} />
            <Text style={[styles.statusPillText, { color: cfg.color }]}>
              {order.status}
            </Text>
          </View>

          <Text style={styles.detailSectionLabel}>Items</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.detailItemRow}>
              <Package size={14} color="#9ca3af" />
              <Text style={styles.detailItemName}>
                {item.name} ×{item.qty}
              </Text>
              <Text style={styles.detailItemPrice}>
                GHS {item.price * item.qty}.00
              </Text>
            </View>
          ))}

          <View style={styles.detailDivider} />
          <View style={styles.detailTotalRow}>
            <Text style={styles.detailTotalLabel}>Total</Text>
            <Text style={styles.detailTotalValue}>
              GHS {order.totalAmount}.00
            </Text>
          </View>

          <Text style={styles.detailSectionLabel}>Delivery Address</Text>
          <View style={styles.trackAddressRow}>
            <MapPin size={14} color="#2A7A4F" />
            <Text style={styles.trackAddressText}>{order.deliveryAddress}</Text>
          </View>

          {(order.status === "Delivered" || order.status === "Cancelled") && (
            <TouchableOpacity style={styles.reorderBtnFull} onPress={onReorder}>
              <RotateCcw size={16} color="#2A7A4F" />
              <Text style={styles.reorderBtnFullText}>Reorder</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onTrack,
  onReorder,
  onViewDetail,
  onCancel,
}: {
  order: Order;
  onTrack: () => void;
  onReorder: () => void;
  onViewDetail: () => void;
  onCancel: (id: string) => void;
}) {
  const cfg = statusConfig(order.status);
  const StatusIcon = cfg.icon;
  const isActive = order.status === "In Progress" || order.status === "Pending";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onViewDetail}
      activeOpacity={0.92}
    >
      {/* Card header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardRef}>Order #{order.orderNumber}</Text>
        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
          <StatusIcon size={11} color={cfg.color} />
          <Text style={[styles.statusPillText, { color: cfg.color }]}>
            {order.status}
          </Text>
        </View>
      </View>

      {/* Items & date */}
      <View style={styles.cardMeta}>
        <Text style={styles.cardItems}>
          {order.items.length} item{order.items.length > 1 ? "s" : ""}
        </Text>
        <Text style={styles.cardDate}>
          {new Date(order.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Total */}
      <Text style={styles.cardTotal}>GHS {order.totalAmount}.00</Text>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Action button */}
      {isActive ? (
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={onTrack}
            activeOpacity={0.85}
          >
            <Truck size={15} color="#fff" />
            <Text style={styles.trackBtnText}>Track Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => onCancel(order._id)}
            activeOpacity={0.85}
          >
            <X size={15} color="#ef4444" />
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.reorderBtn}
          onPress={onReorder}
          activeOpacity={0.85}
        >
          <RotateCcw size={15} color="#2A7A4F" />
          <Text style={styles.reorderBtnText}>Reorder</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  // ─── Fetch orders ──────────────────────────────────────────────────────────
  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      console.log("Fetching orders for user:", user?._id);
      const response = await orderAPI.getUserOrders();
      console.log("Orders response:", response);

      // Handle different response structures
      if (response && response.success && Array.isArray(response.data)) {
        setOrders(response.data);
      } else if (response && Array.isArray(response)) {
        // Some APIs return the array directly
        setOrders(response);
      } else if (response && response.requiresAuth) {
        console.log("[Orders] Authentication required");
        setOrders([]); // Set empty array when auth required
      } else {
        console.warn("Unexpected orders response structure:", response);
        setOrders([]); // Set empty array on unexpected response
      }
    } catch (error: any) {
      console.error("Error fetching orders:", error);

      // Handle authentication errors specifically
      if (
        error.message?.includes("Access denied") ||
        error.message?.includes("token")
      ) {
        console.log("[Orders] Authentication required, showing login prompt");
        // Don't show alert here, let the auth context handle it
      } else {
        Alert.alert("Error", "Failed to load orders. Please try again.");
      }

      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchOrders(); // Initial fetch

      // Set up periodic refresh every 3 seconds
      const interval = setInterval(() => {
        if (user?._id) {
          fetchOrders();
        }
      }, 3000);

      return () => {
        clearInterval(interval);
      };
    } else {
      setOrders([]);
    }
  }, [user?._id]);

  // ─── Filtered orders ───────────────────────────────────────────────────────

  const filtered = orders.filter((order) => {
    const matchesTab = tabMatchesStatus(activeTab, order.status);
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return matchesTab && matchesSearch;
  });

  // ─── Reorder handler ───────────────────────────────────────────────────────

  const handleReorder = async (order: Order) => {
    Alert.alert("Reorder", `Place the same order as #${order.orderNumber}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "default",
        onPress: async () => {
          try {
            console.log("Reordering items from order:", order._id);

            // Create new order with same items
            const reorderData = {
              items: order.items.map((item) => ({
                name: item.name,
                quantity: item.qty,
                price: item.price,
              })),
              totalAmount: order.totalAmount,
              deliveryAddress: order.deliveryAddress || "Default Address", // Fallback address
            };

            console.log("Reorder data:", reorderData);
            const response = await orderAPI.create(reorderData);
            console.log("Reorder response:", response);

            // Refresh orders list
            await fetchOrders();

            Alert.alert(
              "Order Placed!",
              `Your reorder has been submitted successfully. Order #${response.data?._id || response._id || "Created"}`,
              [
                { text: "OK" },
                { text: "View Orders", onPress: () => setDetailOrder(null) },
              ],
            );

            setDetailOrder(null);
          } catch (error: any) {
            console.error("Reorder error:", error);
            Alert.alert(
              "Reorder Failed",
              `Failed to place reorder: ${error?.message || "Please try again."}`,
              [{ text: "OK" }],
            );
          }
        },
      },
    ]);
  };

  // ─── Clear order history handler ─────────────────────────────────────────────

  const handleClearOrderHistory = async () => {
    Alert.alert(
      "Clear Order History",
      "Are you sure you want to clear your entire order history? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear History",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Clearing order history for user:", user?._id);
              const response = await orderAPI.clearOrderHistory();
              console.log("Clear history response:", response);

              // Refresh orders list
              await fetchOrders();

              Alert.alert(
                "History Cleared",
                `Successfully cleared ${response.data?.deletedCount || 0} orders from your history.`,
                [{ text: "OK" }],
              );
            } catch (error: any) {
              console.error("Clear history error:", error);
              Alert.alert(
                "Clear Failed",
                "Failed to clear order history. Please try again.",
                [{ text: "OK" }],
              );
            }
          },
        },
      ],
    );
  };

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order? This action cannot be undone.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Cancelling order:", orderId);
              const response = await orderAPI.cancelOrder(orderId);
              console.log("Cancel response:", response);

              // Refresh orders list
              await fetchOrders();

              Alert.alert(
                "Order Cancelled",
                "Your order has been successfully cancelled.",
                [{ text: "OK" }],
              );
            } catch (error: any) {
              console.error("Cancel order error:", error);
              Alert.alert(
                "Cancellation Failed",
                "Failed to cancel order. Please try again.",
                [{ text: "OK" }],
              );
            }
          },
        },
      ],
    );
  };

  // ─── Not logged in ─────────────────────────────────────────────────────────

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={22} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Package size={48} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Login Required</Text>
          <Text style={styles.emptyText}>Please login to view your orders</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/(auth)/Login")}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={22} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2A7A4F" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main render ───────────────────────────────────────────────────────────

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
        {showSearch ? (
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders…"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        ) : (
          <Text style={styles.headerTitle}>Order History</Text>
        )}
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={handleClearOrderHistory}
          activeOpacity={0.85}
        >
          <Trash2 size={18} color="#ef4444" />
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => {
            setShowSearch((v) => !v);
            setSearchQuery("");
          }}
        >
          {showSearch ? (
            <X size={22} color="#1a1a1a" />
          ) : (
            <Search size={22} color="#1a1a1a" />
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={52} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? "Try a different search"
                : `No ${activeTab.toLowerCase()} orders yet`}
            </Text>
          </View>
        ) : (
          filtered.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onTrack={() => setTrackingOrder(order)}
              onReorder={() => handleReorder(order)}
              onViewDetail={() => setDetailOrder(order)}
              onCancel={handleCancelOrder}
            />
          ))
        )}
      </ScrollView>

      {/* Modals */}
      {trackingOrder && (
        <TrackModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
        />
      )}
      {detailOrder && (
        <DetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onReorder={() => handleReorder(detailOrder)}
        />
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
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a1a" },
  searchBtn: { padding: 4 },
  searchInput: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 14,
    color: "#1a1a1a",
    borderBottomWidth: 1.5,
    borderBottomColor: "#2A7A4F",
    paddingBottom: 2,
  },

  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
  },
  tabActive: { backgroundColor: "#2A7A4F" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  tabTextActive: { color: "#fff" },

  scroll: { flex: 1, paddingHorizontal: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardRef: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  statusPillText: { fontSize: 12, fontWeight: "700" },
  cardMeta: { flexDirection: "row", gap: 8, marginBottom: 6 },
  cardItems: { fontSize: 13, color: "#6b7280" },
  cardDate: { fontSize: 13, color: "#6b7280" },
  cardTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2A7A4F",
    marginBottom: 12,
  },
  cardDivider: { height: 1, backgroundColor: "#f3f4f6", marginBottom: 12 },

  trackBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  reorderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#2A7A4F",
    borderRadius: 10,
    paddingVertical: 12,
  },
  reorderBtnText: { fontSize: 14, fontWeight: "700", color: "#2A7A4F" },
  reorderBtnFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#2A7A4F",
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 10,
  },
  reorderBtnFullText: { fontSize: 14, fontWeight: "700", color: "#2A7A4F" },

  closeBtn: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeBtnText: { fontSize: 14, fontWeight: "600", color: "#374151" },

  emptyState: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptySub: { fontSize: 13, color: "#9ca3af" },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: "#2A7A4F",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  loginButtonText: { color: "#fff", fontSize: 14, fontWeight: "500" },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { fontSize: 14, color: "#6b7280", marginTop: 12 },

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
    maxHeight: "85%",
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
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  trackAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
    backgroundColor: "#f0faf4",
    borderRadius: 10,
    padding: 10,
  },
  trackAddressText: { flex: 1, fontSize: 13, color: "#374151" },

  stepsContainer: { marginBottom: 16 },
  stepRow: { flexDirection: "row", gap: 12 },
  stepLeft: { alignItems: "center", width: 20 },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  stepDotDone: { backgroundColor: "#2A7A4F", borderColor: "#2A7A4F" },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#e5e7eb",
    minHeight: 28,
    marginVertical: 2,
  },
  stepLineDone: { backgroundColor: "#2A7A4F" },
  stepContent: { flex: 1, paddingBottom: 20 },
  stepLabel: { fontSize: 14, fontWeight: "500", color: "#9ca3af" },
  stepLabelDone: { color: "#1a1a1a", fontWeight: "600" },
  stepTime: { fontSize: 12, color: "#9ca3af", marginTop: 2 },

  etaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EAF5EE",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  etaText: { fontSize: 13, color: "#374151" },

  detailSectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  detailItemName: { flex: 1, fontSize: 14, color: "#1a1a1a" },
  detailItemPrice: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  detailDivider: { height: 1, backgroundColor: "#f3f4f6", marginVertical: 12 },
  detailTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailTotalLabel: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  detailTotalValue: { fontSize: 15, fontWeight: "700", color: "#2A7A4F" },

  // Cancel button styles
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  trackBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2A7A4F",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ef4444",
  },

  // Clear button styles
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ef4444",
  },
});
