@echo off
REM ========================================
REM  Glass Task Manager - Development Mode
REM ========================================

echo.
echo [92m================================================[0m
echo [92m    Glass Task Manager - Development Server    [0m
echo [92m================================================[0m
echo.

REM Cambiar al directorio del proyecto
cd /d "%~dp0"

REM Verificar que estamos en el directorio correcto
if not exist "wails.json" (
    echo [91mError: wails.json no encontrado![0m
    echo [91mAsegurate de que este archivo .bat este en la raiz del proyecto.[0m
    pause
    exit /b 1
)

REM Mostrar información del proyecto
echo [96mDirectorio del proyecto:[0m %CD%
echo [96mIniciando servidor de desarrollo...[0m
echo.

REM Ejecutar wails dev
wails dev

REM Si wails dev falla, mostrar mensaje de error
if %ERRORLEVEL% neq 0 (
    echo.
    echo [91m============================================[0m
    echo [91m  Error al ejecutar wails dev             [0m
    echo [91m============================================[0m
    echo [93mPosibles causas:[0m
    echo [93m- Wails no esta instalado o no esta en el PATH[0m
    echo [93m- Dependencias faltantes (Go, Node.js)[0m
    echo [93m- Puerto en uso[0m
    echo.
    echo [96mPara instalar Wails:[0m
    echo [97mgo install github.com/wailsapp/wails/v2/cmd/wails@latest[0m
    echo.
    pause
    exit /b 1
)

echo.
echo [92m========================================[0m
echo [92m  Servidor de desarrollo detenido       [0m
echo [92m========================================[0m
pause