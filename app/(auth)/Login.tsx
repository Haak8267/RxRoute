import { Link } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/auth-context";
import { router } from "expo-router";

// ── Icons ─────────────────────────────────────────────

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <Text className="text-gray-400 text-base">{visible ? "👁" : "🙈"}</Text>
);

const PhoneIcon = () => <Text className="text-gray-400 text-sm">📱</Text>;

const LockIcon = () => <Text className="text-gray-400 text-sm">🔒</Text>;

// ── Main Screen ───────────────────────────────────────

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        Alert.alert("Welcome Back!", "You have successfully logged in.", [
          {
            text: "Continue",
            onPress: () => router.replace("/(tabs)/home"),
          },
        ]);
      } else {
        Alert.alert("Login Failed", result.message || "Invalid credentials");
      }
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar */}
          <View className="h-1.5 w-16 bg-green-700 rounded-full mx-auto mt-4" />

          {/* Header */}
          <View className="px-6 pt-10 pb-6">
            <View className="flex-row items-center mb-1">
              <View className="w-8 h-8 bg-green-700 rounded-lg items-center justify-center mr-2">
                <Text className="text-white text-sm font-bold">Rx</Text>
              </View>
              <Text className="text-green-700 text-base font-semibold tracking-wide">
                RxRoute
              </Text>
            </View>

            <Text className="text-2xl font-bold text-gray-900 mt-6">
              Welcome Back 👋
            </Text>
            <Text className="text-gray-500 mt-1 text-sm">
              Log in to your account
            </Text>
          </View>

          {/* Form */}
          <View className="px-6 flex-1">
            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2">
                Email Address
              </Text>

              <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50 px-3 h-14">
                <Text className="text-gray-400 text-sm">📧</Text>

                <TextInput
                  className="flex-1 ml-2 text-gray-800 text-sm"
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password */}
            <View className="mb-2">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Password
              </Text>

              <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50 px-3 h-14">
                <LockIcon />

                <TextInput
                  className="flex-1 ml-2 text-gray-800 text-sm"
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-1"
                >
                  <EyeIcon visible={showPassword} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity className="self-end mb-6">
              <Text className="text-green-700 text-sm font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={`bg-green-700 rounded-xl py-4 items-center ${
                loading ? "opacity-50" : ""
              }`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base tracking-wide">
                  Log In
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-5">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-3 text-gray-400 text-xs uppercase tracking-widest">
                or continue with
              </Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Google Button */}
            <TouchableOpacity className="flex-row items-center justify-center border border-gray-200 rounded-xl py-3.5 bg-white">
              <View className="w-6 h-6 rounded-full items-center justify-center mr-2 bg-red-500">
                <Text className="text-white text-xs font-bold">G</Text>
              </View>
              <Text className="text-gray-700 font-medium text-sm">
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Sign Up */}
            <View className="flex-row justify-center mt-6 mb-8">
              <Text className="text-gray-500 text-sm">
                Don&apos;t have an account?{" "}
              </Text>
              <Link href="/(auth)/Signup" asChild>
                <TouchableOpacity>
                  <Text className="text-green-700 font-semibold text-sm">
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
