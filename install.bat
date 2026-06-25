@echo off
chcp 65001 >nul
title Obsidian 多文件查找替换插件 — 一键安装
color 0B

echo ============================================
echo   Obsidian 多文件查找替换插件 — 一键安装
echo ============================================
echo.

:: 检查必要文件
if not exist "%~dp0main.js" (
    echo [!] 未找到 main.js，正在构建...
    cd /d "%~dp0"
    where npm >nul 2>&1
    if !errorlevel! equ 0 (
        call npm install --cache "%TEMP%\npm-cache-%RANDOM%" 2>nul
        call npm run build
        echo [✓] 构建完成
    ) else (
        echo [✗] 未找到 Node.js，请先安装: https://nodejs.org/
        pause
        exit /b 1
    )
)

:: 选择安装方式
echo 请选择安装方式：
echo  1. 自动扫描 vault
echo  2. 手动输入路径
echo.
set /p CHOICE="请输入编号 [1/2]: "
echo.

if "%CHOICE%"=="2" goto manual_input

:: 自动扫描
echo 正在扫描 Obsidian vault...
echo.

:: 常见路径
set FOUND_COUNT=0
setlocal enabledelayedexpansion

for %%p in (
    "%USERPROFILE%\Documents\Obsidian"
    "%USERPROFILE%\Obsidian"
    "%USERPROFILE%\Documents"
    "D:\Documents\Obsidian"
    "D:\Obsidian"
    "E:\Obsidian"
    "E:\Documents\Obsidian"
) do (
    if exist "%%p" (
        for /r "%%p" %%d in (.obsidian) do if exist "%%d" (
            set /a FOUND_COUNT+=1
            set "VAULT[!FOUND_COUNT!]=%%~dpd"
            echo  !FOUND_COUNT!. %%~dpd
        )
    )
)

:: 也扫描常见用户目录
for /d %%u in (C:\Users\*) do (
    for /r "%%u\Documents" %%d in (.obsidian) do if exist "%%d" (
        set /a FOUND_COUNT+=1
        set "VAULT[!FOUND_COUNT!]=%%~dpd"
        echo  !FOUND_COUNT!. %%~dpd
    )
)

if !FOUND_COUNT! equ 0 (
    echo [*] 未自动找到 vault
    goto manual_input
)

echo.
set /p SEL="请选择 vault 编号 [1-!FOUND_COUNT!]: "
set "VAULT_PATH=!VAULT[%SEL%]!"
goto install

:manual_input
set /p VAULT_PATH="请输入 vault 完整路径: "

:install
if "%VAULT_PATH%"=="" (
    echo [✗] 路径不能为空
    pause
    exit /b 1
)

:: 去除可能的尾部空格
set "VAULT_PATH=%VAULT_PATH:\=/%"

if not exist "%VAULT_PATH%" (
    echo [✗] 路径不存在: %VAULT_PATH%
    pause
    exit /b 1
)

:: 创建插件目录
set "PLUGIN_DIR=%VAULT_PATH%\.obsidian\plugins\multi-find-replace"
if not exist "%PLUGIN_DIR%" mkdir "%PLUGIN_DIR%"

:: 复制文件
copy /Y "%~dp0main.js" "%PLUGIN_DIR%\" >nul
copy /Y "%~dp0manifest.json" "%PLUGIN_DIR%\" >nul
copy /Y "%~dp0styles.css" "%PLUGIN_DIR%\" >nul

echo.
echo [✓] 安装完成！
echo.
echo   安装位置: %PLUGIN_DIR%
echo.
echo   接下来:
echo   1. 重启 Obsidian
echo   2. 打开 设置 → 第三方插件
echo   3. 关闭"安全模式"
echo   4. 启用「多文件查找替换」
echo.
echo ============================================

pause