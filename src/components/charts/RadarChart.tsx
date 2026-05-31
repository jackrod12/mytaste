import { View } from "react-native";
import Svg, {
  Circle,
  Line,
  Polygon,
  Text as SvgText,
} from "react-native-svg";

import type { RadarAxis } from "@/lib/palette";

interface RadarChartProps {
  axes: RadarAxis[];
  size?: number;
  /** 데이터 폴리곤 색상 */
  color?: string;
}

const RINGS = 4;

/**
 * 테이스팅 팔레트 레이더 차트.
 * 항목 수에 따라 자동으로 다각형 결정 (5항목=오각형, 6항목=육각형 등).
 * 각 axis.value 는 0~1.
 */
export function RadarChart({
  axes,
  size = 260,
  color = "#7B2D3A",
}: RadarChartProps) {
  const n = axes.length;
  if (n < 3) return <View style={{ height: size }} />;

  const labelPad = 30;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - labelPad;

  // i번째 축의 각도 (12시 방향부터 시계방향)
  const angleFor = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pointAt = (i: number, r: number) => {
    const a = angleFor(i);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  // 그리드 링 (정다각형) 좌표 문자열
  const ringPoints = (ratio: number) =>
    axes
      .map((_, i) => {
        const p = pointAt(i, radius * ratio);
        return `${p.x},${p.y}`;
      })
      .join(" ");

  // 데이터 폴리곤
  const dataPoints = axes
    .map((axis, i) => {
      const v = Math.max(0, Math.min(1, axis.value));
      const p = pointAt(i, radius * v);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        {/* 그리드 링 */}
        {Array.from({ length: RINGS }, (_, r) => (
          <Polygon
            key={`ring-${r}`}
            points={ringPoints((r + 1) / RINGS)}
            fill="none"
            stroke="#E5E2DB"
            strokeWidth={1}
          />
        ))}

        {/* 축 라인 */}
        {axes.map((_, i) => {
          const p = pointAt(i, radius);
          return (
            <Line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="#E5E2DB"
              strokeWidth={1}
            />
          );
        })}

        {/* 데이터 폴리곤 */}
        <Polygon
          points={dataPoints}
          fill={`${color}33`}
          stroke={color}
          strokeWidth={2}
        />

        {/* 꼭짓점 점 */}
        {axes.map((axis, i) => {
          const v = Math.max(0, Math.min(1, axis.value));
          const p = pointAt(i, radius * v);
          return (
            <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r={3} fill={color} />
          );
        })}

        {/* 라벨 */}
        {axes.map((axis, i) => {
          const p = pointAt(i, radius + 14);
          const anchor =
            Math.abs(p.x - cx) < 4 ? "middle" : p.x > cx ? "start" : "end";
          return (
            <SvgText
              key={`label-${i}`}
              x={p.x}
              y={p.y + 4}
              fontSize={11}
              fill="#6B6862"
              textAnchor={anchor as "start" | "middle" | "end"}
            >
              {axis.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
