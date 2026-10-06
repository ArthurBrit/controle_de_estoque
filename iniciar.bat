@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Controle de Estoque de Cestas
cd /d "%~dp0"

set "PORT=3000"
set "URL=http://localhost:%PORT%"

echo.
echo  ==============================================
echo     CONTROLE DE ESTOQUE DE CESTAS
echo  ==============================================
echo.

rem --- 1. Verifica o Node.js -------------------------------------------------
where node >nul 2>nul
if errorlevel 1 goto :sem_node
for /f "tokens=1 delims=v." %%v in ('node -v') do set "NODE_MAJOR=%%v"
if %NODE_MAJOR% LSS 20 goto :node_antigo
echo  [ok] Node.js encontrado.

rem --- 2. Sistema ja esta aberto? ---------------------------------------------
netstat -ano | findstr /r /c:":%PORT% .*LISTENING" >nul
if not errorlevel 1 goto :ja_aberto

rem --- 3. Instala/atualiza dependencias quando necessario -----------------------
if not exist "node_modules\.package-lock.json" goto :instalar
powershell -NoProfile -Command "if ((Get-Item 'package-lock.json').LastWriteTime -gt (Get-Item 'node_modules\.package-lock.json').LastWriteTime) { exit 1 } else { exit 0 }"
if errorlevel 1 goto :instalar
goto :dependencias_ok
:instalar
echo  [..] Instalando dependencias, aguarde...
call npm.cmd install --no-audit --no-fund
if errorlevel 1 goto :erro_instalar
:dependencias_ok
echo  [ok] Dependencias prontas.

rem --- 4. Gera o build quando nao existe ou o codigo foi atualizado ------------
powershell -NoProfile -Command "$b = Get-Item '.next\BUILD_ID' -ErrorAction SilentlyContinue; if (-not $b) { exit 1 }; $n = Get-ChildItem 'app','components','lib','package.json','next.config.ts' -Recurse -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1; if ($n.LastWriteTime -gt $b.LastWriteTime) { exit 1 } else { exit 0 }"
if errorlevel 1 (
  echo  [..] Preparando o sistema ^(pode levar alguns minutos^)...
  call npm.cmd run build
  if errorlevel 1 goto :erro_build
)
echo  [ok] Sistema pronto.

rem --- 5. Abre o navegador assim que o servidor responder ----------------------
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "for ($i = 0; $i -lt 90; $i++) { try { Invoke-WebRequest '%URL%/api/stock' -UseBasicParsing -TimeoutSec 2 | Out-Null; Start-Process '%URL%'; break } catch { Start-Sleep -Seconds 1 } }"

echo.
echo  Sistema iniciado em %URL%
echo  Mantenha esta janela aberta enquanto usar o sistema.
echo  Para encerrar, feche esta janela ou pressione Ctrl+C.
echo.
call npm.cmd start -- -p %PORT%
echo.
echo  O sistema foi encerrado.
pause
exit /b 0

:ja_aberto
echo  [ok] O sistema ja esta em execucao. Abrindo o navegador...
start "" "%URL%"
timeout /t 3 >nul
exit /b 0

:sem_node
echo  [erro] Node.js nao foi encontrado.
echo         Instale a versao LTS em https://nodejs.org e execute novamente.
start "" https://nodejs.org
pause
exit /b 1

:node_antigo
echo  [erro] Versao do Node.js muito antiga. Instale a versao 20 ou superior.
pause
exit /b 1

:erro_instalar
echo  [erro] Falha ao instalar as dependencias. Verifique a internet e tente novamente.
pause
exit /b 1

:erro_build
echo  [erro] Falha ao preparar o sistema. Veja as mensagens acima.
pause
exit /b 1
