# Obsidian 多文件查找替换插件

> 🔍 **Multi-File Find & Replace Plugin for Obsidian**

Obsidian 原生搜索面板（`Ctrl+Shift+F`）只能查找，不能替换。当你需要在多个笔记中批量修改内容时——比如重命名一个标签、替换一个术语、批量删除某个模式——这个插件帮你一键完成。

**核心能力：** 在整个 vault 中搜索 → 预览匹配结果 → 全部替换/逐个替换 → 不满意就撤销。

---

## 功能全景

### 🔍 搜索

| 功能 | 说明 |
|------|------|
| 多文件搜索 | 整个工作区 / 按文件夹筛选 |
| 正则表达式 | 支持完整 JS 正则语法，输入错误时**实时提示** |
| 捕获组引用 | 替换框中使用 `$1` `$2` 引用分组匹配 |
| 全词匹配 | 用 `\b` 包裹，只匹配完整单词 |
| 大小写敏感 | 开关控制 |
| 多行模式 | `.` 匹配换行符 |
| 文件类型过滤 | 只搜索 `.md` / `.txt` 等指定类型 |
| 排除模式 | 支持 glob，如 `dist/**`、`*.min.js` |
| 尊重 .gitignore | 自动跳过 git 忽略的文件 |
| 二进制文件跳过 | 图片、PDF、压缩包等自动过滤 |
| 上下文行数 | 控制匹配行前后显示几行 |

### ✏️ 替换

| 功能 | 说明 |
|------|------|
| 全部替换 | 替换所有匹配，**替换前弹出确认**显示影响数量 |
| 逐个替换 | 跳到第一个匹配位置，手动确认 |
| 保留大小写 | 4 种模式：不保留 / 自动 / 全小写 / 全大写 |
| 冲突检测 | 撤销时如果文件已被手动修改，提示确认 |

### 👁️ 预览

| 功能 | 说明 |
|------|------|
| Diff 高亮 | 匹配项用橙色高亮显示 |
| 文件级折叠 | 点击文件名展开/收起该文件的匹配结果 |
| 匹配统计 | 顶部显示"共 X 个文件，Y 处匹配" |
| 点击跳转 | 点击匹配行直接跳转到编辑器并**选中高亮**匹配文本 |

### ↩️ 撤销

| 功能 | 说明 |
|------|------|
| 单步撤销 | 每次替换单独记录 |
| 批次撤销 | 全部替换作为一个原子操作，一次性撤销 |
| 多级栈 | 支持多次撤销/重做 |
| 部分回滚 | 批量替换中某个文件写入失败时，自动回滚已完成的文件 |

### ⚡ 性能

| 功能 | 说明 |
|------|------|
| 防抖 | 300ms 延迟，输入时即时搜索，避免频繁触发 |
| Token 取消 | 快速切换搜索词时自动取消上一次搜索结果 |
| 阈值提示 | 匹配数超过 10000 时提示缩小范围 |
| 取消按钮 | 搜索过程中可随时取消 |

### 📋 历史与导出

| 功能 | 说明 |
|------|------|
| 搜索历史 | 自动记录最近 10 条搜索词/替换词 |
| 导出结果 | 一键将匹配列表复制到剪贴板 |

---

## 安装

### 方式一：一键安装脚本（推荐）

> 适合不熟悉命令行的用户，自动化完成所有步骤。

**前提条件：**
- 你的电脑上安装了 [Node.js](https://nodejs.org/)（LTS 版本即可）
- Obsidian 已关闭（安装完成后重启）

**安装步骤：**

```bash
# 1. 下载项目
git clone https://github.com/2022753697/obsidian-multi-find-replace.git
cd obsidian-multi-find-replace

# 2. 运行安装脚本（会自动构建并安装到你的 Obsidian vault）
bash install.sh
```

安装脚本会自动：
1. 检测你的 Node.js 环境，自动执行 `npm install` 和 `npm run build`
2. 扫描你的电脑查找所有 Obsidian vault
3. 如果找到多个 vault，让你选择安装到哪一个
4. 把插件文件复制到 `.obsidian/plugins/multi-find-replace/`

**没有自动找到你的 vault？** 手动指定路径：

```bash
bash install.sh /path/to/your/obsidian-vault
```

**安装完成后：**
1. 打开 Obsidian
2. 进入 **设置 → 第三方插件**
3. **关闭"安全模式"**（如果还没关的话）
4. 在已安装插件列表中找到 **「多文件查找替换」**，点击开关启用
5. 左侧功能区会出现 🔍 图标

### 方式二：从 GitHub Releases 手动安装

> 适合只想下载不需要源码的情况。

1. 前往 [Releases 页面](https://github.com/2022753697/obsidian-multi-find-replace/releases)
2. 下载最新版本的 `main.js`、`manifest.json`、`styles.css` 三个文件
3. 在你的 Obsidian vault 中创建目录：`.obsidian/plugins/multi-find-replace/`
4. 将三个文件复制到这个目录
5. 重启 Obsidian，在设置 → 第三方插件中启用

### 方式三：通过 BRAT 安装

> 适合经常想尝鲜最新版本的用户。

1. 先在 Obsidian 中安装 [BRAT](https://obsidian.md/plugins?id=obsidian42-brat) 插件
2. BRAT 设置 → `Add Beta plugin`
3. 输入仓库地址：`https://github.com/2022753697/obsidian-multi-find-replace`
4. BRAT 会自动下载并安装，以后有更新会自动提示

### 方式四：从源码构建

> 适合开发者，想修改代码再自己构建。

```bash
git clone https://github.com/2022753697/obsidian-multi-find-replace.git
cd obsidian-multi-find-replace
npm install
npm run build
```

构建后，把 `main.js`、`manifest.json`、`styles.css` 复制到你的 vault 的 `.obsidian/plugins/multi-find-replace/` 目录。

---

## 使用指南

### 打开面板

| 方式 | 操作 |
|------|------|
| **侧边栏图标** | 点击左侧功能区 🔍 图标 |
| **命令面板** | `Ctrl+P` 或 `Cmd+P`，输入"多文件查找替换" |
| **右键菜单** | 在编辑器中选中文本 → 右键 → `多文件搜索选中词` |
| **快捷键** | `F3` / `Shift+F3` 在匹配结果间跳转 |

### 搜索和替换流程

**简单替换：**
```
1. 在"查找"框输入要搜索的内容
2. 在"替换为"框输入替换后的内容
3. 查看预览结果
4. 点击"全部替换"或逐个跳转修改
```

**正则替换：**
```
1. 勾选"正则"
2. "查找"框输入正则，如 \d{4}-\d{2}-\d{2}
3. "替换为"框使用捕获组，如 $1年$2月$3日
4. 查看验证结果（正则不合法会红字提示）
5. 执行替换
```

**保留大小写：**
- 选"自动"：`WORLD` → `THERE`，`world` → `there`，`World` → `There`
- 选"大写"：全部转换为大写
- 选"小写"：全部转换为小写

### 界面说明

```
┌───────────────────────────────────────────────────────┐
│  🔍 多文件查找替换                            [×]     │
├───────────────────────────────────────────────────────┤
│  [▶ 搜索配置]                              [历史记录 ▼]  │
│    (点击展开搜索选项，折叠节省空间)                    │
├───────────────────────────────────────────────────────┤
│  共 12 个文件，38 处匹配                               │
│  [全部替换] [逐个跳转] [撤销] [取消搜索] [导出结果]    │
├───────────────────────────────────────────────────────┤
│  ▼ wiki/concepts/_index.md (3 处匹配)   ← 点击展开/收起 │
│    第 12 行:                                           │
│      图片已省略...                      ← 点击跳转并高亮 │
│    第 45 行:                                           │
│      !(图片已省略)                                     │
│  ▶ wiki/hot.md (1 处匹配)                              │
└───────────────────────────────────────────────────────┘
```

---

## 开发指南

### 常用命令

```bash
npm run dev       # 开发模式，监听文件变化自动重新构建
npm run build     # 生产构建，输出 main.js + styles.css
npm run test      # 运行单元测试
```

### 项目结构

```
obsidian-multi-find-replace/
├── install.sh                # 一键安装脚本
├── src/
│   ├── main.ts               # 插件入口，注册面板、命令、菜单
│   ├── styles.css            # 插件样式
│   ├── types/index.ts        # 所有 TypeScript 类型定义
│   ├── core/                 # 核心逻辑（与 Obsidian API 解耦，可单独测试）
│   │   ├── SearchEngine.ts   # 正则/纯文本搜索
│   │   ├── ReplaceEngine.ts  # 替换执行 + diff 预览 + 保留大小写
│   │   ├── FileFilter.ts     # 文件筛选（类型/排除/gitignore/二进制）
│   │   ├── UndoManager.ts    # 单步/批次撤销栈
│   │   └── PerformanceController.ts  # 防抖/Token/阈值
│   ├── adapter/              # Obsidian API 适配层
│   │   ├── WorkspaceAdapter.ts  # 文件读写、编辑器跳转
│   │   └── EventBus.ts         # 模块间事件通信
│   ├── ui/                   # UI 组件
│   │   ├── SidebarPanel.ts   # 侧边栏面板主视图
│   │   ├── SearchConfig.ts   # 搜索配置表单
│   │   ├── ResultRenderer.ts # 搜索结果渲染 + diff 高亮
│   │   └── Navigator.ts      # F3 导航
│   └── utils/                # 工具函数
│       ├── hash.ts           # FNV-1a 哈希
│       ├── escape.ts         # HTML 转义
│       └── gitignore.ts      # .gitignore 解析
├── manifest.json             # Obsidian 插件清单
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
└── README.md
```

### 架构图

```
┌──────────────────────────────────────────────────┐
│                    UI 层                         │
│   SidebarPanel  /  SearchConfig                 │
│   ResultRenderer  /  Navigator                  │
├──────────────────────────────────────────────────┤
│                   核心层                          │
│  SearchEngine  /  ReplaceEngine                 │
│  FileFilter  /  UndoManager                     │
│  PerformanceController                          │
├──────────────────────────────────────────────────┤
│                  适配层                           │
│  WorkspaceAdapter  /  EventBus                  │
└──────────────────────────────────────────────────┘
```

设计原则：
- **核心层**是纯 TypeScript，不依赖 Obsidian API，可以跑单元测试
- **适配层**封装 Obsidian 特有的操作（文件读写、编辑器交互）
- **UI 层**只负责渲染和用户交互，不处理业务逻辑

### 修改代码后重新构建

```bash
# 修改代码后，只需要重新构建并复制到 vault
npm run build

# 手动复制（或使用 install.sh 重新安装）
cp main.js styles.css manifest.json /path/to/vault/.obsidian/plugins/multi-find-replace/

# 然后在 Obsidian 中重新加载插件（设置 → 第三方插件 → 关闭再开启）
```

---

## 常见问题

**Q: 搜索没有结果？**
A: 检查文件类型过滤是否包含了你的文件类型（默认只搜 `.md`），以及排除模式里是否误排了目标目录。

**Q: 正则表达式报错？**
A: 插件会实时校验正则合法性，错误提示会红字显示在搜索框下方。常见错误：括号未闭合、反斜杠未转义。

**Q: 替换后想撤销但提示"文件已被修改"？**
A: 插件会检测文件在替换后是否被手动编辑过。如果确认想撤销，点击"确定"仍然会覆盖回去。

**Q: 匹配太多卡住了？**
A: 超过 10000 条匹配时会提示你缩小范围。也可以点击"取消搜索"终止当前搜索。

---

## 许可证

MIT

---

## 链接

- GitHub: [https://github.com/2022753697/obsidian-multi-find-replace](https://github.com/2022753697/obsidian-multi-find-replace)
- 提交 Issue: [https://github.com/2022753697/obsidian-multi-find-replace/issues](https://github.com/2022753697/obsidian-multi-find-replace/issues)
