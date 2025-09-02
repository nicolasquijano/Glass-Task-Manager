@echo off
REM ========================================
REM  Glass Task Manager - Build Production
REM ========================================

echo.
echo [92m================================================[0m
echo [92m    Glass Task Manager - Production Build     [0m
echo [92m================================================[0m
echo.

REM Cambiar al directorio del proyecto
cd /d "%%~dp0"

REM Verificar que estamos en el directorio correcto
if not exist "wails.json" (
    echo [91mError: wails.json no encontrado![0m
    echo [91mAsegurate de que este archivo .bat este en la raiz del proyecto.[0m
    pause
    exit /b 1
)

REM Mostrar información del proyecto
echo [96mDirectorio del proyecto:[0m %%CD%%
echo [96mIniciando build de produccion...[0m
echo.

REM Ejecutar wails build
wails build

REM Verificar si el build fue exitoso
if %%ERRORLEVEL%% neq 0 (
    echo.
    echo [91m============================================[0m
    echo [91m  Error al construir la aplicacion        [0m
    echo [91m============================================[0m
    echo [93mPosibles causas:[0m
    echo [93m- Errores de compilacion en Go[0m
    echo [93m- Errores en el frontend (Vue.js)[0m
    echo [93m- Dependencias faltantes[0m
    echo.
    pause
    exit /b 1
)

REM Mostrar ubicación del ejecutable
echo.
echo [92m============================================[0m
echo [92m  Build completado exitosamente!          [0m
echo [92m============================================[0m
echo [96mEjecutable creado en:[0m
echo [97m%%CD%%\build\bin\gestor-tareas-glass.exe[0m
echo.

REM Preguntar si quiere ejecutar la aplicación
set /p choice="[96mDeseas ejecutar la aplicacion ahora? (s/n): [0m"
if /i "%%choice%%"=="s" (
    echo [96mEjecutando aplicacion...[0m
    start "" "%%CD%%\build\bin\gestor-tareas-glass.exe"
) else if /i "%%choice%%"=="si" (
    echo [96mEjecutando aplicacion...[0m
    start "" "%%CD%%\build\bin\gestor-tareas-glass.exe"
) else if /i "%%choice%%"=="y" (
    echo [96mEjecutando aplicacion...[0m
    start "" "%%CD%%\build\bin\gestor-tareas-glass.exe"
) else if /i "%%choice%%"=="yes" (
    echo [96mEjecutando aplicacion...[0m
    start "" "%%CD%%\build\bin\gestor-tareas-glass.exe"
)

echo.
echo [92mProceso completado.[0m
pause
