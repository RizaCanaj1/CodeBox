// TODO list for the group workspace's Tasks tab. Any member can add a task
// and optionally assign it to another member; only that assignee or the
// group creator can toggle/edit/delete it (enforced server-side too — the
// checkbox/edit/delete controls are just disabled/hidden client-side for
// anyone else, same pattern as the upload-zip control being permission-gated).
let editingTodoId = null

function render_tasks(groupId, users, myId, creatorId){
    const wrap = document.querySelector('.tasks')
    if(!wrap) return
    editingTodoId = null
    wrap.innerHTML = `
        <h4 class="text-center mb-3">Tasks</h4>
        <form class='add_task_form d-flex gap-2 flex-wrap mb-3'>
            <input type='text' class='task_title' placeholder='New task'/>
            <select class='task_assignee'>
                <option value=''>Unassigned</option>
                ${users.map(u=>`<option value='${u.from_user_id}'>${escapeHtml(u.user.name)}</option>`).join('')}
            </select>
            <button type='submit' class='btn btn-success'>Add</button>
        </form>
        <div class='todo_list'><p class="text-center">Loading...</p></div>
    `
    const form = wrap.querySelector('.add_task_form')
    form.addEventListener('submit', e=>{
        e.preventDefault()
        const titleInput = form.querySelector('.task_title')
        const title = titleInput.value.trim()
        if(!title) return
        const assignee = form.querySelector('.task_assignee').value
        const csrf = document.querySelector('meta[name="csrf-token"]').content
        fetch(`../group/${groupId}/todos`,{
            method:'POST',
            headers:{'X-CSRF-TOKEN':csrf,'Accept':'application/json','Content-Type':'application/json'},
            body: JSON.stringify({title, assigned_to: assignee || null})
        })
        .then(response=>{
            if(!response.ok) throw new Error('Failed to add task')
            return response.json()
        })
        .then(()=>{
            titleInput.value = ''
            loadTasks(groupId, myId, creatorId, users)
        })
        .catch(error=>console.error(error))
    })
    loadTasks(groupId, myId, creatorId, users)
}

function loadTasks(groupId, myId, creatorId, users){
    fetch(`../group/${groupId}/todos`)
    .then(response=>response.json())
    .then(todos=>renderTodoList(groupId, myId, creatorId, users, todos))
    .catch(error=>console.error(error))
}

function renderTodoList(groupId, myId, creatorId, users, todos){
    const list = document.querySelector('.todo_list')
    if(!list) return
    if(todos.length === 0){
        list.innerHTML = `<p class='text-center'>No tasks yet.</p>`
        return
    }
    list.innerHTML = todos.map(todo=>{
        const canManage = myId == creatorId || myId == todo.assigned_to
        if(todo.id === editingTodoId){
            const options = [`<option value=''>Unassigned</option>`].concat(
                users.map(u=>`<option value='${u.from_user_id}' ${todo.assigned_to == u.from_user_id ? 'selected' : ''}>${escapeHtml(u.user.name)}</option>`)
            ).join('')
            return `<div class='todo_item todo_editing d-flex align-items-center gap-2' data-id='${todo.id}'>
                <input type='text' class='todo_edit_title' value='${escapeHtml(todo.title)}'>
                <select class='todo_edit_assignee'>${options}</select>
                <button type='button' class='todo_save' title='Save'><i class="fa-solid fa-check"></i></button>
                <button type='button' class='todo_cancel' title='Cancel'><i class="fa-solid fa-xmark"></i></button>
            </div>`
        }
        return `<div class='todo_item d-flex align-items-center gap-2${todo.is_done ? ' done' : ''}' data-id='${todo.id}'>
            <input type='checkbox' class='todo_toggle' ${todo.is_done ? 'checked' : ''} ${canManage ? '' : 'disabled'}>
            <span class='todo_title'>${escapeHtml(todo.title)}</span>
            <span class='todo_assignee'>${todo.assignee ? escapeHtml(todo.assignee.name) : 'Unassigned'}</span>
            ${canManage ? `<button type='button' class='todo_edit' title='Edit'><i class="fa-solid fa-pen"></i></button>
            <button type='button' class='todo_delete' title='Delete'><i class="fa-solid fa-trash"></i></button>` : ''}
        </div>`
    }).join('')

    list.querySelectorAll('.todo_toggle:not(:disabled)').forEach(checkbox=>{
        checkbox.addEventListener('change', e=>{
            const id = e.target.closest('.todo_item').dataset.id
            const csrf = document.querySelector('meta[name="csrf-token"]').content
            fetch(`../group/${groupId}/todos/${id}/toggle`,{
                method:'POST',
                headers:{'X-CSRF-TOKEN':csrf,'Accept':'application/json'}
            })
            .then(response=>{
                if(!response.ok) throw new Error('Failed to update task')
                return response.json()
            })
            .then(()=>loadTasks(groupId, myId, creatorId, users))
            .catch(error=>console.error(error))
        })
    })
    list.querySelectorAll('.todo_delete').forEach(button=>{
        button.addEventListener('click', e=>{
            const id = e.target.closest('.todo_item').dataset.id
            const csrf = document.querySelector('meta[name="csrf-token"]').content
            fetch(`../group/${groupId}/todos/${id}`,{
                method:'DELETE',
                headers:{'X-CSRF-TOKEN':csrf,'Accept':'application/json'}
            })
            .then(response=>{
                if(!response.ok) throw new Error('Failed to delete task')
                return response.json()
            })
            .then(()=>loadTasks(groupId, myId, creatorId, users))
            .catch(error=>console.error(error))
        })
    })
    list.querySelectorAll('.todo_edit').forEach(button=>{
        button.addEventListener('click', e=>{
            editingTodoId = parseInt(e.target.closest('.todo_item').dataset.id)
            loadTasks(groupId, myId, creatorId, users)
        })
    })
    list.querySelectorAll('.todo_cancel').forEach(button=>{
        button.addEventListener('click', ()=>{
            editingTodoId = null
            loadTasks(groupId, myId, creatorId, users)
        })
    })
    list.querySelectorAll('.todo_save').forEach(button=>{
        button.addEventListener('click', e=>{
            const row = e.target.closest('.todo_item')
            const id = row.dataset.id
            const title = row.querySelector('.todo_edit_title').value.trim()
            if(!title) return
            const assignee = row.querySelector('.todo_edit_assignee').value
            const csrf = document.querySelector('meta[name="csrf-token"]').content
            fetch(`../group/${groupId}/todos/${id}`,{
                method:'PUT',
                headers:{'X-CSRF-TOKEN':csrf,'Accept':'application/json','Content-Type':'application/json'},
                body: JSON.stringify({title, assigned_to: assignee || null})
            })
            .then(response=>{
                if(!response.ok) throw new Error('Failed to update task')
                return response.json()
            })
            .then(()=>{
                editingTodoId = null
                loadTasks(groupId, myId, creatorId, users)
            })
            .catch(error=>console.error(error))
        })
    })
}
