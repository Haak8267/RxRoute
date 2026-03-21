import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { Tabs } from "expo-router";
import {
  ClipboardList,
  House,
  MessageCircleQuestionMark,
  Plus,
  User,
} from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

function CenterAddButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.centerButtonWrapper}
      activeOpacity={0.85}
    >
      <View style={styles.centerButton}>
        <Plus size={28} color="white" strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          bottom: 35,
          height: 60,
          borderRadius: 40,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarBackground: () => (
          <View className="flex-1 mx-1 bg-white dark:bg-gray-900 rounded-[20px] shadow-2xl border border-gray-100 dark:border-gray-800" />
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <House size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="meds"
        options={{
          title: "",
          tabBarIcon: () => null,
          tabBarLabel: () => null,
          tabBarButton: (props) => (
            <CenterAddButton onPress={props.onPress as () => void} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
      ,
      <Tabs.Screen
        name="help"
        options={{
          title: "Help",
          tabBarIcon: ({ color }) => (
            <MessageCircleQuestionMark size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerButtonWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerButton: {
    width: 54,
    height: 54,
    borderRadius: 26,
    backgroundColor: "#1A6B47",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
