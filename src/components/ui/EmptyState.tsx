import { Text, View } from "react-native";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  desc?: string;
}

export function EmptyState({ emoji = "🫙", title, desc }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-16">
      <Text className="text-4xl">{emoji}</Text>
      <Text className="mt-3 text-[16px] font-semibold text-ink">{title}</Text>
      {desc ? (
        <Text className="mt-1 px-8 text-center text-[14px] text-ink-faint">
          {desc}
        </Text>
      ) : null}
    </View>
  );
}
