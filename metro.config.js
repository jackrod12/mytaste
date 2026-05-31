const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);
const inputPath = path.resolve(__dirname, "global.css");

// CI(Vercel) 환경에서 child_process.fork() + IPC가 hang되는 문제:
//   withNativeWind는 Tailwind CLI를 fork()한 자식 프로세스에서 실행 후
//   process.send() IPC로 CSS를 받는데, Vercel에서 이 IPC가 resolve되지 않아
//   Metro의 getTransformOptions가 영원히 대기한다.
//
// 해결: CI에서는 withCssInterop을 직접 사용하고 getCSSForPlatform을
//       execSync(동기)로 교체 — fork/IPC 없이 즉시 CSS를 반환한다.
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

  function buildCSS(platform) {
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

  module.exports = withCssInterop(config, {
    ...cssToReactNativeRuntimeOptions,
    input: inputPath,
    inlineRem: 14,
    forceWriteFileSystem: true,
    parent: { name: "nativewind", debug: "nativewind" },
    getCSSForPlatform: (platform) => buildCSS(platform),
  });
} else {
  // 로컬 개발(Windows): virtual module 패칭이 실패하는 문제 방지.
  // forceWriteFileSystem: true → 파일시스템 캐시 경유, IPC 불필요.
  module.exports = withNativeWind(config, {
    input: inputPath,
    forceWriteFileSystem: true,
  });
}
