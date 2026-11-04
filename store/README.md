# Kung Fu Fisher 上架素材

## 素材

- `../assets/branding/icon.png`：1024 × 1024、不透明 PNG，iOS / Android 通用应用图标；已接入 app.json。系统负责裁圆角。
- `google-play/icon-512.png`：Google Play 512 × 512 图标，小于 1 MB。
- `google-play/feature-graphic.png`：1024 × 500、不透明横版宣传插画。它不是游戏截图。
- `screenshots/ios/`：iPhone 17 Pro Max 模拟器、Release 构建的真实界面截图；没有 Expo Go 开发浮层。未经宣传合成。
- 生成提示词见 `../assets/branding/PROMPTS.md`，使用内置 imagegen 生成。

## 打包

当前应用标识为 `com.mablic.kungfufisher`，应用名 Kung Fu Fisher，版本 0.2.0。旧 App Store Connect 记录的 Bundle ID 无法修改，提交时必须选择或创建与新标识匹配的应用记录。
现有 EAS projectId 和 slug 保持关联不变；它们不决定用户看到的应用名称。
现有截图和 ZIP 素材包采集于改名前，包含旧标题，不能作为本次改名后的最终商店截图；需在新构建中重拍。
`eas.json` 提供 preview 内部分发及 production 商店构建；app.json 已关联 EAS 项目。在本机登录有该项目权限的 Expo 账号后，从 FishGame 目录运行：

```sh
npm run build:ios
npm run build:android
```

Android production 输出 AAB；preview 输出 APK。iOS 需要 Apple 开发者团队及签名。此处未上传、未提交审核，也未创建任何账号。
本次本地 iOS prebuild 已同步图标配置；以后修改 app.json 后需要重新 prebuild / 编译，Metro 热更新不会更新桌面图标。

### 上传包过大的修复

当前 Git 根目录位于 FishGame 之上的 Documents/Git，包含多个无关项目。上面的 npm 命令通过 `scripts/eas.mjs` 固定 `EAS_NO_VCS=1` 与绝对路径 `EAS_PROJECT_ROOT`，只上传当前应用；不会修改 Git 仓库。不要直接运行未设置这两个变量的 `eas build`，否则可能再次从父仓库打包。

`.easignore` 保留源码、运行时图片/音频、应用图标及依赖锁文件，排除 node_modules、生成的 ios/android、work、QA 截图和商店宣传素材。云端会安装依赖并运行 Expo Prebuild。若以后有原生手工修改，应先迁移到 config plugin，或重新审视 ios/android 排除规则。

可先做本地归档预检（不上传、不触发收费云构建），输出目录必须放在项目之外：

```sh
npm run build:inspect:ios -- --output /tmp/fishgame-eas-inspect
```

参考：[Expo 归档根目录与 EAS_PROJECT_ROOT](https://github.com/expo/fyi/blob/main/eas-build-archive.md)、[.easignore](https://docs.expo.dev/build-reference/easignore/)。

## 提交前仍需完成

- Apple Developer / Google Play Console 账号、证书签名、商店应用记录与支持联系方式。
- 隐私政策 URL、年龄分级及平台隐私 / 数据安全问卷，根据最终 SDK 实际行为填写。
- 正式广告 SDK 尚未接入；当前开发测试广告不能作为可上线的激励广告。接入后再验证完成回调、取消、失败及 +15 秒奖励。
- Android 真机与 iOS 真机的启动、触控、音频、前后台切换和低端机性能验证。iOS 模拟器截图不能证明 Android 已通过测试；Google Play 截图应补采 Android 实际运行画面。
- 确认图片、字体、音乐的发布使用权。AI 宣传图与实际游戏画面分开使用，避免让插画冒充实机截图。

## 商店文案草案

名称：Kung Fu Fisher

简述：Aim your blade, catch river fish, and master seven wuxia manuals.

说明：Journey through 30 fishing challenges across five river regions. Hold to aim, drag to adjust, and release your blade. Learn the movements of 14 fish species, collect martial arts manuals with three special casts each, and face changing currents, mist and waves. Chase stars at your own pace and revisit each river to improve your score.

## 官方尺寸参考

- [Apple 截图规格](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)：本次使用 6.9 英寸档 1320 × 2868。
- [Google Play 素材规格](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en)：图标 512 × 512；宣传图 1024 × 500。

核对日期：2026-10-21。最终以提交时控制台要求为准。
