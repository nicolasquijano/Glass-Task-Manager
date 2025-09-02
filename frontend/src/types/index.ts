// Task related types
export interface Task {
  id: number
  text: string
  completed: boolean
  parentId?: number | null
  level: number
  isExpanded: boolean
  sortOrder: number
  children?: Task[]
}

export interface TaskStats {
  total: number
  completed: number
  pending: number
}

// Settings types
export interface Settings {
  alwaysOnTop: boolean
}

// Background luminance types
export interface BackgroundLuminance {
  luminance: number
  isLight: boolean
  error?: string
}

// Wails API types
export interface WailsAPI {
  AddTask: (text: string) => Promise<Task>
  AddSubTask: (parentId: number, text: string) => Promise<Task>
  GetTasks: () => Promise<Task[]>
  UpdateTask: (task: Task) => Promise<void>
  DeleteTask: (taskId: number) => Promise<void>
  ToggleExpanded: (taskId: number) => Promise<void>
  ReorderTasks: (taskIds: number[], parentId?: number | null) => Promise<void>
  ForceBackup: () => Promise<void>
  GetLastBackupTime: () => Promise<string>
  IsAlwaysOnTop: () => Promise<boolean>
  ToggleAlwaysOnTop: () => Promise<void>
  DetectBackgroundLuminance: () => Promise<BackgroundLuminance>
  OnWindowFocus: () => void
  OnWindowBlur: () => void
}

// Component event types
export interface AddSubTaskEvent {
  parentId: number
  text: string
}

export interface EditTaskEvent {
  id: number
  text: string
}

export interface ReorderTasksEvent {
  draggedTaskId: number
  targetTaskId: number
  parentId?: number | null
}

// Theme types
export type Theme = 'light' | 'dark'

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  show: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

// Validation result type
export interface ValidationResult {
  isValid: boolean
  issues: string[]
  totalTasks: number
}

declare global {
  interface Window {
    go?: {
      main: {
        App: WailsAPI
      }
    }
    $toast?: Toast
  }
}