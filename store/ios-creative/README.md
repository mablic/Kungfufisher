# Kung Fu Fisher · iOS 素材

## 上传位置

- `app-preview-886x1920.mp4`：上传到 iPhone 6.1 / 6.3 英寸 App Preview 栏位。竖屏真实玩法录制，28 秒，886×1920，30fps，H.264 High Level 4.0；AAC 双声道 48kHz。约 38 MB。
- `header-5244x2950.png`：16:9 通用创意图片，上传到 Product Page Header。PNG RGB，无透明通道。
- `header-3840x1646.png`：21:9 专用 Header，同一插画的宽幅裁切。PNG RGB，无透明通道。两个 header 选一个上传即可，建议先试 21:9 并检查控制台裁切预览。
- `preview-poster-886x1920.png`：供选择预览封面帧时参考；不是合规尺寸的商店截图，也不是视频替代品。App Store Connect 中可从视频选择封面。

## 来源与处理

Header 使用内置 imagegen、参考项目角色美术生成；保存 master 后按目标像素尺寸裁切/放大导出。属于宣传插画，不是游戏截图。画面无标题、网址或平台标记。

视频来自本机 iPhone 17 Pro Max 模拟器上已安装的 Release 版本（改名前的本地 com.fishgame.tideline 安装包）。只录制游戏过程，不包含旧应用名或首页；玩法界面与当前项目一致。未伪造分数、未加速游戏、没有测试广告或 Expo 开发浮层。导出时轻微缩放/裁切到 Apple 接受的比例，叠加了项目内 river-loop.wav 环境音乐，未伪造同步击中音效。最终提交前请与本次 TestFlight 构建核对；若玩法改变应重新录制。

视频已抽查开头、中间及结尾帧，尺寸、时长、编码通过 ffprobe 检查。控制台的实际接收与审核尚未验证；本次没有上传。

## 官方参考

- [App Preview 视频规格](https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications/)
- [Header 创意素材规格](https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications)
- [素材最佳实践](https://developer.apple.com/app-store/asset-best-practices/)

## Header 生成提示词

Create a polished Apple App Store product page header illustration for Kung Fu Fisher, Chinese wuxia fishing mobile game. Use supplied image ONLY as reference for character and wooden skiff: dark charcoal flowing robe, vermilion sash, broad straw hat obscuring face, sword on back. Ignore reference's magenta/green background entirely. Wide 16:9 cinematic composition. Small wooden skiff at middle-right, full character and boat kept within central horizontal band, martial artist elegantly casts a silver jian blade toward the jade river. At center-left a graceful golden koi leaps with a restrained sparkling water arc; several red and ivory koi visible just beneath clear teal water. Misty Jiangnan limestone mountains and pine silhouettes behind, warm ivory dawn sky, refined painterly ink-wash style matching a premium wuxia game, deep jade water and warm gold accents. Dynamic but peaceful, beautiful readable silhouettes, sophisticated restrained detail. Critical character, koi and boat all inside central 60% width and central 50% height so both 16:9 and wide 21:9 crops work. No text, no letters, no logo, no UI, no border, no badges, no misleading features, no photorealism. This is promotional key art, not an in-game screenshot.

