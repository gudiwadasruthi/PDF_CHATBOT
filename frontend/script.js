<<<<<<< HEAD
// Extracted and cleaned JS from index.html
// All DOMContentLoaded and event listeners are wrapped for safety

document.addEventListener('DOMContentLoaded', function() {
    // Chat History Management
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    let currentChatId = null;
    let currentMessages = [];
    let adobeDCView = null;
    let currentPDFUrl = null;


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
            const response = await fetch('https://pdf-chatbot-lm6d.onrender.com/upload/', {
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
        const container = document.createElement('div');
        container.id = 'analysis-output';
    
        const subsectionAnalysis = result.subsection_analysis || [];
        const extractedSections = result.extracted_sections || [];
    
        // 🧠 Title for Subsection Analysis
        const title = document.createElement('h3');
        title.textContent = `🧠 Subsection Analysis`;
        container.appendChild(title);
    
        // Filter entries that have meaningful refined_text
        const filteredSubsections = subsectionAnalysis.filter(
            entry => entry.refined_text && entry.refined_text.trim().length > 10
        );
    
        if (filteredSubsections.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.textContent = 'No analysis results available.';
            emptyMsg.style.color = '#ccc';
            container.appendChild(emptyMsg);
        }
    
        // 📘 Display each filtered analysis block
        filteredSubsections.forEach(entry => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'analysis-card';
            sectionDiv.style.marginBottom = '1em';
            sectionDiv.style.padding = '10px';
            sectionDiv.style.border = '1px solid #ccc';
            sectionDiv.style.borderRadius = '8px';
            sectionDiv.style.backgroundColor = '#0e0c0cff';
    
            const docTitle = document.createElement('strong');
            docTitle.textContent = `📘 ${entry.document} (Page ${entry.page_number})`;
            sectionDiv.appendChild(docTitle);
    
            // Hybrid splitting logic: bullet symbols OR sentence-based
            const points = (entry.refined_text || "")
                .split(/[\u2022•\-–]\s+|(?<=\.)\s+/)  // Split by bullets or after periods
                .map(s => s.trim())
                .filter(p => p.length > 0);
    
            const ul = document.createElement('ul');
            points.forEach(pt => {
                const li = document.createElement('li');
                li.textContent = pt.endsWith('.') ? pt : pt + '.'; // Ensure sentence ends with .
                ul.appendChild(li);
            });
    
            sectionDiv.appendChild(ul);
            // Make the card clickable: just log and show link in chat
            sectionDiv.onclick = () => {
                const pdfUrl = entry.pdf_url || getPDFUrlForDocument(entry.document);
                console.log("📄 Opening PDF:", pdfUrl);
                const linkMessage = `<a href="${pdfUrl}" target="_blank" style="color:#5ad1e6;text-decoration:underline;">📄 Open PDF: ${entry.document}</a>`;
                addMessageToUI(linkMessage, false, false);
            }
            container.appendChild(sectionDiv);
        });
    
        // ➕ Add extracted_sections as reference cards
        if (extractedSections.length > 0) {
            const suggestionHeader = document.createElement('h4');
            suggestionHeader.style.marginTop = '20px';
            suggestionHeader.textContent = '📎 You can also refer to these particular sections for more information:';
            container.appendChild(suggestionHeader);
    
            extractedSections.forEach(section => {
                const sectionRef = document.createElement('div');
                sectionRef.style.margin = '8px 0';
                sectionRef.style.padding = '8px';
                sectionRef.style.backgroundColor = '#0e0c0cff';
                sectionRef.style.borderLeft = '4px solid #3b82f6';
                sectionRef.style.borderRadius = '4px';
    
                const lines = [
                    `📄 PDF: ${section.document}`,
                    `📑 Subsection Title: ${section.section_title}`,
                    `📄 Page No: ${section.page_number}`
                ];
    
                lines.forEach(line => {
                    const p = document.createElement('p');
                    p.style.margin = '2px 0';
                    p.textContent = line;
                    sectionRef.appendChild(p);
                });
    
                container.appendChild(sectionRef);
            });
        }
    
        addMessageToUI(container.outerHTML, false);
    }
});
=======
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = 'https://pdf-chatbot-7hnb.onrender.com'; // Single base URL (combined app)

  const uBtn = document.getElementById('uBtn');
  const aBtn = document.getElementById('aBtn');
  const sBtn = document.getElementById('sBtn');

  const uModal = document.getElementById('uModal');
  const aModal = document.getElementById('aModal');
  const uOk = document.getElementById('uOk');
  const aOk = document.getElementById('aOk');
  const uClose = document.getElementById('uClose');
  const aClose = document.getElementById('aClose');


  const pdfIn = document.getElementById('pdfIn');
  const dropZone = document.getElementById('dropZone');
  const fileListEl = document.getElementById('fileList');
  const uploadProgress = document.getElementById('uploadProgress');
  const uploadProgressBar = document.getElementById('uploadProgressBar');
  const uploadProgressText = document.getElementById('uploadProgressText');
  const analyzeProgress = document.getElementById('analyzeProgress');
  const analyzeProgressBar = document.getElementById('analyzeProgressBar');
  const analyzeProgressText = document.getElementById('analyzeProgressText');
  const resultsEl = document.getElementById('results');
  const personaIn = document.getElementById('persona');
  const taskIn = document.getElementById('task');
  const askForm = document.querySelector('form');
  const askInput = askForm?.querySelector('input[type="text"]');
  const themeSelect = document.getElementById('themeSelect');

  // Theme switching
  function applyTheme(theme) {
    try {
      const t = theme || 'legacy';
      document.documentElement.setAttribute('data-theme', t);
    } catch (_) {}
  }
  function initTheme() {
    try {
      const saved = localStorage.getItem('rw_theme');
      const theme = saved || 'legacy';
      applyTheme(theme);
      if (themeSelect) themeSelect.value = theme;
    } catch (_) { applyTheme('legacy'); }
  }
  initTheme();
  themeSelect?.addEventListener('change', (e) => {
    const val = e.target?.value || 'legacy';
    applyTheme(val);
    try { localStorage.setItem('rw_theme', val); } catch (_) {}
  });

  // Helpers
  function renderJSON(obj) {
    try { resultsEl.textContent = JSON.stringify(obj, null, 2); } catch { resultsEl.textContent = String(obj); }
  }
  function toast(message, type = 'success') {
    const d = document.createElement('div');
    d.textContent = message;
    d.style.position = 'fixed';
    d.style.bottom = '1rem';
    d.style.right = '1rem';
    d.style.zIndex = 9999;
    d.style.padding = '0.5rem 0.75rem';
    d.style.borderRadius = '0.375rem';
    d.style.color = '#fff';
    d.style.fontWeight = '800';
    d.style.background = type === 'error' ? '#dc2626' : '#16a34a';
    d.style.boxShadow = '0 8px 32px rgba(0,0,0,.25)';
    document.body.appendChild(d);
    setTimeout(() => { d.style.opacity = '0'; d.style.transition = 'opacity 400ms'; }, 2200);
    setTimeout(() => d.remove(), 2700);
  }

  // Thinking indicator in results panel
  function showThinking(message) {
    if (!resultsEl) return;
    resultsEl.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'thinking';
    const ring = document.createElement('span');
    ring.className = 'spinner-ring';
    const msg = document.createElement('span');
    msg.className = 'msg';
    msg.textContent = message || 'Working...';
    wrap.appendChild(ring);
    wrap.appendChild(msg);
    resultsEl.appendChild(wrap);
  }

  // Clipboard helpers
  async function copyTextToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return !!ok;
      } catch (e) {
        console.warn('Clipboard API failed', e);
        return false;
      }
    }
  }
  function markButtonCopied(btn, fallbackLabel = 'Copy') {
    if (!btn) return;
    const prev = btn.textContent;
    btn.textContent = 'Copied';
    btn.classList.add('success');
    setTimeout(() => {
      btn.textContent = prev || fallbackLabel;
      btn.classList.remove('success');
    }, 1400);
  }

  // Upload progress helpers
  function setUploadProgress(pct) {
    if (!uploadProgress || !uploadProgressBar || !uploadProgressText) return;
    uploadProgress.classList.remove('hidden');
    const val = Math.max(0, Math.min(100, Math.round(pct)));
    uploadProgressBar.style.width = val + '%';
    uploadProgressText.textContent = val + '%';
  }
  function setUploadError() {
    if (!uploadProgress || !uploadProgressBar || !uploadProgressText) return;
    uploadProgress.classList.remove('hidden');
    uploadProgressBar.classList.add('error');
  }
  function setUploadLabel(text) {
    if (!uploadProgress) return;
    const label = uploadProgress.querySelector('.progress-label');
    if (label) label.childNodes[0].nodeValue = text + ' ';
  }

  // Analyze progress helpers
  function setAnalyzeProgress(pct) {
    if (!analyzeProgress || !analyzeProgressBar || !analyzeProgressText) return;
    analyzeProgress.classList.remove('hidden');
    const val = Math.max(0, Math.min(100, Math.round(pct)));
    analyzeProgressBar.style.width = val + '%';
    analyzeProgressText.textContent = val + '%';
  }
  function setAnalyzeLabel(text) {
    if (!analyzeProgress) return;
    const label = analyzeProgress.querySelector('.progress-label');
    if (label) label.childNodes[0].nodeValue = text + ' ';
  }
  function setAnalyzeError() {
    if (!analyzeProgress || !analyzeProgressBar) return;
    analyzeProgress.classList.remove('hidden');
    analyzeProgressBar.classList.add('error');
  }

  // Render selected file names into the list
  function renderFileList() {
    if (!fileListEl || !pdfIn) return;
    try {
      fileListEl.innerHTML = '';
      const files = pdfIn.files ? Array.from(pdfIn.files) : [];
      if (!files.length) return;
      files.forEach(f => {
        const li = document.createElement('li');
        li.textContent = f.name;
        fileListEl.appendChild(li);
      });
    } catch (_) {}
  }

  // Setup drag & drop on the drop zone
  if (dropZone && pdfIn) {
    const prevent = e => { e.preventDefault(); e.stopPropagation(); };
    ['dragenter', 'dragover'].forEach(evt => {
      dropZone.addEventListener(evt, e => {
        prevent(e);
        try { e.dataTransfer.dropEffect = 'copy'; } catch(_) {}
        dropZone.classList.add('is-dragover');
      });
    });
    ;['dragleave', 'dragend'].forEach(evt => {
      dropZone.addEventListener(evt, e => {
        prevent(e);
        dropZone.classList.remove('is-dragover');
      });
    });
    dropZone.addEventListener('drop', e => {
      prevent(e);
      dropZone.classList.remove('is-dragover');
      const incoming = Array.from(e.dataTransfer?.files || []);
      const pdfs = incoming.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
      if (!pdfs.length) {
        try { toast('Only PDF files are supported.', 'error'); } catch(_) {}
        return;
      }
      try {
        const dt = new DataTransfer();
        const existing = pdfIn.files ? Array.from(pdfIn.files) : [];
        const seen = new Set();
        // keep existing
        existing.forEach(f => {
          const key = `${f.name}|${f.size}`;
          if (!seen.has(key)) { seen.add(key); dt.items.add(f); }
        });
        // add new
        pdfs.forEach(f => {
          const key = `${f.name}|${f.size}`;
          if (!seen.has(key)) { seen.add(key); dt.items.add(f); }
        });
        pdfIn.files = dt.files;
        renderFileList();
        try { toast(`Added ${pdfs.length} file(s)`); } catch(_) {}
      } catch (err) {
        console.warn('Drop failed', err);
      }
    });
    // Click to open file chooser
    dropZone.addEventListener('click', () => { try { pdfIn.click(); } catch(_) {} });
    // Sync list when choosing with file input
    pdfIn.addEventListener('change', renderFileList);
  }

  // Mark frontend ready for quick visual check
  try {
    console.log('[UI] Frontend ready');
    if (resultsEl) resultsEl.textContent = 'Welcome to ReadWise AI';
  } catch(_) {}

  // Pretty renderer for Analyze results
  function displayAnalysisResult(result) {
    // Clear and render structured analysis
    resultsEl.innerHTML = '';
    const container = document.createElement('div');
    container.id = 'analysis-output';
    const card = document.createElement('div');
    card.classList.add('summary-card');

    const subsectionAnalysis = Array.isArray(result?.subsection_analysis) ? result.subsection_analysis : [];
    const extractedSections = Array.isArray(result?.extracted_sections) ? result.extracted_sections : [];

    // Title for Subsection Analysis
    const header = document.createElement('div');
    header.classList.add('card-header');
    const title = document.createElement('h2');
    title.textContent = '🧠 Subsection Analysis';
    title.style.fontWeight = '800';
    title.classList.add('gradient-text');
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy';
    header.appendChild(title);
    header.appendChild(copyBtn);
    card.appendChild(header);
    const body = document.createElement('div');
    body.className = 'card-content';

    const filteredSubsections = subsectionAnalysis.filter(
      entry => entry?.refined_text && String(entry.refined_text).trim().length > 0
    );
    if (filteredSubsections.length) {
      const list = document.createElement('ul');
      list.style.listStyleType = 'disc';
      list.style.listStylePosition = 'outside';
      list.style.paddingLeft = '1.25rem';
      filteredSubsections.slice(0, 10).forEach(entry => {
        const li = document.createElement('li');
        const refined = String(entry.refined_text || '').trim();
        const score = (typeof entry.score === 'number') ? ` (score: ${entry.score.toFixed(3)})` : '';

        // Try to detect structured sub-points in refined text
        const bulletParts = refined.includes('•') ? refined.split(/•/).map(s => s.trim()).filter(Boolean)
                           : refined.split(/\r?\n/).map(s => s.replace(/^[-*–]\s*/, '').trim()).filter(Boolean);

        if (bulletParts.length > 1) {
          // Heading label for the parent item (first line), rest as nested bullets
          const head = bulletParts.shift();
          const headSpan = document.createElement('span');
          headSpan.classList.add('gradient-text');
          headSpan.textContent = head + score;
          li.appendChild(headSpan);

          const ul = document.createElement('ul');
          ul.style.listStyleType = 'circle';
          ul.style.listStylePosition = 'outside';
          ul.style.paddingLeft = '1.25rem';
          bulletParts.forEach(pt => {
            const li2 = document.createElement('li');
            const span2 = document.createElement('span');
            span2.classList.add('gradient-text');
            span2.textContent = pt;
            li2.appendChild(span2);
            ul.appendChild(li2);
          });
          li.appendChild(ul);
        } else {
          const span = document.createElement('span');
          span.classList.add('gradient-text');
          span.textContent = refined + score;
          li.appendChild(span);
        }
        list.appendChild(li);
      });
      body.appendChild(list);
    } else {
      const p = document.createElement('p');
      p.textContent = 'No subsection insights available.';
      p.classList.add('gradient-text');
      body.appendChild(p);
    }

    // Divider
    const hr = document.createElement('hr');
    hr.style.margin = '0.75rem 0';
    body.appendChild(hr);

    // Title for Extracted Sections
    const title2 = document.createElement('h3');
    title2.textContent = '📌 Top Extracted Sections';
    title2.style.fontWeight = '800';
    title2.style.marginBottom = '0.5rem';
    title2.classList.add('gradient-text');
    body.appendChild(title2);

    if (extractedSections.length) {
      const list2 = document.createElement('ol');
      list2.style.listStyleType = 'decimal';
      list2.style.listStylePosition = 'outside';
      list2.style.paddingLeft = '1.25rem';
      extractedSections.slice(0, 10).forEach(sec => {
        const li = document.createElement('li');
        const doc = sec?.document_title || sec?.document || '';
        const title = sec?.section_title || sec?.title || '';
        const span = document.createElement('span');
        span.classList.add('gradient-text');
        span.textContent = [doc, title].filter(Boolean).join(' — ');
        li.appendChild(span);
        list2.appendChild(li);
      });
      body.appendChild(list2);
    } else {
      const p2 = document.createElement('p');
      p2.textContent = 'No extracted sections available.';
      p2.classList.add('gradient-text');
      body.appendChild(p2);
    }

    // Wire copy button for the whole analysis card
    try {
      copyBtn.addEventListener('click', async () => {
        const text = `${title.textContent}\n\n${body.innerText}`.trim();
        const ok = await copyTextToClipboard(text);
        if (ok) markButtonCopied(copyBtn); else try { toast('Copy failed', 'error'); } catch(_) {}
      });
    } catch(_) {}

    card.appendChild(body);
    container.appendChild(card);
    resultsEl.appendChild(container);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 50);
  }

  // Pretty renderer for Summary results (based on backend/output/summary.json structure)
  function displaySummaryResult(result) {
    resultsEl.innerHTML = '';
    const container = document.createElement('div');
    container.id = 'summary-output';

    const title = document.createElement('h3');
    title.textContent = '📝 Quick Summary';
    title.style.fontWeight = '800';
    title.style.marginBottom = '0.5rem';
    container.appendChild(title);

    // Grid container for per-document cards
    const grid = document.createElement('div');
    grid.classList.add('summary-grid');

    const items = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []);
    if (!items.length) {
      const p = document.createElement('p');
      p.textContent = 'No summary available.';
      container.appendChild(p);
      resultsEl.appendChild(container);
      return; // Avoid appending container again
    }

    items.forEach(doc => {
      const docWrap = document.createElement('div');
      docWrap.classList.add('summary-card');
      // header with copy
      const header = document.createElement('div');
      header.className = 'card-header';
      const h4 = document.createElement('h4');
      h4.textContent = doc?.title || doc?.pdf_name || 'Untitled Document';
      h4.classList.add('gradient-text');
      h4.style.fontWeight = '700';
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = 'Copy';
      header.appendChild(h4);
      header.appendChild(copyBtn);
      docWrap.appendChild(header);
      // body content container
      const body = document.createElement('div');
      body.className = 'card-content';
    
      const headings = Array.isArray(doc?.headings) ? doc.headings : [];
      if (headings.length) {
        const list = document.createElement('ul');
        list.style.listStyle = 'disc';
        list.style.paddingLeft = '1.25rem';
        headings.slice(0, 10).forEach(h => {
          const li = document.createElement('li');
          const head = (h?.heading || '').trim();
          const sum = (h?.summary || '').trim();
    

          // If the summary contains bullet markers (•), render them as a nested list
          const parts = sum.split(/•/).map(s => s.trim()).filter(Boolean);
          if (parts.length > 1) {
            // Heading label
            const strong = document.createElement('strong');
            strong.textContent = head || 'Section';
            strong.classList.add('gradient-text'); // ensure label uses gradient too
            li.appendChild(strong);
            // Nested bullets
            const ul = document.createElement('ul');
            ul.style.listStyle = 'circle';
            ul.style.paddingLeft = '1.25rem';
            parts.forEach(b => {
              const li2 = document.createElement('li');
              // Wrap text in a gradient span to keep bullet marker visible
              const span = document.createElement('span');
              span.classList.add('gradient-text');
              span.textContent = b;
              li2.appendChild(span);
              ul.appendChild(li2);
            });
            li.appendChild(ul);
          } else {
            // Wrap the combined text in a gradient span so the bullet remains visible
            const span = document.createElement('span');
            span.classList.add('gradient-text');
            span.textContent = [head, sum].filter(Boolean).join(' — ');
            li.appendChild(span);
          }
          list.appendChild(li);
        });
        body.appendChild(list);
      } else {
        const p = document.createElement('p');
        p.textContent = 'No section summaries.';
        p.classList.add('gradient-text'); // ensure fallback text is gradient
        body.appendChild(p);
      }
      // wire copy for this document card
      try {
        copyBtn.addEventListener('click', async () => {
          const text = `${h4.textContent}\n\n${body.innerText}`.trim();
          const ok = await copyTextToClipboard(text);
          if (ok) markButtonCopied(copyBtn); else try { toast('Copy failed', 'error'); } catch(_) {}
        });
      } catch(_) {}

      docWrap.appendChild(body);
      grid.appendChild(docWrap);
    });

    // Append the grid of cards to the panel container, then render the panel
    container.appendChild(grid);
    resultsEl.appendChild(container);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 50);

  }

  // Pretty renderer for Explain results (based on backend/output/explain_*.json structure)
  function displayExplainResult(result) {
    resultsEl.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const container = document.createElement('div');
    container.id = 'explain-output';
    const card = document.createElement('div');
    card.classList.add('summary-card');

    const header = document.createElement('div');
    header.className = 'card-header';
    const heading = document.createElement('h3');
    heading.textContent = '💡 Explanations';
    heading.style.fontWeight = '800';
    heading.classList.add('gradient-text');
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy';
    header.appendChild(heading);
    header.appendChild(copyBtn);
    card.appendChild(header);
    const body = document.createElement('div');
    body.className = 'card-content';

    // If backend returned an error, surface it clearly
    const backendError = (result && result.error) || (result && result.data && result.data.error);
    if (backendError) {
      const errP = document.createElement('p');
      errP.textContent = `Backend error: ${backendError}`;
      errP.classList.add('gradient-text');
      body.appendChild(errP);
      card.appendChild(body);
      container.appendChild(card);
      resultsEl.appendChild(container);
      return;
    }

    const items = Array.isArray(result)
      ? result
      : (Array.isArray(result?.data) ? result.data
      : (Array.isArray(result?.explanations) ? result.explanations
      : (Array.isArray(result?.data?.explanations) ? result.data.explanations : [])));
    if (!items.length) {
      const p = document.createElement('p');
      p.textContent = 'No explanation available.';
      p.classList.add('gradient-text');
      body.appendChild(p);
      card.appendChild(body);
      container.appendChild(card);
      resultsEl.appendChild(container);
      return;
    }

    // Show first 10 explanations
    const list = document.createElement('ol');
    list.style.listStyle = 'decimal';
    list.style.paddingLeft = '1.25rem';
    items.slice(0, 10).forEach(item => {
      const li = document.createElement('li');
      const title = item?.heading || item?.title || item?.pdf_name || 'Section';
      const para = document.createElement('div');
      para.style.marginTop = '0.25rem';
      para.textContent = (item?.explanation || '').trim();

      const strong = document.createElement('strong');
      strong.textContent = title;
      strong.classList.add('gradient-text');
      para.classList.add('gradient-text');
      li.appendChild(strong);
      li.appendChild(para);
      list.appendChild(li);
    });
    body.appendChild(list);

    // wire copy for whole explanations card
    try {
      copyBtn.addEventListener('click', async () => {
        const text = `${heading.textContent}\n\n${body.innerText}`.trim();
        const ok = await copyTextToClipboard(text);
        if (ok) markButtonCopied(copyBtn); else try { toast('Copy failed', 'error'); } catch(_) {}
      });
    } catch(_) {}

    card.appendChild(body);
    container.appendChild(card);
    resultsEl.appendChild(container);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 50);
  }

  const hideModals = () => {
    try { uModal?.classList.add('hidden'); } catch(_) {}
    try { aModal?.classList.add('hidden'); } catch(_) {}
  };
  const showModal = (m) => {
    try { hideModals(); } catch(_) {}
    if (m && m.classList) {
      m.classList.remove('hidden');
    }
  };

  uBtn?.addEventListener('click', () => showModal(uModal));
  aBtn?.addEventListener('click', () => showModal(aModal));
  sBtn?.addEventListener('click', async () => {
    hideModals();
    try {
      showThinking('Summarizing your PDFs…');
      const resp = await fetch(`${API_BASE}/summary/`);
      if (!resp.ok) throw new Error(`Summary failed ${resp.status}`);
      console.debug('[HTTP] /summary status', resp.status);
      const data = await resp.json();
      console.debug('[HTTP] /summary JSON keys', Object.keys(data || {}));
      const payload = data?.data ?? data;
      // Render structured summary
      resultsEl.innerHTML = '';
      try { displaySummaryResult(payload); } catch (err) { console.warn('[WARN] displaySummaryResult failed', err); resultsEl.textContent = 'Error displaying summary.'; }
    } catch (e) {
      console.error('[ERR] summary', e);
      resultsEl.textContent = `Error (summary): ${e?.message || e}`;
    }
  });

  // Close/hide modals without surfacing any dock UI
  const minU = () => { uModal?.classList.add('hidden'); };
  const minA = () => { aModal?.classList.add('hidden'); };

  async function uploadAndRun() {
    try {
      const files = pdfIn?.files || [];
      if (!files.length) {
        alert('Please select one or more PDF files.');
        return;
      }
      // Prepare form data
      const formData = new FormData();
      for (const f of files) formData.append('files', f);

      // UI: disable button and show status
      const prevLabel = uOk.textContent;
      uOk.disabled = true;
      uOk.textContent = 'Uploading...';
      resultsEl.textContent = 'Uploading and processing...';

      // Use XHR to capture upload progress
      if (uploadProgressBar) uploadProgressBar.classList.remove('error');
      setUploadLabel('Uploading…');
      setUploadProgress(0);
      let displayPct = 0;
      let creepTimer = null;
      const data = await new Promise((resolve, reject) => {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${API_BASE}/stage1/upload/`);
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              // Drive upload portion up to 80%
              const pct = Math.min(80, Math.max(2, (e.loaded / e.total) * 80));
              displayPct = pct;
              setUploadProgress(pct);
            }
          });
          xhr.upload.addEventListener('load', () => {
            // Upload finished; hold ~80% while backend processes
            displayPct = Math.max(displayPct, 80);
            setUploadProgress(displayPct);
            setUploadLabel('Processing…');
            if (!creepTimer) {
              creepTimer = setInterval(() => {
                displayPct = Math.min(95, displayPct + 1);
                setUploadProgress(displayPct);
              }, 400);
            }
          });
          xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const json = JSON.parse(xhr.responseText || 'null');
                  if (creepTimer) { clearInterval(creepTimer); creepTimer = null; }
                  // Mark 100% on completion
                  setUploadProgress(100);
                  setUploadLabel('Complete');
                  resolve(json);
                } catch (err) {
                  if (creepTimer) { clearInterval(creepTimer); creepTimer = null; }
                  reject(new Error('Invalid JSON response from backend.'));
                }
              } else {
                if (creepTimer) { clearInterval(creepTimer); creepTimer = null; }
                reject(new Error(`Backend error ${xhr.status}: ${xhr.responseText}`));
              }
            }
          };
          xhr.onerror = () => { if (creepTimer) { clearInterval(creepTimer); creepTimer = null; } reject(new Error('Network error')); };
          xhr.send(formData);
        } catch (err) {
          reject(err);
        }
      });
      console.log("Stage1 response:", data);
      
      // Store the document names for later steps
      try {
        let docs = [];
        if (Array.isArray(data)) {
          docs = data.map(o => o?.filename || o?.document).filter(Boolean);
        } else if (pdfIn?.files?.length) {
          docs = Array.from(pdfIn.files).map(f => f.name);
        }
        window.lastDocs = docs;
        if (docs.length) {
          localStorage.setItem('lastDocs', JSON.stringify(docs));
        }
      } catch(_) {}
      
      resultsEl.textContent = "✅ You are all set to ask questions!";
      resultsEl.style.color = "white"
      // Keep last Stage 1 outputs for Analyze step
      window.lastStage1 = data;
      // Also persist just the filenames to survive shape differences
      try {
        let docs = [];
        if (Array.isArray(data)) {
          docs = data.map(o => o?.filename || o?.document).filter(Boolean);
        } else if (pdfIn?.files?.length) {
          docs = Array.from(pdfIn.files).map(f => f.name);
        }
        window.lastDocs = docs;
        // Persist to localStorage so it survives refresh or modal toggles
        if (docs.length) {
          localStorage.setItem('lastDocs', JSON.stringify(docs));
        }
        console.debug('Stage1 documents captured:', docs);
      } catch(_) {}

      // Notify success
      try {
        const uploadedCount = Array.isArray(window.lastDocs) ? window.lastDocs.length : 0;
      } catch(_) {}

      // Minimize after success
      minU();
      // Auto-hide progress UI after a short delay
      try { setUploadProgress(100); } catch(_) {}
      setTimeout(() => { try { uploadProgress?.classList.add('hidden'); } catch(_) {} }, 1500);
      // restore label
      uOk.textContent = prevLabel || 'Done';
      uOk.disabled = false;
    } catch (err) {
      console.error(err);
      resultsEl.textContent = `Error: ${err?.message || err}`;
      setUploadError();
      uOk.textContent = 'Done';
      uOk.disabled = false;
    }
  }

  async function runAnalyze() {
    let aCreepTimer = null;
    try {
      const persona = personaIn?.value?.trim();
      const task = taskIn?.value?.trim();
      if (!persona || !task) {
        alert('Please enter both Persona and Task.');
        return;
      }
      // derive documents from lastStage1 (list from Stage 1 upload)
      // Prefer the persisted filenames from upload; fall back to lastStage1 or current file input
      let names = Array.isArray(window.lastDocs) ? window.lastDocs : [];
      if (!names.length) {
        try {
          const stored = localStorage.getItem('lastDocs');
          if (stored) names = JSON.parse(stored);
        } catch(_) {}
      }
      if (!names.length && Array.isArray(window.lastStage1)) {
        names = window.lastStage1.map(o => o?.filename || o?.document).filter(Boolean);
      }
      if (!names.length && pdfIn?.files?.length) {
        names = Array.from(pdfIn.files).map(f => f.name);
      }
      if (!names.length && resultsEl?.textContent) {
        // As a last resort, try to parse the visible results JSON
        try {
          const maybe = JSON.parse(resultsEl.textContent);
          if (Array.isArray(maybe)) {
            names = maybe.map(o => o?.filename || o?.document).filter(Boolean);
          } else if (maybe && Array.isArray(maybe.data)) {
            names = maybe.data.map(o => o?.filename || o?.document).filter(Boolean);
          }
        } catch(_) {}
      }
      console.debug('Analyze resolving document names:', names);
      if (!names.length) {
        console.warn('No document names resolved on frontend; proceeding to rely on backend auto-discovery.');
      }
      // Match script.js format (lines 272-342): include challenge_info and title
      const documents = names.map(name => ({ filename: name, title: name.replace(/\.[^.]+$/, '') }));
      const config = {
        challenge_info: {
          challenge_id: 'round_1b_002',
          test_case_name: 'custom_case',
          description: 'User Provided'
        },
        documents,
        persona: { role: persona },
        job_to_be_done: { task }
      };
      const blob = new Blob([JSON.stringify(config)], { type: 'application/json' });
      const fd = new FormData();
      fd.append('config', blob, 'challenge1b_input.json');

      const prev = aOk.textContent;
      aOk.disabled = true;
      aOk.textContent = 'Analyzing...';
      showThinking('Analyzing your collection…');

      // Init analyze progress bar
      if (analyzeProgressBar) analyzeProgressBar.classList.remove('error');
      setAnalyzeLabel('Processing…');
      setAnalyzeProgress(0);
      let aDisplayPct = 0;
      aCreepTimer = setInterval(() => {
        aDisplayPct = Math.min(95, aDisplayPct + 1);
        setAnalyzeProgress(aDisplayPct);
      }, 400);

      const resp = await fetch(`${API_BASE}/analyze/`, { method: 'POST', body: fd });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Analyze failed ${resp.status}: ${txt}`);
      }
      console.debug('[HTTP] /analyze status', resp.status);
      const data = await resp.json();
      console.debug('[HTTP] /analyze JSON keys', Object.keys(data || {}));
      const payload = data?.data ?? data; // unwrap {status,data}
      // Always write raw JSON immediately so user sees something
      // First clear results
      resultsEl.innerHTML = "";
      // Render structured view only
      try { displayAnalysisResult(payload); } catch(err) {
        console.warn('[WARN] displayAnalysisResult failed', err);
        resultsEl.textContent = "Error displaying analysis result.";
      }

      // Success: mark 100% and hide shortly after
      if (aCreepTimer) { clearInterval(aCreepTimer); aCreepTimer = null; }
      try { setAnalyzeProgress(100); setAnalyzeLabel('Complete'); } catch(_) {}
      setTimeout(() => { try { analyzeProgress?.classList.add('hidden'); } catch(_) {} }, 1500);
      minA();
      aOk.textContent = prev || 'Start Analysis';
      aOk.disabled = false;
    } catch (e) {
      console.error('[ERR] analyze', e);
      resultsEl.textContent = `Error (analyze): ${e?.message || e}`;
      if (aCreepTimer) { clearInterval(aCreepTimer); aCreepTimer = null; }
      setAnalyzeError();
      aOk.textContent = 'Start Analysis';
      aOk.disabled = false;
    }
  }

  async function runExplain(ev) {
    ev?.preventDefault();
    const q = askInput?.value?.trim();
    if (!q) return;
    try {
      showThinking('Thinking…');
      const resp = await fetch(`${API_BASE}/explain/?topic=${encodeURIComponent(q)}`);
      if (!resp.ok) throw new Error(`Explain failed ${resp.status}`);
      console.debug('[HTTP] /explain status', resp.status);
      const data = await resp.json();
      console.debug('[HTTP] /explain JSON keys', Object.keys(data || {}));
      let payload = data?.data ?? data;
      // Fallback: backend may return stdout containing JSON if file write failed
      if (!Array.isArray(payload) && !payload?.explanations && typeof data?.stdout === 'string') {
        try {
          const parsed = JSON.parse(data.stdout);
          if (parsed && (Array.isArray(parsed) || parsed.explanations)) {
            payload = parsed;
            console.debug('[HTTP] /explain parsed stdout payload');
          }
        } catch (e) {
          console.warn('[WARN] Failed to parse stdout JSON from /explain');
        }
      }
      resultsEl.innerHTML = '';
      try { displayExplainResult(payload); } catch (err) { console.warn('[WARN] displayExplainResult failed', err); resultsEl.textContent = 'Error displaying explanation.'; }
    } catch (e) {
      console.error('[ERR] explain', e);
      resultsEl.textContent = `Error (explain): ${e?.message || e}`;
    }
  }

  uOk?.addEventListener('click', uploadAndRun);
  uClose?.addEventListener('click', minU);
  aOk?.addEventListener('click', runAnalyze);
  aClose?.addEventListener('click', minA);

  askForm?.addEventListener('submit', runExplain);
  // Dock buttons removed
});
>>>>>>> 4580bc7 (first commit)
