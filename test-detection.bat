@echo off
echo =============================================
echo  TESTING GLASS TASK MANAGER - THEME DETECTION
echo =============================================
echo.
echo ✅ Mejoras implementadas:
echo    - No más desvanecimiento de ventana
echo    - Detección estable con historial
echo    - Captura de píxeles en bordes (sin ocultar ventana)
echo    - Botón de tema integrado en barra de título
echo    - Hystéresis para evitar cambios constantes
echo.
echo 🧪 Para probar:
echo    1. Mueve la aplicación sobre VS Code (modo claro/oscuro)
echo    2. Coloca ventanas de diferentes colores detrás
echo    3. Observa los logs en DevTools (F12)
echo    4. Prueba el botón manual (sol/luna) en la barra
echo.
echo 📊 Logs esperados:
echo    📊 Detectando: light/dark (recopilando datos)
echo    ⏸️ Tema estable: (sin cambio necesario)
echo    ✅ Tema cambiado a: (cambio confirmado)
echo.
echo 🎯 Intervalo: 5 segundos entre detecciones
echo 🛡️ Requiere 3 detecciones consistentes + 15%% diferencia
echo.
pause