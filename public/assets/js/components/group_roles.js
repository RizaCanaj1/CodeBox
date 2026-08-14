// Discord-style role panel: roles (from get_group's response, refreshed via
// loadGroupData()) render as colored chips, each with creator-only
// edit/delete affordances. "Add"/"Edit" share one form (role_form_html)
// that names the role, picks a color, toggles the two file permissions
// (manage / download), and picks which top-level Code/ folders it's
// scoped to (none selected = unrestricted, same semantics as view-access).
const DEFAULT_ROLE_COLOR = '#fd7a7a'

const roles_model = (my_id, creator_id, groupRoles) => {
    const isCreator = my_id == creator_id
    const showRoles = groupRoles.map(role => {
        const folderNames = role.folders.map(f => f.folder_name)
        const title = folderNames.length ? folderNames.map(escapeHtml).join(', ') : 'Unrestricted — sees every folder'
        const color = role.color || DEFAULT_ROLE_COLOR
        const badges = [
            role.can_manage_files ? `<i class="fa-solid fa-pen-to-square role-badge-icon" title="Can manage files"></i>` : '',
            role.can_download ? `<i class="fa-solid fa-download role-badge-icon" title="Can download files"></i>` : '',
        ].join('')
        const actions = isCreator ? `
            <button type="button" class="role-action role-edit" onclick="handle_edit_role(${role.id})" title="Edit role"><i class="fa-solid fa-pen"></i></button>
            <button type="button" class="role-action role-delete" onclick="handle_delete_role(${role.id})" title="Delete role"><i class="fa-solid fa-trash"></i></button>` : ''
        return `<div class='role' style="background-color: ${color}" title="${title}" data-role-id="${role.id}">
            <span class='role-name'>${escapeHtml(role.name)}</span>${badges}${actions}
        </div>`
    }).join('')

    return `<div class='roles_wrapper'>
    <div class='title'>Roles</div>
        <div class='roles'>
            ${showRoles}
            ${isCreator ? `<div class='add_role' onclick='handle_add_role()'><p>Add Role</p></div>` : ''}
        </div>
        <div class='role_form_container mt-3'></div>
    </div>`
}

function role_form_html(action){
    return `
        <div class='role_form'>
            <div class='role_form_row'>
                <label class='role_form_label' for='role_name_input'>Role name</label>
                <div class='role_form_name_row d-flex gap-2 align-items-center'>
                    <input type='color' class='role_color_input' value='${DEFAULT_ROLE_COLOR}' title="Role color">
                    <input type='text' class='role_name_input' id='role_name_input' placeholder='e.g. Frontend'/>
                </div>
            </div>
            <div class='role_form_row role_form_switches'>
                <label class='role_switch'>
                    <input type='checkbox' class='role_manage_input'>
                    <span class='role_switch_track'></span>
                    <span class='role_switch_text'>
                        <strong>Can manage files</strong>
                        <small>Upload, edit, and delete files in their assigned folders.</small>
                    </span>
                </label>
                <label class='role_switch'>
                    <input type='checkbox' class='role_download_input'>
                    <span class='role_switch_track'></span>
                    <span class='role_switch_text'>
                        <strong>Can download files</strong>
                        <small>Export files or the whole project as a zip.</small>
                    </span>
                </label>
            </div>
            <p class='folders_hint'>Folder access is now set from the Code tab — open a folder there and use its "Manage access" button to pick which roles can reach it.</p>
            <div class='role_form_actions d-flex gap-2 align-items-center justify-content-end'>
                <span class='code_editor_error role_form_error'></span>
                <button type="button" class='cancel' onclick='handle_cancel_role_form()'>Cancel</button>
                <button type="button" class='save' onclick='${action}(event)'>Save role</button>
            </div>
        </div>`
}

function handle_add_role(){
    const container = document.querySelector('.role_form_container')
    delete container.dataset.editingRoleId
    container.innerHTML = role_form_html('handle_save_new_role')
}

function handle_edit_role(roleId){
    const role = roles.find(r => r.id === roleId)
    if(!role) return
    const container = document.querySelector('.role_form_container')
    container.innerHTML = role_form_html('handle_save_edit_role')
    container.dataset.editingRoleId = roleId
    container.querySelector('.role_name_input').value = role.name
    container.querySelector('.role_manage_input').checked = !!role.can_manage_files
    container.querySelector('.role_download_input').checked = !!role.can_download
    container.querySelector('.role_color_input').value = role.color || DEFAULT_ROLE_COLOR
}

function handle_cancel_role_form(){
    const container = document.querySelector('.role_form_container')
    delete container.dataset.editingRoleId
    container.innerHTML = ''
}

function collect_role_form(container){
    const name = container.querySelector('.role_name_input').value.trim()
    const can_manage_files = container.querySelector('.role_manage_input').checked
    const can_download = container.querySelector('.role_download_input').checked
    const color = container.querySelector('.role_color_input').value
    return {name, can_manage_files, can_download, color}
}

function handle_save_new_role(e){
    const container = e.target.closest('.role_form_container')
    const form = collect_role_form(container)
    const errorEl = container.querySelector('.role_form_error')
    if(!form.name){
        if(errorEl) errorEl.textContent = 'Name the role first.'
        return
    }
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content
    fetch(`../add-group-role/${group_id}`,{
        method:'POST',
        headers: {
            'X-CSRF-TOKEN': csrfToken,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
    })
    .then(response => response.json().then(body => ({ok: response.ok, body})))
    .then(({ok, body})=>{
        if(!ok) throw new Error(body.message || 'Failed to create role')
        // Re-render from the server's own state instead of an in-memory array —
        // previously a created role only ever lived in local JS state and
        // vanished on refresh regardless of whether the backend call succeeded.
        return loadGroupData().then(()=>screenUpdate('settings'))
    })
    .catch(error=>{ if(errorEl) errorEl.textContent = error.message })
}

function handle_save_edit_role(e){
    const container = e.target.closest('.role_form_container')
    const roleId = container.dataset.editingRoleId
    const form = collect_role_form(container)
    const errorEl = container.querySelector('.role_form_error')
    if(!form.name || !roleId){
        if(errorEl) errorEl.textContent = 'Name the role first.'
        return
    }
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content
    fetch(`../group/${group_id}/roles/${roleId}`,{
        method:'PUT',
        headers: {
            'X-CSRF-TOKEN': csrfToken,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
    })
    .then(response => response.json().then(body => ({ok: response.ok, body})))
    .then(({ok, body})=>{
        if(!ok) throw new Error(body.message || 'Failed to update role')
        return loadGroupData().then(()=>screenUpdate('settings'))
    })
    .catch(error=>{ if(errorEl) errorEl.textContent = error.message })
}

function handle_delete_role(roleId){
    if(!confirm('Delete this role? Members will lose any access it granted.')) return
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content
    fetch(`../group/${group_id}/roles/${roleId}`,{
        method:'DELETE',
        headers: {
            'X-CSRF-TOKEN': csrfToken,
            'Accept': 'application/json'
        }
    })
    .then(response=>{
        if(!response.ok) throw new Error('Failed to delete role')
        return response.json()
    })
    .then(()=>loadGroupData().then(()=>screenUpdate('settings')))
    .catch(error=>console.error(error))
}
