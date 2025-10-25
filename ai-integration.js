Create ai-integration.js:
// AI Personal Assistant Integration
class AIPersonalAssistant {
    constructor() {
        this.groqApiKey = 'YOUR_API_KEY_HERE'; // Will be provided by instructor
        this.groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.conversationHistory = [];
        this.userContext = this.loadUserContext();
        this.tasks = this.loadTasks();
    }

    async processMessage(message) {
        try {
            const intent = this.analyzeIntent(message);
            const response = await this.generateResponse(message, intent);
            
            // Execute any actions based on intent
            if (intent.action) {
                await this.executeAction(intent);
            }
            
            this.addToHistory(message, response);
            return response;
            
        } catch (error) {
            console.error('AI Processing Error:', error);
            return this.generateFallbackResponse(message);
        }
    }

    analyzeIntent(message) {
        const messageLower = message.toLowerCase();
        
        // Task management intents
        if (messageLower.includes('add') && (messageLower.includes('task') || messageLower.includes('reminder'))) {
            return { type: 'add_task', action: 'addTask', data: this.extractTaskData(message) };
        }
        
        if (messageLower.includes('prioritize') || messageLower.includes('priority')) {
            return { type: 'prioritize', action: 'prioritizeTasks' };
        }
        
        if (messageLower.includes('schedule') || messageLower.includes('calendar')) {
            return { type: 'schedule', action: 'optimizeSchedule' };
        }
        
        // Productivity insights
        if (messageLower.includes('insight') || messageLower.includes('productivity') || messageLower.includes('analysis')) {
            return { type: 'insights', action: 'generateInsights' };
        }
        
        // Focus and recommendations
        if (messageLower.includes('focus') || messageLower.includes('what should') || messageLower.includes('recommend')) {
            return { type: 'recommendations', action: 'generateRecommendations' };
        }
        
        // General conversation
        return { type: 'conversation', action: null };
    }

    async generateResponse(message, intent) {
        const prompt = this.createPrompt(message, intent);
        
        try {
            const response = await fetch(this.groqUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [
                        {
                            role: 'system',
                            content: this.getSystemPrompt()
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 800,
                    top_p: 0.9
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
            
        } catch (error) {
            console.error('Groq API Error:', error);
            throw error;
        }
    }

    getSystemPrompt() {
        return `You are an advanced AI Personal Assistant specializing in productivity optimization and intelligent task management. You have deep expertise in:

CORE CAPABILITIES:
- Intelligent task prioritization using urgency/importance matrix
- Natural language processing for task creation and scheduling
- Productivity pattern analysis and optimization
- Time management and focus enhancement strategies
- Personalized recommendations based on user behavior

USER CONTEXT:
- Current tasks: ${this.tasks.length} active tasks
- Productivity score: ${this.userContext.productivityScore}%
- Peak hours: ${this.userContext.peakHours.join(', ')}
- Work style: ${this.userContext.workStyle}

RESPONSE GUIDELINES:
- Be proactive and solution-oriented
- Provide specific, actionable advice
- Use encouraging and motivational language
- Include time estimates and priority levels
- Suggest concrete next steps
- Reference user's productivity patterns when relevant
- Keep responses concise but comprehensive
- Use emojis sparingly but effectively for emphasis

TASK MANAGEMENT PRINCIPLES:
- High impact + Urgent = Do First (Priority 1)
- High impact + Not urgent = Schedule (Priority 2) 
- Low impact + Urgent = Delegate/Quick wins (Priority 3)
- Low impact + Not urgent = Eliminate/Later (Priority 4)

Always aim to maximize the user's productivity and well-being while maintaining a helpful, intelligent, and personable tone.`;
    }

    createPrompt(message, intent) {
        const contextInfo = {
            currentTime: new Date().toLocaleString(),
            tasksCount: this.tasks.length,
            completedToday: this.userContext.completedToday,
            productivityScore: this.userContext.productivityScore
        };

        let prompt = `USER MESSAGE: "${message}"
INTENT DETECTED: ${intent.type}
CURRENT CONTEXT: ${JSON.stringify(contextInfo)}`;

        if (intent.type === 'add_task' && intent.data) {
            prompt += `\nTASK TO ADD: ${JSON.stringify(intent.data)}`;
        }

        if (intent.type === 'prioritize') {
            prompt += `\nCURRENT TASKS: ${JSON.stringify(this.tasks.slice(0, 5))}`;
        }

        prompt += `\n\nProvide a helpful response that addresses the user's request while offering intelligent productivity insights and recommendations.`;

        return prompt;
    }

    extractTaskData(message) {
        // Simple extraction - in a real app, this would be more sophisticated
        const taskData = {
            title: message.replace(/add|task|reminder|todo/gi, '').trim(),
            priority: 'medium',
            dueDate: this.extractDate(message),
            category: this.extractCategory(message)
        };

        return taskData;
    }

    extractDate(message) {
        const datePatterns = [
            /tomorrow/i,
            /today/i,
            /next week/i,
            /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i,
            /\d{1,2}\/\d{1,2}/,
            /\d{1,2}:\d{2}/
        ];

        for (const pattern of datePatterns) {
            if (pattern.test(message)) {
                // Simple date extraction - would be more sophisticated in production
                return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            }
        }

        return null;
    }

    extractCategory(message) {
        const categories = {
            'work': /work|meeting|project|client|business/i,
            'personal': /personal|family|home|health/i,
            'learning': /learn|study|course|read|research/i,
            'fitness': /gym|exercise|workout|run|fitness/i
        };

        for (const [category, pattern] of Object.entries(categories)) {
            if (pattern.test(message)) {
                return category;
            }
        }

        return 'general';
    }

    async executeAction(intent) {
        switch (intent.action) {
            case 'addTask':
                this.addTask(intent.data);
                break;
            case 'prioritizeTasks':
                this.prioritizeTasks();
                break;
            case 'optimizeSchedule':
                this.optimizeSchedule();
                break;
            case 'generateInsights':
                return this.generateProductivityInsights();
            case 'generateRecommendations':
                return this.generateRecommendations();
        }
    }

    addTask(taskData) {
        const newTask = {
            id: Date.now(),
            title: taskData.title,
            priority: this.calculatePriority(taskData),
            dueDate: taskData.dueDate,
            category: taskData.category,
            completed: false,
            createdAt: new Date().toISOString(),
            aiScore: this.calculateAIScore(taskData)
        };

        this.tasks.push(newTask);
        this.saveTasks();
        
        // Update UI
        this.updateTaskDisplay();
    }

    calculatePriority(taskData) {
        // AI-powered priority calculation
        let score = 50; // Base score

        // Time sensitivity
        if (taskData.dueDate) {
            const daysUntilDue = (new Date(taskData.dueDate) - new Date()) / (1000 * 60 * 60 * 24);
            if (daysUntilDue <= 1) score += 30;
            else if (daysUntilDue <= 3) score += 20;
            else if (daysUntilDue <= 7) score += 10;
        }

        // Category importance
        const categoryWeights = {
            'work': 25,
            'personal': 15,
            'learning': 20,
            'fitness': 10,
            'general': 5
        };
        score += categoryWeights[taskData.category] || 5;

        // Keywords that indicate importance
        const importantKeywords = /urgent|important|critical|deadline|meeting|client|boss/i;
        if (importantKeywords.test(taskData.title)) {
            score += 20;
        }

        return score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
    }

    calculateAIScore(taskData) {
        // Generate AI confidence score for priority assessment
        let score = Math.random() * 20 + 70; // Base 70-90%

        if (taskData.dueDate) score += 5;
        if (taskData.category !== 'general') score += 3;
        
        return Math.round(score);
    }

    prioritizeTasks() {
        this.tasks.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        
        this.saveTasks();
        this.updateTaskDisplay();
    }

    generateProductivityInsights() {
        const insights = [
            `You've completed ${this.userContext.completedToday} tasks today - ${this.userContext.completedToday >= 5 ? 'excellent progress!' : 'you can do more!'}`,
            `Your productivity score is ${this.userContext.productivityScore}% - ${this.userContext.productivityScore >= 80 ? 'outstanding performance' : 'room for improvement'}`,
            `Peak productivity hours: ${this.userContext.peakHours.join(' and ')} - schedule important tasks during these times`,
            `You have ${this.tasks.filter(t => t.priority === 'high').length} high-priority tasks remaining`
        ];

        return insights[Math.floor(Math.random() * insights.length)];
    }

    generateRecommendations() {
        const recommendations = [
            "Focus on your top 3 high-priority tasks first - they'll give you the biggest impact",
            "Consider time-blocking your calendar to protect focus time for important work",
            "Take a 5-minute break every 25 minutes to maintain peak performance (Pomodoro technique)",
            "Review and update your task priorities weekly to stay aligned with your goals"
        ];

        return recommendations[Math.floor(Math.random() * recommendations.length)];
    }

    generateFallbackResponse(message) {
        const fallbackResponses = [
            "I understand you're looking for help with productivity. Could you be more specific about what you'd like to accomplish?",
            "I'm here to help optimize your productivity! Try asking me to add a task, prioritize your work, or get insights about your performance.",
            "Let me help you stay productive! You can ask me to schedule tasks, provide recommendations, or analyze your productivity patterns.",
            "I'm your AI productivity assistant. I can help with task management, scheduling, and providing personalized productivity insights."
        ];

        return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }

    // Data persistence methods
    loadUserContext() {
        const defaultContext = {
            productivityScore: 87,
            completedToday: 12,
            peakHours: ['9 AM - 11 AM', '2 PM - 4 PM'],
            workStyle: 'focused sprints',
            preferences: {
                notifications: true,
                aiSuggestions: true,
                timeBlocking: true
            }
        };

        try {
            const saved = localStorage.getItem('aiAssistantContext');
            return saved ? { ...defaultContext, ...JSON.parse(saved) } : defaultContext;
        } catch (error) {
            return defaultContext;
        }
    }

    saveUserContext() {
        try {
            localStorage.setItem('aiAssistantContext', JSON.stringify(this.userContext));
        } catch (error) {
            console.error('Failed to save user context:', error);
        }
    }

    loadTasks() {
        const defaultTasks = [
            {
                id: 1,
                title: "Complete quarterly business review presentation",
                priority: "high",
                dueDate: new Date().toISOString().split('T')[0],
                category: "work",
                completed: false,
                aiScore: 95
            },
            {
                id: 2,
                title: "Review and respond to client proposal",
                priority: "high",
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                category: "work",
                completed: false,
                aiScore: 88
            }
        ];

        try {
            const saved = localStorage.getItem('aiAssistantTasks');
            return saved ? JSON.parse(saved) : defaultTasks;
        } catch (error) {
            return defaultTasks;
        }
    }

    saveTasks() {
        try {
            localStorage.setItem('aiAssistantTasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Failed to save tasks:', error);
        }
    }

    updateTaskDisplay() {
        // This would update the UI - implementation depends on the main app structure
        if (window.app && window.app.refreshTasks) {
            window.app.refreshTasks();
        }
    }

    addToHistory(message, response) {
        this.conversationHistory.push({
            timestamp: new Date().toISOString(),
            message: message,
            response: response
        });

        // Keep only last 20 conversations
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-20);
        }
    }

    // Advanced AI features
    async analyzeProductivityPatterns() {
        const prompt = `Analyze this user's productivity data and provide insights:

TASKS: ${JSON.stringify(this.tasks)}
CONTEXT: ${JSON.stringify(this.userContext)}
HISTORY: ${JSON.stringify(this.conversationHistory.slice(-5))}

Provide:
1. Productivity pattern analysis
2. Optimization recommendations
3. Potential bottlenecks or issues
4. Personalized productivity tips

Be specific and actionable.`;

        try {
            const response = await this.generateResponse(prompt, { type: 'analysis' });
            return response;
        } catch (error) {
            return "I'm analyzing your productivity patterns and will provide insights shortly. In the meantime, focus on your high-priority tasks!";
        }
    }

    async suggestOptimalSchedule() {
        const prompt = `Create an optimal daily schedule for this user:

TASKS: ${JSON.stringify(this.tasks.filter(t => !t.completed))}
PEAK HOURS: ${this.userContext.peakHours.join(', ')}
WORK STYLE: ${this.userContext.workStyle}

Suggest:
1. Time blocks for each task
2. Break intervals
3. Buffer time for unexpected items
4. Energy management considerations

Format as a practical daily schedule.`;

        try {
            const response = await this.generateResponse(prompt, { type: 'scheduling' });
            return response;
        } catch (error) {
            return "I recommend starting with your highest priority tasks during your peak hours: " + this.userContext.peakHours[0];
        }
    }
}

// Initialize AI Assistant
const aiAssistant = new AIPersonalAssistant();
Step 7: Main Application Logic
Create script.js:
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
                document.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
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
            this.addMessageToChat('I apologize, but I encountered an issue processing your request. Please try again.', 'ai');
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
        const mediumPriorityContainer = document.getElementById('mediumPriorityTasks');
        const lowPriorityContainer = document.getElementById('lowPriorityTasks');

        // Clear existing tasks
        [highPriorityContainer, mediumPriorityContainer, lowPriorityContainer].forEach(container => {
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
                    <span class="task-due">${task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'No deadline'}</span>
                    <span class="task-ai-score">AI Priority: ${task.aiScore}%</span>
                </div>
                <div class="task-ai-reason">${this.generateTaskReason(task)}</div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn" onclick="app.editTask(${task.id})">✏️</button>
                <button class="task-action-btn" onclick="app.scheduleTask(${task.id})">⏰</button>
            </div>
        `;

        return taskDiv;
    }

    generateTaskReason(task) {
        const reasons = {
            high: ['High impact on goals', 'Urgent deadline approaching', 'Critical for success'],
            medium: ['Important for progress', 'Moderate deadline pressure', 'Good for momentum'],
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
