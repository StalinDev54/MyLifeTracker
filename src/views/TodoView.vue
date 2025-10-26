<template>
    <div class="todo-container">
        <!-- 页面标题 -->
        <div class="page-header">
            <h1>专注任务管理</h1>
            <mdui-button-icon @click="openAddTaskDialog" class="add-button">
                <mdui-icon name="add"></mdui-icon>
            </mdui-button-icon>
        </div>

        <!-- 任务统计 -->
        <div class="task-stats">
            <div class="stat-card">
                <div class="stat-value">{{ inProgressTasks.length }}</div>
                <div class="stat-label">进行中</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{{ pendingTasks.length }}</div>
                <div class="stat-label">待办</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{{ completedTasksCount }}</div>
                <div class="stat-label">已完成</div>
            </div>
        </div>

        <!-- 进行中的任务 -->
        <div class="task-section" v-if="inProgressTasks.length > 0">
            <div class="section-header">
                <h2>进行中</h2>
                <span class="task-count">{{ inProgressTasks.length }}</span>
            </div>
            <div class="task-list">
                <div v-for="task in inProgressTasks" :key="task.id" class="task-item in-progress">
                    <div class="task-content">
                        <mdui-icon name="play_circle" class="task-icon"></mdui-icon>
                        <div class="task-info">
                            <div class="task-name">{{ task.name }}</div>
                            <div class="task-meta">
                                <span class="elapsed-time">{{ formatElapsedTime(task) }}</span>
                                <span class="estimated-time">{{ formatEstimatedTime(task) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-actions">
                        <mdui-button-icon @click="toggleTaskStatus(task)">
                            <mdui-icon name="pause"></mdui-icon>
                        </mdui-button-icon>
                        <mdui-button-icon @click="openEditTaskDialog(task)">
                            <mdui-icon name="edit"></mdui-icon>
                        </mdui-button-icon>
                        <mdui-button-icon @click="deleteTask(task)">
                            <mdui-icon name="delete"></mdui-icon>
                        </mdui-button-icon>
                    </div>
                </div>
            </div>
        </div>

        <!-- 待办任务 -->
        <div class="task-section" v-if="pendingTasks.length > 0">
            <div class="section-header">
                <h2>待办任务</h2>
                <span class="task-count">{{ pendingTasks.length }}</span>
            </div>
            <div class="task-list">
                <div v-for="task in pendingTasks" :key="task.id" class="task-item pending">
                    <div class="task-content">
                        <mdui-icon name="hourglass_empty" class="task-icon"></mdui-icon>
                        <div class="task-info">
                            <div class="task-name">{{ task.name }}</div>
                            <div class="task-meta">
                                <span class="estimated-time">{{ formatEstimatedTime(task) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-actions">
                        <mdui-button-icon @click="toggleTaskStatus(task)">
                            <mdui-icon name="play_arrow"></mdui-icon>
                        </mdui-button-icon>
                        <mdui-button-icon @click="openEditTaskDialog(task)">
                            <mdui-icon name="edit"></mdui-icon>
                        </mdui-button-icon>
                        <mdui-button-icon @click="deleteTask(task)">
                            <mdui-icon name="delete"></mdui-icon>
                        </mdui-button-icon>
                    </div>
                </div>
            </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-if="inProgressTasks.length === 0 && pendingTasks.length === 0">
            <mdui-icon name="task" class="empty-icon"></mdui-icon>
            <p>暂无任务，点击右上角添加任务</p>
        </div>

        <!-- 添加/编辑任务对话框 -->
        <mdui-dialog ref="taskDialog" :open="isTaskDialogOpen" @close="handleDialogClose" class="task-dialog">
            <div class="dialog-content">
                <h2>{{ editingTask ? '编辑任务' : '添加任务' }}</h2>
                <div class="form-group">
                    <mdui-text-field v-model="taskForm.name" label="任务名称" required></mdui-text-field>
                </div>
                <div class="form-group">
                    <mdui-select v-model="taskForm.status" label="任务状态" @change="onStatusChange" @click.stop>
                        <mdui-menu-item value="pending">待办</mdui-menu-item>
                        <mdui-menu-item value="in-progress">进行中</mdui-menu-item>
                    </mdui-select>
                </div>
                <div class="form-group">
                    <div class="duration-selector">
                        <label class="duration-label">预估时长</label>
                        <div class="duration-options">
                            <mdui-button v-for="option in durationOptions" :key="option.value"
                                :variant="taskForm.estimatedDuration === option.value ? 'filled' : 'outlined'"
                                @click="selectDuration(option.value)" class="duration-button">
                                {{ option.label }}
                            </mdui-button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="dialog-actions" slot="action">
                <mdui-button @click="closeTaskDialog" variant="text">取消</mdui-button>
                <mdui-button @click="saveTask" variant="filled">保存</mdui-button>
            </div>
        </mdui-dialog>

        <!-- 删除确认对话框 -->
        <mdui-dialog ref="confirmDialog" :open="isConfirmDialogOpen" @close="handleConfirmDialogClose"
            class="confirm-dialog">
            <div class="dialog-content">
                <h2>确认删除</h2>
                <p>确定要删除任务 "{{ taskToDelete?.name }}" 吗？此操作不可撤销。</p>
            </div>
            <div class="dialog-actions" slot="action">
                <mdui-button @click="closeConfirmDialog" variant="text">取消</mdui-button>
                <mdui-button @click="confirmDeleteTask" variant="tonal">删除</mdui-button>
            </div>
        </mdui-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { snackbar } from 'mdui/functions/snackbar.js'

// 任务数据
const tasks = ref({
    inProgress: [],
    pending: []
})

// 对话框状态
const isTaskDialogOpen = ref(false)
const isConfirmDialogOpen = ref(false)

// 预估时间选项
const durationOptions = [
    { value: 15, label: '15分钟' },
    { value: 30, label: '30分钟' },
    { value: 45, label: '45分钟' },
    { value: 60, label: '1小时' },
    { value: 90, label: '1小时30分钟' },
    { value: 120, label: '2小时' },
    { value: 150, label: '2小时30分钟' },
    { value: 180, label: '3小时' },
    { value: 240, label: '4小时' }
]

// 表单数据
const taskForm = ref({
    name: '',
    status: 'pending',
    estimatedDuration: 30 // 默认30分钟
})

// 编辑中的任务
const editingTask = ref(null)

// 待删除的任务
const taskToDelete = ref(null)

// 定时器引用
const timer = ref(null)

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// 计算属性
const inProgressTasks = computed(() => tasks.value.inProgress)
const pendingTasks = computed(() => tasks.value.pending)

const completedTasksCount = computed(() => {
    // 这里可以根据实际需求计算已完成任务数量
    return 0
})

// 格式化已进行时间
const formatElapsedTime = (task) => {
    if (!task.startTime) return '刚刚开始'

    const elapsedMs = Date.now() - task.startTime
    const elapsedSeconds = Math.floor(elapsedMs / 1000)

    const hours = Math.floor(elapsedSeconds / 3600)
    const minutes = Math.floor((elapsedSeconds % 3600) / 60)
    const seconds = elapsedSeconds % 60

    if (hours > 0) {
        return `${hours}小时${minutes}分钟`
    } else if (minutes > 0) {
        return `${minutes}分钟${seconds}秒`
    } else {
        return `${seconds}秒`
    }
}

// 格式化预估时间
const formatEstimatedTime = (task) => {
    // 确保预估时长是一个有效数字
    const estimatedDuration = task.estimatedDuration || 0;

    if (estimatedDuration <= 0) return '无预估'

    if (estimatedDuration >= 60) {
        const hours = Math.floor(estimatedDuration / 60)
        const remainingMinutes = estimatedDuration % 60
        if (remainingMinutes === 0) {
            return `${hours}小时`
        } else {
            return `${hours}小时${remainingMinutes}分钟`
        }
    } else {
        return `${estimatedDuration}分钟`
    }
}

// 选择预估时长
const selectDuration = (value) => {
    taskForm.value.estimatedDuration = value
}

// 处理状态变更事件
const onStatusChange = (event) => {
    // 阻止事件冒泡，防止对话框关闭
    event.stopPropagation()
    // 更新表单状态
    taskForm.value.status = event.target.value
}

// 处理对话框关闭事件
const handleDialogClose = (event) => {
    // 阻止对话框关闭事件的默认行为
    // 只有在特定条件下才允许关闭对话框
    if (event.target === event.currentTarget) {
        closeTaskDialog()
    }
}

// 处理确认对话框关闭事件
const handleConfirmDialogClose = (event) => {
    // 阻止对话框关闭事件的默认行为
    if (event.target === event.currentTarget) {
        closeConfirmDialog()
    }
}

// 打开添加任务对话框
const openAddTaskDialog = () => {
    editingTask.value = null
    taskForm.value = {
        name: '',
        status: 'pending',
        estimatedDuration: 30 // 默认30分钟
    }
    isTaskDialogOpen.value = true
}

// 打开编辑任务对话框
const openEditTaskDialog = (task) => {
    editingTask.value = task
    taskForm.value = {
        name: task.name,
        status: task.status,
        estimatedDuration: task.estimatedDuration && !isNaN(task.estimatedDuration) ? task.estimatedDuration : 30 // 默认30分钟
    }
    isTaskDialogOpen.value = true
}

// 关闭任务对话框
const closeTaskDialog = () => {
    isTaskDialogOpen.value = false
    editingTask.value = null
}

// 保存任务
const saveTask = async () => {
    if (!taskForm.value.name.trim()) {
        snackbar({ message: '任务名称不能为空' })
        return
    }

    // 确保预估时长是有效数字
    const estimatedDuration = parseInt(taskForm.value.estimatedDuration)
    if (isNaN(estimatedDuration) || estimatedDuration < 0) {
        taskForm.value.estimatedDuration = 0
    }

    try {
        if (editingTask.value) {
            // 编辑任务
            await updateTask(editingTask.value)
        } else {
            // 添加新任务
            await createTask()
        }

        closeTaskDialog()
        snackbar({ message: editingTask.value ? '任务更新成功' : '任务添加成功' })
    } catch (error) {
        console.error('保存任务失败:', error)
        snackbar({ message: '保存任务失败: ' + error.message })
    }
}

// 创建新任务
const createTask = async () => {
    // 确保预估时长是有效数字
    const estimatedDuration = parseInt(taskForm.value.estimatedDuration)

    const newTask = {
        id: Date.now().toString(),
        name: taskForm.value.name,
        status: taskForm.value.status,
        estimatedDuration: !isNaN(estimatedDuration) && estimatedDuration > 0 ? estimatedDuration : 0,
        startTime: taskForm.value.status === 'in-progress' ? Date.now() : null,
        accumulatedTime: 0
    }

    if (taskForm.value.status === 'in-progress') {
        tasks.value.inProgress.push(newTask)
    } else {
        tasks.value.pending.push(newTask)
    }

    await syncTasksToServer()
}

// 更新任务
const updateTask = async (task) => {
    // 确保预估时长是有效数字
    const estimatedDuration = parseInt(taskForm.value.estimatedDuration)

    // 找到任务并更新
    let taskFound = false

    // 在进行中的任务中查找
    const inProgressIndex = tasks.value.inProgress.findIndex(t => t.id === task.id)
    if (inProgressIndex !== -1) {
        tasks.value.inProgress[inProgressIndex] = {
            ...tasks.value.inProgress[inProgressIndex],
            name: taskForm.value.name,
            status: taskForm.value.status,
            estimatedDuration: !isNaN(estimatedDuration) && estimatedDuration > 0 ? estimatedDuration : 0
        }
        taskFound = true
    }

    // 在待办任务中查找
    const pendingIndex = tasks.value.pending.findIndex(t => t.id === task.id)
    if (pendingIndex !== -1) {
        tasks.value.pending[pendingIndex] = {
            ...tasks.value.pending[pendingIndex],
            name: taskForm.value.name,
            status: taskForm.value.status,
            estimatedDuration: !isNaN(estimatedDuration) && estimatedDuration > 0 ? estimatedDuration : 0
        }
        taskFound = true
    }

    // 如果任务状态发生变化，需要移动任务
    if (taskFound) {
        const updatedTask = taskForm.value.status === 'in-progress'
            ? tasks.value.inProgress.find(t => t.id === task.id)
            : tasks.value.pending.find(t => t.id === task.id)

        // 如果状态发生变化，需要重新整理任务列表
        if (updatedTask && updatedTask.status !== taskForm.value.status) {
            // 从原列表中移除
            if (taskForm.value.status === 'pending') {
                tasks.value.inProgress = tasks.value.inProgress.filter(t => t.id !== task.id)
                tasks.value.pending.push({
                    ...updatedTask,
                    status: 'pending',
                    startTime: null
                })
            } else {
                tasks.value.pending = tasks.value.pending.filter(t => t.id !== task.id)
                tasks.value.inProgress.push({
                    ...updatedTask,
                    status: 'in-progress',
                    startTime: Date.now()
                })
            }
        }
    }

    await syncTasksToServer()
}

// 切换任务状态
const toggleTaskStatus = async (task) => {
    try {
        const baseUrl = API_BASE_URL || ''
        const response = await fetch(`${baseUrl}/api/focus-tasks/toggle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Key': '1545433540' // 默认密钥
            },
            body: JSON.stringify({
                taskId: task.id,
                action: task.status === 'in-progress' ? 'pause' : 'start'
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
            // 更新本地任务数据
            tasks.value = result.data.allTasks
            snackbar({
                message: task.status === 'in-progress' ? '任务已暂停' : '任务已开始'
            })
        } else {
            throw new Error(result.error || '操作失败')
        }
    } catch (error) {
        console.error('切换任务状态失败:', error)
        snackbar({ message: '切换任务状态失败: ' + error.message })
    }
}

// 删除任务
const deleteTask = (task) => {
    taskToDelete.value = task
    isConfirmDialogOpen.value = true
}

// 关闭确认对话框
const closeConfirmDialog = () => {
    isConfirmDialogOpen.value = false
    taskToDelete.value = null
}

// 确认删除任务
const confirmDeleteTask = async () => {
    if (!taskToDelete.value) return

    try {
        // 从本地数据中移除任务
        if (taskToDelete.value.status === 'in-progress') {
            tasks.value.inProgress = tasks.value.inProgress.filter(t => t.id !== taskToDelete.value.id)
        } else {
            tasks.value.pending = tasks.value.pending.filter(t => t.id !== taskToDelete.value.id)
        }

        // 同步到服务器
        await syncTasksToServer()

        snackbar({ message: '任务删除成功' })
    } catch (error) {
        console.error('删除任务失败:', error)
        snackbar({ message: '删除任务失败: ' + error.message })
    } finally {
        closeConfirmDialog()
    }
}

// 同步任务到服务器
const syncTasksToServer = async () => {
    try {
        const baseUrl = API_BASE_URL || ''
        const response = await fetch(`${baseUrl}/api/focus-tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Key': '1545433540' // 默认密钥
            },
            body: JSON.stringify({
                inProgress: tasks.value.inProgress,
                pending: tasks.value.pending
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
            throw new Error(result.error || '同步失败')
        }
    } catch (error) {
        console.error('同步任务到服务器失败:', error)
        throw error
    }
}

// 从服务器获取任务数据
const fetchTasksFromServer = async () => {
    try {
        const baseUrl = API_BASE_URL || ''
        const response = await fetch(`${baseUrl}/api/focus-tasks`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
            tasks.value = result.data
        } else {
            throw new Error(result.error || '获取任务数据失败')
        }
    } catch (error) {
        console.error('获取任务数据失败:', error)
        snackbar({ message: '获取任务数据失败: ' + error.message })
    }
}

// 组件挂载时获取任务数据
onMounted(async () => {
    await fetchTasksFromServer()

    // 启动定时器，每秒更新进行中任务的时间
    timer.value = setInterval(() => {
        if (tasks.value.inProgress.length > 0) {
            // 触发重新渲染以更新时间显示
            tasks.value = { ...tasks.value }
        }
    }, 1000)
})

// 组件卸载时清理定时器
onUnmounted(() => {
    if (timer.value) {
        clearInterval(timer.value)
    }
})
</script>

<style scoped>
.todo-container {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.page-header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
}

.add-button {
    background-color: #007AFF;
    color: white;
    border-radius: 50%;
}

.task-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
}

.stat-card {
    flex: 1;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 16px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #007AFF;
    margin-bottom: 4px;
}

.stat-label {
    font-size: 14px;
    color: #8E8E93;
}

.task-section {
    margin-bottom: 32px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.section-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
}

.task-count {
    background: #007AFF;
    color: white;
    border-radius: 12px;
    padding: 2px 8px;
    font-size: 12px;
}

.task-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.task-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.task-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.task-item.in-progress {
    border-left: 4px solid #34C759;
}

.task-item.pending {
    border-left: 4px solid #FF9500;
}

.task-content {
    display: flex;
    align-items: center;
    flex: 1;
}

.task-icon {
    font-size: 24px;
    margin-right: 12px;
}

.task-info {
    flex: 1;
    min-width: 0;
    /* 允许文本换行 */
}

.task-name {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 4px;
    word-break: break-word;
}

.task-meta {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    /* 允许换行 */
}

.elapsed-time {
    font-size: 13px;
    color: #34C759;
    font-weight: 500;
    white-space: nowrap;
}

.estimated-time {
    font-size: 13px;
    color: #8E8E93;
    white-space: nowrap;
}

.task-actions {
    display: flex;
    gap: 8px;
}

.empty-state {
    text-align: center;
    padding: 48px 20px;
    color: #8E8E93;
}

.empty-icon {
    font-size: 48px;
    opacity: 0.3;
    margin-bottom: 16px;
}

.dialog-content {
    padding: 24px;
}

.dialog-content h2 {
    margin-top: 0;
    margin-bottom: 24px;
}

.form-group {
    margin-bottom: 20px;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
}

/* 预估时长选择器样式 */
.duration-selector {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.duration-label {
    font-size: 16px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.87);
}

.duration-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
    padding: 4px;
}

.duration-button {
    flex: 1 1 calc(50% - 4px);
    min-width: 120px;
    text-align: center;
    padding: 12px 8px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
}

/* 响应式设计优化 */
@media (max-width: 768px) {
    .todo-container {
        padding: 16px;
    }

    .task-stats {
        gap: 12px;
    }

    .stat-card {
        padding: 12px;
    }

    .stat-value {
        font-size: 20px;
    }

    .task-item {
        padding: 12px;
    }

    .task-meta {
        flex-direction: column;
        gap: 4px;
    }

    .dialog-content {
        padding: 16px;
    }

    .dialog-content h2 {
        font-size: 20px;
        margin-bottom: 16px;
    }

    .form-group {
        margin-bottom: 16px;
    }

    .task-dialog,
    .confirm-dialog {
        margin: 16px;
        width: calc(100% - 32px);
        max-height: calc(100% - 32px);
    }

    .duration-options {
        max-height: 180px;
    }

    .duration-button {
        flex: 1 1 calc(50% - 4px);
        min-width: 100px;
        padding: 10px 6px;
        font-size: 13px;
    }
}

@media (max-width: 480px) {
    .page-header h1 {
        font-size: 20px;
    }

    .stat-card {
        padding: 10px;
    }

    .stat-value {
        font-size: 18px;
    }

    .stat-label {
        font-size: 12px;
    }

    .task-item {
        padding: 10px;
    }

    .task-name {
        font-size: 14px;
    }

    .elapsed-time,
    .estimated-time {
        font-size: 12px;
    }

    .task-dialog,
    .confirm-dialog {
        margin: 8px;
        width: calc(100% - 16px);
        max-height: calc(100% - 16px);
    }

    .duration-options {
        max-height: 160px;
    }

    .duration-button {
        flex: 1 1 calc(50% - 4px);
        min-width: 90px;
        padding: 8px 4px;
        font-size: 12px;
    }
}

/* 确保滚动条在所有浏览器中显示 */
.duration-options::-webkit-scrollbar {
    width: 6px;
}

.duration-options::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
}

.duration-options::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
}

.duration-options::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.5);
}
</style>