import { useRouter } from "expo-router";
import {
  Bot,
  ChevronRight,
  Mail,
  Phone,
  Send,
  User as UserIcon,
  X
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

// ─── Claude API ───────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are RxRoute AI Assistant — a helpful, friendly support bot for RxRoute, a medication delivery app in Ghana.

You help users with:
- Tracking and managing orders
- Prescription upload requirements
- Medication information and advice
- Payment methods (mobile money, cards, cash on delivery)
- Delivery times (2-3 days Accra, 3-5 days other regions)
- Account issues (password reset, profile updates)
- Returns and refunds (contact within 24hrs for wrong/damaged items)
- App navigation help

Key facts:
- Free delivery on orders over GHS 100, otherwise GHS 10 delivery fee
- Prescription medications require a valid doctor's prescription uploaded in app
- Pharmacists review prescriptions within 24 hours
- Emergency number in Ghana: 193
- Support email: support@rxroute.com
- Support phone: +233123456789 (Mon-Fri, 9AM-6PM)

Keep responses concise, warm, and helpful. If you can't help with something, direct them to human support.`;

const getClaudeResponse = async (
  userMessage: string,
  history: Message[],
): Promise<string> => {
  // For now, use fallback responses instead of Claude API
  // In production, you would add your Claude API key here
  return getFallbackResponse(userMessage);
};

// ─── Fallback if API is unavailable ──────────────────────────────────────────

const getFallbackResponse = (userMessage: string): string => {
  const msg = userMessage.toLowerCase();

  if (
    msg.includes("track") ||
    (msg.includes("order") && msg.includes("status"))
  ) {
    return "To track your order, go to Orders tab. You'll see real-time status updates there.";
  }

  if (msg.includes("prescription")) {
    return "Upload your prescription via the camera icon in the app. Our pharmacists review it within 24 hours.";
  }

  if (msg.includes("payment") || msg.includes("pay")) {
    return "We accept mobile money, credit/debit cards, and cash on delivery. All transactions are secure.";
  }

  if (msg.includes("delivery") || msg.includes("deliver")) {
    return "Standard delivery: 2-3 days in Accra, 3-5 days for other regions. Free delivery on orders over GHS 100.";
  }

  if (msg.includes("return") || msg.includes("refund")) {
    return "Contact us within 24 hours of receiving wrong or damaged items and we'll arrange a replacement or refund.";
  }

  if (msg.includes("hello") || msg.includes("hi")) {
    return "Hello! How can I help you with RxRoute today?";
  }

  if (msg.includes("thank")) {
    return "You're welcome! Is there anything else I can help you with?";
  }

  return "For specific help, contact us at support@rxroute.com or call +233123456789 (Mon-Fri, 9AM-6PM).";
};

// ─── Quick responses ──────────────────────────────────────────────────────────

const QUICK_RESPONSES = [
  "Track my order",
  "Prescription requirements",
  "Payment methods",
  "Delivery times",
  "Return policy",
  "Account issues",
];

// ─── Contact options ──────────────────────────────────────────────────────────

const CONTACT_OPTIONS = [
  {
    id: "1",
    title: "Email Support",
    description: "We reply within 24 hours",
    icon: "mail",
    action: async () => {
      try {
        await Linking.openURL("mailto:support@rxroute.com");
      } catch {
        Alert.alert("Email Support", "Please email us at: support@rxroute.com");
      }
    },
  },
  {
    id: "2",
    title: "Phone Support",
    description: "Mon–Fri, 9AM–6PM",
    icon: "phone",
    action: async () => {
      try {
        await Linking.openURL("tel:+233123456789");
      } catch {
        Alert.alert("Phone Support", "Call us at: +233123456789");
      }
    },
  },
];

// ─── Main Screen ──────────────────────────────────────────────────────

export default function HelpScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm RxRoute AI Assistant powered by Claude. How can I help you today? Ask me anything about orders, medications, payments, or delivery.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  // ─── Core send logic — takes message text directly ───────────────────

  const sendMessageText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmed,
      sender: "user",
      timestamp: new Date(),
    };

    // Capture current messages + new user message for context
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsTyping(true);

    try {
      // Pass history (excluding new message) so Claude has context
      const response = await getClaudeResponse(trimmed, messages);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble responding right now. Please try again or contact support@rxroute.com.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Send button / keyboard submit
  const handleSend = () => sendMessageText(inputText);

  // Quick response chips — pass text directly, no state race condition
  const handleQuickResponse = (response: string) => {
    setInputText(response);
    sendMessageText(response);
  };

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View className="bg-white border-b border-gray-100 px-4 py-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-8 h-8 items-center justify-center"
              >
                <X size={22} color="#374151" />
              </TouchableOpacity>
              <View className="flex-row items-center gap-2">
                <View className="w-9 h-9 bg-green-100 rounded-full items-center justify-center">
                  <Bot size={20} color="#2A7A4F" />
                </View>
                <View>
                  <Text className="text-base font-bold text-gray-900">
                    RxRoute Assistant
                  </Text>
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-2 h-2 bg-green-500 rounded-full" />
                    <Text className="text-xs text-gray-500">
                      Powered by Claude AI
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View className="w-3 h-3 bg-green-500 rounded-full" />
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Quick Responses */}
          {!isTyping && (
            <View className="mb-5">
              <Text className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">
                Quick Questions
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {QUICK_RESPONSES.map((response, index) => (
                  <TouchableOpacity
                    key={index}
                    className="bg-white border border-gray-200 rounded-full px-3 py-2"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                    onPress={() => handleQuickResponse(response)}
                  >
                    <Text className="text-xs text-gray-700 font-medium">
                      {response}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Render all messages */}
          {messages.map((message) => (
            <View
              key={message.id}
              className={`mb-4 max-w-[82%] ${
                message.sender === "user" ? "self-end" : "self-start"
              }`}
            >
              <View
                className={`flex-row items-end gap-2 ${
                  message.sender === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <View
                  className={`w-7 h-7 rounded-full items-center justify-center flex-shrink-0 mb-1 ${
                    message.sender === "user" ? "bg-green-500" : "bg-gray-200"
                  }`}
                >
                  {message.sender === "user" ? (
                    <UserIcon size={14} color="white" />
                  ) : (
                    <Bot size={14} color="#2A7A4F" />
                  )}
                </View>

                {/* Bubble */}
                <View
                  className={`rounded-2xl px-4 py-3 ${
                    message.sender === "user"
                      ? "bg-green-500 rounded-br-sm"
                      : "bg-white rounded-bl-sm shadow-sm"
                  }`}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: message.sender === "bot" ? 0.06 : 0,
                    shadowRadius: 3,
                    elevation: message.sender === "bot" ? 1 : 0,
                  }}
                >
                  <Text
                    className={`text-sm leading-5 ${
                      message.sender === "user" ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {message.text}
                  </Text>
                </View>
              </View>

              {/* Timestamp */}
              <Text
                className={`text-xs text-gray-400 mt-1 ${
                  message.sender === "user" ? "text-right mr-9" : "ml-9"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <View className="self-start mb-4">
              <View className="flex-row items-end gap-2">
                <View className="w-7 h-7 rounded-full bg-gray-200 items-center justify-center">
                  <Bot size={14} color="#2A7A4F" />
                </View>
                <View className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <View className="flex-row gap-1.5 items-center">
                    <ActivityIndicator size="small" color="#2A7A4F" />
                    <Text className="text-xs text-gray-400 ml-1">
                      Thinking...
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Contact Options - Moved above input */}
        <View className="px-4 pb-2">
          <Text className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wide">
            Still need help?
          </Text>
          {CONTACT_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="bg-white rounded-2xl p-4 mb-2 flex-row items-center gap-3"
              onPress={item.action}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center">
                {item.icon === "mail" ? (
                  <Mail size={18} color="#2A7A4F" />
                ) : (
                  <Phone size={18} color="#2A7A4F" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900">
                  {item.title}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {item.description}
                </Text>
              </View>
              <ChevronRight size={16} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Input */}
        <View
          className="bg-white border-t border-gray-100 px-4 py-3"
          style={{ paddingBottom: Platform.OS === "ios" ? 8 : 12 }}
        >
          <View className="flex-row items-end gap-2">
            <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 min-h-[44px] max-h-24 justify-center">
              <TextInput
                className="text-gray-800 text-sm"
                placeholder="Ask me anything..."
                placeholderTextColor="#9ca3af"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
            </View>
            <TouchableOpacity
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{
                backgroundColor:
                  inputText.trim() && !isTyping ? "#2A7A4F" : "#d1d5db",
              }}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
            >
              <Send size={18} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-center text-xs text-gray-400 mt-2">
            AI responses may not always be accurate. For urgent issues, call us.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
