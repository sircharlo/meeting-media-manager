# 用户指南 {#user-guide}

这份综合用户指南将帮助您从基础设置到高级演示，全面掌握 M³ 的各项功能。

## 入门 {#getting-started}

### 下载与安装 {#download-and-install}

从 [下载页面](download)获取最新版本。 它能为您的设备推荐最佳版本并显示最新版本。

### 首次启动 {#first-launch}

第一次启动 M³ 时，将进入设置向导，帮助您完成关键配置：

1. **选择界面语言** —— 确定 M³ 菜单与按钮所使用的语言
2. **选择配置文件类型** —— 常规会众请选择“Regular”，特殊活动可选“Other”
3. **配置会众信息** —— 输入会众详细信息，或使用自动查询功能
4. **设置聚会日程** —— 配置周中与周末聚会时间
5. **可选功能** —— 例如 OBS 集成、背景音乐以及其他高级功能

:::tip 小贴士

请按需耐心完成设置；您也可以随时在“设置”菜单中再次修改。

:::

### 主界面概览 {#main-interface}

M³ 主界面包含以下关键区域：

- **侧边导航** —— 进入不同分区与设置
- **日历视图** —— 按日期浏览媒体
- **媒体列表** —— 查看并管理选中日期的媒体
- **工具栏** —— 快速访问常用功能
- **状态栏** —— 显示下载进度、背景音乐状态、OBS Studio 连接状态等

## 媒体管理 {#user-guide-media-management}

### 认识日历视图 {#calendar-view}

日历视图显示您的聚会安排与可用媒体：

- **聚会日** —— 高亮显示已安排聚会的日期
- **媒体指示** —— 以图标提示可用媒体类型
- **日期导航** —— 使用方向键在不同月份间切换

<!-- ### Downloading Media {#downloading-media}

::: info Note

Download speed depends on your internet connection and the size of media files. Videos typically take longer to download than images.

::: -->

### 整理媒体 {#organizing-media}

M³ 会按聚会类型与分区自动整理媒体：

- **聚会分区** —— 例如公众讲演、取之于神话语等
- **自定义分区** —— 当某日没有聚会安排时，您仍可自建分区添加媒体

## 媒体演示 {#media-presentation}

### 打开媒体播放器 {#opening-media-player}

用于聚会中的媒体演示：

1. 选择日期与要演示的媒体项
2. 点击播放按钮或使用快捷键
3. 媒体将在“媒体显示”窗口中开始播放
4. 使用控制项进行播放、暂停或导航

### 播放器控制 {#media-player-controls}

播放器提供完整控制：

- **播放/暂停** —— 开始或暂停播放
- **停止** —— 停止播放

<!-- - **Previous/Next** - Navigate between media items
- **Volume** - Adjust playback volume -->

<!-- - **Fullscreen** - Toggle fullscreen mode -->

- **缩放/平移** —— 鼠标滚轮缩放、拖拽平移（用于图片）

### 高级演示功能 {#advanced-presentation}

#### 自定义时段 {#custom-timing}

可为媒体设置自定义起止时间：

<!-- 1. Right-click on a media item
2. Select "Edit Timing" -->

1. 点击缩略图左上角显示的“时长”区域
2. 设置开始时间与结束时间
3. 保存更改

#### 缩放与平移 {#zoom-pan}

适用于图片与视频：

- **缩放** —— 使用鼠标滚轮或缩略图上的缩放控件
- **平移** —— 在缩略图上按住拖拽进行移动
- **重置** —— 一键恢复初始缩放

#### 键盘快捷键 {#user-guide-keyboard-shortcuts}

配置快速访问的自定义快捷键。 请注意，默认设置没有键盘快捷键。

**内置媒体列表控制**（主窗口聚焦且显示媒体列表时）：

- **Tab/Shift+Tab** —— 在媒体项之间移动焦点
- **上下方向键** —— 在媒体项之间移动焦点
- **空格** —— 播放/暂停
- **Esc** —— 停止播放

**可自定义快捷键**（在设置中启用后生效）：

- **媒体窗口** —— 打开/关闭媒体窗口
- **上一项/下一项** —— 媒体间导航
- **暂停/继续** —— 控制播放
- **停止播放** —— 停止播放
- **背景音乐开关** —— 控制背景音乐

**注（\*）**：全局快捷键 —— 即使应用未聚焦也可使用。

## 背景音乐 {#user-guide-background-music}

### 设置背景音乐 {#background-music-setup}

背景音乐会在聚会前自动播放，并在适当时机停止：

1. **启用音乐** —— 在设置中开启背景音乐
2. **自动启动** —— 适当情况下，M³ 启动后会自动播放
3. **聚会前停止** —— 将在聚会开始前自动停止
4. **手动控制** —— 使用状态栏上的音乐按钮随时开/关
5. **重新播放** —— 聚会后可一键恢复播放

## Zoom 集成 {#user-guide-zoom-integration}

M³ 可与 Zoom 集成以自动切换共享：

1. **启用集成** —— 在设置中开启 Zoom 集成
2. **配置快捷键** —— 在 Zoom 中设置屏幕共享快捷键 ，并勾选“全局快捷键”
3. **自动控制** —— M³ 将按需自动切换 Zoom 屏幕共享
4. **手动优先** —— 如有需要，仍可在 Zoom 内手动操作

## OBS Studio 集成 {#user-guide-obs-integration}

### 设置 OBS 集成 {#user-guide-obs-setup}

使用 M3 与 OBS Studio 混合会议：

1. **安装 OBS Studio** —— 下载并安装 OBS
2. **启用 WebSocket** —— 在 OBS 中安装并启用 WebSocket 插件
3. **配置 M³** —— 在 M³ 中填写 OBS 端口与密码
4. **设置场景** —— 准备摄像机、媒体、图片等场景
5. **测试** —— 验证播放与切换

### OBS 场景管理 {#obs-scene-management}

演示期间 M³ 将自动切换场景：

- **摄像机场景** —— 讲台/摄像头视图
- **媒体场景** —— 播放媒体内容
- **图片场景** —— 显示图片（若启用“延迟图片”，将等待手动触发）
- **自动切换** —— 基于媒体类型与设置自动变更

### M³ 在本机播放带声音的媒体，但这些声音**不会**自动随视频流传到 OBS/Zoom。就像把 OBS 当作“虚拟摄像头” —— 只有画面，没有声音。因此必须明确配置 Zoom 去“听见”电脑声音。

#### 延迟图像 {#user-guide-postpone-images}

启用此选项以延迟共享图像到 OBS 直到手动触发：

1. 在 OBS 设置中启用"延迟图像"
2. 只有当您点击按钮以使用 OBS Studio 显示图像时，图像才会被共享。 这有助于首先将图像展示给亲自观看者。

#### 场景切换行为 {#user-guide-scene-switching}

配置 M3 如何处理场景变化：

- **这不是 M³ 的限制**：使用任何播放器在 OBS+Zoom 的场景下都会有类似现象。若电脑音频路由设置合适（例如给媒体播放使用第二声卡，并让 Zoom 把它当“麦克风”采集），启用“原始音频”即可让 Zoom 捕获电脑正在播放的声音。
- **反复练习** —— 熟悉并形成肌肉记忆

### 混合聚会音频配置 {#audio-configuration}

当与 OBS 搭配进行混合聚会（线下 + Zoom）时，需要妥善配置音频，使线上与会者能听到媒体声音。

#### Zoom 音频设置 {#zoom-audio-settings}

**每次开会前都要启用 Zoom 的“原始音频（Original Audio）”：**

1. **打开 Zoom** → **设置**
2. 进入 **音频** → **高级**
3. 勾选 **“在会议内显示‘启用原始音频’选项”**
4. 勾选 **“禁用回声消除”**（第一项）
5. 勾选 **“禁用噪声抑制”**（第二项）
6. **不勾选** **“禁用高保真音乐模式”**（第三项）
7. **每次会议开始前**，在会议控制条中点击“Original Audio/原始音频”按钮

**替代方案：共享电脑声音**  
如果“原始音频”在您的环境下效果不佳：

1. **播放媒体前**，在 Zoom 的共享界面切换到 **“高级”** 选项卡
2. 勾选 **“共享电脑声音”**
3. **注意**：每次新开 Zoom 会话都要重新开启

**更简便的替代方案**：考虑改用 M³ 的 Zoom 集成。它使用 Zoom 原生屏幕共享，音频处理更直接，无需复杂设置。

#### 为什么需要这些设置 {#why-audio-config}

M³ plays media with sound on your computer, but this audio is **not automatically transmitted** through the video stream to OBS Studio. This is the same behavior you would experience with any other media player.

**The audio issue is not related to M³** - it's a limitation of how OBS Studio video streaming works with Zoom. The video stream acts like a virtual camera without sound, just like a webcam, so you must explicitly configure Zoom to capture the computer's audio. This implies that your computer has two sound cards, and if this isn't the case, you probably won't be able to use the OBS Studio integration successfully.

**替代方案**：使用 Zoom 的“共享电脑声音”，或直接使用 M³ 的 Zoom 集成以简化音频流程。

#### 音频疑难解答 {#audio-troubleshooting}

**常见问题：**

- **Zoom 无声音**：检查是否已启用并正确设置“原始音频”
- **音质差**：核对三项“原始音频”设置（前两项启用，第三项不启用）
- **重启后无效**：每次新开 Zoom 会话都必须重新启用“原始音频”

**最佳实践：**

- 在聚会前测试音频路径与共享设置
- 准备音频设置清单，方便执勤交接
- 把“共享电脑声音”当作备选方案
- **若寻求更简便方案，可优先使用 Zoom 集成**
- 确保所有 AV 服事同工熟悉这些设置

## 媒体导入和管理 {#media-import}

### 导入自定义媒体 {#importing-custom-media}

向 M³ 添加您自己的媒体文件：

1. **文件导入** —— 使用导入按钮添加视频、图片或音频
2. **拖放导入** —— 直接将文件拖入 M³
3. **文件夹监控** —— 设置监控文件夹以自动导入新文件
4. **JWPUB/播放列表** —— 导入出版物和播放列表
5. **公众讲演媒体（S‑34 / S‑34mp）** —— 通过 S‑34 或 S‑34mp JWPUB 文件导入

### 管理已导入媒体 {#managing-imported-media}

- **按日期整理** —— 将媒体分配到具体日期
- **自定义分区** —— 用于更细致的组织与分类
- **编辑属性** —— 修改标题、说明与时段
- **移除媒体** —— 删除不再需要的项目

### 音频圣经导入 {#audio-bible-import}

导入经文音频录音：

1. 点击“音频圣经”按钮
2. 选择圣经书卷与章节
3. 选择具体经文或经文范围
4. 下载音频文件
5. Use them

## 文件夹监控与导出 {#user-guide-folder-monitoring}

### 设置文件夹监控 {#folder-monitoring-setup}

监控某个文件夹以自动导入新媒体：

1. **启用文件夹监控** —— 在设置中开启
2. **选择文件夹** —— 指定要监控的路径
3. **自动导入** —— 新文件会自动加入 M³
4. **自动整理** —— 可按日期结构进行整理

### 媒体导出 {#user-guide-media-export}

自动将媒体导出到有组织的文件夹：

1. **启用自动导出** —— 在设置中开启
2. **选择导出位置** —— 指定保存路径
3. **自动整理** —— 按日期与分区分类保存
4. **格式选项** —— 可转换为 MP4 以提升兼容性

## 网站演示 {#website-presentation}

### 演示官方网站 {#presenting-the-website}

在外接显示器上展示官方网站：

1. **开启网站模式** —— 点击“网站演示”按钮
2. **外部显示** —— 网站会在新窗口打开
3. **浏览导航** —— 使用浏览器控件进行导航

### 网站控件 {#website-controls}

- **导航** —— 标准前进/后退
- **刷新** —— 重新加载当前页
- **关闭** —— 退出网站演示模式

## 高级功能 {#user-guide-advanced-features}

### 多个会众 {#user-guide-multiple-congregations}

管理多个会众或小组：

1. **创建配置文件** —— 为不同会众建立独立配置
2. **切换配置** —— 使用会众选择器在配置间切换
3. **独立设置** —— 每个配置有独立的设置与媒体
4. **共享资源** —— 在可能的情况下共享媒体文件以节省空间

### 键盘快捷键 {#keyboard-shortcuts-guide}

配置快捷键以提升效率：

1. **启用快捷键** —— 在设置中打开键盘快捷键功能
2. **设置快捷键** —— 为常用操作配置合适组合
3. **使用快捷键** —— 熟练掌握常用快捷键
4. **个性化** —— 根据偏好进行调整

## 故障排除 {#troubleshooting-guide}

### 常见问题 {#common-issues}

#### 无法下载媒体 {#user-guide-media-not-downloading}

- 检查聚会日程设置是否正确
- 确认网络连接正常
- 核对所选语言在官网是否提供媒体

#### OBS 集成无效 {#user-guide-obs-not-working}

- 确认已安装且运行 OBS WebSocket 插件
- 检查端口与密码设置
- 确保 OBS 正在运行

#### Zoom/OBS 音频问题 {#audio-issues}

- **Zoom 无声音**：启用并检查“原始音频”设置
- **音质差**：核对三项“原始音频”勾选（前两项启用，第三项不启用）
- **重启后失效**：每一次新的 Zoom 会话都需要重新启用“原始音频”
- **替代方案**：使用 Zoom 的“共享电脑声音”

#### 性能问题 {#user-guide-performance-issues}

- 启用额外缓存
- 降低最高分辨率
- 清理旧缓存文件
- 检查可用磁盘空间

#### 语言问题 {#user-guide-language-issues}

- 检查媒体语言设置
- 确认该语言在 JW.org 可用
- 尝试设置后备语言
- 核对界面语言

### 获取帮助 {#getting-help}

如果遇到问题：

1. **查看文档** —— 阅读本指南及其他相关文档
2. **搜索问题** —— 在 GitHub 上查找相似问题
3. **反馈记录** —— 创建新 Issue 并附上详尽信息

## 最佳实践 {#best-practices}

### 会前 {#before-meetings}

1. **检查下载** —— 确认所有媒体已经下载完成
2. **测试设备** —— 检查显示与音频是否正常
3. **准备媒体** —— 审阅并整理当次媒体，确保无缺失
4. **配置音频** —— 混合聚会时，启用原始音频或设置“共享电脑声音”

### 会中 {#during-meetings}

1. **专注演示** —— 利用简洁界面减少干扰
2. 可在设置中配置自定义快捷键。默认不预设任何全局快捷键。
3. **监控音频** —— 如有职责，请关注音量与质量
4. **预备下一项** —— 提前选中下一条媒体
5. **核对线上音频** —— 确认 Zoom 端能听到媒体声音

### 会后 {#after-meetings}

1. **恢复背景音乐** —— 需要时重新播放
2. **规划下次** —— 为下次聚会做好准备
3. **收尾整理** —— 合适时关闭媒体窗口

### 日常维护 {#regular-maintenance}

1. **更新 M³** —— 及时升级到最新版本
2. **清理缓存** —— 定期清理旧缓存
3. **检查设置** —— 根据需要调整配置
