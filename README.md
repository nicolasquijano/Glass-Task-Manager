# Glass Task Manager / Gestor de Tareas Glass

A beautiful, ultra-transparent task manager built with Go (Wails v2) and Vue.js, featuring native Windows Acrylic effects and elegant glass morphism design.

Un hermoso gestor de tareas ultra transparente construido con Go (Wails v2) y Vue.js, con efectos nativos Windows Acrylic y elegante diseño glassmorphism.

## Features / Características

### English
- **Ultra-transparent interface** with native Windows Acrylic backdrop
- **Hierarchical tasks** with drag & drop reordering
- **Subtasks support** with unlimited nesting levels
- **Always on top** option for persistent visibility
- **Frameless window** with custom controls
- **Glass morphism UI** with soft glowing buttons
- **Real-time notifications** with toast messages
- **Optimized performance** with prepared SQL statements
- **Data persistence** in SQLite database stored in Documents folder
- **Responsive design** optimized for desktop usage

### Español
- **Interfaz ultra transparente** con efecto nativo Windows Acrylic
- **Tareas jerárquicas** con reordenamiento por arrastrar y soltar
- **Soporte de subtareas** con niveles de anidamiento ilimitados
- **Siempre visible** opción para visibilidad persistente
- **Ventana sin marco** con controles personalizados
- **UI glassmorphism** con botones de brillo suave
- **Notificaciones en tiempo real** con mensajes toast
- **Rendimiento optimizado** con declaraciones SQL preparadas
- **Persistencia de datos** en base de datos SQLite almacenada en carpeta Documentos
- **Diseño responsivo** optimizado para uso de escritorio

## Screenshots / Capturas

![Glass Task Manager](docs/screenshot.png)

## Installation / Instalación

### Prerequisites / Prerrequisitos
- Windows 10/11
- Go 1.21+ 
- Node.js 16+
- Wails CLI v2

### Build / Compilar

#### English
1. Clone the repository:
```bash
git clone https://github.com/your-username/gestor-tareas-glass.git
cd gestor-tareas-glass
```

2. Install dependencies:
```bash
# Go dependencies
go mod tidy

# Frontend dependencies
cd frontend
npm install
cd ..
```

3. Build the application:
```bash
wails build
```

4. Run the executable from `build/bin/` folder.

#### Español
1. Clonar el repositorio:
```bash
git clone https://github.com/your-username/gestor-tareas-glass.git
cd gestor-tareas-glass
```

2. Instalar dependencias:
```bash
# Dependencias Go
go mod tidy

# Dependencias frontend
cd frontend
npm install
cd ..
```

3. Compilar la aplicación:
```bash
wails build
```

4. Ejecutar el archivo desde la carpeta `build/bin/`.

## Development / Desarrollo

### English
To run in development mode with hot reload:

```bash
wails dev
```

This will start the application with:
- Hot reload for frontend changes
- Go backend with live reload
- Developer tools access

### Español
Para ejecutar en modo desarrollo con recarga automática:

```bash
wails dev
```

Esto iniciará la aplicación con:
- Recarga automática para cambios del frontend
- Backend Go con recarga en vivo
- Acceso a herramientas de desarrollador

## Architecture / Arquitectura

### English
The application follows a clean architecture pattern:

**Backend (Go):**
- `main.go` - Application entry point and Wails configuration
- `app.go` - Core application logic and database operations
- SQLite database with optimized indices and prepared statements
- Connection pooling for improved performance

**Frontend (Vue.js):**
- `App.vue` - Main application component
- `components/` - Reusable UI components with glass effects
- `composables/useTasks.js` - Centralized state management
- Tailwind CSS for styling with custom glass morphism classes

### Español
La aplicación sigue un patrón de arquitectura limpia:

**Backend (Go):**
- `main.go` - Punto de entrada de la aplicación y configuración Wails
- `app.go` - Lógica central de la aplicación y operaciones de base de datos
- Base de datos SQLite con índices optimizados y declaraciones preparadas
- Pool de conexiones para mejor rendimiento

**Frontend (Vue.js):**
- `App.vue` - Componente principal de la aplicación
- `components/` - Componentes UI reutilizables con efectos glass
- `composables/useTasks.js` - Gestión de estado centralizada
- Tailwind CSS para estilos con clases personalizadas glassmorphism

## Key Components / Componentes Clave

### English
- **GlassButton** - Ultra-transparent buttons with soft glow effects
- **GlassInput** - Minimalist input fields with glass styling
- **GlassCard** - Container components with subtle transparency
- **GlassToast** - Notification system with colored variants
- **TreeTask** - Hierarchical task component with drag & drop
- **WindowControls** - Custom window controls for frameless design

### Español
- **GlassButton** - Botones ultra transparentes con efectos de brillo suave
- **GlassInput** - Campos de entrada minimalistas con estilo glass
- **GlassCard** - Componentes contenedor con transparencia sutil
- **GlassToast** - Sistema de notificaciones con variantes de color
- **TreeTask** - Componente de tarea jerárquica con arrastrar y soltar
- **WindowControls** - Controles de ventana personalizados para diseño sin marco

## Features Details / Detalles de Características

### Task Management / Gestión de Tareas
#### English
- Create tasks with simple text input
- Add unlimited subtasks to any task
- Mark tasks as complete/incomplete
- Delete tasks (cascading deletion for subtasks)
- Drag & drop reordering within same hierarchy level
- Expand/collapse task trees
- Persistent task state across sessions

#### Español
- Crear tareas con entrada de texto simple
- Añadir subtareas ilimitadas a cualquier tarea
- Marcar tareas como completas/incompletas
- Eliminar tareas (eliminación en cascada para subtareas)
- Reordenar arrastrando y soltando dentro del mismo nivel jerárquico
- Expandir/contraer árboles de tareas
- Estado persistente de tareas entre sesiones

### UI/UX Features / Características UI/UX
#### English
- **Ultra-transparent design** - Barely visible until interaction
- **Native Windows integration** - Uses Windows Acrylic backdrop
- **Soft glow effects** - Buttons have subtle constant glow
- **Hover interactions** - Intense glow on button hover
- **Smooth animations** - GPU-accelerated transitions
- **Responsive layout** - Adapts to different content sizes
- **Always on top option** - Stay visible over other applications

#### Español
- **Diseño ultra transparente** - Apenas visible hasta la interacción
- **Integración nativa Windows** - Usa fondo Windows Acrylic
- **Efectos de brillo suave** - Los botones tienen brillo constante sutil
- **Interacciones hover** - Brillo intenso al pasar sobre botones
- **Animaciones suaves** - Transiciones aceleradas por GPU
- **Layout responsivo** - Se adapta a diferentes tamaños de contenido
- **Opción siempre visible** - Permanecer visible sobre otras aplicaciones

## Data Storage / Almacenamiento de Datos

### English
The application stores data in:
- **Location**: `%USERPROFILE%/Documents/Gestor de Tareas Glass/`
- **Database**: `tasks.db` (SQLite)
- **Settings**: `settings.json`

Database features:
- Optimized with indices for fast queries
- Connection pooling for better performance
- Prepared statements to prevent SQL injection
- WAL mode for concurrent access
- Foreign key constraints for data integrity

### Español
La aplicación almacena datos en:
- **Ubicación**: `%USERPROFILE%/Documents/Gestor de Tareas Glass/`
- **Base de datos**: `tasks.db` (SQLite)
- **Configuraciones**: `settings.json`

Características de la base de datos:
- Optimizada con índices para consultas rápidas
- Pool de conexiones para mejor rendimiento
- Declaraciones preparadas para prevenir inyección SQL
- Modo WAL para acceso concurrente
- Restricciones de clave foránea para integridad de datos

## Performance Optimizations / Optimizaciones de Rendimiento

### English
- **Prepared SQL statements** for frequent database operations
- **Connection pooling** with configurable limits
- **GPU acceleration** for CSS animations and effects
- **Optimistic updates** in the frontend for responsive UI
- **Efficient Vue composables** for state management
- **Tree-shaking** and code splitting for smaller bundle size
- **Minimal DOM manipulation** with Vue's reactive system

### Español
- **Declaraciones SQL preparadas** para operaciones frecuentes de base de datos
- **Pool de conexiones** con límites configurables
- **Aceleración GPU** para animaciones y efectos CSS
- **Actualizaciones optimistas** en el frontend para UI responsiva
- **Composables Vue eficientes** para gestión de estado
- **Tree-shaking** y división de código para menor tamaño de bundle
- **Manipulación DOM mínima** con sistema reactivo de Vue

## Configuration / Configuración

### English
Available settings (stored in `settings.json`):
- `alwaysOnTop`: Keep window always visible over other applications

Window configuration:
- Size: 350x450 pixels (optimized for task management)
- Frameless with custom controls
- Translucent with Windows Acrylic backdrop
- Transparent WebView for seamless integration

### Español
Configuraciones disponibles (almacenadas en `settings.json`):
- `alwaysOnTop`: Mantener ventana siempre visible sobre otras aplicaciones

Configuración de ventana:
- Tamaño: 350x450 píxeles (optimizado para gestión de tareas)
- Sin marco con controles personalizados
- Translúcida con fondo Windows Acrylic
- WebView transparente para integración perfecta

## Contributing / Contribuir

### English
Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Español
¡Las contribuciones son bienvenidas! Por favor, siéntete libre de enviar un Pull Request.

1. Hacer fork del repositorio
2. Crear tu rama de características (`git checkout -b feature/CaracteristicaIncreible`)
3. Confirmar tus cambios (`git commit -m 'Añadir CaracteristicaIncreible'`)
4. Empujar a la rama (`git push origin feature/CaracteristicaIncreible`)
5. Abrir un Pull Request

## License / Licencia

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## Credits / Créditos

**Created by / Creado por:** Nicolas Quijano  
**Email:** nicoquijano@gmail.com  
**GitHub:** [@nicolasquijano](https://github.com/nicolasquijano)

### Technologies Used / Tecnologías Utilizadas
- [Wails v2](https://wails.io/) - Go + Web frontend framework
- [Vue.js 3](https://vuejs.org/) - Progressive JavaScript framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [SQLite](https://sqlite.org/) - Lightweight database engine
- [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) - Modern typography

### Special Thanks / Agradecimientos Especiales
- Wails community for excellent documentation and support
- Vue.js community for the reactive framework
- Windows team for native Acrylic effects API

---

**Glass Task Manager** - A transparent, elegant solution for modern task management.  
**Gestor de Tareas Glass** - Una solución transparente y elegante para la gestión moderna de tareas.

*Built with ❤️ and lots of ☕ by Nicolas Quijano*