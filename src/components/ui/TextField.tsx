import { Text, TextInput, View } from "react-native";

import { COLORS } from "@/constants";

interface TextFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  maxLength,
}: TextFieldProps) {
  return (
    <View className="mb-4">
      {label ? (
        <Text className="mb-1.5 text-[13px] font-semibold text-ink-soft">
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.inkFaint}
        multiline={multiline}
        maxLength={maxLength}
        className={`rounded-xl border border-line bg-card px-3.5 py-3 text-[15px] text-ink ${
          multiline ? "h-24" : ""
        }`}
        style={multiline ? { textAlignVertical: "top" } : undefined}
      />
    </View>
  );
}
