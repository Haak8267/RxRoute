import { router } from "expo-router";
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

const COUNTRIES = [
  { flag: "🇬🇭", code: "+233", name: "Ghana" },
  { flag: "🇺🇸", code: "+1", name: "United States" },
  { flag: "🇬🇧", code: "+44", name: "United Kingdom" },
  { flag: "🇳🇬", code: "+234", name: "Nigeria" },
];

export default function SignUpScreen() {
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  const handleSignup = async () => {
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter a password");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (!dateOfBirth.trim()) {
      Alert.alert("Error", "Please enter your date of birth");
      return;
    }

    setLoading(true);
    try {
      const userData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: `${selectedCountry.code}${phoneNumber.trim()}`,
        password,
        dateOfBirth,
        address: address.trim() || "Default Address",
        emergencyContact: {
          name: "",
          phone: "",
          relationship: "",
        },
      };

      console.log(
        "[Signup] Sending user data:",
        JSON.stringify(userData, null, 2),
      );
      const result = await register(userData);
      console.log("[Signup] Register result:", result);
      if (result.success) {
        Alert.alert(
          "Registration Successful!",
          "Your account has been created successfully.",
          [
            {
              text: "Continue",
              onPress: () => router.replace("/(tabs)/home"),
            },
          ],
        );
      } else {
        Alert.alert(
          "Registration Failed",
          result.message || "Something went wrong",
        );
      }
    } catch (error: any) {
      console.error("[Signup] Registration error:", error);
      console.error("[Signup] Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response,
        status: error.status,
      });
      Alert.alert(
        "Registration Failed",
        error.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-lg">←</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">
              Create Account
            </Text>
            <View className="w-10" />
          </View>

          {/* Body */}
          <View className="flex-1 px-6 pt-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </Text>

            <Text className="text-sm text-gray-400 mb-10 leading-5">
              Join RxRoute to manage your medications.
            </Text>

            {/* Name Input */}
            <View className="bg-gray-50 rounded-2xl p-4 gap-3">
              <Text className="text-sm font-bold text-gray-900">Full Name</Text>
              <View className="flex-row gap-3">
                <TextInput
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 flex-1"
                  placeholder="First name"
                  placeholderTextColor="#9ca3af"
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <TextInput
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 flex-1"
                  placeholder="Last name"
                  placeholderTextColor="#9ca3af"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            {/* Email Input */}
            <View className="bg-gray-50 rounded-2xl p-4 gap-3">
              <Text className="text-sm font-bold text-gray-900">
                Email Address
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900"
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Phone Number */}
            <View className="mb-6 relative">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </Text>

              <View className="flex-row">
                {/* Country Picker */}
                <TouchableOpacity
                  onPress={() => setShowCountryPicker(!showCountryPicker)}
                  className="flex-row items-center px-4 py-4 rounded-2xl bg-gray-50 border border-gray-200 mr-3"
                  style={{ minWidth: 110 }}
                >
                  <Text className="text-lg mr-1">{selectedCountry.flag}</Text>
                  <Text className="text-gray-800 text-base font-medium ml-1">
                    {selectedCountry.code}
                  </Text>
                  <Text className="text-gray-400 ml-1 text-xs">▾</Text>
                </TouchableOpacity>

                {/* Phone Input */}
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  placeholder="XX XXX XXXX"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  className={`flex-1 px-4 py-4 rounded-2xl text-gray-900 text-base bg-gray-50 border ${
                    phoneFocused ? "border-green-500" : "border-gray-200"
                  }`}
                />
              </View>

              {/* Dropdown */}
              {showCountryPicker && (
                <View
                  className="absolute left-0 right-0 top-24 rounded-2xl bg-white border border-gray-200"
                  style={{
                    elevation: 10,
                    shadowColor: "#000",
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 6 },
                  }}
                >
                  {COUNTRIES.map((country, idx) => (
                    <TouchableOpacity
                      key={country.code}
                      onPress={() => {
                        setSelectedCountry(country);
                        setShowCountryPicker(false);
                      }}
                      className={`flex-row items-center px-4 py-3 ${
                        idx < COUNTRIES.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      } ${
                        selectedCountry.code === country.code
                          ? "bg-blue-50"
                          : "bg-white"
                      }`}
                    >
                      <Text className="text-lg mr-3">{country.flag}</Text>

                      <Text className="text-gray-800 text-sm font-medium flex-1">
                        {country.name}
                      </Text>

                      <Text className="text-gray-400 text-sm">
                        {country.code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Password Fields */}
            <View className="bg-gray-50 rounded-2xl p-4 gap-3">
              <Text className="text-sm font-bold text-gray-900">Password</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900"
                placeholder="Create password"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900"
                placeholder="Confirm password"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            {/* Date of Birth */}
            <View className="bg-gray-50 rounded-2xl p-4 gap-3">
              <Text className="text-sm font-bold text-gray-900">
                Date of Birth
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
              />
            </View>

            {/* Address */}
            <View className="bg-gray-50 rounded-2xl p-4 gap-3">
              <Text className="text-sm font-bold text-gray-900">
                Address (Optional)
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900"
                placeholder="Enter your address"
                placeholderTextColor="#9ca3af"
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>

            <View className="flex-1" />

            {/* CTA */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              className={`w-full py-4 rounded-2xl bg-green-600 items-center justify-center mb-6 ${
                loading ? "opacity-50" : ""
              }`}
              style={{
                elevation: 8,
                shadowColor: "#3b82f6",
                shadowOpacity: 0.35,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white text-base font-bold tracking-wide">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* Sign In */}
            <View className="flex-row justify-center mb-8">
              <Text className="text-gray-400 text-sm">
                Already have an account?{" "}
              </Text>

              <TouchableOpacity onPress={() => router.push("/(auth)/Login")}>
                <Text className="text-green-600 text-sm font-semibold">
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
