import pill from "@/assets/images/pill.png";
import { Link } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Image,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface WelcomeScreenProps {
  onGetStarted?: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  return (
    <View className="flex-1 bg-[#1e6e4a] items-center justify-center px-8">
      <StatusBar barStyle="light-content" backgroundColor="#1e6e4a" />

      {/* Center content */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          alignItems: "center",
        }}
      >
        {/* App Icon */}
        <Image
          source={pill}
          className="w-28 h-28 mb-8 bg-white p-4 rounded-2xl shadow-lg"
          resizeMode="contain"
        />

        {/* App Name */}
        <Text className="text-white text-4xl font-bold tracking-tight mb-3">
          RxRoute
        </Text>

        {/* Tagline */}
        <Text className="text-white/80 text-lg font-normal text-center">
          Your Medications. Delivered.
        </Text>
      </Animated.View>

      {/* Bottom section */}
      <View className="absolute bottom-20 w-full items-center px-8">
        <Link href="/(auth)/Login" asChild>
          <TouchableOpacity
            className="w-full bg-white rounded-2xl py-4 items-center shadow-lg"
            onPress={onGetStarted}
            activeOpacity={0.85}
          >
            <Text className="text-[#1e6e4a] text-lg font-bold tracking-wide">
              Get Started
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
};

export default WelcomeScreen;
