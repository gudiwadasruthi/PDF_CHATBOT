// Extracted and cleaned JS from index.html
// All DOMContentLoaded and event listeners are wrapped for safety

document.addEventListener('DOMContentLoaded', function() {
    // Chat History Management
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    let currentChatId = null;
    let currentMessages = [];

    function initializeChatHistory() {
        const chatHistoryContainer = document.getElementById('chatHistory');
        chatHistoryContainer.innerHTML = '';

        if (chatHistory.length === 0) {
            chatHistoryContainer.innerHTML = '<p style="opacity: 0.6; text-align: center; padding: 1rem;">No chat history yet</p>';
            return;
        }

        chatHistory.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-history-item';
            chatItem.innerHTML = `
                <div>
                    <div class="chat-history-title">${chat.title}</div>
                    <div class="chat-history-date">${formatDate(chat.timestamp)}</div>
                </div>
            `;
            chatItem.addEventListener('click', () => loadChat(chat.id));
            chatHistoryContainer.appendChild(chatItem);
        });
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    function saveChat() {
        if (currentMessages.length === 0) return;
        const chatTitle = generateChatTitle(currentMessages);
        const newChat = {
            id: Date.now(),
            title: chatTitle,
            messages: [...currentMessages],
            timestamp: new Date().toISOString()
        };
        chatHistory.unshift(newChat);
        if (chatHistory.length > 10) {
            chatHistory = chatHistory.slice(0, 10);
        }
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        initializeChatHistory();
    }

    function generateChatTitle(messages) {
        const firstUserMessage = messages.find(msg => msg.isUser);
        if (firstUserMessage) {
            const text = firstUserMessage.text.substring(0, 30);
            return text.length === 30 ? text + '...' : text;
        }
        return 'New Chat';
    }

    function loadChat(chatId) {
        const chat = chatHistory.find(c => c.id === chatId);
        if (!chat) return;
        currentChatId = chatId;
        currentMessages = [...chat.messages];
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        currentMessages.forEach(msg => {
            addMessageToUI(msg.text, msg.isUser, false);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
        showToast(`Loaded: ${chat.title}`);
    }

    function addMessageToUI(text, isUser, animate = true) {
        const chatMessages = document.getElementById('chatMessages');
        const message = document.createElement('div');
        message.className = 'message' + (isUser ? ' user' : '');
        if (!animate) {
            message.style.animation = 'none';
        }
        message.innerHTML = `
            <div class="message-avatar">${isUser ? '👤' : '🤖'}</div>
            <div class="message-content">${text}</div>
        `;
        chatMessages.appendChild(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function startNewChat() {
        if (currentMessages.length > 0) {
            saveChat();
        }
        currentChatId = null;
        currentMessages = [];
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        addMessageToUI("Hello! I'm your AI Assistant. I can help you with PDF conversions, document management, and answer any questions you have. How can I assist you today?", false, false);
        showToast('New chat started');
    }

    document.getElementById('newChatBtn').addEventListener('click', startNewChat);

    // PDF Converter Functionality
    const dropZonePanel = document.getElementById('dropZonePanel');
    const fileInputPanel = document.getElementById('fileInputPanel');
    const analyzeBtnPanel = document.getElementById('analyzeBtnPanel');
    const personaInput = document.getElementById('personaInput');
    const jobInput = document.getElementById('jobInput');
    const progressContainerPanel = document.getElementById('progressContainerPanel');
    const progressFillPanel = document.getElementById('progressFillPanel');
    const progressTextPanel = document.getElementById('progressTextPanel');
    const fileListPanel = document.getElementById('fileListPanel');
    const fileItemsPanel = document.getElementById('fileItemsPanel');
    const status = document.getElementById('status');
    const pdfSelector = document.getElementById('pdfSelector');
    const pdfPanel = document.getElementById('pdfPanel');
    const closePanel = document.getElementById('closePanel');
    let panelSelectedFiles = [];

    function showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        toastMessage.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    function updatePanelAnalyzeButton() {
        if (panelSelectedFiles.length === 0) {
            analyzeBtnPanel.disabled = true;
        } else {
            analyzeBtnPanel.disabled = false;
        }
    }

    pdfSelector.addEventListener('click', () => {
        pdfPanel.classList.toggle('show');
        pdfSelector.classList.toggle('active');
    });
    closePanel.addEventListener('click', () => {
        pdfPanel.classList.remove('show');
        pdfSelector.classList.remove('active');
    });
    dropZonePanel.addEventListener('click', () => fileInputPanel.click());
    dropZonePanel.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZonePanel.classList.add('drag-over');
    });
    dropZonePanel.addEventListener('dragleave', () => {
        dropZonePanel.classList.remove('drag-over');
    });
    dropZonePanel.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZonePanel.classList.remove('drag-over');
        handlePanelFiles(e.dataTransfer.files);
    });
    fileInputPanel.addEventListener('change', (e) => {
        handlePanelFiles(e.target.files);
    });

    function handlePanelFiles(files) {
        panelSelectedFiles = Array.from(files);
        updatePanelFileList();
        updatePanelAnalyzeButton();
        showToast(`${files.length} file(s) selected`);
    }

    function updatePanelFileList() {
        if (panelSelectedFiles.length === 0) {
            fileListPanel.style.display = 'none';
            return;
        }
        fileListPanel.style.display = 'block';
        fileItemsPanel.innerHTML = '';
        panelSelectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <span class="file-icon">📄</span>
                    <span class="file-name">${file.name}</span>
                </div>
                <button class="remove-file-btn" data-index="${index}">×</button>
            `;
            fileItem.querySelector('.remove-file-btn').addEventListener('click', () => {
                removePanelFile(index);
            });
            fileItemsPanel.appendChild(fileItem);
        });
    }

    function removePanelFile(index) {
        panelSelectedFiles.splice(index, 1);
        updatePanelFileList();
        updatePanelAnalyzeButton();
    }

    analyzeBtnPanel.addEventListener('click', async () => {
        if (panelSelectedFiles.length === 0) {
            showToast('Please select at least one PDF.');
            return;
        }
        const persona = personaInput.value.trim();
        const job = jobInput.value.trim();
        if (!persona || !job) {
            showToast('Please enter both persona and job to be done.');
            return;
        }
        const documents = panelSelectedFiles.map(file => ({
            filename: file.name,
            title: file.name.replace(/\.[^.]+$/, '')
        }));
        const inputJson = {
            challenge_info: {
                challenge_id: 'round_1b_002',
                test_case_name: 'custom_case',
                description: 'User Provided'
            },
            documents,
            persona: { role: persona },
            job_to_be_done: { task: job }
        };
        const formData = new FormData();
        panelSelectedFiles.forEach((file, idx) => {
            formData.append('pdfs', file, file.name);
        });
        formData.append('input_json', new Blob([JSON.stringify(inputJson)], { type: 'application/json' }), 'challenge1b_input.json');
        progressContainerPanel.style.display = 'block';
        progressFillPanel.style.width = '0%';
        progressTextPanel.textContent = '0%';
        analyzeBtnPanel.disabled = true;
        status.textContent = 'Analyzing...';
        await new Promise(r => setTimeout(r, 0));
        try {
            const response = await fetch('https://pdf-chatbot-69qo.onrender.com', {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                const result = await response.json();
                showToast('Analysis complete!');
                displayAnalysisResult(result);
            } else {
                showToast('Backend error: ' + response.statusText);
            }
        } catch (err) {
            showToast('Error connecting to backend.');
        } finally {
            progressContainerPanel.style.display = 'none';
            progressFillPanel.style.width = '0%';
            progressTextPanel.textContent = '0%';
            analyzeBtnPanel.disabled = false;
            status.textContent = 'Online';
        }
    });

    function displayAnalysisResult(result) {
        const formatted = `<pre style="margin-bottom:0">${JSON.stringify(result, null, 2)}</pre>`;
        addMessageToUI(formatted, false);
    }
});