function check_projet(project_id){
    return fetch(`/get_project/${project_id}`)
    .then(response => response.json());
}
let rootData = null
let folderBase = {}
let pos = '' // current folder being BROWSED in the sidebar tree — independent of which files are open as tabs (see openTabs below)

// Mirrors Posts::pathCoveredByAny() server-side: a restriction on "Alpha"
// also covers "Alpha/Sub" and "Alpha/Sub/file.txt", not just an exact
// top-level match — folder access is now granted per-folder (any depth)
// from the file manager's "Manage access" button rather than only at the
// top level from the role form.
function pathCoveredByAny(path, allowed){
    return allowed.some(entry => path === entry || path.startsWith(entry + '/'))
}
// Full path (no leading slash) of `pos` itself — used wherever a check
// needs "the folder currently open", not a row inside it.
function currentPath(){
    return pos.split('/').filter(Boolean).join('/')
}
// Full path (no leading slash) of a row about to be rendered inside the
// folder currently at `pos`.
function fullPathForRow(fileName){
    const base = currentPath()
    return base ? base + '/' + fileName : fileName
}
function canManageFolder(path){
    return manageable_folders === null || (manageable_folders && pathCoveredByAny(path, manageable_folders))
}
function canDownloadFolder(path){
    return downloadable_folders === null || (downloadable_folders && pathCoveredByAny(path, downloadable_folders))
}
// Folder-level access assignment (the "Manage access" button) stays
// creator-only, same as role create/edit/delete — it's a distinct
// capability from canManageFolder()/canDownloadFolder() (which describe
// what a role permits a MEMBER to do), so it doesn't reuse those. `settings`
// and `my_id` are shared globals populated by group.js's loadGroupData().
function isCreator(){
    return settings && settings.creator_id == my_id
}
let selectMode = false
let selectedPaths = new Set()
function toggleSelectMode(){
    selectMode = !selectMode
    selectedPaths.clear()
    document.querySelector(".code_sidebar").innerHTML = file_model(folderBase, '', 'refresh')
}
function handle_toggle_select(event){
    const path = event.target.dataset.path
    if(event.target.checked) selectedPaths.add(path)
    else selectedPaths.delete(path)
    // Re-renders just the header controls (selection count), not the whole
    // row list, so checking a box doesn't reset scroll position.
    const host = document.querySelector('.download_controls')
    if(host) host.innerHTML = renderDownloadControls(folderBase.contents)
}
function downloadBlobAs(blob, filename){
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}
function extractDownloadFilename(response, fallback){
    const disposition = response.headers.get('Content-Disposition')
    const match = disposition && disposition.match(/filename="?([^"]+)"?/)
    return match ? match[1] : fallback
}
function downloadZip(paths, fallbackName){
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    fetch('../download-project-files', {
        method: 'POST',
        headers: {'X-CSRF-TOKEN': csrf, 'Accept':'application/json', 'Content-Type':'application/json'},
        body: JSON.stringify({group_id, paths})
    })
    .then(response=>{
        if(!response.ok) return response.json().then(body=>{ throw new Error(body.message || 'Failed to download') })
        return response.blob().then(blob => ({blob, filename: extractDownloadFilename(response, fallbackName)}))
    })
    .then(({blob, filename}) => downloadBlobAs(blob, filename))
    .catch(error=>alert(error.message))
}
function handle_download_single_file(event){
    const row = event.target.closest('.file')
    const name = row.querySelector('.file_name').textContent
    const filePath = pos + '/' + name
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    fetch('../get-code', {
        method: 'POST',
        headers: {'X-CSRF-TOKEN': csrf, 'Accept':'application/json', 'Content-Type':'application/json'},
        body: JSON.stringify({group_id, file_position: filePath, raw: true})
    })
    .then(response => response.json().then(body => ({ok: response.ok, body})))
    .then(({ok, body})=>{
        if(!ok) throw new Error(body.message || 'Failed to download')
        downloadBlobAs(new Blob([body.code]), name)
    })
    .catch(error=>alert(error.message))
}
function handle_download_selected(){
    if(selectedPaths.size === 0) return
    downloadZip(Array.from(selectedPaths), 'selected-files.zip')
}
function handle_download_all(){
    const paths = Object.keys(folderBase.contents)
        .filter(name => canDownloadFolder(fullPathForRow(name)))
        .map(name => '/' + name)
    if(paths.length === 0) return
    downloadZip(paths, 'project.zip')
}
// Select toggle + "download all" (root only) + "download N selected" —
// rendered into its own .download_controls wrapper so selecting a row can
// re-render just this part (see handle_toggle_select).
function renderDownloadControls(folderContents){
    const anyDownloadableHere = Object.keys(folderContents).some(name => canDownloadFolder(fullPathForRow(name)))
    if(!anyDownloadableHere) return ''
    let html = `<button type="button" class="add-item-btn select-toggle-btn${selectMode ? ' active' : ''}" title="${selectMode ? 'Cancel selection' : 'Select files to download'}" onclick="toggleSelectMode()"><i class="fa-solid fa-square-check"></i></button>`
    if(selectMode && selectedPaths.size > 0){
        html += `<button type="button" class="download-selected-btn" onclick="handle_download_selected()">Download (${selectedPaths.size})</button>`
    }
    if(!selectMode && pos === ''){
        html += `<button type="button" class="add-item-btn download-all-btn" title="Download all" onclick="handle_download_all()"><i class="fa-solid fa-file-zipper"></i></button>`
    }
    return html
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
    return canManageFolder(currentPath())
}
// Shared by file_model() (once a tree already exists) and group.js's empty
// project state (nothing uploaded yet) — same "add a file or a new folder"
// affordance either way, since there's no reason bootstrapping a project
// should require a zip specifically.
function renderAddControls(){
    if(!canAddHere()) return ''
    return `<div class='add_item_controls d-flex gap-2'>
        <button type='button' class='add-item-btn new-file-btn' title="New file" onclick='handle_create_file()'><i class="fa-solid fa-file-pen"></i></button>
        <label class='add-item-btn add-file-btn' title="Upload file(s)">
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
    else if (direction === 'refresh') {
        // pos stays put — re-rendering the same folder (e.g. toggling select mode).
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
            const rowFullPath = fullPathForRow(fileName)
            const canManage = canManageFolder(rowFullPath)
            const canDownloadRow = canDownloadFolder(rowFullPath)
            const deleteBtn = canManage ? `<button type="button" class="item-delete" onclick="handle_delete_item(event)" title="Delete"><i class="fa-solid fa-trash"></i></button>` : ''
            const manageAccessBtn = (fileInfo.info.type === 'directory' && isCreator())
                ? `<button type="button" class="manage-access-btn" onclick="handle_manage_access(event)" title="Manage access"><i class="fa-solid fa-user-lock"></i></button>` : ''
            const rowExt = fileName.split('.').pop().toLowerCase()
            const openBtn = (rowExt === 'html' || rowExt === 'htm') ? `<button type="button" class="item-open" onclick="handle_open_item_preview(event)" title="Open"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>` : ''
            const rowPath = pos + '/' + fileName
            let selectionControl = ''
            if(canDownloadRow){
                if(selectMode){
                    selectionControl = `<input type="checkbox" class="item-select-checkbox" data-path="${escapeHtml(rowPath)}" ${selectedPaths.has(rowPath) ? 'checked' : ''} onchange="handle_toggle_select(event)">`
                } else if(fileInfo.info.type !== 'directory'){
                    selectionControl = `<button type="button" class="item-download" onclick="handle_download_single_file(event)" title="Download"><i class="fa-solid fa-download"></i></button>`
                }
            }
            if (fileInfo.info.type === 'directory') {
                foldersHTML += `
                    <div class='folder d-flex justify-content-between'>
                        <div class='name d-flex gap-2' onclick='handle_folder_open(event)'>
                            <i class="fa-solid fa-folder folder_icon"></i>
                            <h5>${escapeHtml(fileName)}</h5>
                        </div>
                        <div class='info d-flex gap-2 align-items-center'>
                            <div class='folders'><p>${fileInfo.folder_count === 1 ? '1 Folder' : (fileInfo.folder_count + ' Folders')}</p></div>
                            <div class='files'><p>${fileInfo.file_count === 1 ? '1 File' : (fileInfo.file_count + ' Files')}</p></div>
                            <div class='last_updated'>${fileInfo.info.last_updated}</div>
                            ${selectionControl}
                            ${manageAccessBtn}
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
                            ${selectionControl}
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
            <div class='download_controls d-flex gap-2 align-items-center'>${renderDownloadControls(folderContents)}</div>
            ${renderAddControls()}
        </div>
    </div>
    <div class='project_files mx-3'>
        ${foldersHTML}
        ${filesHTML}
    </div>`;
    return folderElement
}
// Creates a blank file directly (as opposed to add-file-btn, which uploads
// an existing one from disk) and opens it as a tab right away so the user
// can start typing immediately — mirrors "New File" in VS Code's explorer.
function handle_create_file(){
    const name = prompt('File name (e.g. index.html):')
    if(!name || !name.trim()) return
    const filePosition = pos + '/' + name.trim()
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    fetch('../update-project-file', {
        method: 'POST',
        headers: {'X-CSRF-TOKEN': csrf, 'Accept':'application/json', 'Content-Type':'application/json'},
        body: JSON.stringify({group_id, file_position: filePosition, content: ''})
    })
    .then(response => response.json().then(body => ({ok: response.ok, body})))
    .then(({ok, body})=>{
        if(!ok) throw new Error(body.message || 'Failed to create file')
        refreshSidebar()
        openFileAtPosition(filePosition)
    })
    .catch(error=>alert(error.message))
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
        refreshSidebar()
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
        refreshSidebar()
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
        document.querySelector(".code_sidebar").innerHTML=file_model(folder, dir, 'forwards')
    },800)
}
// Sidebar tree navigation — deliberately doesn't touch open tabs at all
// (no unsaved-changes guard, no editor state reset). Browsing folders in
// the sidebar and having files open in the editor are independent now,
// same as VS Code's Explorer vs. its open editor tabs.
function handle_go_back(event){
    const segments = pos.split('/').filter(Boolean)
    segments.pop()
    let folder = rootData
    segments.forEach(seg => { folder = folder.contents[seg] })
    document.querySelector(".code_sidebar").innerHTML = file_model(folder, '', 'backwards')
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
    .then(()=>refreshSidebar())
    .catch(error=>console.error(error))
}
// Folder-level access control, moved here from the role form: pick a
// folder, decide which roles can reach it. Restricting a folder covers
// everything inside it (nested folders/files inherit it) — see
// Posts::pathCoveredByAny()/pathHasAllowedDescendant() server-side.
function handle_manage_access(event){
    const row = event.target.closest('.folder')
    const name = row.querySelector('h5').textContent
    openAccessModal(fullPathForRow(name))
}
function openAccessModal(path){
    fetch(`../group/${group_id}/folder-roles?path=${encodeURIComponent(path)}`, {
        headers: {'Accept': 'application/json'}
    })
    .then(response => response.json())
    .then(data => renderAccessModal(path, data.role_ids || []))
    .catch(()=>renderAccessModal(path, []))
}
function renderAccessModal(path, checkedIds){
    const existing = document.querySelector('.access_modal')
    if(existing) existing.remove()
    const modal = document.createElement('div')
    modal.className = 'access_modal'
    const roleRows = roles.length
        ? roles.map(role => `<label class='access_role_check' style="--role_chip_color: ${role.color || DEFAULT_ROLE_COLOR}">
            <input type='checkbox' value='${role.id}' ${checkedIds.includes(role.id) ? 'checked' : ''}> <span>${escapeHtml(role.name)}</span>
        </label>`).join('')
        : `<p>No roles yet — create one in Settings first.</p>`
    modal.innerHTML = `
        <div class='confirm_modal_head'><strong>Manage access</strong></div>
        <p>Roles checked here can reach <strong>${escapeHtml(path)}</strong> and everything inside it. This adds to whatever else each role is already scoped to.</p>
        <div class='access_modal_roles'>${roleRows}</div>
        <div class='confirm_modal_actions d-flex gap-2 justify-content-end'>
            <span class='code_editor_error access_modal_error'></span>
            <button type='button' class='btn btn-secondary cancel'>Cancel</button>
            <button type='button' class='btn btn-success save'>Save</button>
        </div>`
    modal.querySelector('.cancel').addEventListener('click', ()=>modal.remove())
    modal.querySelector('.save').addEventListener('click', ()=>{
        const roleIds = Array.from(modal.querySelectorAll('input[type=checkbox]:checked')).map(i=>parseInt(i.value, 10))
        const csrf = document.querySelector('meta[name="csrf-token"]').content
        fetch(`../group/${group_id}/folder-roles`, {
            method: 'POST',
            headers: {'X-CSRF-TOKEN': csrf, 'Accept':'application/json', 'Content-Type':'application/json'},
            body: JSON.stringify({path, role_ids: roleIds})
        })
        .then(response => response.json().then(body => ({ok: response.ok, body})))
        .then(({ok, body})=>{
            if(!ok) throw new Error(body.message || 'Failed to save access')
            modal.remove()
            refreshSidebar()
        })
        .catch(error=>{
            const errorEl = modal.querySelector('.access_modal_error')
            if(errorEl) errorEl.textContent = error.message
        })
    })
    document.body.appendChild(modal)
}
// Reuses the same live-preview page as the showcase-post "Open" button
// (beta-test.js), parameterized for a group file instead of a flat
// storage/codes/ lookup — beta-test.js fetches it through get-code with
// the same auth + folder-access checks as viewing/editing it here. Opens
// in a new tab so the group workspace itself doesn't navigate away. Used
// both from a file row (pos is the containing folder, name comes from the
// row) and from the editor toolbar (falls back to whichever tab is active,
// there's no row to read from there).
function handle_open_item_preview(event){
    const row = event.target.closest('.file')
    const filePath = row ? (pos + '/' + row.querySelector('.file_name').textContent) : activeTabPath
    if(!filePath) return
    window.open(`../beta-test?group=${group_id}&file=${encodeURIComponent(filePath)}`, '_blank')
}

// ---------- Open files as tabs (VS Code style) ----------
// One shared CodeMirror instance + one CodeMirror.Doc per open tab (same
// pattern as the Bug Hunter multi-file editor) — swapping which doc is
// attached is how switching tabs works, so every open file keeps its own
// undo history/scroll position/content without needing N separate CM
// instances. `openTabs` + `activeTabPath` replace the old single `pos`
// (now sidebar-only)/`activeEditor`/`editorDirty` globals.
let openTabs = []
let activeTabPath = null
let sharedCM = null

function findTab(path){
    return openTabs.find(t => t.path === path)
}
function anyDirtyTabs(){
    return openTabs.some(t => t.dirty)
}

// Opens straight into the editor as a tab — no separate read-only preview
// + "Edit" click anymore. Users without manage access on this file still
// get the same tab (readOnly CodeMirror: syntax highlighting + copy, no
// typing/save) rather than a completely different view.
function openFileAtPosition(filePosition){
    const existing = findTab(filePosition)
    if(existing){
        activateTab(filePosition)
        return
    }
    const ext = filePosition.split('.').pop()
    const modeSpec = cmModeForExtension(ext)
    const modeName = typeof modeSpec === 'string' ? modeSpec : (modeSpec ? modeSpec.name : null)
    const canManage = canManageFolder(filePosition)
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    fetch('../get-code', {
        method: 'POST',
        headers: {'X-CSRF-TOKEN': csrf, 'Accept':'application/json', 'Content-Type':'application/json'},
        body: JSON.stringify({group_id, file_position: filePosition, raw: true})
    })
    .then(response => response.json().then(body => ({ok: response.ok, body})))
    .then(({ok, body})=>{
        if(!ok) throw new Error(body.message || 'Failed to open file')
        const doc = new CodeMirror.Doc(body.code, modeSpec || undefined)
        doc.on('change', () => {
            const tab = findTab(filePosition)
            if(tab && !tab.dirty){ tab.dirty = true; renderTabs() }
        })
        openTabs.push({path: filePosition, doc, dirty: false, modeSpec, modeName, readOnly: !canManage})
        activateTab(filePosition)
    })
    .catch(error => console.error(error))
}
function handle_file_open(event){
    let file_name = event.target.closest('.name').querySelector('.file_name').textContent
    openFileAtPosition(pos+'/'+file_name)
}

function activateTab(path){
    activeTabPath = path
    renderTabs()
    mountActiveEditor()
    updateCodeLayoutState()
}

// Per-tab close guard (only prompts about THIS tab's changes, not every
// open tab — that's what the top-level group-tab switcher's
// guardUnsavedChanges() is for).
function handle_close_tab(event){
    event.stopPropagation()
    const chip = event.target.closest('.code_tab')
    const path = chip.dataset.path
    const tab = findTab(path)
    if(!tab) return
    const doClose = () => {
        openTabs = openTabs.filter(t => t.path !== path)
        if(activeTabPath === path){
            activeTabPath = openTabs.length ? openTabs[openTabs.length - 1].path : null
        }
        renderTabs()
        if(activeTabPath) mountActiveEditor()
        updateCodeLayoutState()
    }
    if(tab.dirty){
        showConfirmModal({
            title: 'Unsaved changes',
            message: `You have unsaved changes in "${path.split('/').filter(Boolean).pop()}". Save them before closing?`,
            buttons: [
                {label: 'Save', class: 'btn-success', action: ()=>save_edit_file(tab, doClose)},
                {label: "Don't Save", class: 'btn-danger', action: doClose},
                {label: 'Cancel', class: 'btn-secondary', action: ()=>{}},
            ]
        })
    } else {
        doClose()
    }
}

function renderTabs(){
    const el = document.getElementById('code_tabs')
    if(!el) return
    el.innerHTML = openTabs.map(t => {
        const name = t.path.split('/').filter(Boolean).pop()
        const classes = ['code_tab']
        if(t.path === activeTabPath) classes.push('active')
        if(t.dirty) classes.push('dirty')
        return `<div class="${classes.join(' ')}" data-path="${escapeHtml(t.path)}" title="${escapeHtml(t.path)}">
            <i class="fa-solid fa-file file_icon"></i>
            <span class="code_tab_name">${escapeHtml(name)}</span>
            <span class="code_tab_dot"></span>
            <button type="button" class="code_tab_close" title="Close" onclick="handle_close_tab(event)"><i class="fa-solid fa-xmark"></i></button>
        </div>`
    }).join('')
    el.querySelectorAll('.code_tab').forEach(chip => {
        chip.addEventListener('click', (e) => {
            if(e.target.closest('.code_tab_close')) return
            activateTab(chip.dataset.path)
        })
    })
}

// Builds the toolbar + mounts the single shared CodeMirror instance once —
// only rebuilt if the DOM under it was torn down (e.g. leaving and
// re-entering the Code tab), never per-tab-switch.
function ensureEditorChrome(){
    const area = document.getElementById('code_editor_area')
    if(!area || area.querySelector('.code_editor_chrome')) return
    const chrome = document.createElement('div')
    chrome.className = 'code_editor_chrome'
    chrome.innerHTML = `
        <div class='code_editor_toolbar d-flex gap-2 align-items-center justify-content-end'>
            <span class='code_editor_error'></span>
            <button type='button' class='editor-tool-btn run-btn' title="Run"><i class="fa-solid fa-play"></i></button>
            <button type='button' class='editor-tool-btn wrap-toggle-btn${wordWrapEnabled ? ' active' : ''}' title="Toggle word wrap"><i class="fa-solid fa-text-width"></i></button>
            <button type='button' class='editor-tool-btn open-preview-btn' title="Open"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
            <button type='button' class='editor-tool-btn download-btn' title="Download"><i class="fa-solid fa-download"></i></button>
            <button type='button' class='editor-tool-btn save-as-btn' title="Save As"><i class="fa-solid fa-file-circle-plus"></i></button>
            <button type='button' class='editor-tool-btn save-btn' title="Save"><i class="fa-solid fa-floppy-disk"></i></button>
            <button type='button' class='editor-tool-btn delete-btn' title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
        <div class='code_editor_cm' id='code_editor_cm'></div>
        <div class='code_run_output d-none'>
            <div class='code_run_output_header d-flex align-items-center justify-content-between'>
                <span class='code_run_output_title'>Output</span>
                <button type='button' class='code_run_output_close' title="Close">&times;</button>
            </div>
            <pre class='code_run_output_body'></pre>
        </div>`
    area.appendChild(chrome)

    if(sharedCM){
        // The editor already exists from before — e.g. we left and
        // re-entered the Code tab, which tears down and rebuilds this
        // whole area's DOM. A CodeMirror.Doc can only ever be linked to
        // ONE editor instance at a time, and destroying the old DOM
        // doesn't release that link — constructing a brand new
        // CodeMirror() here would throw "document already in use" the
        // moment we tried to swap back to an already-open tab's doc. Move
        // the EXISTING editor's own DOM node into the new chrome instead
        // of building another one.
        chrome.querySelector('.code_editor_cm').replaceWith(sharedCM.getWrapperElement())
        sharedCM.refresh()
    } else {
        sharedCM = CodeMirror(chrome.querySelector('.code_editor_cm'), {
            value: '',
            theme: 'codebox',
            lineNumbers: true,
            lineWrapping: wordWrapEnabled,
            indentUnit: 4,
            extraKeys: {'Ctrl-Space': 'autocomplete'},
        })
        wireAskAiSelection(sharedCM)
        sharedCM.on('inputRead', (instance, change) => {
            const tab = findTab(activeTabPath)
            if(!tab || instance.state.completionActive) return
            if(change.text && change.text.length === 1 && cmShouldTrigger(tab.modeName, change.text[0])){
                CodeMirror.showHint(instance, cmHintHelperFor(tab.modeName), {completeSingle: false})
            }
        })
    }

    // The toolbar buttons themselves ARE fresh DOM nodes every time this
    // runs (they live in `chrome`, not on the reused CodeMirror node), so
    // they always need their listeners wired regardless of the branch above.
    area.querySelector('.save-btn').addEventListener('click', ()=>save_edit_file())
    area.querySelector('.save-as-btn').addEventListener('click', handle_save_as)
    area.querySelector('.delete-btn').addEventListener('click', ()=>handle_delete_open_file())
    area.querySelector('.open-preview-btn').addEventListener('click', (e)=>handle_open_item_preview(e))
    area.querySelector('.download-btn').addEventListener('click', ()=>{
        const tab = findTab(activeTabPath)
        if(!tab) return
        const name = tab.path.split('/').filter(Boolean).pop() || 'file.txt'
        downloadBlobAs(new Blob([sharedCM.getValue()]), name)
    })
    area.querySelector('.wrap-toggle-btn').addEventListener('click', (e)=>{
        wordWrapEnabled = !wordWrapEnabled
        sharedCM.setOption('lineWrapping', wordWrapEnabled)
        e.currentTarget.classList.toggle('active', wordWrapEnabled)
    })
    area.querySelector('.run-btn').addEventListener('click', handle_run_code)
    area.querySelector('.code_run_output_close').addEventListener('click', ()=>{
        area.querySelector('.code_run_output').classList.add('d-none')
    })
    updateCodeLayoutState()
}

// Mirrors RUNNABLE_LANGUAGES in PostController::run_code() — extensions
// Piston (the third-party execution sandbox that endpoint proxies to) can
// actually run. Anything else just doesn't get a Run button.
const RUNNABLE_EXTENSIONS = ['js', 'mjs', 'py', 'php', 'cpp', 'cc', 'cxx', 'c', 'java', 'cs']
function isRunnableExtension(ext){
    return RUNNABLE_EXTENSIONS.includes((ext || '').toLowerCase())
}
function handle_run_code(){
    const tab = findTab(activeTabPath)
    if(!tab) return
    const ext = (tab.path.split('.').pop() || '').toLowerCase()
    const area = document.getElementById('code_editor_area')
    const outputPanel = area.querySelector('.code_run_output')
    const outputBody = area.querySelector('.code_run_output_body')
    const runBtn = area.querySelector('.run-btn')
    outputPanel.classList.remove('d-none')
    outputBody.textContent = 'Running...'
    outputBody.classList.remove('has-error')
    runBtn.disabled = true
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    fetch('../run-code', {
        method: 'POST',
        headers: {'X-CSRF-TOKEN': csrf, 'Accept':'application/json', 'Content-Type':'application/json'},
        body: JSON.stringify({language: ext, code: sharedCM.getValue()})
    })
    .then(response => response.json().then(body => ({ok: response.ok, body})))
    .then(({ok, body})=>{
        if(!ok) throw new Error(body.message || 'Failed to run your code')
        const compileError = body.compile_stderr && body.compile_stderr.trim()
        if(compileError){
            outputBody.textContent = compileError
            outputBody.classList.add('has-error')
            return
        }
        const stderr = (body.stderr || '').trim()
        const stdout = (body.stdout || '').trim()
        if(stderr){
            outputBody.textContent = [stdout, stderr].filter(Boolean).join('\n\n')
            outputBody.classList.add('has-error')
        } else {
            outputBody.textContent = stdout || '(no output)'
        }
    })
    .catch(error=>{
        outputBody.textContent = error.message
        outputBody.classList.add('has-error')
    })
    .finally(()=>{ runBtn.disabled = false })
}

function mountActiveEditor(){
    ensureEditorChrome()
    const tab = findTab(activeTabPath)
    if(!tab || !sharedCM) return
    sharedCM.swapDoc(tab.doc)
    sharedCM.setOption('readOnly', tab.readOnly ? true : false)
    sharedCM.refresh()

    const ext = (tab.path.split('.').pop() || '').toLowerCase()
    const isHtml = ext === 'html' || ext === 'htm'
    document.querySelector('.open-preview-btn')?.classList.toggle('d-none', !isHtml)
    document.querySelector('.save-btn')?.classList.toggle('d-none', tab.readOnly)
    document.querySelector('.save-as-btn')?.classList.toggle('d-none', tab.readOnly)
    document.querySelector('.delete-btn')?.classList.toggle('d-none', tab.readOnly)
    document.querySelector('.download-btn')?.classList.toggle('d-none', !canDownloadFolder(tab.path))
    document.querySelector('.run-btn')?.classList.toggle('d-none', !isRunnableExtension(ext))
    const errorEl = document.querySelector('.code_editor_error')
    if(errorEl) errorEl.textContent = ''
    // Run output is per-run, not per-file — switching tabs should hide the
    // previous file's leftover output rather than show it out of context.
    document.querySelector('.code_run_output')?.classList.add('d-none')
}

// Single source of truth for the sidebar-width/main-visibility state, driven
// entirely by whether any tabs are open. Full-width file tree with zero tabs
// open (nothing to shrink for), fixed-width compact tree + visible editor
// pane as soon as the first tab opens.
function updateCodeLayoutState(){
    const hasTabs = openTabs.length > 0
    document.querySelector('.code_sidebar')?.classList.toggle('sidebar-compact', hasTabs)
    document.querySelector('.code_main')?.classList.toggle('has-tabs', hasTabs)
}

// Re-fetches + re-renders just the sidebar tree (whatever folder is
// currently browsed), leaving open tabs/editor state completely alone.
// Used after anything that changes the file list (create folder, upload,
// delete from the list, change folder access) — screenUpdate('code') would
// work too but tears down and rebuilds the whole Code tab, which would
// silently close every open tab.
function refreshSidebar(){
    check_projet(group_id).then(data => {
        if(!data.contents) return
        rootData = data
        const segments = pos.split('/').filter(Boolean)
        let folder = rootData
        segments.forEach(seg => { folder = folder && folder.contents && folder.contents[seg] })
        if(folder) document.querySelector('.code_sidebar').innerHTML = file_model(folder, '', 'refresh')
    })
}

function handle_delete_open_file(){
    const tab = findTab(activeTabPath)
    if(!tab) return
    const name = tab.path.split('/').filter(Boolean).pop()
    if(!confirm(`Delete "${name}"?`)) return
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    fetch('../delete-project-file', {
        method: 'POST',
        headers: {'X-CSRF-TOKEN': csrf, 'Accept':'application/json', 'Content-Type':'application/json'},
        body: JSON.stringify({group_id, file_position: tab.path})
    })
    .then(response=>{
        if(!response.ok) throw new Error('Failed to delete')
        return response.json()
    })
    .then(()=>{
        openTabs = openTabs.filter(t => t.path !== tab.path)
        activeTabPath = openTabs.length ? openTabs[openTabs.length - 1].path : null
        renderTabs()
        if(activeTabPath) mountActiveEditor()
        updateCodeLayoutState()
        refreshSidebar()
    })
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
// The "member access" languages — no real language server here, so '.'
// just pops the same word-list (anyword) hint used for general typing;
// still useful since it lists identifiers already used elsewhere in the
// file (property/method names included) rather than nothing at all.
const CM_WORD_LANGS = ['javascript', 'php', 'python', 'text/x-c++src', 'text/x-csrc', 'text/x-java', 'text/x-csharp']
// Whether this single typed character should pop the hint list, per mode.
// HTML/XML/PHP: '<' (start of a tag). CSS: ':' (start of a value/pseudo).
// Word languages: '.' (member access) plus any letter/underscore, so
// suggestions appear as you type identifiers — closest we can get to
// VS Code-style live suggestions without a real language server.
function cmShouldTrigger(modeName, ch){
    if(modeName === 'htmlmixed' || modeName === 'xml' || modeName === 'php') return ch === '<' || (CM_WORD_LANGS.includes(modeName) && /[A-Za-z_.]/.test(ch))
    if(modeName === 'css') return ch === ':'
    if(CM_WORD_LANGS.includes(modeName)) return /[A-Za-z_.]/.test(ch)
    return false
}
function cmHintHelperFor(modeName){
    if((modeName === 'htmlmixed' || modeName === 'xml') && CodeMirror.hint.html) return CodeMirror.hint.html
    if(modeName === 'xml' && CodeMirror.hint.xml) return CodeMirror.hint.xml
    if(modeName === 'css' && CodeMirror.hint.css) return CodeMirror.hint.css
    if(modeName === 'javascript' && CodeMirror.hint.javascript) return CodeMirror.hint.javascript
    return CodeMirror.hint.anyword
}

// Persists across files within the same page load (not reset per file-open)
// — matches how a real editor remembers your wrap preference for the
// session rather than forcing you to re-toggle it every time. Applies to
// the one shared CodeMirror instance, so it's a per-editor (not per-tab)
// preference, same as before.
let wordWrapEnabled = false

// explicitTab lets callers (e.g. the per-tab close guard) save a tab that
// isn't necessarily the active one — a Doc's content is readable via
// tab.doc.getValue() regardless of whether it's currently swapped into
// sharedCM. onSuccess defaults to just clearing the dirty flag; the
// unsaved-changes guards pass their own onProceed so "Save" can save AND
// then continue whatever navigation was about to happen.
function save_edit_file(explicitTab, onSuccess){
    const tab = explicitTab || findTab(activeTabPath)
    if(!tab) return
    const successCallback = onSuccess || (()=>{ tab.dirty = false; renderTabs() })
    const errorEl = document.querySelector('.code_editor_error')
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    if(errorEl) errorEl.textContent = ''
    fetch('../update-project-file', {
        method: 'POST',
        headers: {'X-CSRF-TOKEN': csrf, 'Accept':'application/json', 'Content-Type':'application/json'},
        body: JSON.stringify({group_id, file_position: tab.path, content: tab.doc.getValue()})
    })
    .then(response => response.json().then(body => ({ok: response.ok, body})))
    .then(({ok, body})=>{
        if(!ok) throw new Error(body.message || 'Failed to save')
        tab.dirty = false
        renderTabs()
        successCallback()
    })
    .catch(error=>{
        // Leaves the edit open with the error shown (no data loss) instead
        // of proceeding on failure.
        if(errorEl) errorEl.textContent = error.message
    })
}
// "Save As" reuses the exact same upsert endpoint against a different
// path in the current folder, then closes the old tab and opens the new
// path as its own tab.
function handle_save_as(){
    const tab = findTab(activeTabPath)
    if(!tab) return
    const currentName = tab.path.split('/').filter(Boolean).pop() || ''
    const newName = prompt('Save as (file name):', currentName)
    if(!newName || !newName.trim()) return
    const trimmed = newName.trim()
    if(!/^[A-Za-z0-9_\-. ]+$/.test(trimmed) || trimmed.includes('..')){
        alert('Invalid file name')
        return
    }
    const segments = tab.path.split('/').filter(Boolean)
    segments.pop()
    const newPath = (segments.length ? '/' + segments.join('/') : '') + '/' + trimmed
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    const errorEl = document.querySelector('.code_editor_error')
    fetch('../update-project-file', {
        method: 'POST',
        headers: {'X-CSRF-TOKEN': csrf, 'Accept':'application/json', 'Content-Type':'application/json'},
        body: JSON.stringify({group_id, file_position: newPath, content: tab.doc.getValue()})
    })
    .then(response => response.json().then(body => ({ok: response.ok, body})))
    .then(({ok, body})=>{
        if(!ok) throw new Error(body.message || 'Failed to save')
        // The new path doesn't exist in the in-memory folder tree yet (it was
        // fetched once when the Code tab loaded) — without this, the file
        // opens fine here, but the sidebar wouldn't show it until the whole
        // page reloaded. Same tree the initial Code tab load and the
        // zip-upload flow use.
        return check_projet(group_id).then(data=>{
            if(data.contents) rootData = data
            openTabs = openTabs.filter(t => t.path !== tab.path)
            openFileAtPosition(newPath)
            refreshSidebar()
        })
    })
    .catch(error=>{ if(errorEl) errorEl.textContent = error.message })
}
// Browser/VS-Code-style "unsaved changes" guard for leaving the Code tab
// entirely (group.js's top-level tab switcher) — checks across every open
// tab, not just one. Per-tab closes use their own guard in
// handle_close_tab() instead, which only asks about that one tab.
function guardUnsavedChanges(onProceed){
    if(!anyDirtyTabs()){
        onProceed()
        return
    }
    const dirtyNames = openTabs.filter(t => t.dirty).map(t => t.path.split('/').filter(Boolean).pop()).join(', ')
    showConfirmModal({
        title: 'Unsaved changes',
        message: `You have unsaved changes in: ${dirtyNames}. Save them before leaving?`,
        buttons: [
            {label: 'Save all', class: 'btn-success', action: ()=>{
                Promise.all(openTabs.filter(t => t.dirty).map(t => new Promise(resolve => save_edit_file(t, resolve)))).then(onProceed)
            }},
            {label: "Don't Save", class: 'btn-danger', action: onProceed},
            {label: 'Cancel', class: 'btn-secondary', action: ()=>{}},
        ]
    })
}
function showConfirmModal({title, message, buttons}){
    const existing = document.querySelector('.confirm_modal')
    if(existing) existing.remove()
    const modal = document.createElement('div')
    modal.className = 'confirm_modal'
    modal.innerHTML = `
        <div class='confirm_modal_head'><strong></strong></div>
        <p></p>
        <div class='confirm_modal_actions d-flex gap-2 justify-content-end'></div>`
    modal.querySelector('.confirm_modal_head strong').textContent = title
    modal.querySelector('p').textContent = message
    const actionsEl = modal.querySelector('.confirm_modal_actions')
    buttons.forEach(btn=>{
        const el = document.createElement('button')
        el.type = 'button'
        el.className = `btn ${btn.class || 'btn-secondary'}`
        el.textContent = btn.label
        el.addEventListener('click', ()=>{
            modal.remove()
            btn.action()
        })
        actionsEl.appendChild(el)
    })
    document.body.appendChild(modal)
}
// Native browser "leave site?" prompt as a last-resort safety net for
// closing the tab/navigating away entirely while mid-edit — can't be
// customized with Save/Discard (browsers block that for beforeunload), but
// still stops an accidental close from silently losing changes.
window.addEventListener('beforeunload', (e)=>{
    if(anyDirtyTabs()){
        e.preventDefault()
        e.returnValue = ''
    }
})

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
