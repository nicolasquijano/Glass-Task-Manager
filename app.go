package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"image"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"

	"github.com/kbinani/screenshot"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	_ "github.com/mattn/go-sqlite3"
)

// Task struct
type Task struct {
	ID         int    `json:"id"`
	Text       string `json:"text"`
	Completed  bool   `json:"completed"`
	ParentID   *int   `json:"parentId"`
	Level      int    `json:"level"`
	IsExpanded bool   `json:"isExpanded"`
	SortOrder  int    `json:"sortOrder"`
	Children   []Task `json:"children,omitempty"`
}

// Settings struct
type Settings struct {
	AlwaysOnTop bool `json:"alwaysOnTop"`
}

// WindowState struct to track focus state
type WindowState struct {
	IsActive bool `json:"isActive"`
}

// BackgroundLuminance struct para retornar datos de luminancia
type BackgroundLuminance struct {
	Luminance float64 `json:"luminance"`
	IsLight   bool    `json:"isLight"`
	Error     string  `json:"error,omitempty"`
}

// App struct
type App struct {
	ctx         context.Context
	db          *sql.DB
	settings    Settings
	windowState WindowState
	appDataDir  string // Directorio donde se guardan los datos
	// Prepared statements para mejor performance
	stmtGetTasks      *sql.Stmt
	stmtAddTask       *sql.Stmt
	stmtUpdateTask    *sql.Stmt
	stmtDeleteTask    *sql.Stmt
	stmtToggleExpand  *sql.Stmt
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		windowState: WindowState{IsActive: true},
	}
}

// startup is called when the app starts.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	
	// Obtener la carpeta Documentos del usuario
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Fatal("Error obteniendo directorio del usuario:", err)
	}
	
	documentsDir := filepath.Join(homeDir, "Documents")
	a.appDataDir = filepath.Join(documentsDir, "Gestor de Tareas Glass")
	
	// Crear el directorio de la aplicación si no existe
	if err := os.MkdirAll(a.appDataDir, 0755); err != nil {
		log.Fatal("Error creando directorio de datos:", err)
	}
	
	// Ruta completa de la base de datos
	dbPath := filepath.Join(a.appDataDir, "tasks.db")
	
	// Connect to the database con configuraciones optimizadas
	db, err := sql.Open("sqlite3", dbPath+"?_journal_mode=WAL&_synchronous=NORMAL&_cache_size=1000&_foreign_keys=ON")
	if err != nil {
		log.Fatal(err)
	}
	
	// Configurar connection pool
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(0) // Connections never expire
	
	a.db = db

	// Create the tasks table if it doesn't exist
	statement, err := a.db.Prepare(`
		CREATE TABLE IF NOT EXISTS tasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			text TEXT NOT NULL,
			completed BOOLEAN NOT NULL,
			parent_id INTEGER,
			level INTEGER DEFAULT 0,
			is_expanded BOOLEAN DEFAULT true,
			sort_order INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(parent_id) REFERENCES tasks(id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		log.Fatal(err)
	}
	_, err = statement.Exec()
	if err != nil {
		log.Fatal(err)
	}

	// Add missing columns if they don't exist (for migration from old structure)
	a.db.Exec("ALTER TABLE tasks ADD COLUMN parent_id INTEGER")
	a.db.Exec("ALTER TABLE tasks ADD COLUMN level INTEGER DEFAULT 0")
	a.db.Exec("ALTER TABLE tasks ADD COLUMN is_expanded BOOLEAN DEFAULT true")
	a.db.Exec("ALTER TABLE tasks ADD COLUMN sort_order INTEGER DEFAULT 0")
	a.db.Exec("ALTER TABLE tasks ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP")
	a.db.Exec("ALTER TABLE tasks ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP")

	// Optimización: Crear índices para mejorar performance de queries
	a.db.Exec("CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id)")
	a.db.Exec("CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(sort_order)")
	a.db.Exec("CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)")
	a.db.Exec("CREATE INDEX IF NOT EXISTS idx_tasks_parent_sort ON tasks(parent_id, sort_order)")
	a.db.Exec("CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at)")

	// Load settings
	err = a.loadSettings()
	if err != nil {
		log.Println("Error loading settings:", err)
		// Create default settings if file doesn't exist
		a.settings = Settings{AlwaysOnTop: true}
		a.saveSettings()
	}
	runtime.WindowSetAlwaysOnTop(a.ctx, a.settings.AlwaysOnTop)
	
	// Set up window focus events
	runtime.EventsOn(a.ctx, "window-focus", func(optionalData ...interface{}) {
		a.OnWindowFocus()
	})
	
	runtime.EventsOn(a.ctx, "window-blur", func(optionalData ...interface{}) {
		a.OnWindowBlur()
	})
	
	// Preparar statements para mejor performance
	a.prepareStatements()
}

// shutdown is called when the app closes.
func (a *App) shutdown(ctx context.Context) {
	// Cerrar prepared statements
	if a.stmtGetTasks != nil {
		a.stmtGetTasks.Close()
	}
	if a.stmtAddTask != nil {
		a.stmtAddTask.Close()
	}
	if a.stmtUpdateTask != nil {
		a.stmtUpdateTask.Close()
	}
	if a.stmtDeleteTask != nil {
		a.stmtDeleteTask.Close()
	}
	if a.stmtToggleExpand != nil {
		a.stmtToggleExpand.Close()
	}
	
	a.db.Close()
}

// prepareStatements prepara los statements más usados para mejor performance
func (a *App) prepareStatements() {
	var err error
	
	// Statement para obtener tareas optimizado
	a.stmtGetTasks, err = a.db.Prepare(`
		SELECT 
			id, 
			text, 
			completed, 
			COALESCE(parent_id, NULL) as parent_id,
			COALESCE(level, 0) as level,
			COALESCE(is_expanded, 1) as is_expanded,
			COALESCE(sort_order, 0) as sort_order
		FROM tasks 
		ORDER BY COALESCE(sort_order, 0), id ASC
	`)
	if err != nil {
		log.Printf("Error preparing GetTasks statement: %v", err)
	}
	
	// Statement para añadir tarea
	a.stmtAddTask, err = a.db.Prepare(`
		INSERT INTO tasks (text, completed, parent_id, level, is_expanded, sort_order, updated_at) 
		VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
	`)
	if err != nil {
		log.Printf("Error preparing AddTask statement: %v", err)
	}
	
	// Statement para actualizar tarea
	a.stmtUpdateTask, err = a.db.Prepare(`
		UPDATE tasks 
		SET text = ?, completed = ?, parent_id = ?, level = ?, is_expanded = ?, updated_at = CURRENT_TIMESTAMP 
		WHERE id = ?
	`)
	if err != nil {
		log.Printf("Error preparing UpdateTask statement: %v", err)
	}
	
	// Statement para eliminar tarea
	a.stmtDeleteTask, err = a.db.Prepare("DELETE FROM tasks WHERE id = ?")
	if err != nil {
		log.Printf("Error preparing DeleteTask statement: %v", err)
	}
	
	// Statement para toggle expand
	a.stmtToggleExpand, err = a.db.Prepare(`
		UPDATE tasks 
		SET is_expanded = NOT is_expanded, updated_at = CURRENT_TIMESTAMP 
		WHERE id = ?
	`)
	if err != nil {
		log.Printf("Error preparing ToggleExpand statement: %v", err)
	}
}

// loadSettings loads settings from settings.json
func (a *App) loadSettings() error {
	settingsPath := filepath.Join(a.appDataDir, "settings.json")
	file, err := os.Open(settingsPath)
	if err != nil {
		return err
	}
	defer file.Close()

	bytes, err := ioutil.ReadAll(file)
	if err != nil {
		return err
	}

	return json.Unmarshal(bytes, &a.settings)
}

// saveSettings saves settings to settings.json
func (a *App) saveSettings() error {
	bytes, err := json.MarshalIndent(a.settings, "", "  ")
	if err != nil {
		return err
	}

	settingsPath := filepath.Join(a.appDataDir, "settings.json")
	return ioutil.WriteFile(settingsPath, bytes, 0644)
}

// ToggleAlwaysOnTop toggles the always on top state of the window
func (a *App) ToggleAlwaysOnTop() {
	a.settings.AlwaysOnTop = !a.settings.AlwaysOnTop
	runtime.WindowSetAlwaysOnTop(a.ctx, a.settings.AlwaysOnTop)
	a.saveSettings()
}

// IsAlwaysOnTop returns the current always on top state of the window
func (a *App) IsAlwaysOnTop() bool {
	return a.settings.AlwaysOnTop
}

// OnWindowFocus handles window focus events
func (a *App) OnWindowFocus() {
	a.windowState.IsActive = true
	runtime.EventsEmit(a.ctx, "window:focus", a.windowState)
}

// OnWindowBlur handles window blur events
func (a *App) OnWindowBlur() {
	a.windowState.IsActive = false
	runtime.EventsEmit(a.ctx, "window:blur", a.windowState)
}

// GetWindowState returns the current window state
func (a *App) GetWindowState() WindowState {
	return a.windowState
}

// GetTasks returns all tasks in a tree structure
func (a *App) GetTasks() ([]Task, error) {
	// Usar prepared statement para mejor performance
	var rows *sql.Rows
	var err error
	
	if a.stmtGetTasks != nil {
		rows, err = a.stmtGetTasks.Query()
	} else {
		// Fallback si no hay prepared statement
		rows, err = a.db.Query(`
			SELECT 
				id, 
				text, 
				completed, 
				COALESCE(parent_id, NULL) as parent_id,
				COALESCE(level, 0) as level,
				COALESCE(is_expanded, 1) as is_expanded,
				COALESCE(sort_order, 0) as sort_order
			FROM tasks 
			ORDER BY COALESCE(sort_order, 0), id ASC
		`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	taskMap := make(map[int]*Task)

	// First pass: create all tasks
	for rows.Next() {
		var task Task
		var parentID sql.NullInt64
		if err := rows.Scan(&task.ID, &task.Text, &task.Completed, &parentID, &task.Level, &task.IsExpanded, &task.SortOrder); err != nil {
			return nil, err
		}

		if parentID.Valid {
			task.ParentID = new(int)
			*task.ParentID = int(parentID.Int64)
		}

		task.Children = []Task{}
		taskMap[task.ID] = &task
	}

	// Second pass: build tree structure
	var rootTasks []Task
	for _, task := range taskMap {
		if task.ParentID == nil {
			rootTasks = append(rootTasks, *task)
		} else {
			if parent, exists := taskMap[*task.ParentID]; exists {
				parent.Children = append(parent.Children, *task)
			}
		}
	}

	return rootTasks, nil
}

// AddTask adds a new root-level task
func (a *App) AddTask(text string) (Task, error) {
	// Get the highest sort_order for root tasks to append at the end
	var maxOrder int
	a.db.QueryRow("SELECT COALESCE(MAX(sort_order), -1) FROM tasks WHERE parent_id IS NULL").Scan(&maxOrder)
	newOrder := maxOrder + 1

	res, err := a.db.Exec("INSERT INTO tasks (text, completed, parent_id, level, is_expanded, sort_order) VALUES (?, ?, NULL, 0, 1, ?)", text, false, newOrder)
	if err != nil {
		return Task{}, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return Task{}, err
	}

	return Task{ID: int(id), Text: text, Completed: false, ParentID: nil, Level: 0, IsExpanded: true, SortOrder: newOrder, Children: []Task{}}, nil
}

// AddSubTask adds a subtask to a parent task
func (a *App) AddSubTask(parentID int, text string) (Task, error) {
	// Get parent task level, defaulting to 0 if not found
	var parentLevel int
	err := a.db.QueryRow("SELECT COALESCE(level, 0) FROM tasks WHERE id = ?", parentID).Scan(&parentLevel)
	if err != nil {
		parentLevel = 0 // Default level if query fails
	}

	// Get the highest sort_order for subtasks of this parent
	var maxOrder int
	a.db.QueryRow("SELECT COALESCE(MAX(sort_order), -1) FROM tasks WHERE parent_id = ?", parentID).Scan(&maxOrder)
	newOrder := maxOrder + 1

	newLevel := parentLevel + 1
	res, err := a.db.Exec("INSERT INTO tasks (text, completed, parent_id, level, is_expanded, sort_order) VALUES (?, ?, ?, ?, 1, ?)", text, false, parentID, newLevel, newOrder)
	if err != nil {
		return Task{}, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return Task{}, err
	}

	// Ensure parent is expanded to show the new subtask
	a.db.Exec("UPDATE tasks SET is_expanded = 1 WHERE id = ?", parentID)

	return Task{
		ID:         int(id),
		Text:       text,
		Completed:  false,
		ParentID:   &parentID,
		Level:      newLevel,
		IsExpanded: true,
		SortOrder:  newOrder,
		Children:   []Task{},
	}, nil
}

// UpdateTask updates an existing task
func (a *App) UpdateTask(task Task) error {
	var parentID interface{}
	if task.ParentID != nil {
		parentID = *task.ParentID
	}

	_, err := a.db.Exec("UPDATE tasks SET text = ?, completed = ?, parent_id = ?, level = ?, is_expanded = ? WHERE id = ?",
		task.Text, task.Completed, parentID, task.Level, task.IsExpanded, task.ID)
	return err
}

// ToggleExpanded toggles the expanded state of a task
func (a *App) ToggleExpanded(taskID int) error {
	if a.stmtToggleExpand != nil {
		_, err := a.stmtToggleExpand.Exec(taskID)
		return err
	}
	
	// Fallback si no hay prepared statement
	_, err := a.db.Exec("UPDATE tasks SET is_expanded = NOT is_expanded WHERE id = ?", taskID)
	return err
}

// ReorderTasks reorders tasks within the same parent level
func (a *App) ReorderTasks(taskIDs []int, parentID *int) error {
	// Start a transaction for atomic update
	tx, err := a.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Update sort_order for each task
	for i, taskID := range taskIDs {
		var query string
		var args []interface{}

		if parentID == nil {
			query = "UPDATE tasks SET sort_order = ? WHERE id = ? AND parent_id IS NULL"
			args = []interface{}{i, taskID}
		} else {
			query = "UPDATE tasks SET sort_order = ? WHERE id = ? AND parent_id = ?"
			args = []interface{}{i, taskID, *parentID}
		}

		_, err := tx.Exec(query, args...)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// DeleteTask deletes a task and all its subtasks (CASCADE)
func (a *App) DeleteTask(id int) error {
	_, err := a.db.Exec("DELETE FROM tasks WHERE id = ?", id)
	return err
}

// DetectBackgroundLuminance detecta la luminancia del fondo sin ocultar la ventana
func (a *App) DetectBackgroundLuminance() BackgroundLuminance {
	// Obtener dimensiones de la pantalla
	n := screenshot.NumActiveDisplays()
	if n == 0 {
		return BackgroundLuminance{
			Luminance: 0.3,
			IsLight:   false,
			Error:     "No se encontraron pantallas activas",
		}
	}

	// Obtener posición y tamaño de la ventana
	x, y := runtime.WindowGetPosition(a.ctx)
	width, height := runtime.WindowGetSize(a.ctx)

	// Validar que las coordenadas estén dentro de la pantalla
	bounds := screenshot.GetDisplayBounds(0)
	if x < bounds.Min.X || y < bounds.Min.Y || x+width > bounds.Max.X || y+height > bounds.Max.Y {
		// Si la ventana está parcialmente fuera de pantalla, usar pantalla completa
		x, y = bounds.Min.X, bounds.Min.Y
		width, height = bounds.Dx(), bounds.Dy()
	}

	// Capturar región más grande que incluya áreas alrededor de la ventana
	// para detectar el fondo sin esconder la ventana
	margin := 50
	captureX := x - margin
	captureY := y - margin  
	captureWidth := width + (2 * margin)
	captureHeight := height + (2 * margin)

	// Asegurar que la región de captura esté dentro de la pantalla
	if captureX < bounds.Min.X {
		captureX = bounds.Min.X
	}
	if captureY < bounds.Min.Y {
		captureY = bounds.Min.Y
	}
	if captureX + captureWidth > bounds.Max.X {
		captureWidth = bounds.Max.X - captureX
	}
	if captureY + captureHeight > bounds.Max.Y {
		captureHeight = bounds.Max.Y - captureY
	}

	// Capturar la región expandida SIN esconder la ventana
	img, err := screenshot.CaptureRect(image.Rect(captureX, captureY, captureX+captureWidth, captureY+captureHeight))

	if err != nil {
		log.Printf("Error capturando pantalla: %v", err)
		return BackgroundLuminance{
			Luminance: 0.3,
			IsLight:   false,
			Error:     "Error en captura de pantalla: " + err.Error(),
		}
	}

	// Samplear puntos en los BORDES de la imagen (donde está el fondo)
	// Evitamos el centro donde está nuestra ventana
	imgBounds := img.Bounds()
	samplePoints := []image.Point{
		// Esquinas externas
		{imgBounds.Min.X + 20, imgBounds.Min.Y + 20},
		{imgBounds.Max.X - 20, imgBounds.Min.Y + 20},
		{imgBounds.Min.X + 20, imgBounds.Max.Y - 20},
		{imgBounds.Max.X - 20, imgBounds.Max.Y - 20},
		// Bordes laterales
		{imgBounds.Min.X + 10, imgBounds.Min.Y + imgBounds.Dy()/2},
		{imgBounds.Max.X - 10, imgBounds.Min.Y + imgBounds.Dy()/2},
		// Bordes superior e inferior
		{imgBounds.Min.X + imgBounds.Dx()/2, imgBounds.Min.Y + 10},
		{imgBounds.Min.X + imgBounds.Dx()/2, imgBounds.Max.Y - 10},
	}

	var totalLuminance float64
	validSamples := 0

	for _, point := range samplePoints {
		if point.X >= imgBounds.Min.X && point.X < imgBounds.Max.X && 
		   point.Y >= imgBounds.Min.Y && point.Y < imgBounds.Max.Y {
			
			r, g, b, _ := img.At(point.X, point.Y).RGBA()
			
			// Convertir de uint32 a float64 y normalizar a 0-1
			rf := float64(r>>8) / 255.0
			gf := float64(g>>8) / 255.0
			bf := float64(b>>8) / 255.0
			
			// Calcular luminancia usando fórmula estándar
			luminance := 0.2126*rf + 0.7152*gf + 0.0722*bf
			totalLuminance += luminance
			validSamples++
		}
	}

	if validSamples == 0 {
		return BackgroundLuminance{
			Luminance: 0.3,
			IsLight:   false,
			Error:     "No se pudieron obtener muestras válidas",
		}
	}

	avgLuminance := totalLuminance / float64(validSamples)
	isLight := avgLuminance > 0.5

	log.Printf("Luminancia detectada (sin ocultar): %.3f, IsLight: %v, Samples: %d", 
		avgLuminance, isLight, validSamples)

	return BackgroundLuminance{
		Luminance: avgLuminance,
		IsLight:   isLight,
		Error:     "",
	}
}