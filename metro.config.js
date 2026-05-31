const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);
const inputPath = path.resolve(__dirname, "global.css");

// ─────────────────────────────────────────────────────────────────────────────
// CI / Vercel 빌드 경로
//
// 문제 흐름:
//   1. withCssInterop이 초기화 시 ios.js, android.js … 를 미리 생성하지만
//      web.css는 생성하지 않는다 (platformPath("web") = "web.css").
//   2. getCSSForPlatform()은 getTransformOptions() 안에서 비동기로 호출된다.
//   3. Metro는 config 로드 직후 Haste map(파일 스캔)을 빌드한다.
//      → Haste map 완성 시점에 web.css가 없음 → SHA-1 계산 불가 → 오류.
//
// 해결:
//   metro.config.js는 Metro 시작보다 먼저 동기적으로 실행된다.
//   여기서 web.css를 미리 생성하면 Haste map에 포함되어 SHA-1 문제가 사라진다.
//   getCSSForPlatform은 미리 생성된 파일을 읽어 반환하므로
//   withCssInterop이 동일 내용을 다시 쓰더라도 SHA-1이 변하지 않는다.
// ─────────────────────────────────────────────────────────────────────────────
if (process.env.CI || process.env.VERCEL) {
  const { withCssInterop } = require("react-native-css-interop/metro");
  const { cssToReactNativeRuntimeOptions } = require("nativewind/dist/metro/common");
  const fs = require("fs");
  const os = require("os");
  const { execSync } = require("child_process");

  const tailwindCli = path.join(
    __dirname,
    "node_modules",
    "tailwindcss",
    "lib",
    "cli.js"
  );

  // withCssInterop이 web.css를 기록하는 경로 (platformPath("web") 로직과 동일)
  const cacheDir = path.resolve(
    path.dirname(require.resolve("react-native-css-interop/package.json")),
    ".cache"
  );

  function generateCSS(platform) {
    const tmpOut = path.join(os.tmpdir(), `nativewind-${platform}.css`);
    execSync(`node "${tailwindCli}" -i "${inputPath}" -o "${tmpOut}"`, {
      cwd: __dirname,
      stdio: "pipe",
      env: { ...process.env, NATIVEWIND_OS: platform, NATIVEWIND_INPUT: inputPath },
    });
    const css = fs.readFileSync(tmpOut, "utf-8");
    try { fs.unlinkSync(tmpOut); } catch (_) {}
    return css;
  }

  // Metro Haste map 빌드 전에 web.css를 미리 생성
  fs.mkdirSync(cacheDir, { recursive: true });
  const prebuiltCSS = generateCSS("web");
  fs.writeFileSync(path.join(cacheDir, "web.css"), prebuiltCSS);

  // Metro가 cacheDir 안의 파일을 추적할 수 있도록 watchFolders에 추가
  config.watchFolders = [...(config.watchFolders ?? []), cacheDir];

  module.exports = withCssInterop(config, {
    ...cssToReactNativeRuntimeOptions,
    input: inputPath,
    inlineRem: 14,
    forceWriteFileSystem: true,
    parent: { name: "nativewind", debug: "nativewind" },
    getCSSForPlatform: (platform) => {
      if (platform === "web") {
        // 미리 생성한 파일을 반환 → withCssInterop이 동일 내용으로 덮어쓰므로 SHA-1 불변
        return fs.readFileSync(path.join(cacheDir, "web.css"), "utf-8");
      }
      return generateCSS(platform);
    },
  });
} else {
  // 로컬 개발(Windows): virtual module 패칭 실패 방지
  module.exports = withNativeWind(config, {
    input: inputPath,
    forceWriteFileSystem: true,
  });
}
