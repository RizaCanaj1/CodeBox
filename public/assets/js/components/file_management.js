function check_projet(project_id){
    return fetch(`/get_project/${project_id}`)
    .then(response => response.json());
}
let rootData = null
let folderBase = {}
let pos = ''

// For a row about to be rendered inside the folder currently at `pos`: at
// root, a row's own name IS the top-level folder being scoped; already
// inside one, every row shares that folder's first path segment.
function topFolderForRow(fileName){
    const segments = pos.split('/').filter(Boolean)
    return segments.length ? segments[0] : fileName
}
function canManageFolder(topFolder){
    return manageable_folders === null || (manageable_folders && manageable_folders.includes(topFolder))
}
// Whether the requester can add a new file/folder into whatever's currently
// open. At root, adding a brand-new top-level item has no existing folder
// to scope against, so it's "has any manage permission at all" (same
// bootstrap rule the server applies); inside a folder, it's scoped to that
// folder like every other write action.
function canAddHere(){
    if(pos === ''){
        return manageable_folders === null || (manageable_folders && manageable_folders.length > 0)
    }
    return canManageFolder(pos.split('/').filter(Boolean)[0])
}
// Shared by file_model() (once a tree already exists) and group.js's empty
// project state (nothing uploaded yet) — same "add a file or a new folder"
// affordance either way, since there's no reason bootstrapping a project
// should require a zip specifically.
function renderAddControls(){
    if(!canAddHere()) return ''
    return `<div class='add_item_controls d-flex gap-2'>
        <label class='add-item-btn add-file-btn' title="Add file(s)">
            <i class="fa-solid fa-file-circle-plus"></i>
            <input type='file' class='d-none' multiple onchange='handle_add_files(event)'>
        </label>
        <button type='button' class='add-item-btn add-folder-btn' title="New folder" onclick='handle_create_folder()'><i class="fa-solid fa-folder-plus"></i></button>
    </div>`
}

// folder = {contents, file_count, folder_count} for whatever's being shown.
// Previously this tried to find the root folder by indexing
// `base[Object.keys(base)]` — Object.keys() returns an ARRAY, and using an
// array as a property key coerces it to a comma-joined string, which only
// ever happened to resolve when the project had exactly one top-level
// item. Any project with 2+ top-level folders hit `folder.contents` on
// undefined and the whole Code tab silently rendered nothing (confirmed
// live). Callers now just pass the already-resolved folder object directly.
function file_model(folder, folderName = '', direction){
    if (direction === 'backwards') {
        const segments = pos.split('/').filter(Boolean)
        segments.pop()
        pos = segments.length ? '/' + segments.join('/') : ''
    }
    else if (direction === 'forwards') {
        pos += '/' + folderName
    }
    else {
        pos = ''
        rootData = folder
    }
    folderBase = folder
    let back_button = (pos !== '' ? '<button class="back_button" onclick="handle_go_back(event)">...</button>' : '')
    const folderContents = folder.contents;
    let foldersHTML = '';
    let filesHTML = '';
    for (const fileName in folderContents) {
        if (folderContents.hasOwnProperty(fileName)) {
            const fileInfo = folderContents[fileName];
            const canManage = canManageFolder(topFolderForRow(fileName))
            const deleteBtn = canManage ? `<button type="button" class="item-delete" onclick="handle_delete_item(event)" title="Delete"><i class="fa-solid fa-trash"></i></button>` : ''
            const rowExt = fileName.split('.').pop().toLowerCase()
            const openBtn = (rowExt === 'html' || rowExt === 'htm') ? `<button type="button" class="item-open" onclick="handle_open_item_preview(event)" title="Open"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>` : ''
            if (fileInfo.info.type === 'directory') {
                let fileIconsHTML = '';
                const maxFileIcons = 3;
                const numFileIcons = Math.min(fileInfo.file_count, maxFileIcons);
                for (let i = 0; i < numFileIcons; i++) {
                    fileIconsHTML += `<i class="fa-regular fa-file file_icon"></i>`;
                }
                foldersHTML += `
                    <div class='folder d-flex justify-content-between'>
                        <div class='name d-flex gap-2' onclick='handle_folder_open(event)'>
                            <i class="fa-solid fa-folder folder_icon"></i>
                            ${fileIconsHTML}
                            <h5>${escapeHtml(fileName)}</h5>
                        </div>
                        <div class='info d-flex gap-2 align-items-center'>
                            <div class='folders'><p>${fileInfo.folder_count === 1 ? '1 Folder' : (fileInfo.folder_count + ' Folders')}</p></div>
                            <div class='files'><p>${fileInfo.file_count === 1 ? '1 File' : (fileInfo.file_count + ' Files')}</p></div>
                            <div class='last_updated'>${fileInfo.info.last_updated}</div>
                            ${deleteBtn}
                        </div>
                    </div>`;
            } else {
                filesHTML += `
                    <div class='file d-flex justify-content-between'>
                        <div class='name d-flex gap-2' onclick='handle_file_open(event)'>
                            <i class="fa-solid fa-file file_icon"></i>
                            <p class='extention'>${escapeHtml(rowExt)}</p>
                            <p class='file_name'>${escapeHtml(fileName)}</p></div>
                        <div class='info d-flex gap-2 align-items-center'>
                            <div class='size'>${formatFileSize(fileInfo.info.size)}</div>
                            <div class='type'>${escapeHtml(fileInfo.info.type)}</div>
                            <div class='last_updated'>${fileInfo.info.last_updated}</div>
                            ${openBtn}
                            ${deleteBtn}
                        </div>
                    </div>`;
            }
        }
    }

    const folderElement = `
    <div class='mx-5 project_info d-flex justify-content-between align-items-center'>
        <div class='folder_name d-flex justify-content-between'><h4>${back_button}${escapeHtml(pos)}</h4></div>
        <div class='d-flex gap-3 align-items-center'>
            <div class='d-flex gap-2'>
                <div class='folders'><p>${folder.folder_count === 1 ? '1 Folder' : folder.folder_count + ' Folders'}</p></div>
                <div class='files'><p>${folder.file_count === 1 ? '1 File' : folder.file_count + ' Files'}</p></div>
            </div>
            ${renderAddControls()}
        </div>
    </div>
    <div class='project_files mx-3'>
        ${foldersHTML}
        ${filesHTML}
    </div>`;
    return folderElement
}
function handle_create_folder(){
    const name = prompt('Folder name:')
    if(!name || !name.trim()) return
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    fetch('../create-project-folder', {
        method: 'POST',
        headers: {'X-CSRF-TOKEN': csrf, 'Accept':'application/json', 'Content-Type':'application/json'},
        body: JSON.stringify({group_id, path: pos, name: name.trim()})
    })
    .then(response => response.json().then(body => ({ok: response.ok, body})))
    .then(({ok, body})=>{
        if(!ok) throw new Error(body.message || 'Failed to create folder')
        screenUpdate('code')
    })
    .catch(error=>alert(error.message))
}
function handle_add_files(event){
    const files = event.target.files
    if(!files || files.length === 0) return
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    const formdata = new FormData()
    Array.from(files).forEach(f => formdata.append('files[]', f))
    formdata.append('group_id', group_id)
    formdata.append('path', pos)
    formdata.append('_token', csrf)
    fetch('../add-project-files', {
        method: 'POST',
        body: formdata
    })
    .then(response => response.json().then(body => ({ok: response.ok, body})))
    .then(({ok, body})=>{
        if(!ok) throw new Error(body.message || 'Failed to upload files')
        screenUpdate('code')
    })
    .catch(error=>alert(error.message))
    event.target.value = ''
}
function handle_folder_open(event){
    const element = event.target.closest('.folder')
    const title = element.querySelector('h5')
    const dir = title.textContent
    const file_icon = element.querySelectorAll('.file_icon')
    file_icon.forEach(icon => {
        icon.classList.remove('fa-regular')
        icon.classList.add('fa-solid')
    });
    const folder = folderBase.contents[dir]
    title.outerHTML = `<h4><button class="back_button" onclick="handle_go_back(event)">...</button>${escapeHtml(pos+'/'+dir)}</h4>`
    document.querySelectorAll('.open_folder').forEach(close_folder =>close_folder.classList.remove('open_folder'))
    element.classList.add('open_folder')
    setTimeout(()=>{
        document.querySelector(".code").innerHTML=file_model(folder, dir, 'forwards')
    },800)
}
function handle_go_back(event){
    activeEditor = null
    const segments = pos.split('/').filter(Boolean)
    segments.pop()
    let folder = rootData
    segments.forEach(seg => { folder = folder.contents[seg] })
    document.querySelector(".code").innerHTML = file_model(folder, '', 'backwards')
}
function handle_delete_item(event){
    const row = event.target.closest('.folder, .file')
    const isFolder = row.classList.contains('folder')
    const name = isFolder ? row.querySelector('h5').textContent : row.querySelector('.file_name').textContent
    if(!confirm(`Delete "${name}"?${isFolder ? ' This deletes everything inside it.' : ''}`)) return
    const filePosition = pos + '/' + name
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    fetch('../delete-project-file', {
        method: 'POST',
        headers: {'X-CSRF-TOKEN': csrf, 'Accept':'application/json', 'Content-Type':'application/json'},
        body: JSON.stringify({group_id, file_position: filePosition})
    })
    .then(response=>{
        if(!response.ok) throw new Error('Failed to delete')
        return response.json()
    })
    .then(()=>screenUpdate('code'))
    .catch(error=>console.error(error))
}
// Reuses the same live-preview page as the showcase-post "Open" button
// (beta-test.js), parameterized for a group file instead of a flat
// storage/codes/ lookup — beta-test.js fetches it through get-code with
// the same auth + folder-access checks as viewing/editing it here. Opens
// in a new tab so the group workspace itself doesn't navigate away. Used
// both from a file row (pos is the containing folder, name comes from the
// row) and from the opened-file header (pos is already the full path to
// that file, no row to read from).
function handle_open_item_preview(event){
    const row = event.target.closest('.file')
    const filePath = row ? (pos + '/' + row.querySelector('.file_name').textContent) : pos
    window.open(`../beta-test?group=${group_id}&file=${encodeURIComponent(filePath)}`, '_blank')
}

let currentFileExtention = ''
function openFileAtPosition(filePosition){
    activeEditor = null
    pos = filePosition
    currentFileExtention = filePosition.split('.').pop()
    const canManage = canManageFolder(pos.split('/').filter(Boolean)[0])
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    fetch('../get-code',{
        method:'POST',
        headers: {
            'X-CSRF-TOKEN': csrf,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body:JSON.stringify({group_id, file_position: pos})
    })
    .then(response=>response.json())
    .then(data=>{
        const isHtml = currentFileExtention.toLowerCase() === 'html' || currentFileExtention.toLowerCase() === 'htm'
        const openBtn = isHtml ? `<button type="button" class="file-open-btn" onclick='handle_open_item_preview(event)' title="Open"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>` : ''
        const manageButtons = canManage ? `
            <button type="button" class="file-edit-btn" onclick='start_edit_file()' title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button type="button" class="file-delete-btn" onclick='handle_delete_open_file()' title="Delete"><i class="fa-solid fa-trash"></i></button>` : ''
        const actionButtons = (openBtn || manageButtons) ? `<div class='file_actions'>${openBtn}${manageButtons}</div>` : ''
        document.querySelector(".code").innerHTML=`
            <div class='file_position'>
                <div>
                    <h4><button class="back_button" onclick="handle_go_back(event)">...</button>${escapeHtml(pos)}</h4>
                </div>
                ${actionButtons}
            </div>
            <pre class='codeblock'></pre>`
        let codeblock = document.querySelector('.codeblock')
        open_code(codeblock,group_id,data.code,currentFileExtention)
    })
    .catch(error=>console.error(error))
}
function handle_file_open(event){
    let file_name = event.target.closest('.name').querySelector('.file_name').textContent
    openFileAtPosition(pos+'/'+file_name)
}
function handle_delete_open_file(){
    const segments = pos.split('/').filter(Boolean)
    const name = segments[segments.length-1]
    if(!confirm(`Delete "${name}"?`)) return
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    fetch('../delete-project-file', {
        method: 'POST',
        headers: {'X-CSRF-TOKEN': csrf, 'Accept':'application/json', 'Content-Type':'application/json'},
        body: JSON.stringify({group_id, file_position: pos})
    })
    .then(response=>{
        if(!response.ok) throw new Error('Failed to delete')
        return response.json()
    })
    .then(()=>screenUpdate('code'))
    .catch(error=>console.error(error))
}

// Extension -> CodeMirror mode. Anything not listed falls back to plain
// text (still gets line numbers, just no highlighting/hints).
function cmModeForExtension(ext){
    const modes = {
        html: 'htmlmixed', htm: 'htmlmixed',
        css: 'css',
        js: 'javascript', jsx: 'javascript', mjs: 'javascript', ts: 'javascript', tsx: 'javascript',
        json: {name: 'javascript', json: true},
        php: 'php',
        py: 'python',
        xml: 'xml',
        yml: 'yaml', yaml: 'yaml',
        md: 'markdown',
        cpp: 'text/x-c++src', cc: 'text/x-c++src', cxx: 'text/x-c++src', h: 'text/x-c++src', hpp: 'text/x-c++src',
        c: 'text/x-csrc',
        java: 'text/x-java',
        cs: 'text/x-csharp',
    }
    return modes[(ext || '').toLowerCase()] || null
}
// Characters that pop the completion list automatically for a given mode —
// e.g. typing '<' in HTML/PHP suggests tags. This is a lightweight
// dictionary-based helper (CodeMirror's bundled hint addons + its generic
// "anyword" fallback for modes with no dedicated one, like C/C++), not real
// per-language IntelliSense — a full language server is out of scope here.
function cmHintTriggersFor(modeName){
    if(modeName === 'htmlmixed' || modeName === 'xml' || modeName === 'php') return ['<']
    if(modeName === 'css') return [':']
    return null
}
function cmHintHelperFor(modeName){
    if((modeName === 'htmlmixed' || modeName === 'xml') && CodeMirror.hint.html) return CodeMirror.hint.html
    if(modeName === 'xml' && CodeMirror.hint.xml) return CodeMirror.hint.xml
    if(modeName === 'css' && CodeMirror.hint.css) return CodeMirror.hint.css
    if(modeName === 'javascript' && CodeMirror.hint.javascript) return CodeMirror.hint.javascript
    return CodeMirror.hint.anyword
}

let activeEditor = null

// Real save path — the old edit_code() just made spans contenteditable
// with nothing wired up to persist a change. This swaps the CodeBox viewer
// for a CodeMirror instance (line numbers + per-language autocomplete)
// pre-filled with the raw content, and posts to update_project_file on
// save. Fetches the raw source fresh (get-code with raw=true) instead of
// reconstructing it from the read-only viewer's rendered line spans — that
// viewer renders progressively across animation frames (see
// renderCodeInChunks() in code_box.js), so scraping it only worked once
// that had actually finished.
function start_edit_file(){
    const codeBox = document.querySelector('.codeblock')
    if(!codeBox) return
    const modeSpec = cmModeForExtension(pos.split('.').pop())
    const modeName = typeof modeSpec === 'string' ? modeSpec : (modeSpec ? modeSpec.name : null)
    const csrf = document.querySelector('meta[name="csrf-token"]').content

    fetch('../get-code', {
        method: 'POST',
        headers: {'X-CSRF-TOKEN': csrf, 'Accept':'application/json', 'Content-Type':'application/json'},
        body: JSON.stringify({group_id, file_position: pos, raw: true})
    })
    .then(response => response.json().then(body => ({ok: response.ok, body})))
    .then(({ok, body}) => {
        if(!ok) throw new Error(body.message || 'Failed to load file for editing')
        mountCodeEditor(codeBox, body.code, modeSpec, modeName)
    })
    .catch(error => console.error(error))
}
function mountCodeEditor(codeBox, originalText, modeSpec, modeName){
    const editorWrapper = document.createElement('div')
    editorWrapper.className = 'code_editor'
    editorWrapper.innerHTML = `
        <div class='code_editor_cm'></div>
        <div class='code_editor_actions d-flex gap-2 justify-content-end align-items-center'>
            <span class='code_editor_error'></span>
            <button type='button' class='btn btn-success save_edit_btn'>Save</button>
            <button type='button' class='btn btn-secondary cancel_edit_btn'>Cancel</button>
        </div>`
    codeBox.replaceWith(editorWrapper)

    const cm = CodeMirror(editorWrapper.querySelector('.code_editor_cm'), {
        value: originalText,
        mode: modeSpec || undefined,
        theme: 'codebox',
        lineNumbers: true,
        lineWrapping: true,
        indentUnit: 4,
        extraKeys: {'Ctrl-Space': 'autocomplete'},
    })
    activeEditor = cm

    const triggers = cmHintTriggersFor(modeName)
    if(triggers){
        cm.on('inputRead', (instance, change)=>{
            if(change.text && change.text.length === 1 && triggers.includes(change.text[0])){
                CodeMirror.showHint(instance, cmHintHelperFor(modeName), {completeSingle: false})
            }
        })
    }
    wireAskAiSelection(cm)

    editorWrapper.querySelector('.save_edit_btn').addEventListener('click', save_edit_file)
    editorWrapper.querySelector('.cancel_edit_btn').addEventListener('click', ()=>openFileAtPosition(pos))
    const editBtn = document.querySelector('.file-edit-btn')
    const deleteBtn = document.querySelector('.file-delete-btn')
    if(editBtn) editBtn.classList.add('d-none')
    if(deleteBtn) deleteBtn.classList.add('d-none')
}
function save_edit_file(){
    if(!activeEditor) return
    const errorEl = document.querySelector('.code_editor_error')
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    errorEl.textContent = ''
    fetch('../update-project-file', {
        method: 'POST',
        headers: {'X-CSRF-TOKEN': csrf, 'Accept':'application/json', 'Content-Type':'application/json'},
        body: JSON.stringify({group_id, file_position: pos, content: activeEditor.getValue()})
    })
    .then(response => response.json().then(body => ({ok: response.ok, body})))
    .then(({ok, body})=>{
        if(!ok) throw new Error(body.message || 'Failed to save')
        // Leaves the edit open with the error shown (no data loss) instead
        // of reopening the file on failure.
        activeEditor = null
        openFileAtPosition(pos)
    })
    .catch(error=>{
        errorEl.textContent = error.message
    })
}

// Concept placeholder only, per explicit request — a floating "Ask AI"
// button appears whenever text is selected in the editor, and clicking it
// just shows what WOULD be sent. Deliberately does not call any AI/model;
// nothing here executes anything. Wires the UI hook now so a real
// integration can be dropped into show_ask_ai_stub() later without
// redesigning the surrounding editor.
function wireAskAiSelection(cm){
    let askBtn = null
    function removeBtn(){
        if(askBtn){ askBtn.remove(); askBtn = null }
    }
    cm.on('cursorActivity', ()=>{
        removeBtn()
        if(!cm.somethingSelected()) return
        const coords = cm.cursorCoords(cm.getCursor('from'), 'local')
        askBtn = document.createElement('button')
        askBtn.type = 'button'
        askBtn.className = 'ask_ai_btn'
        askBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Ask AI'
        askBtn.style.left = coords.left + 'px'
        askBtn.style.top = (coords.top - 32) + 'px'
        // mousedown (not click) so this fires before CodeMirror's own
        // handling would otherwise clear the selection first.
        askBtn.addEventListener('mousedown', e=>{
            e.preventDefault()
            show_ask_ai_stub(cm.getSelection())
        })
        cm.getScrollerElement().appendChild(askBtn)
    })
    cm.on('blur', removeBtn)
}
function show_ask_ai_stub(selectedText){
    const existing = document.querySelector('.ask_ai_popover')
    if(existing) existing.remove()
    const popover = document.createElement('div')
    popover.className = 'ask_ai_popover'
    const preview = selectedText.length > 300 ? selectedText.slice(0, 300) + '…' : selectedText
    popover.innerHTML = `
        <div class='ask_ai_popover_head'>
            <span><i class="fa-solid fa-wand-magic-sparkles"></i> Ask AI</span>
            <button type='button' class='ask_ai_close' aria-label="Close">&times;</button>
        </div>
        <p>Not wired up yet — a placeholder for asking an AI assistant about the selected code.</p>
        <pre class='ask_ai_preview'></pre>`
    popover.querySelector('.ask_ai_preview').textContent = preview
    popover.querySelector('.ask_ai_close').addEventListener('click', ()=>popover.remove())
    document.body.appendChild(popover)
}

let stop_upload = false
function handle_file_change(event){
    stop_upload = true
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    const codeFile = event.srcElement
    const file = codeFile.files[0]
    if(document.querySelector('.uploading_progress'))document.querySelector('.uploading_progress').remove()
    if(!document.querySelector('.file_buttons')) document.querySelector('.upload_zip').outerHTML+=`
    <div class='file_buttons d-flex justify-content-center gap-2'>
        <button class='btn btn-success upload'>Upload</button>
        <button class='btn btn-danger remove'>Remove</button>
    </div>`
    const remove_btn =  document.querySelector('.file_buttons .remove')
    const upload_btn = document.querySelector('.file_buttons .upload')
    const file_buttons = document.querySelector('.file_buttons')
    upload_btn.onclick = () =>{
        file_buttons.remove()
        stop_upload = false
        let progress = 0
        if(!document.querySelector('.uploading_progress')) document.querySelector('.upload_zip').innerHTML+=`<div class='my-2 uploading_progress d-flex justify-content-center gap-2'><progress id="progress" max="100" value="${progress}">${progress}%</progress></div>`
        const formdata = new FormData();
        formdata.append('code', file);
        formdata.append('post_id', group_id);
        formdata.append('user_id', my_id);
        formdata.append('_token', csrf);
        const request = new XMLHttpRequest();
        request.upload.addEventListener('progress', function (e) {
            if (stop_upload) request.abort()
            if (e.lengthComputable) {
                progress = Math.round((e.loaded / e.total) * 100);
                const progressBar = document.querySelector('#progress');
                if (progressBar) {
                    progressBar.value = progress;
                    progressBar.innerHTML = `${progress}%`;
                }
                if(progress == 100){
                    progressBar.outerHTML='<h4>Finished</h4>'
                }
            }
        });
        request.onload = function() {
            if (request.status >= 200 && request.status < 300) {
                // Refresh the Code tab so the newly uploaded tree actually
                // shows up — previously this just logged to the console and
                // left the finished-progress UI sitting there.
                screenUpdate('code')
            } else {
                console.error('Request failed with status:', request.status);
            }
        };

        request.onerror = function() {
            console.error('Network error occurred');
        };

        request.ontimeout = function() {
            console.error('Request timed out');
        };

        request.open('POST', `../project_code`);
        request.timeout = 450000;
        request.send(formdata);
    }
    remove_btn.onclick = () =>{
        const progressBar = document.querySelector('.uploading_progress')
        const buttons = document.querySelector('.file_buttons')
        const file_name = document.querySelector('.file_name')
        if(file_name) file_name.remove()
        if(progressBar) progressBar.remove()
        if(buttons) buttons.remove()
        file.value = ''
        stop_upload=true
    }
    if(!document.querySelector('.file_name')) document.querySelector('.upload_zip').innerHTML+=`<div class='file_name d-flex justify-content-center gap-2'><h4>${escapeHtml(file.name)}  ---  ${formatFileSize(file.size)}</h4></div>`
    else document.querySelector('.file_name').innerHTML = `<h4>${escapeHtml(file.name)}  ---  ${formatFileSize(file.size)}</h4>`
}
