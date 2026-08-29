@echo off
chcp 65001 >nul
title 住得近 - 本地开发服务器
cd /d "%~dp0"

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [错误] 没有找到 Node.js 或 npm。
  echo 请先安装 Node.js LTS，然后重新双击本文件。
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo [首次运行] 正在安装项目依赖，请稍候……
  call npm.cmd install
  if errorlevel 1 (
    echo [错误] 依赖安装失败，请检查网络后重试。
    pause
    exit /b 1
  )
)

echo.
echo 住得近正在启动……
echo 本地网址：http://127.0.0.1:5173/
echo 请保持本窗口开启；关闭窗口即可停止网站。
echo.
call npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort --open

echo.
echo 服务器已停止。
pause
