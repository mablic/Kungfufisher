# River & Steel 上架素材

## 素材

- `../assets/branding/icon.png`：1024 × 1024、不透明 PNG，iOS / Android 通用应用图标；已接入 app.json。系统负责裁圆角。
- `google-play/icon-512.png`：Google Play 512 × 512 图标，小于 1 MB。
- `google-play/feature-graphic.png`：1024 × 500、不透明横版宣传插画。它不是游戏截图。
- `screenshots/ios/`：iPhone 17 Pro Max 模拟器、Release 构建的真实界面截图；没有 Expo Go 开发浮层。未经宣传合成。
- 生成提示词见 `../assets/branding/PROMPTS.md`，使用内置 imagegen 生成。

## 打包

项目保留应用标识 `com.mablic.kungfufisher`，版本 0.2.0，初始构建号 1；正式发布前确认该标识归属。
`eas.json` 提供 preview 内部分发及 production 商店构建。先在本机登录自己的 Expo 账号并执行 `npx eas-cli init` 关联项目，再运行：

```sh
npx eas-cli build --platform ios --profile production
npx eas-cli build --platform android --profile production
```

Android production 输出 AAB；preview 输出 APK。iOS 需要 Apple 开发者团队及签名。此处未上传、未提交审核，也未创建任何账号。
本次本地 iOS prebuild 已同步图标配置；以后修改 app.json 后需要重新 prebuild / 编译，Metro 热更新不会更新桌面图标。

## 提交前仍需完成

- Apple Developer / Google Play Console 账号、证书签名、商店应用记录与支持联系方式。
- 隐私政策 URL、年龄分级及平台隐私 / 数据安全问卷，根据最终 SDK 实际行为填写。
- 正式广告 SDK 尚未接入；当前开发测试广告不能作为可上线的激励广告。接入后再验证完成回调、取消、失败及 +15 秒奖励。
- Android 真机与 iOS 真机的启动、触控、音频、前后台切换和低端机性能验证。iOS 模拟器截图不能证明 Android 已通过测试；Google Play 截图应补采 Android 实际运行画面。
- 确认图片、字体、音乐的发布使用权。AI 宣传图与实际游戏画面分开使用，避免让插画冒充实机截图。

## 商店文案草案

名称：River & Steel

简述：Aim your blade, catch river fish, and master seven wuxia manuals.

说明：Journey through 30 fishing challenges across five river regions. Hold to aim, drag to adjust, and release your blade. Learn the movements of 14 fish species, collect martial arts manuals with three special casts each, and face changing currents, mist and waves. Chase stars at your own pace and revisit each river to improve your score.

## 官方尺寸参考

- [Apple 截图规格](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)：本次使用 6.9 英寸档 1320 × 2868。
- [Google Play 素材规格](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en)：图标 512 × 512；宣传图 1024 × 500。

核对日期：2026-10-21。最终以提交时控制台要求为准。
