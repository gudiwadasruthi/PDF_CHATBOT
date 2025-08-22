document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = 'https://pdf-chatbot-7hnb.onrender.com';

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

  // Reset progress UIs so they start hidden and clean
  function resetUploadUI() {
      try {
          if (uploadProgress) uploadProgress.classList.add('hidden');
          if (uploadProgressBar) {
              uploadProgressBar.classList.remove('error');
              uploadProgressBar.style.width = '0%';
          }
          if (uploadProgressText) uploadProgressText.textContent = '0%';
          setUploadLabel('Uploading…');
      } catch (_) {}
  }
  function resetAnalyzeUI() {
      try {
          if (analyzeProgress) analyzeProgress.classList.add('hidden');
          if (analyzeProgressBar) {
              analyzeProgressBar.classList.remove('error');
              analyzeProgressBar.style.width = '0%';
          }
          if (analyzeProgressText) analyzeProgressText.textContent = '0%';
          setAnalyzeLabel('Processing…');
      } catch (_) {}
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
              try { e.dataTransfer.dropEffect = 'copy'; } catch (_) {}
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
              try { toast('Only PDF files are supported.', 'error'); } catch (_) {}
              return;
          }
          try {
              const dt = new DataTransfer();
              const existing = pdfIn.files ? Array.from(pdfIn.files) : [];
              const seen = new Set();
              existing.forEach(f => {
                  const key = `${f.name}|${f.size}`;
                  if (!seen.has(key)) { seen.add(key); dt.items.add(f); }
              });
              pdfs.forEach(f => {
                  const key = `${f.name}|${f.size}`;
                  if (!seen.has(key)) { seen.add(key); dt.items.add(f); }
              });
              pdfIn.files = dt.files;
              renderFileList();
              try { toast(`Added ${pdfs.length} file(s)`); } catch (_) {}
          } catch (err) {
              console.warn('Drop failed', err);
          }
      });
      dropZone.addEventListener('click', () => { try { pdfIn.click(); } catch (_) {} });
      pdfIn.addEventListener('change', renderFileList);
  }

  // Mark frontend ready
  try {
      console.log('[UI] Frontend ready');
      if (resultsEl) resultsEl.textContent = '👩‍🏫Welcome to ReadWise AI';
  } catch (_) {}

  // Pretty renderer for Analyze results
  function displayAnalysisResult(result) {
      resultsEl.innerHTML = '';
      const container = document.createElement('div');
      container.id = 'analysis-output';
      const card = document.createElement('div');
      card.classList.add('summary-card');

      const subsectionAnalysis = Array.isArray(result?.subsection_analysis) ? result.subsection_analysis : [];
      const extractedSections = Array.isArray(result?.extracted_sections) ? result.extracted_sections : [];

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

              const bulletParts = refined.includes('•') ? refined.split(/•/).map(s => s.trim()).filter(Boolean)
                             : refined.split(/\r?\n/).map(s => s.replace(/^[-*–]\s*/, '').trim()).filter(Boolean);
              if (bulletParts.length > 1) {
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

      const hr = document.createElement('hr');
      hr.style.margin = '0.75rem 0';
      body.appendChild(hr);

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

      try {
          copyBtn.addEventListener('click', async () => {
              const text = `${title.textContent}\n\n${body.innerText}`.trim();
              const ok = await copyTextToClipboard(text);
              if (ok) markButtonCopied(copyBtn); else try { toast('Copy failed', 'error'); } catch (_) {}
          });
      } catch (_) {}

      card.appendChild(body);
      container.appendChild(card);
      resultsEl.appendChild(container);
      setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
  }

  function displaySummaryResult(result) {
      resultsEl.innerHTML = '';
      const container = document.createElement('div');
      container.id = 'summary-output';

      const title = document.createElement('h3');
      title.textContent = '📝 Quick Summary';
      title.style.fontWeight = '800';
      title.style.marginBottom = '0.5rem';
      container.appendChild(title);

      const grid = document.createElement('div');
      grid.classList.add('summary-grid');

      const items = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []);
      if (!items.length) {
          const p = document.createElement('p');
          p.textContent = 'No summary available.';
          container.appendChild(p);
          resultsEl.appendChild(container);
          return;
      }

      items.forEach(doc => {
          const docWrap = document.createElement('div');
          docWrap.classList.add('summary-card');
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

                  const parts = sum.split(/•/).map(s => s.trim()).filter(Boolean);
                  if (parts.length > 1) {
                      const strong = document.createElement('strong');
                      strong.textContent = head || 'Section';
                      strong.classList.add('gradient-text');
                      li.appendChild(strong);
                      const ul = document.createElement('ul');
                      ul.style.listStyle = 'circle';
                      ul.style.paddingLeft = '1.25rem';
                      parts.forEach(b => {
                          const li2 = document.createElement('li');
                          const span2 = document.createElement('span');
                          span2.classList.add('gradient-text');
                          span2.textContent = b;
                          li2.appendChild(span2);
                          ul.appendChild(li2);
                      });
                      li.appendChild(ul);
                  } else {
                      const strong = document.createElement('strong');
                      strong.textContent = head || 'Section';
                      strong.classList.add('gradient-text');
                      li.appendChild(strong);
                      if (sum) {
                          const span = document.createElement('span');
                          span.textContent = `: ${sum}`;
                          span.classList.add('gradient-text');
                          li.appendChild(span);
                      }
                  }
                  list.appendChild(li);
              });
              body.appendChild(list);
          } else {
              const p = document.createElement('p');
              p.textContent = 'No headings summarized.';
              p.classList.add('gradient-text');
              body.appendChild(p);
          }
          docWrap.appendChild(body);
          try {
              copyBtn.addEventListener('click', async () => {
                  const text = `${h4.textContent}\n\n${body.innerText}`.trim();
                  const ok = await copyTextToClipboard(text);
                  if (ok) markButtonCopied(copyBtn); else try { toast('Copy failed', 'error'); } catch (_) {}
              });
          } catch (_) {}
          grid.appendChild(docWrap);
      });
      container.appendChild(grid);
      resultsEl.appendChild(container);
      setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
  }

  function displayExplainResult(result) {
      resultsEl.innerHTML = '';
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

      try {
          copyBtn.addEventListener('click', async () => {
              const text = `${heading.textContent}\n\n${body.innerText}`.trim();
              const ok = await copyTextToClipboard(text);
              if (ok) markButtonCopied(copyBtn); else try { toast('Copy failed', 'error'); } catch (_) {}
          });
      } catch (_) {}

      card.appendChild(body);
      container.appendChild(card);
      resultsEl.appendChild(container);
      setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
  }

  const hideModals = () => {
      try { uModal.classList.add('hidden'); } catch (_) {}
      try { aModal.classList.add('hidden'); } catch (_) {}
      // Reset progress sections when closing
      try { resetUploadUI(); } catch (_) {}
      try { resetAnalyzeUI(); } catch (_) {}
  };
  const showModal = (m) => {
      try { hideModals(); } catch (_) {}
      if (m && m.classList) {
          m.classList.remove('hidden');
          // Ensure progress for this modal is hidden on open
          try {
              if (m === uModal) resetUploadUI();
              if (m === aModal) resetAnalyzeUI();
          } catch (_) {}
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
          const data = await resp.json();
          const payload = data?.data ?? data;
          resultsEl.innerHTML = '';
          try { displaySummaryResult(payload); } catch (err) { console.warn('[WARN] displaySummaryResult failed', err); resultsEl.textContent = 'Error displaying summary.'; }
      } catch (e) {
          console.error('[ERR] summary', e);
          resultsEl.textContent = `Error (summary): ${e?.message || e}`;
      }
  });

  const minU = () => { uModal.classList.add('hidden'); };
  const minA = () => { aModal.classList.add('hidden'); };

  async function uploadAndRun() {
      try {
          const files = pdfIn?.files || [];
          if (!files.length) {
              alert('Please select one or more PDF files.');
              return;
          }
          const formData = new FormData();
          for (const f of files) formData.append('files', f);

          const prevLabel = uOk.textContent;
          uOk.disabled = true;
          uOk.textContent = 'Uploading...';
          resultsEl.textContent = 'Uploading and processing...';

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
                          const pct = Math.min(80, Math.max(2, (e.loaded / e.total) * 80));
                          displayPct = pct;
                          setUploadProgress(pct);
                      }
                  });
                  xhr.upload.addEventListener('load', () => {
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
          } catch (_) {}

          resultsEl.textContent = "✅ You are all set to ask questions!";
          window.lastStage1 = data;
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
          } catch (_) {}

          setTimeout(() => { try { uploadProgress.classList.add('hidden'); } catch (_) {} }, 1500);
          uOk.textContent = prevLabel || 'Done';
          uOk.disabled = false;
          minU(); // Auto-close modal after completion
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
          let names = Array.isArray(window.lastDocs) ? window.lastDocs : [];
          if (!names.length) {
              try {
                  const stored = localStorage.getItem('lastDocs');
                  if (stored) names = JSON.parse(stored);
              } catch (_) {}
          }
          if (!names.length && Array.isArray(window.lastStage1)) {
              names = window.lastStage1.map(o => o?.filename || o?.document).filter(Boolean);
          }
          if (!names.length && pdfIn?.files?.length) {
              names = Array.from(pdfIn.files).map(f => f.name);
          }
          if (!names.length && resultsEl?.textContent) {
              try {
                  const maybe = JSON.parse(resultsEl.textContent);
                  if (Array.isArray(maybe)) {
                      names = maybe.map(o => o?.filename || o?.document).filter(Boolean);
                  } else if (maybe && Array.isArray(maybe.data)) {
                      names = maybe.data.map(o => o?.filename || o?.document).filter(Boolean);
                  }
              } catch (_) {}
          }
          console.debug('Analyze resolving document names:', names);
          if (!names.length) {
              console.warn('No document names resolved on frontend; proceeding to rely on backend auto-discovery.');
          }
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
          const data = await resp.json();
          const payload = data?.data ?? data;
          resultsEl.innerHTML = "";
          try { displayAnalysisResult(payload); } catch (err) {
              console.warn('[WARN] displayAnalysisResult failed', err);
              resultsEl.textContent = "Error displaying analysis result.";
          }

          if (aCreepTimer) { clearInterval(aCreepTimer); aCreepTimer = null; }
          setAnalyzeProgress(100);
          setAnalyzeLabel('Complete');
          setTimeout(() => { try { analyzeProgress.classList.add('hidden'); } catch (_) {} }, 1500);
          aOk.textContent = prev || 'Start Analysis';
          aOk.disabled = false;
          minA(); // Auto-close modal after completion
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
          const data = await resp.json();
          let payload = data?.data ?? data;
          if (!Array.isArray(payload) && !payload?.explanations && typeof data?.stdout === 'string') {
              try {
                  const parsed = JSON.parse(data.stdout);
                  if (parsed && (Array.isArray(parsed) || parsed.explanations)) {
                      payload = parsed;
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

  document.querySelector('.submit-btn').addEventListener('click', function () {
      this.style.transform = 'scale(0.9)';
      setTimeout(() => {
          this.style.transform = 'scale(1.1)';
      }, 150);
  });

  document.querySelectorAll('.action-card').forEach(card => {
      card.addEventListener('click', function () {
          this.style.transform = 'translateY(-10px) scale(0.98)';
          setTimeout(() => {
              this.style.transform = 'translateY(-10px) scale(1)';
          }, 100);
      });
  });

  window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const header = document.querySelector('.header');
      header.style.transform = `translateY(${scrolled * 0.1}px)`;
  });

  // Initial reset to guarantee hidden progress bars on load
  try { resetUploadUI(); } catch (_) {}
  try { resetAnalyzeUI(); } catch (_) {}
});