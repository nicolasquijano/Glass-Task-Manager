@echo off
set CGO_ENABLED=1
echo Building with CGO_ENABLED=1...
wails build -clean
echo Build completed!
pause