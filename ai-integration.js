// AI Personal Assistant Integration
class AIPersonalAssistant {
constructor() {
this.groqApiKey = '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'; // Will be provided by instructor
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
if (messageLower.includes('add') && (messageLower.includes('task') ||
messageLower.includes('reminder'))) {
return { type: 'add_task', action: 'addTask', data: this.extractTaskData(message) };
}
if (messageLower.includes('prioritize') || messageLower.includes('priority')) {
return { type: 'prioritize', action: 'prioritizeTasks' };
}
if (messageLower.includes('schedule') || messageLower.includes('calendar')) {
return { type: 'schedule', action: 'optimizeSchedule' };
}
// Productivity insights
if (messageLower.includes('insight') || messageLower.includes('productivity') ||
messageLower.includes('analysis')) {
return { type: 'insights', action: 'generateInsights' };
}
// Focus and recommendations
if (messageLower.includes('focus') || messageLower.includes('what should') ||
messageLower.includes('recommend')) {
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
