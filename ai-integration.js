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
    if (
      messageLower.includes('add') &&
      (messageLower.includes('task') || messageLower.includes('reminder') || messageLower.includes('meeting') || messageLower.includes('event'))
    ) {
      return { type: 'add_task', action: 'addTask', data: this.extractTaskData(message) };
    }

    if (messageLower.includes('prioritize') || messageLower.includes('priority')) {
      return { type: 'prioritize', action: 'prioritizeTasks' };
    }

    if (messageLower.includes('schedule') || messageLower.includes('calendar') || messageLower.includes('meeting')) {
      return { type: 'schedule', action: 'optimizeSchedule' };
    }

    // Productivity insights
    if (messageLower.includes('insight') || messageLower.includes('productivity') || messageLower.includes('analysis')) {
      return { type: 'insights', action: 'generateProductivityInsights' };
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
          model: 'mixtral-8x7b-32768',
          messages: [
            { role: 'system', content: this.getSystemPrompt() },
            { role: 'user', content: prompt }
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

    prompt += `

Provide a helpful response that addresses the user's request while offering intelligent productivity insights and recommendations.`;
    return prompt;
  }

  extractTaskData(message) {
    // Simple extraction - in a real app, this would be more sophisticated
    const taskData = {
      title: message.replace(/add|task|reminder|todo|meeting|event/gi, '').trim(),
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
      work: /work|meeting|project|client|business/i,
      personal: /personal|family|home|health/i,
      learning: /learn|study|course|read|research/i,
      fitness: /gym|exercise|workout|run|fitness/i
    };
    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(message)) return category;
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
      case 'generateProductivityInsights':
        return this.generateProductivityInsights();
      case 'generateRecommendations':
        return this.generateRecommendations();
      default:
        return null;
    }
  }

  addTask(taskData) {
    const newTask = {
      id: Date.now(),
      title: taskData.title || 'Untitled Task',
      priority: this.calculatePriority(taskData),
      dueDate: taskData.dueDate,
      category: taskData.category,
      completed: false,
      createdAt: new Date().toISOString(),
      aiScore: this.calculateAIScore(taskData)
    };
    this.tasks.push(newTask);
    this.saveTasks();
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
    const categoryWeights = { work: 25, personal: 15, learning: 20, fitness: 10, general: 5 };
    score += categoryWeights[taskData.category] || 5;

    // Keywords that indicate importance
    const importantKeywords = /urgent|important|critical|deadline|meeting|client|boss/i;
    if (importantKeywords.test(taskData.title)) score += 20;

    return score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
  }

  calculateAIScore(taskData) {
    // Generate AI confidence score for priority assessment
    let score = Math.random() * 20 + 70; // Base 70–90%
    if (taskData.dueDate) score += 5;
    if (taskData.category !== 'general') score += 3;
    return Math.round(score);
  }

  prioritizeTasks() {
    this.tasks.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
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
    const recs = [
      'Focus on your top 3 high-priority tasks first to get the biggest impact.',
      'Time-block your calendar to protect deep-work windows.',
      'Use 25/5 focus cycles (Pomodoro) to maintain peak performance.',
      'Review and update priorities weekly to stay aligned with goals.'
    ];
    return recs[Math.floor(Math.random() * recs.length)];
  }

  generateFallbackResponse() {
    const fallbacks = [
      'Tell me what you want to accomplish, and I’ll suggest the fastest next steps.',
      'Try: “add task: …”, “prioritize my tasks”, or “show my productivity insights”.',
      'I can schedule tasks, provide recommendations, and analyze your productivity patterns.',
      'Need momentum? Start with one high-priority task and a 25-minute focus block.'
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // Data persistence methods
  loadUserContext() {
    const defaults = {
      productivityScore: 87,
      completedToday: 12,
      peakHours: ['9 AM - 11 AM', '2 PM - 4 PM'],
      workStyle: 'focused sprints',
      preferences: { notifications: true, aiSuggestions: true, timeBlocking: true }
    };
    try {
      const saved = localStorage.getItem('aiAssistantContext');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  }

  saveUserContext() {
    try {
      localStorage.setItem('aiAssistantContext', JSON.stringify(this.userContext));
    } catch (err) {
      console.error('Failed to save user context:', err);
    }
  }

  loadTasks() {
    const defaults = [
      {
        id: 1,
        title: 'Complete quarterly business review presentation',
        priority: 'high',
        dueDate: new Date().toISOString().split('T')[0],
        category: 'work',
        completed: false,
        aiScore: 95
      },
      {
        id: 2,
        title: 'Review and respond to client proposal',
        priority: 'high',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'work',
        completed: false,
        aiScore: 88
      }
    ];
    try {
      const saved = localStorage.getItem('aiAssistantTasks');
      return saved ? JSON.parse(saved) : defaults;
    } catch {
      return defaults;
    }
  }

  saveTasks() {
    try {
      localStorage.setItem('aiAssistantTasks', JSON.stringify(this.tasks));
    } catch (err) {
      console.error('Failed to save tasks:', err);
    }
  }

  updateTaskDisplay() {
    // Re-render if the host app exposes a refresh hook
    if (window.app && typeof window.app.refreshTasks === 'function') {
      window.app.refreshTasks();
    }
  }

  

  addToHistory(message, response) {
    this.conversationHistory.push({
      timestamp: new Date().toISOString(),
      message,
      response
    });
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
    } catch {
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
    } catch {
      return `I recommend starting with your highest priority tasks during your peak hours: ${this.userContext.peakHours[0]}.`;
    }
  }
}

// Initialize AI Assistant
const aiAssistant = new AIPersonalAssistant();
window.aiAssistant = aiAssistant; // make it accessible to other scripts
