// Discord-style role panel: roles (from get_group's response, refreshed via
// loadGroupData()) render as chips, each with creator-only edit/delete
// affordances. "Add"/"Edit" share one form (role_form_html) that lets you
// name the role, check which top-level Code/ folders it's scoped to (empty
// = unrestricted, same semantics as view-access), and toggle whether it can
// manage files (upload/edit/delete) within those folders.
const roles_model = (my_id, creator_id, groupRoles) => {
    const isCreator = my_id == creator_id
    const showRoles = groupRoles.map(role => {
        const folderNames = role.folders.map(f => f.folder_name)
        const title = folderNames.length ? folderNames.map(escapeHtml).join(', ') : 'Unrestricted — sees every folder'
        const manageBadge = role.can_manage_files ? `<i class="fa-solid fa-pen-to-square manage-badge" title="Can manage files"></i>` : ''
        const actions = isCreator ? `
            <button type="button" class="role-action role-edit" onclick="handle_edit_role(${role.id})" title="Edit role"><i class="fa-solid fa-pen"></i></button>
            <button type="button" class="role-action role-delete" onclick="handle_delete_role(${role.id})" title="Delete role"><i class="fa-solid fa-trash"></i></button>` : ''
        return `<div class='role' title="${title}" data-role-id="${role.id}">
            <span class='role-name'>${escapeHtml(role.name)}</span>${manageBadge}${actions}
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
        <div class='add_role_form'>
            <div class='d-flex flex-column gap-2'>
                <input class='text-center role_name_input' type='text' placeholder='Name role'/>
                <label class='manage-check'><input type='checkbox' class='role_manage_input'> Can manage files (upload, edit, delete)</label>
                <p class='folders_hint'>Check folders to restrict this role to them — leave all unchecked for unrestricted access.</p>
                <div class='role_folders_list'><p>Loading folders...</p></div>
                <div class='buttons d-flex gap-2 justify-content-center'>
                    <button type="button" class='save' onclick='${action}(event)'>Save</button>
                    <button type="button" class='cancel' onclick='handle_cancel_role_form()'>Cancel</button>
                </div>
            </div>
        </div>`
}

function populate_role_folders(container, checkedFolders = []){
    const folderList = container.querySelector('.role_folders_list')
    check_projet(group_id)
    .then(data=>{
        const folderNames = (data.error != false && data.contents)
            ? Object.keys(data.contents).filter(name => data.contents[name].info.type === 'directory')
            : []
        if(folderNames.length === 0){
            folderList.innerHTML = `<p>No folders uploaded yet — this role will be unrestricted.</p>`
            return
        }
        folderList.innerHTML = folderNames.map(name=>`<label class='folder-check'><input type='checkbox' name='folder' value='${escapeHtml(name)}' ${checkedFolders.includes(name) ? 'checked' : ''}> ${escapeHtml(name)}</label>`).join('')
    })
}

function handle_add_role(){
    const container = document.querySelector('.role_form_container')
    delete container.dataset.editingRoleId
    container.innerHTML = role_form_html('handle_save_new_role')
    populate_role_folders(container)
}

function handle_edit_role(roleId){
    const role = roles.find(r => r.id === roleId)
    if(!role) return
    const container = document.querySelector('.role_form_container')
    container.innerHTML = role_form_html('handle_save_edit_role')
    container.dataset.editingRoleId = roleId
    container.querySelector('.role_name_input').value = role.name
    container.querySelector('.role_manage_input').checked = !!role.can_manage_files
    populate_role_folders(container, role.folders.map(f=>f.folder_name))
}

function handle_cancel_role_form(){
    const container = document.querySelector('.role_form_container')
    delete container.dataset.editingRoleId
    container.innerHTML = ''
}

function collect_role_form(container){
    const name = container.querySelector('.role_name_input').value.trim()
    const can_manage_files = container.querySelector('.role_manage_input').checked
    const folders = Array.from(container.querySelectorAll('input[name="folder"]:checked')).map(i=>i.value)
    return {name, can_manage_files, folders}
}

function handle_save_new_role(e){
    const container = e.target.closest('.role_form_container')
    const form = collect_role_form(container)
    if(!form.name) return
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
    .then(response=>{
        if(!response.ok) throw new Error('Failed to create role')
        return response.json()
    })
    // Re-render from the server's own state instead of an in-memory array —
    // previously a created role only ever lived in local JS state and
    // vanished on refresh regardless of whether the backend call succeeded.
    .then(()=>loadGroupData().then(()=>screenUpdate('settings')))
    .catch(error=>console.error(error))
}

function handle_save_edit_role(e){
    const container = e.target.closest('.role_form_container')
    const roleId = container.dataset.editingRoleId
    const form = collect_role_form(container)
    if(!form.name || !roleId) return
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
    .then(response=>{
        if(!response.ok) throw new Error('Failed to update role')
        return response.json()
    })
    .then(()=>loadGroupData().then(()=>screenUpdate('settings')))
    .catch(error=>console.error(error))
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
