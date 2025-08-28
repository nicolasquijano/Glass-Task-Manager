@echo off
echo Building with CGO_ENABLED=1...
set CGO_ENABLED=1
wails build -clean
echo Build completed!
echo.
if exist "build\bin\gestor-tareas-glass.exe" (
    echo ✅ Executable created successfully!
    echo Location: build\bin\gestor-tareas-glass.exe
) else (
    echo ❌ Build failed - executable not found
)
echo.
pause