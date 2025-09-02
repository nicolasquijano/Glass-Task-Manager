package main

import (
	"context"
	"encoding/json"
	"fmt"
	"image"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/kbinani/screenshot"
	"github.com/wailsapp/wails/v2/pkg/runtime"
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

// DataStore estructura para almacenar todos los datos
type DataStore struct {
	Tasks        []Task    `json:"tasks"`
	NextID       int       `json:"nextId"`
	Settings     Settings  `json:"settings"`
	LastModified time.Time `json:"lastModified"`
}

// App struct
type App struct {
	ctx         context.Context
	dataStore   *DataStore
	dataPath    string
	backupPath  string
	mutex       sync.RWMutex
	windowState *WindowState
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		windowState: &WindowState{IsActive: true},
	}
}

// startup is called when the app starts. The context passed
// in is saved and can be used to call runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	
	// Establecer rutas de archivos
	userHomeDir, err := os.UserHomeDir()
	if err != nil {
		log.Printf("Error getting user home dir: %v", err)
		a.dataPath = "glass_task_manager_data.json"
		a.backupPath = "glass_task_manager_backup.json"
	} else {
		dataDir := filepath.Join(userHomeDir, "GlassTaskManager")
		os.MkdirAll(dataDir, 0755)
		a.dataPath = filepath.Join(dataDir, "data.json")
		a.backupPath = filepath.Join(dataDir, "backup.json")
	}

	// Inicializar almacén de datos
	a.dataStore = &DataStore{
		Tasks:        []Task{},
		NextID:       1,
		Settings:     Settings{AlwaysOnTop: false},
		LastModified: time.Now(),
	}

	// Cargar datos existentes
	if err := a.loadData(); err != nil {
		log.Printf("Error loading data: %v", err)
		// Intentar cargar desde backup
		if backupErr := a.loadBackup(); backupErr != nil {
			log.Printf("Error loading backup: %v", backupErr)
			log.Printf("Starting with empty data store")
		} else {
			log.Printf("Successfully loaded from backup")
		}
	}

	// Iniciar sistema de backup automático (cada 5 minutos)
	go a.startAutoBackup()

	log.Printf("App started successfully. Data path: %s", a.dataPath)
}

// shutdown is called when the app is shutting down
func (a *App) shutdown(ctx context.Context) {
	// Guardar datos antes de cerrar
	if err := a.saveData(); err != nil {
		log.Printf("Error saving data on shutdown: %v", err)
	}
	
	// Crear backup final
	if err := a.createBackup(); err != nil {
		log.Printf("Error creating backup on shutdown: %v", err)
	}
	
	log.Println("App shut down")
}

// loadData carga los datos desde el archivo JSON
func (a *App) loadData() error {
	a.mutex.Lock()
	defer a.mutex.Unlock()

	if _, err := os.Stat(a.dataPath); os.IsNotExist(err) {
		log.Printf("Data file doesn't exist, starting with empty store")
		return nil
	}

	data, err := ioutil.ReadFile(a.dataPath)
	if err != nil {
		return fmt.Errorf("error reading data file: %v", err)
	}

	if len(data) == 0 {
		log.Printf("Data file is empty, starting with empty store")
		return nil
	}

	var store DataStore
	if err := json.Unmarshal(data, &store); err != nil {
		return fmt.Errorf("error unmarshaling data: %v", err)
	}

	a.dataStore = &store
	log.Printf("Loaded %d tasks from data file", len(a.dataStore.Tasks))
	return nil
}

// saveData guarda los datos al archivo JSON
func (a *App) saveData() error {
	a.mutex.Lock()
	defer a.mutex.Unlock()

	a.dataStore.LastModified = time.Now()

	data, err := json.MarshalIndent(a.dataStore, "", "  ")
	if err != nil {
		return fmt.Errorf("error marshaling data: %v", err)
	}

	// Escribir a archivo temporal primero
	tempPath := a.dataPath + ".tmp"
	if err := ioutil.WriteFile(tempPath, data, 0644); err != nil {
		return fmt.Errorf("error writing temp file: %v", err)
	}

	// Renombrar archivo temporal al definitivo (operación atómica)
	if err := os.Rename(tempPath, a.dataPath); err != nil {
		os.Remove(tempPath) // Limpiar archivo temporal en caso de error
		return fmt.Errorf("error renaming temp file: %v", err)
	}

	return nil
}

// loadBackup carga los datos desde el archivo de backup
func (a *App) loadBackup() error {
	a.mutex.Lock()
	defer a.mutex.Unlock()

	data, err := ioutil.ReadFile(a.backupPath)
	if err != nil {
		return fmt.Errorf("error reading backup file: %v", err)
	}

	var store DataStore
	if err := json.Unmarshal(data, &store); err != nil {
		return fmt.Errorf("error unmarshaling backup: %v", err)
	}

	a.dataStore = &store
	return nil
}

// createBackup crea una copia de seguridad
func (a *App) createBackup() error {
	a.mutex.RLock()
	defer a.mutex.RUnlock()

	data, err := json.MarshalIndent(a.dataStore, "", "  ")
	if err != nil {
		return fmt.Errorf("error marshaling backup data: %v", err)
	}

	if err := ioutil.WriteFile(a.backupPath, data, 0644); err != nil {
		return fmt.Errorf("error writing backup file: %v", err)
	}

	return nil
}

// startAutoBackup inicia el sistema de backup automático
func (a *App) startAutoBackup() {
	ticker := time.NewTicker(5 * time.Minute) // Backup cada 5 minutos
	defer ticker.Stop()

	for range ticker.C {
		if err := a.createBackup(); err != nil {
			log.Printf("Error creating auto backup: %v", err)
		} else {
			log.Printf("Auto backup created successfully")
		}
	}
}

// getNextID obtiene el siguiente ID disponible
func (a *App) getNextID() int {
	id := a.dataStore.NextID
	a.dataStore.NextID++
	return id
}

// buildTaskTree construye el árbol de tareas con hijos anidados
func (a *App) buildTaskTree(tasks []Task) []Task {
	taskMap := make(map[int]*Task)
	var rootTasks []Task

	// Crear mapa de todas las tareas
	for i := range tasks {
		task := tasks[i]
		task.Children = []Task{} // Inicializar slice de hijos
		taskMap[task.ID] = &task
	}

	// Construir árbol
	for _, task := range taskMap {
		if task.ParentID == nil {
			rootTasks = append(rootTasks, *task)
		} else if parent, exists := taskMap[*task.ParentID]; exists {
			parent.Children = append(parent.Children, *task)
		}
	}

	return rootTasks
}

// GetTasks returns all tasks as a tree structure
func (a *App) GetTasks() ([]Task, error) {
	a.mutex.RLock()
	defer a.mutex.RUnlock()

	tree := a.buildTaskTree(a.dataStore.Tasks)
	log.Printf("Returning %d root tasks", len(tree))
	return tree, nil
}

// AddTask adds a new task
func (a *App) AddTask(text string) (*Task, error) {
	if strings.TrimSpace(text) == "" {
		return nil, fmt.Errorf("task text cannot be empty")
	}

	a.mutex.Lock()
	defer a.mutex.Unlock()

	task := Task{
		ID:         a.getNextID(),
		Text:       strings.TrimSpace(text),
		Completed:  false,
		ParentID:   nil,
		Level:      0,
		IsExpanded: true,
		SortOrder:  len(a.dataStore.Tasks),
	}

	a.dataStore.Tasks = append(a.dataStore.Tasks, task)
	
	if err := a.saveData(); err != nil {
		// Rollback
		a.dataStore.Tasks = a.dataStore.Tasks[:len(a.dataStore.Tasks)-1]
		a.dataStore.NextID--
		return nil, fmt.Errorf("error saving task: %v", err)
	}

	log.Printf("Added task: %d - %s", task.ID, task.Text)
	return &task, nil
}

// AddSubTask adds a subtask to a parent task
func (a *App) AddSubTask(parentID int, text string) (*Task, error) {
	if strings.TrimSpace(text) == "" {
		return nil, fmt.Errorf("subtask text cannot be empty")
	}

	a.mutex.Lock()
	defer a.mutex.Unlock()

	// Verificar que el padre existe
	parentFound := false
	parentLevel := 0
	for _, task := range a.dataStore.Tasks {
		if task.ID == parentID {
			parentFound = true
			parentLevel = task.Level
			break
		}
	}

	if !parentFound {
		return nil, fmt.Errorf("parent task with ID %d not found", parentID)
	}

	// Crear subtarea
	subtask := Task{
		ID:         a.getNextID(),
		Text:       strings.TrimSpace(text),
		Completed:  false,
		ParentID:   &parentID,
		Level:      parentLevel + 1,
		IsExpanded: true,
		SortOrder:  len(a.dataStore.Tasks),
	}

	a.dataStore.Tasks = append(a.dataStore.Tasks, subtask)
	
	if err := a.saveData(); err != nil {
		// Rollback
		a.dataStore.Tasks = a.dataStore.Tasks[:len(a.dataStore.Tasks)-1]
		a.dataStore.NextID--
		return nil, fmt.Errorf("error saving subtask: %v", err)
	}

	log.Printf("Added subtask: %d - %s (parent: %d)", subtask.ID, subtask.Text, parentID)
	return &subtask, nil
}

// UpdateTask updates a task
func (a *App) UpdateTask(task Task) error {
	a.mutex.Lock()
	defer a.mutex.Unlock()

	// Encontrar y actualizar la tarea
	found := false
	for i, t := range a.dataStore.Tasks {
		if t.ID == task.ID {
			a.dataStore.Tasks[i] = task
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("task with ID %d not found", task.ID)
	}

	if err := a.saveData(); err != nil {
		return fmt.Errorf("error saving updated task: %v", err)
	}

	log.Printf("Updated task: %d - %s", task.ID, task.Text)
	return nil
}

// DeleteTask deletes a task and all its subtasks
func (a *App) DeleteTask(taskID int) error {
	a.mutex.Lock()
	defer a.mutex.Unlock()

	// Encontrar todas las tareas a eliminar (tarea + subtareas)
	var toDelete []int
	var findSubtasks func(parentID int)
	findSubtasks = func(parentID int) {
		for _, task := range a.dataStore.Tasks {
			if task.ParentID != nil && *task.ParentID == parentID {
				toDelete = append(toDelete, task.ID)
				findSubtasks(task.ID) // Recursivo para subtareas anidadas
			}
		}
	}

	toDelete = append(toDelete, taskID)
	findSubtasks(taskID)

	// Crear nueva lista sin las tareas eliminadas
	var newTasks []Task
	for _, task := range a.dataStore.Tasks {
		shouldDelete := false
		for _, deleteID := range toDelete {
			if task.ID == deleteID {
				shouldDelete = true
				break
			}
		}
		if !shouldDelete {
			newTasks = append(newTasks, task)
		}
	}

	a.dataStore.Tasks = newTasks

	if err := a.saveData(); err != nil {
		return fmt.Errorf("error saving after deletion: %v", err)
	}

	log.Printf("Deleted task %d and %d related tasks", taskID, len(toDelete)-1)
	return nil
}

// ToggleExpanded toggles the expanded state of a task
func (a *App) ToggleExpanded(taskID int) error {
	a.mutex.Lock()
	defer a.mutex.Unlock()

	for i, task := range a.dataStore.Tasks {
		if task.ID == taskID {
			a.dataStore.Tasks[i].IsExpanded = !task.IsExpanded
			
			if err := a.saveData(); err != nil {
				// Rollback
				a.dataStore.Tasks[i].IsExpanded = task.IsExpanded
				return fmt.Errorf("error saving expanded state: %v", err)
			}
			
			log.Printf("Toggled expanded state for task %d to %t", taskID, a.dataStore.Tasks[i].IsExpanded)
			return nil
		}
	}

	return fmt.Errorf("task with ID %d not found", taskID)
}

// ReorderTasks reorders tasks within the same level
func (a *App) ReorderTasks(taskIDs []int, parentID *int) error {
	a.mutex.Lock()
	defer a.mutex.Unlock()

	// Actualizar sort orders
	for i, taskID := range taskIDs {
		for j, task := range a.dataStore.Tasks {
			if task.ID == taskID {
				a.dataStore.Tasks[j].SortOrder = i
				break
			}
		}
	}

	if err := a.saveData(); err != nil {
		return fmt.Errorf("error saving reordered tasks: %v", err)
	}

	log.Printf("Reordered %d tasks", len(taskIDs))
	return nil
}

// ForceBackup creates a manual backup
func (a *App) ForceBackup() error {
	if err := a.createBackup(); err != nil {
		return fmt.Errorf("error creating backup: %v", err)
	}
	log.Printf("Manual backup created successfully")
	return nil
}

// GetLastBackupTime returns the last backup time
func (a *App) GetLastBackupTime() (string, error) {
	if _, err := os.Stat(a.backupPath); os.IsNotExist(err) {
		return "Nunca", nil
	}

	info, err := os.Stat(a.backupPath)
	if err != nil {
		return "", fmt.Errorf("error getting backup info: %v", err)
	}

	return info.ModTime().Format("2006-01-02 15:04:05"), nil
}

// Settings methods
func (a *App) IsAlwaysOnTop() (bool, error) {
	a.mutex.RLock()
	defer a.mutex.RUnlock()
	return a.dataStore.Settings.AlwaysOnTop, nil
}

func (a *App) ToggleAlwaysOnTop() error {
	a.mutex.Lock()
	defer a.mutex.Unlock()

	a.dataStore.Settings.AlwaysOnTop = !a.dataStore.Settings.AlwaysOnTop
	
	if err := a.saveData(); err != nil {
		// Rollback
		a.dataStore.Settings.AlwaysOnTop = !a.dataStore.Settings.AlwaysOnTop
		return fmt.Errorf("error saving settings: %v", err)
	}

	if a.dataStore.Settings.AlwaysOnTop {
		runtime.WindowSetAlwaysOnTop(a.ctx, true)
	} else {
		runtime.WindowSetAlwaysOnTop(a.ctx, false)
	}

	return nil
}

// Window event handlers
func (a *App) OnWindowFocus() {
	a.windowState.IsActive = true
	log.Println("Window focused")
}

func (a *App) OnWindowBlur() {
	a.windowState.IsActive = false
	log.Println("Window blurred")
}

// Background luminance detection (keeping existing implementation)
func (a *App) DetectBackgroundLuminance() BackgroundLuminance {
	img, err := a.captureScreenshotAtWindowPosition()
	if err != nil {
		return BackgroundLuminance{
			Error: fmt.Sprintf("Error capturing screenshot: %v", err),
		}
	}

	luminance := a.calculateAverageLuminance(img)
	isLight := luminance > 0.5

	return BackgroundLuminance{
		Luminance: luminance,
		IsLight:   isLight,
	}
}

func (a *App) captureScreenshotAtWindowPosition() (image.Image, error) {
	bounds := screenshot.GetDisplayBounds(0)
	img, err := screenshot.CaptureRect(bounds)
	if err != nil {
		return nil, fmt.Errorf("failed to capture screenshot: %v", err)
	}
	return img, nil
}

func (a *App) calculateAverageLuminance(img image.Image) float64 {
	bounds := img.Bounds()
	var totalLuminance float64
	var pixelCount int64

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			r, g, b, _ := img.At(x, y).RGBA()
			// Convert from 16-bit to 8-bit
			r, g, b = r>>8, g>>8, b>>8
			// Calculate relative luminance
			luminance := (0.299*float64(r) + 0.587*float64(g) + 0.114*float64(b)) / 255.0
			totalLuminance += luminance
			pixelCount++
		}
	}

	if pixelCount == 0 {
		return 0.0
	}

	return totalLuminance / float64(pixelCount)
}