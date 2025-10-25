// Main Personal Assistant Application
class PersonalAssistantApp {
constructor() {
this.isProcessing = false;
this.initializeApp();
}
initializeApp() {
this.setupEventListeners();
this.updateStats();
this.loadInitialTasks();
console.log('AI Personal Assistant initialized');
}
setupEventListeners() {
// Chat input handling
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
sendButton.addEventListener('click', () => this.handleMessage());
chatInput.addEventListener('keypress', (e) => {
if (e.key === 'Enter' && !e.shiftKey) {
e.preventDefault();
this.handleMessage();
}
});
// Quick action buttons
document.querySelectorAll('.quick-action-btn').forEach(btn => {
btn.addEventListener('click', (e) => {
const action = e.currentTarget.dataset.action;
this.handleQuickAction(action);
});
});
// Suggestion buttons
document.querySelectorAll('.suggestion-btn').forEach(btn => {
btn.addEventListener('click', (e) => {
chatInput.value = e.target.textContent.replace(/["""]/g, '');
this.handleMessage();
});
});
// Task checkboxes
document.addEventListener('change', (e) => {
if (e.target.type === 'checkbox' && e.target.closest('.task-item')) {
this.handleTaskCompletion(e.target);
}
});
// Panel controls
document.querySelectorAll('.control-btn').forEach(btn => {
btn.addEventListener('click', (e) => {
document.querySelectorAll('.control-btn').forEach(b =>
b.classList.remove('active'));
e.target.classList.add('active');
this.switchTaskView(e.target.dataset.view);
});
});
// Refresh insights
document.getElementById('refreshInsights').addEventListener('click', () => {
this.refreshInsights();
});
}
async handleMessage() {
if (this.isProcessing) return;
const input = document.getElementById('chatInput');
const message = input.value.trim();
if (!message) {
this.showNotification('Please enter a message', 'warning');
return;
}
this.isProcessing = true;
this.showLoadingState('Processing your request...');
try {
// Add user message to chat
this.addMessageToChat(message, 'user');
input.value = '';
// Process with AI
const response = await aiAssistant.processMessage(message);
// Add AI response to chat
this.addMessageToChat(response, 'ai');
// Update UI if tasks were modified
this.refreshTasks();
this.updateStats();
} catch (error) {
console.error('Message processing error:', error);
this.addMessageToChat('I apologize, but I encountered an issue processing
your request. Please try again.', 'ai');
} finally {
this.isProcessing = false;
  this.hideLoadingState();
}
}
addMessageToChat(message, sender) {
const chatContainer = document.getElementById('chatContainer');
const messageDiv = document.createElement('div');
messageDiv.className = `message ${sender}-message`;
const avatar = document.createElement('div');
avatar.className = 'message-avatar';
avatar.textContent = sender === 'user' ? '👤' : '🤖';
const content = document.createElement('div');
content.className = 'message-content';
content.innerHTML = this.formatMessage(message);
messageDiv.appendChild(avatar);
messageDiv.appendChild(content);
chatContainer.appendChild(messageDiv);
chatContainer.scrollTop = chatContainer.scrollHeight;
}
formatMessage(message) {
// Basic message formatting
return message
.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
.replace(/\*(.*?)\*/g, '<em>$1</em>')
.replace(/\n/g, '<br>');
}
handleQuickAction(action) {
const actionMessages = {
'add-task': 'I\'d like to add a new task',
'prioritize': 'Please help me prioritize my tasks',
'schedule': 'Can you help me optimize my schedule?',
'insights': 'Show me my productivity insights'
};
const message = actionMessages[action];
if (message) {
document.getElementById('chatInput').value = message;
this.handleMessage();
}
}
handleTaskCompletion(checkbox) {
const taskItem = checkbox.closest('.task-item');
const taskId = parseInt(taskItem.dataset.taskId);
if (checkbox.checked) {
taskItem.style.opacity = '0.6';
taskItem.style.textDecoration = 'line-through';
// Update task in AI assistant
const task = aiAssistant.tasks.find(t => t.id === taskId);
if (task) {
task.completed = true;
aiAssistant.saveTasks();
}
// Update stats
aiAssistant.userContext.completedToday++;
aiAssistant.saveUserContext();
this.updateStats();
this.showNotification('Task completed! Great job! 🎉', 'success');
} else {
taskItem.style.opacity = '1';
taskItem.style.textDecoration = 'none';
// Update task in AI assistant
const task = aiAssistant.tasks.find(t => t.id === taskId);
if (task) {
task.completed = false;
aiAssistant.saveTasks();
}
}
}
switchTaskView(view) {
// Implementation for different task views
this.showNotification(`Switched to ${view} view`, 'info');
}
refreshTasks() {
const highPriorityContainer = document.getElementById('highPriorityTasks');
const mediumPriorityContainer =
document.getElementById('mediumPriorityTasks');
const lowPriorityContainer = document.getElementById('lowPriorityTasks');
// Clear existing tasks
[highPriorityContainer, mediumPriorityContainer,
lowPriorityContainer].forEach(container => {
if (container) container.innerHTML = '';
});
// Group tasks by priority
const tasksByPriority = {
high: aiAssistant.tasks.filter(t => t.priority === 'high' && !t.completed),
medium: aiAssistant.tasks.filter(t => t.priority === 'medium' && !t.completed),
low: aiAssistant.tasks.filter(t => t.priority === 'low' && !t.completed)
};
// Render tasks
Object.entries(tasksByPriority).forEach(([priority, tasks]) => {
const container = document.getElementById(`${priority}PriorityTasks`);
if (!container) return;
tasks.forEach(task => {
const taskElement = this.createTaskElement(task);
  container.appendChild(taskElement);
});
});
}
createTaskElement(task) {
const taskDiv = document.createElement('div');
taskDiv.className = `task-item ${task.priority}-priority`;
taskDiv.dataset.taskId = task.id;
taskDiv.innerHTML = `
<div class="task-checkbox">
<input type="checkbox" id="task${task.id}" ${task.completed ? 'checked' : ''}>
<label for="task${task.id}"></label>
</div>
<div class="task-content">
<div class="task-title">${task.title}</div>
<div class="task-meta">
<span class="task-due">${task.dueDate ? `Due: ${new
Date(task.dueDate).toLocaleDateString()}` : 'No deadline'}</span>
<span class="task-ai-score">AI Priority: ${task.aiScore}%</span>
</div>
<div class="task-ai-reason">${this.generateTaskReason(task)}</div>
</div>
<div class="task-actions">
<button class="task-action-btn"
onclick="app.editTask(${task.id})">✏</button>
<button class="task-action-btn"
onclick="app.scheduleTask(${task.id})">⏰</button>
</div>
`;
return taskDiv;
}
generateTaskReason(task) {
const reasons = {
high: ['High impact on goals', 'Urgent deadline approaching', 'Critical for
success'],
medium: ['Important for progress', 'Moderate deadline pressure', 'Good for
momentum'],
low: ['Nice to have completed', 'Flexible timing', 'Low impact activity']
};
const reasonList = reasons[task.priority] || reasons.medium;
return reasonList[Math.floor(Math.random() * reasonList.length)];
}
updateStats() {
const stats = {
completedTasks: aiAssistant.userContext.completedToday,
timeManaged: '6.5h',
focusScore: aiAssistant.userContext.productivityScore + '%',
weeklyTrend: '+23%',
productivityScore: aiAssistant.userContext.productivityScore + '%'
};
Object.entries(stats).forEach(([key, value]) => {
const element = document.getElementById(key);
if (element) {
element.textContent = value;
}
});
}
async refreshInsights() {
this.showLoadingState('Generating fresh insights...');
try {
const insights = await aiAssistant.analyzeProductivityPatterns();
this.addMessageToChat(insights, 'ai');
this.showNotification('Insights refreshed!', 'success');
} catch (error) {
this.showNotification('Failed to refresh insights', 'error');
} finally {
this.hideLoadingState();
}
}
loadInitialTasks() {
this.refreshTasks();
}
// Task management methods
editTask(taskId) {
const task = aiAssistant.tasks.find(t => t.id === taskId);
if (task) {
const newTitle = prompt('Edit task:', task.title);
if (newTitle && newTitle.trim()) {
task.title = newTitle.trim();
aiAssistant.saveTasks();
this.refreshTasks();
this.showNotification('Task updated!', 'success');
}
}
}
scheduleTask(taskId) {
const task = aiAssistant.tasks.find(t => t.id === taskId);
if (task) {
const newDate = prompt('Set due date (YYYY-MM-DD):', task.dueDate || '');
if (newDate) {
task.dueDate = newDate;
aiAssistant.saveTasks();
this.refreshTasks();
this.showNotification('Task scheduled!', 'success');
}
}
}
// UI state management
showLoadingState(message = 'Processing...') {
const overlay = document.getElementById('loadingOverlay');
const messageElement = document.getElementById('loadingMessage');
if (messageElement) messageElement.textContent = message;
if (overlay) overlay.style.display = 'flex';
}
hideLoadingState() {
const overlay = document.getElementById('loadingOverlay');
if (overlay) overlay.style.display = 'none';
}
showNotification(message, type = 'info') {
const notification = document.createElement('div');
notification.className = `notification ${type}`;
notification.textContent = message;
document.body.appendChild(notification);
setTimeout(() => {
notification.remove();
}, 3000);
}
}
// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
window.app = new PersonalAssistantApp();
});
// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
window.addEventListener('load', function() {
navigator.serviceWorker.register('/sw.js')
.then(function(registration) {
console.log('ServiceWorker registration successful');
})
.catch(function(err) {
console.log('ServiceWorker registration failed');
});
});
}
