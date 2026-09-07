@echo off
title Controle de Estoque de Cestas
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando dependencias pela primeira vez...
  call npm.cmd install
)
if not exist .next (
  echo Preparando a aplicacao...
  call npm.cmd run build
)
echo Abrindo http://localhost:3000
start "" http://localhost:3000
call npm.cmd start
pause
