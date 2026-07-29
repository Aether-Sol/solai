/* ==========================================
   1. FALLING FLOWERS BACKGROUND
========================================== */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let width, height, particles = [];

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height - height;
        this.size = Math.random() * 3 + 1;
        this.speedY = Math.random() * 1 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.color = `rgba(56, 189, 248, ${this.opacity})`;
    }
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        if (this.y > height) {
            this.y = -10;
            this.x = Math.random() * width;
        }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

for (let i = 0; i < 40; i++) particles.push(new Particle());
function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateParticles);
}
animateParticles();

/* ==========================================
   2. APP STATE & LOCAL STORAGE
========================================== */
let apiKey = localStorage.getItem('apiKey') || '';
let systemPrompt = localStorage.getItem('systemPrompt') || 'You are a helpful AI assistant.';
let currentTheme = localStorage.getItem('theme') || 'dark';

let savedConversations = JSON.parse(localStorage.getItem('savedChats')) || [];
let currentChatIndex = null;
let conversationHistory = [];
let activeImageBase64 = null;

document.documentElement.setAttribute('data-theme', currentTheme);
document.getElementById('api-key').value = apiKey;
document.getElementById('system-prompt').value = systemPrompt;

const chatMessages = document.getElementById('chat-messages');
const historyList = document.getElementById('history-list');

function toggleTheme() {
    const themes = ['dark', 'light', 'neon'];
    let nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
    currentTheme = themes[nextIndex];
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
}

/* ==========================================
   3. CHAT HISTORY (FIXED: PERSISTENT IMAGES)
========================================== */
function initApp() {
    if (savedConversations.length === 0) {
        createNewChat();
    } else {
        loadChat(0);
    }
}

function createNewChat() {
    const newChat = { id: Date.now(), title: 'New Conversation', messages: [] };
    savedConversations.unshift(newChat);
    saveToLocalStorage();
    loadChat(0);
}

function loadChat(index) {
    currentChatIndex = index;
    conversationHistory = [...savedConversations[index].messages];
    chatMessages.innerHTML = '';
    
    if (conversationHistory.length === 0) {
        appendMessageUI('assistant', 'Hello! How can I help you today?');
    } else {
        conversationHistory.forEach(msg => {
            appendMessageUI(msg.role === 'user' ? 'user' : 'assistant', msg.content, msg.imageUrl || null);
        });
    }
    renderHistory();
}

function saveCurrentChatToHistory() {
    if (currentChatIndex !== null && savedConversations[currentChatIndex]) {
        const firstUserMsg = conversationHistory.find(m => m.role === 'user');
        if (firstUserMsg && savedConversations[currentChatIndex].title === 'New Conversation') {
            savedConversations[currentChatIndex].title = firstUserMsg.content.substring(0, 25) + '...';
        }
        savedConversations[currentChatIndex].messages = [...conversationHistory];
        saveToLocalStorage();
        renderHistory();
    }
}

function saveToLocalStorage() {
    localStorage.setItem('savedChats', JSON.stringify(savedConversations));
}

function renderHistory() {
    historyList.innerHTML = '';
    savedConversations.forEach((chat, index) => {
        const div = document.createElement('div');
        div.className = `history-item ${index === currentChatIndex ? 'active' : ''}`;
        div.innerHTML = `
            <span onclick="loadChat(${index})" style="flex-grow:1; overflow:hidden; text-overflow:ellipsis;">${chat.title}</span>
            <button class="delete-btn" onclick="deleteChat(${index}, event)"><i class="fas fa-trash"></i></button>
        `;
        historyList.appendChild(div);
    });
}

function deleteChat(index, event) {
    event.stopPropagation();
    savedConversations.splice(index, 1);
    if (savedConversations.length === 0) createNewChat();
    else loadChat(0);
    saveToLocalStorage();
}

/* ==========================================
   4. UI DISPLAY & DIRECT DOWNLOADS
========================================== */
function appendMessageUI(role, text, imageUrl = null) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    
    if (text) div.innerHTML = marked.parse(text);

    if (imageUrl) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'message-img-container';

        const img = document.createElement('img');
        img.src = imageUrl;
        imgContainer.appendChild(img);

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
        downloadBtn.onclick = () => downloadImage(imageUrl, `pollinations_${Date.now()}.png`);
        
        imgContainer.appendChild(downloadBtn);
        div.appendChild(imgContainer);
    }

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function downloadImage(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
    } catch (err) {
        window.open(url, '_blank');
    }
}

/* ==========================================
   5. POLLINATIONS AI IMAGE GENERATION
========================================== */
function isImageGenerationRequest(text) {
    const lower = text.toLowerCase();
    return lower.includes('generate an image') || lower.includes('create an image') || lower.startsWith('imagine ');
}

function handleImageGeneration(promptText) {
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?seed=${seed}&nologo=true`;
    
    const replyText = `Here is your image for: **"${promptText}"**`;
    appendMessageUI('assistant', replyText, imageUrl);
    
    conversationHistory.push({ 
        role: 'assistant', 
        content: replyText, 
        imageUrl: imageUrl 
    });
    saveCurrentChatToHistory();
}

/* ==========================================
   6. SEND MESSAGE & INPUT HANDLERS
========================================== */
function handleSendMessage() {
    const inputEl = document.getElementById('chat-input');
    const text = inputEl.value.trim();
    if (!text) return;

    appendMessageUI('user', text, activeImageBase64);
    
    conversationHistory.push({ 
        role: 'user', 
        content: text, 
        imageUrl: activeImageBase64 
    });
    saveCurrentChatToHistory();

    inputEl.value = '';

    if (isImageGenerationRequest(text)) {
        setTimeout(() => handleImageGeneration(text), 500);
    } else {
        setTimeout(() => {
            const aiReply = "Got it! Your memory and images are permanently saved to this chat session.";
            appendMessageUI('assistant', aiReply);
            conversationHistory.push({ role: 'assistant', content: aiReply });
            saveCurrentChatToHistory();
        }, 800);
    }

    clearImage();
}

function handleEnter(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            activeImageBase64 = event.target.result;
            document.getElementById('preview-img').src = activeImageBase64;
            document.getElementById('image-preview').style.display = 'flex';
        };
        reader.readAsDataURL(file);
    }
}

function clearImage() {
    activeImageBase64 = null;
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('file-upload').value = '';
}

function openSettings() { document.getElementById('settings-modal').style.display = 'flex'; }
function saveSettings() {
    localStorage.setItem('apiKey', document.getElementById('api-key').value);
    localStorage.setItem('systemPrompt', document.getElementById('system-prompt').value);
    document.getElementById('settings-modal').style.display = 'none';
}

initApp();
