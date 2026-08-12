const group_features = document.querySelectorAll('div[class^="feature-"]')
const screen = document.querySelector('div.screen')
const group_id = document.querySelector('.groups-shell').dataset.groupId
let user_document = null;
let my_id
let chats = []
let users = null
let settings = null
let roles = []
let manageable_folders = null
let chatPollTimer = null

function escapeHtml(str) {
    if (str === null || str === undefined) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function stopChatPolling() {
    if (chatPollTimer) {
        clearInterval(chatPollTimer)
        chatPollTimer = null
    }
}

fetch('../authid')
.then(response=>response.json())
.then(data=>{
    my_id = data
    screenUpdate('chats')
})

group_features.forEach(field=>{
    field.addEventListener('click',()=>{
        let field_attributes = field.getAttribute('class').split(' ')
        if(field_attributes[field_attributes.length-1]!='active'){
            group_features.forEach(x=>{
                x.classList.remove('active')
            })
            field.classList.add('active')
            screen.classList.add('remove-previous-screen');
            stopChatPolling()
            setTimeout(()=>{screenUpdate(field_attributes[0].split('-')[1])},200)
        }
    })
})
function loadGroupData(){
    return fetch(`../get-group/${group_id}`)
    .then(response => response.json())
    .then(data=>{
        settings = data.settings
        users = data.users
        roles = data.roles
        manageable_folders = data.manageable_folders
        return data
    })
}
loadGroupData()
function screenUpdate(topic){
    screen.classList.remove('remove-previous-screen')
    switch (topic) {
        case 'chats': {
            screen.innerHTML = `<div class="chat m-3"> </div>`
            let chats_model = (from,message,timeLabel)=>{
                const show_time = timeLabel ? `<hr class='mt-2' /><p class="text-center">${timeLabel}</p>` : ''
                switch (from) {
                    case 'me':
                        return `<div class="message-me mt-3 mx-3 d-flex flex-row-reverse">
                            <img class="message-profile-image" src="../assets/images/user.png" alt="User-image">
                            <div class='msg my-auto ms-2 me-2'>${message}</div>
                        </div>
                        ${show_time}`
                    case 'others':
                        return `<div class="message-others mt-3 mx-3 d-flex">
                            <img class="message-profile-image" src="../assets/images/user.png" alt="User-image">
                            <div class='msg my-auto ms-2 me-2'>${message}</div>
                        </div>
                        ${show_time}`
                    default:
                        return ''
                }
            }
            // Groups consecutive same-sender messages (within 2h, same day)
            // into one bubble, with a date/time divider whenever a group
            // starts a new day or follows a >2h gap. Rewritten from the
            // original index-walking version, which flushed a "run" only
            // when it detected the NEXT message starting a new one — so a
            // brand new message from a different sender than the previous
            // one (the single most common case once chat is polling live)
            // was silently never rendered until some other message arrived
            // after it. Building explicit groups up front and always
            // rendering every group fixes that.
            let update_chats = (chatsData) =>{
                const chatElement = screen.querySelector('.chat');
                if(!chatElement) return
                chatElement.innerHTML = ''
                if(chatsData.length === 0) return

                let groups = []
                chatsData.forEach((chat,index)=>{
                    const currentTime = new Date(chat.created_at)
                    const prev = index > 0 ? chatsData[index-1] : null
                    const prevTime = prev ? new Date(prev.created_at) : null
                    const sameDay = prev ? currentTime.toDateString() === prevTime.toDateString() : false
                    const hoursGap = prev ? (currentTime - prevTime) / (1000*60*60) : Infinity
                    const sameSender = prev ? chat.from_user_id === prev.from_user_id : false
                    const timeBreak = !prev || !sameDay || hoursGap > 2
                    if(!prev || !sameSender || timeBreak){
                        groups.push({from: chat.from_user_id, lines: [chat.content], time: currentTime, showDivider: timeBreak, isNewDay: !sameDay})
                    }
                    else{
                        groups[groups.length-1].lines.push(chat.content)
                    }
                })

                groups.forEach(group=>{
                    let timeLabel = null
                    if(group.showDivider){
                        timeLabel = group.isNewDay
                            ? `${getDayAsText(group.time)}, ${getMonthAsText(group.time)} ${group.time.getDate()}, ${group.time.getFullYear()}, ${formatTime(group.time,'Europe/Berlin')}`
                            : formatTime(group.time,'Europe/Berlin')
                    }
                    const fill_message = group.lines.map(line=>`<pre>${escapeHtml(line)}</pre>`).join('')
                    chatElement.innerHTML += chats_model(group.from == my_id ? 'me' : 'others', fill_message, timeLabel)
                })

                if(chatElement.scrollHeight>chatElement.clientHeight){
                    chatElement.style.overflowY='scroll';
                    chatElement.scrollTop = chatElement.scrollHeight;
                }
            }
            let pollChats = () =>{
                fetch(`../group_chat/${group_id}`)
                .then(response => response.json())
                .then(data=>{
                    if(data.length !== chats.length){
                        chats = data
                        update_chats(chats)
                    }
                })
                .catch(error=>console.error(error))
            }
            fetch(`../group_chat/${group_id}`)
            .then(response => response.json())
            .then(data=>{
                chats=data
                update_chats(data)
            })
            stopChatPolling()
            chatPollTimer = setInterval(pollChats, 3000)
            screen.innerHTML +=`<form  class='message_form position-absolute w-100 d-flex gap-5 justify-content-center align-items-center'><div class='emojis position-absolute w-100'><div class="emojis_nav position-sticky d-flex justify-content-center align-items-center"></div><div class='emojis_wrapper position-absolute w-100 pt-2 px-4'><h5 id="loading_emojis">Loading Emojis</h5></div></div><textarea class='chat_msg w-75' name='content'></textarea><p class='emojis_btn'><i class="fa-solid fa-icons"></i></p><button class='send_message'>></button></form>`
            const emojis_btn = screen.querySelector('.emojis_btn')
            const emojis = screen.querySelector(`.emojis`)
            const emojis_wrapper = emojis.querySelector('.emojis_wrapper')
            const chat_msg = screen.querySelector('.chat_msg')
            const send_message = screen.querySelector('.send_message')
            emojis_btn.onclick = ()=>{
                if (emojis_wrapper.classList.contains('show_emojis')) {emojis_wrapper.classList.remove('show_emojis');}
                else {emojis_wrapper.classList.add('show_emojis');}
            }
            show_emojis().then(emojis_text=>{
                document.getElementById('loading_emojis').remove()
                emojis_handler(chat_msg,emojis_text,emojis)
            })
            .catch(error=>{
                emojis_wrapper.innerHTML=`<h5 class='text-danger'>${error}</h5>`
                emojis_wrapper.style.overflowY = 'hidden'
            })
            send_message.onclick=(e)=>{
                e.preventDefault()
                if(!chat_msg.value.trim()) return
                let csrf = document.querySelector('meta[name="csrf-token"]').content
                const content = chat_msg.value
                chat_msg.value=''
                fetch(`../send_group_message/${group_id}`, {
                    method: 'post',
                    body: JSON.stringify({content}),
                    headers: {
                        'X-CSRF-TOKEN': csrf,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }).then(response => {
                    if(!response.ok) throw new Error('Failed to send message')
                    return response.json()
                })
                .then(()=>pollChats())
                .catch(error => {
                    console.error(error)
                    chat_msg.value = content
                });
            }
            break;
        }
        case 'users':
            screen.innerHTML = `<h4 class="text-center mt-4">Loading...</h4>`
            loadGroupData().then(()=>{
                screen.innerHTML = `<h4 class="m-2 text-center" >Members (${users.length})</h4><div class='members m-3'></div>`
                const membersWrap = screen.querySelector('.members')
                const amCreator = settings.creator_id == my_id
                users.forEach(user=>{
                    const memberRoles = roles.filter(r => r.members.some(m => m.id == user.from_user_id))
                    const rolesHtml = amCreator
                        ? roles.map(r => `<label class='role-check'><input type='checkbox' data-role-id='${r.id}' ${memberRoles.some(mr=>mr.id===r.id) ? 'checked' : ''}> ${escapeHtml(r.name)}</label>`).join('')
                        : memberRoles.map(r => `<span class='role-badge'>${escapeHtml(r.name)}</span>`).join('')
                    membersWrap.innerHTML+=`<div class="user m-2 d-flex gap-2 align-items-center flex-wrap" id="user-${user.from_user_id}">
                        <img class="user-profile-image" src="../assets/images/user.png" alt="User-image">
                        <p class='ms-2'>${escapeHtml(user.user.name)}</p>
                        <div class='member-roles d-flex gap-2 flex-wrap'>${rolesHtml}</div>
                    </div>`
                })
                if(amCreator){
                    membersWrap.querySelectorAll('.role-check input').forEach(input=>{
                        input.addEventListener('change',(e)=>{
                            const userRow = e.target.closest('.user')
                            const userId = userRow.id.split('-')[1]
                            const checkedIds = Array.from(userRow.querySelectorAll('.role-check input:checked')).map(i=>i.dataset.roleId)
                            const csrf = document.querySelector('meta[name="csrf-token"]').content
                            fetch(`../group/${group_id}/members/${userId}/roles`,{
                                method:'POST',
                                headers:{'X-CSRF-TOKEN':csrf,'Accept':'application/json','Content-Type':'application/json'},
                                body: JSON.stringify({role_ids: checkedIds})
                            })
                            .then(response=>response.json())
                            .then(()=>loadGroupData())
                            .catch(error=>console.error(error))
                        })
                    })
                }
                user_document = document.querySelectorAll('.user')
                user_document.forEach(user=>{
                    user.querySelector('img').addEventListener('dblclick',()=>{
                        window.location.href=`../profile?id=${user.id.split('-')[1]}`
                    })
                })
            })
            break;
        case 'settings':
            screen.innerHTML =`<div class='settings m-3'>
                <h3>Settings</h3>
            </div>`
            loadGroupData().then(()=>{
                document.querySelector(".settings").innerHTML+= `<div class="settings-roles m-2">
                    ${roles_model(my_id,settings.creator_id,roles)}
                </div>`
            })
            break;
        case 'tasks':
            screen.innerHTML = `<div class='tasks m-3'></div>`
            loadGroupData().then(()=>{
                render_tasks(group_id, users, my_id, settings.creator_id)
            })
            break;
        case 'code':
            pos = ''
            screen.innerHTML =`<div class='code m-3'></div>`
            Promise.all([loadGroupData(), check_projet(group_id)])
            .then(([, projectData])=>{
                if(projectData.error!=false){
                    document.querySelector(".code").innerHTML = file_model (projectData);
                }
                else{
                    const canUpload = manageable_folders === null || (manageable_folders && manageable_folders.length > 0)
                    document.querySelector(".code").innerHTML = `<div class="code_id m-2">
                        ${canUpload?(`<div class='upload_zip'>
                            <label class='w-100' for='code'><h4 class='text-center'>Update your project as zip</h4></label>
                            <input class='d-none' type='file' name='code' id='code' accept=".zip, .rar, .7zip" onchange='handle_file_change(event)'>
                        </div>
                        <div class='d-flex justify-content-center mt-3'>${renderAddControls()}</div>`):('')}
                    </div>`
                }
            })
            break;
        default:
            screen.classList.add('remove-previous-screen')
            setTimeout(()=>{
            screen.classList.remove('remove-previous-screen')
            screen.innerHTML=`<div class="soon d-flex align-items-center justify-content-center h-100">
            <h4>Coming Soon</h4>
            </div>`},200)
            break;
    }
}
// formatFileSize() is used by file_management.js's file tree renderer, but
// lives here so it's available before that script's own top-level code
// runs. handle_file_change()/upload logic itself lives in
// file_management.js now (file-management concerns, alongside
// delete/edit) — it used to be duplicated here too, which became a
// SyntaxError once both files declared `let stop_upload` in the same
// global scope.
function formatFileSize(fileSize) {
    if (fileSize < 1024) {
        return fileSize + ' bytes';
    } else if (fileSize < 1024 * 1024) {
        return (fileSize / 1024).toFixed(2) + ' KB';
    } else if (fileSize < 1024 * 1024 * 1024) {
        return (fileSize / (1024 * 1024)).toFixed(2) + ' MB';
    } else if (fileSize < 1024 * 1024 * 1024 * 1024) {
        return (fileSize / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    } else {
        return (fileSize / (1024 * 1024 * 1024 * 1024)).toFixed(2) + ' TB';
    }
}
