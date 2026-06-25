#!/usr/bin/env bash
# ============================================================
# install.sh — Obsidian 多文件查找替换插件 一键安装脚本
# ============================================================
# 用法：
#   方式一：直接运行，交互式选择 vault
#     bash install.sh
#
#   方式二：指定 vault 路径
#     bash install.sh /path/to/your/vault
#
#   方式三：从当前 vault 目录运行
#     cd your-vault && bash /path/to/install.sh
# ============================================================

set -e

PLUGIN_NAME="multi-find-replace"
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Obsidian 多文件查找替换插件 — 一键安装${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# 检查必要文件
if [ ! -f "$SOURCE_DIR/main.js" ] || [ ! -f "$SOURCE_DIR/manifest.json" ] || [ ! -f "$SOURCE_DIR/styles.css" ]; then
  echo -e "${YELLOW}[!] 未找到构建产物，正在构建...${NC}"
  cd "$SOURCE_DIR"
  if command -v npm &> /dev/null; then
    npm install --cache /tmp/npm-cache-$$ 2>/dev/null || npm install
    npm run build
    echo -e "${GREEN}[✓] 构建完成${NC}"
  else
    echo -e "${RED}[✗] 未安装 Node.js，请先安装：https://nodejs.org/${NC}"
    exit 1
  fi
fi

# 查找 Obsidian vault
VAULT_PATH=""

# 方式1：命令行参数
if [ -n "$1" ]; then
  VAULT_PATH="$1"
fi

# 方式2：当前目录是否包含 .obsidian
if [ -z "$VAULT_PATH" ] && [ -d ".obsidian" ]; then
  VAULT_PATH="$(pwd)"
fi

# 方式3：交互式选择
if [ -z "$VAULT_PATH" ]; then
  echo -e "${YELLOW}正在扫描 Obsidian vault...${NC}"
  echo ""

  # 常见 vault 位置
  CANDIDATES=()
  case "$(uname -s)" in
    Linux*)
      CANDIDATES+=("$HOME/Documents/Obsidian" "$HOME/Obsidian" "$HOME/Documents")
      ;;
    Darwin*)
      CANDIDATES+=("$HOME/Documents/Obsidian" "$HOME/Obsidian" "$HOME/Documents" "$HOME/iCloud Drive/obsidian")
      ;;
    MINGW*|MSYS*|CYGWIN*)
      CANDIDATES+=("/c/Users/$USER/Documents/Obsidian" "/c/Users/$USER/Obsidian" "/d/Users/$USER/Documents/Obsidian")
      CANDIDATES+=("$HOME/Documents/Obsidian" "$HOME/Obsidian")
      ;;
  esac

  # 搜索 .obsidian 目录
  VAULTS=()
  for dir in "${CANDIDATES[@]}"; do
    if [ -d "$dir" ]; then
      while IFS= read -r -d '' obs_dir; do
        vault_root="$(dirname "$obs_dir")"
        VAULTS+=("$vault_root")
      done < <(find "$dir" -maxdepth 3 -name ".obsidian" -type d -print0 2>/dev/null)
    fi
  done

  # Windows 特殊路径
  if [ -d "/c/Users" ]; then
    while IFS= read -r -d '' obs_dir; do
      vault_root="$(dirname "$obs_dir")"
      VAULTS+=("$vault_root")
    done < <(find "/c/Users" -maxdepth 4 -name ".obsidian" -type d -print0 2>/dev/null || true)
  fi

  # 去重
  UNIQUE_VAULTS=()
  for v in "${VAULTS[@]}"; do
    seen=false
    for u in "${UNIQUE_VAULTS[@]}"; do
      [ "$u" = "$v" ] && seen=true && break
    done
    $seen || UNIQUE_VAULTS+=("$v")
  done

  if [ ${#UNIQUE_VAULTS[@]} -eq 0 ]; then
    echo -e "${RED}[!] 未自动找到 vault，请输入路径：${NC}"
    read -r VAULT_PATH
  elif [ ${#UNIQUE_VAULTS[@]} -eq 1 ]; then
    VAULT_PATH="${UNIQUE_VAULTS[0]}"
    echo -e "${GREEN}  找到 vault: $VAULT_PATH${NC}"
  else
    echo "找到多个 vault，请选择："
    for i in "${!UNIQUE_VAULTS[@]}"; do
      echo "  $((i+1)). ${UNIQUE_VAULTS[$i]}"
    done
    echo ""
    echo -n "请输入编号 [1-${#UNIQUE_VAULTS[@]}]: "
    read -r SELECTION
    VAULT_PATH="${UNIQUE_VAULTS[$((SELECTION-1))]}"
  fi
fi

# 验证 vault 路径
if [ ! -d "$VAULT_PATH" ]; then
  echo -e "${RED}[✗] 路径不存在: $VAULT_PATH${NC}"
  exit 1
fi

if [ ! -d "$VAULT_PATH/.obsidian" ]; then
  echo -e "${YELLOW}[!] 路径下没有 .obsidian 目录，确定这是 vault 根目录？${NC}"
  echo -n "继续? [Y/n]: "
  read -r CONFIRM
  if [ "$CONFIRM" = "n" ] || [ "$CONFIRM" = "N" ]; then
    exit 1
  fi
fi

# 创建插件目录
PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/$PLUGIN_NAME"
mkdir -p "$PLUGIN_DIR"

# 复制文件
cp "$SOURCE_DIR/main.js" "$PLUGIN_DIR/"
cp "$SOURCE_DIR/manifest.json" "$PLUGIN_DIR/"
cp "$SOURCE_DIR/styles.css" "$PLUGIN_DIR/"

echo -e "${GREEN}[✓] 安装完成！${NC}"
echo ""
echo -e "  安装位置: ${CYAN}$PLUGIN_DIR${NC}"
echo ""
echo "  接下来："
echo "  1. 重启 Obsidian"
echo "  2. 打开 设置 → 第三方插件"
echo "  3. 关闭"安全模式""
echo "  4. 启用「多文件查找替换」"
echo ""
echo -e "${CYAN}============================================${NC}"