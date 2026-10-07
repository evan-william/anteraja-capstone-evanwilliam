@echo off
setlocal
title Anteraja - React + Laravel
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\run-local.ps1"
if errorlevel 1 (
  echo.
  echo Gagal menjalankan aplikasi. Baca pesan error di atas.
  pause
)
endlocal
