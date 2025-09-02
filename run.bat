@echo off
REM ========================================
REM  Glass Task Manager - Run Application
REM ========================================

echo.
echo [92m================================================[0m
echo [92m      Glass Task Manager - Ejecutar App       [0m
echo [92m================================================[0m
echo.

REM Cambiar al directorio del proyecto
cd /d "%%~dp0"

REM Verificar que el ejecutable existe
if not exist "build\bin\gestor-tareas-glass.exe" (
    echo [91mError: La aplicacion no esta construida![0m
    echo [93mPrimero debes ejecutar build.bat para construir la aplicacion.[0m
    echo.
    set /p choice="[96mDeseas construir la aplicacion ahora? (s/n): [0m"
    if /i "%%choice%%"=="s" (
        call build.bat
        exit /b %%ERRORLEVEL%%
    ) else if /i "%%choice%%"=="si" (
        call build.bat
        exit /b %%ERRORLEVEL%%
    ) else if /i "%%choice%%"=="y" (
        call build.bat
        exit /b %%ERRORLEVEL%%
    ) else if /i "%%choice%%"=="yes" (
        call build.bat
        exit /b %%ERRORLEVEL%%
    )
    pause
    exit /b 1
)

echo [96mEjecutando Glass Task Manager...[0m
echo [97mRuta:[0m %%CD%%\build\bin\gestor-tareas-glass.exe
echo.

REM Ejecutar la aplicación
start "" "%%CD%%\build\bin\gestor-tareas-glass.exe"

echo [92mAplicacion iniciada exitosamente![0m
timeout /t 2 /nobreak >nul
