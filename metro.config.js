const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Windows에서 virtual module 패칭이 실패해 CSS가 주입되지 않는 문제 방지.
  // 파일시스템 캐시에 직접 기록하는 모드를 강제한다.
  forceWriteFileSystem: true,
});
