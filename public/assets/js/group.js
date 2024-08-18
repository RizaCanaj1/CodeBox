const group_features = document.querySelectorAll('div[class^="feature-"]')
const screen = document.querySelector('div.screen')
let user_document = null;
let from_same_person = 0;
let group_id = (window.location.href.split('/')[window.location.href.split('/').length-1]).split(/[?#]/)[0]
let fill_message = ``
let my_id 
fetch('../authid')
.then(response=>response.json())
.then(data=>my_id = data)
let chats = []
let users = null
let settings = null
screenUpdate('chats')
group_features.forEach(field=>{
    field.addEventListener('click',()=>{
        let field_attributes = field.getAttribute('class').split(' ')
        if(field_attributes[field_attributes.length-1]!='active'){
            group_features.forEach(x=>{
                x.classList.remove('active')
            })
            field.classList.add('active')
            screen.classList.add('remove-previous-screen');
            setTimeout(()=>{screenUpdate(field_attributes[0].split('-')[1])},200)
        }
    })
})
fetch(`../get-group/${group_id}`)
.then(response => response.json())
.then(data=>{
    settings = data.settings
    users = data.users
})
function screenUpdate(topic){
    screen.classList.remove('remove-previous-screen')
    switch (topic) {
        case 'chats':
            screen.innerHTML = `<div class="chat m-3"> </div>`
            let dayDifference = 0
            let monthDifference = 0
            let yearDifference = 0
            let chats_model = (from,message,time=true,currentTime)=>{
                const show_time = (!time) ? (
                    `<hr class='mt-2' /><p class="text-center">
                        ${dayDifference > 0 ? 
                            `${getDayAsText(currentTime)}, ${formatTime(currentTime,'Europe/Berlin')}`:
                        monthDifference > 0 ? 
                            `${getDayAsText(currentTime)},${getMonthAsText(currentTime)} ${currentTime.getDate()}, ${formatTime(currentTime,'Europe/Berlin')}` :
                        yearDifference > 0 ? 
                        `${getDayAsText(currentTime)}, ${getMonthAsText(currentTime)} ${currentTime.getDate()}, ${currentTime.getFullYear()}, ${formatTime(currentTime,'Europe/Berlin')}` :
                        formatTime(currentTime,'Europe/Berlin')}
                    </p>`
                ) : ('');    
                switch (from) {
                    case 'me':
                        return `<div class="message-me mt-3 mx-3 d-flex flex-row-reverse">
                            <img class="message-profile-image" src="../assets/images/user.png" alt="User-image">
                            <div class='msg my-auto ms-2 me-2'>${message}</div> 
                        </div>
                        ${show_time}`
                        break;
                    case 'others':
                        return `<div class="message-others mt-3 mx-3 d-flex">
                            <img class="message-profile-image" src="../assets/images/user.png" alt="User-image">
                            <div class='msg my-auto ms-2 me-2'>${message}</div>
                        </div>
                        ${show_time}`
                        break;
                    default:
                        break;
                }
            }
            let update_chats = (chats) =>{
               
                chats.forEach((chat,index)=>{
                    let time = chat.created_at
                    const currentTime = new Date(time);
                    const currentDay = currentTime.getDate();
                    const currentMonth = currentTime.getMonth();
                    const currentYear = currentTime.getFullYear();
                    const chatElement = screen.querySelector('.chat');
                    if(index < 1){
                        chatElement.innerHTML+=`<hr/><p class="text-center">${getDayAsText(currentTime)}, ${getMonthAsText(currentTime)} ${currentDay}, ${currentTime.getFullYear()}, ${formatTime(currentTime,'Europe/Berlin')}</p>`
                        from_same_message_handle(chat.from_user_id)
                    }
                    else {
                        let check_time = true
                        const previousTime = new Date(chats[index - 1].created_at);
                        const previousDay = previousTime.getDate();
                        const previousMonth = previousTime.getMonth();
                        const previousYear = previousTime.getFullYear();

                        dayDifference = currentDay - previousDay;
                        monthDifference = currentMonth - previousMonth;
                        yearDifference = currentYear - previousYear;

                        const timeDifference = currentTime - previousTime;
                        const timeDifferenceInHours = timeDifference / (1000 * 60 * 60);

                        if (timeDifferenceInHours > 2 || dayDifference > 0 || monthDifference > 0 || yearDifference > 0) {
                            check_time = false;
                        }
                        if(chat.from_user_id != chats[index-1].from_user_id){
                            fill_message = ''
                            for(let x = index - from_same_person -1; x < index ; x++){
                                fill_message += `<pre>${chats[x].content}</pre>`
                            }
                            if(chats[index-1].from_user_id!= my_id){
                                chatElement.innerHTML += chats_model('others',fill_message)
                            }
                            else{
                                chatElement.innerHTML += chats_model('me',fill_message)
                            }
                            
                        }
                        else if(index == chats.length-1){
                            fill_message = ''
                            for(let x = index - from_same_person -1; x <= index ; x++){
                                fill_message += `<pre>${chats[x].content}</pre>`
                            }
                            
                            if(chats[index-1].from_user_id!= my_id){
                                chatElement.innerHTML += chats_model('others',fill_message)
                            }
                            else{
                                chatElement.innerHTML += chats_model('me',fill_message)
                            }
                        }
                        else if(!check_time){
                            if(chat.from_user_id == chats[index-1].from_user_id){
                                fill_message = ''
                                for(let x = index - from_same_person -1; x <= index-1; x++){
                                    fill_message += `<pre>${chats[x].content}</pre>`
                                }
                                if(chats[index-1].from_user_id!= my_id){
                                    chatElement.innerHTML += chats_model('others',fill_message,check_time,currentTime)
                                }
                                else{
                                    chatElement.innerHTML += chats_model('me',fill_message,check_time,currentTime)
                                }
                            }
                            if(chat.from_user_id != chats[index-1].from_user_id){
                                fill_message = ''
                                for(let x = index - from_same_person -1; x <= index-1; x++){
                                    fill_message += `<pre>${chats[x].content}</pre>`
                                }
                                if(chats[index-1].from_user_id!= my_id){
                                    chatElement.innerHTML += chats_model('others',fill_message,check_time,currentTime)
                                }
                                else{
                                    chatElement.innerHTML += chats_model('me',fill_message,check_time,currentTime)
                                }
                            }
                        }
                        else{
                            fill_message = `<pre>${chat.content}</pre>`
                        }
                        from_same_message_handle(chat.from_user_id,chats[index-1].from_user_id,check_time)
                    }
                })
                const chatElement = screen.querySelector('.chat')
                if(chatElement.scrollHeight>chatElement.clientHeight){
                    chatElement.style.overflowY='scroll';
                    chatElement.scrollTop = chatElement.scrollHeight;
                }
            }
            fetch(`../group_chat/${group_id}`)
            .then(response => response.json())
            .then(data=>{
                chats=data
                update_chats(data)
            })
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
                let csrf = document.querySelector('meta[name="csrf-token"]').content
                let new_message = {from_user_id:my_id,content:`${chat_msg.value}`}
                if(chats[chats.length-1].from_user_id == my_id){
                    const chatElement = screen.querySelector('.chat .message-me:last-child .msg');
                    chatElement.innerHTML += `<pre>${chat_msg.value}</pre>`
                }
                else{
                    const chatElement = screen.querySelector('.chat');
                    chatElement.innerHTML += `
                    <div class="message-me mt-3 mx-3 d-flex flex-row-reverse">
                        <img class="message-profile-image" src="../assets/images/user.png" alt="User-image">
                        <div class='msg my-auto ms-2 me-2'><pre>${chat_msg.value}</pre></div>
                    </div>`
                }
                chats.push(new_message)
                chat_msg.value=''
                fetch(`../send_group_message/${parseInt(group_id)}`, {
                    method: 'post',
                    body: JSON.stringify(new_message),
                    headers: {
                        'X-CSRF-TOKEN': csrf,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }).then(response => response.json())
                .catch(error => {console.error(error)});
            }
            break;
        case 'users':
            screen.innerHTML = `<h4 class="m-2 text-center" >Users (${users.length})</h4>`
            screen.innerHTML +=`<div class='my-friends m-3'>
            <h5>My Friends</h5>
            </div>` 
            users.forEach(user=>{
                document.querySelector(".my-friends").innerHTML+=`<div class="user m-2 d-flex gap-2 align-items-center" id="user-${user.from_user_id}">
                    <img class="user-profile-image" src="../assets/images/user.png" alt="User-image">
                    <p class='ms-2'>${user.user.name}</p>
                </div>`
                
            })
            screen.innerHTML +=`<div class='all-users m-3'>
            <h5>All Users</h5>
            </div>` 
                users.forEach(user=>{
                    document.querySelector(".all-users").innerHTML+= `<div class="user m-2 d-flex gap-2 align-items-center" id="user-${user.from_user_id}">
                        <img class="user-profile-image" src="../assets/images/user.png" alt="User-image">
                        <p class='ms-2'>${user.user.name}</p>
                    </div>`
                })
            
            user_document = document.querySelectorAll('.user')
            user_document.forEach(user=>{
                user.querySelector('img').addEventListener('dblclick',()=>{
                    window.location.href=`../profile?id=${user.id.split('-')[1]}`
                })
            })
            break;
        case 'settings':
            screen.innerHTML =`<div class='settings m-3'>
                <h3>Settings</h3>
            </div>` 
            
            document.querySelector(".settings").innerHTML+= `<div class="settings m-2 d-flex gap-2 align-items-center">
                ${roles_model(my_id,settings.creator_id)}
            </div>`
            user_document = document.querySelectorAll('.user')
            user_document.forEach(user=>{
                user.querySelector('img').addEventListener('dblclick',()=>{
                    window.location.href=`../profile?id=${user.id.split('-')[1]}`
                })
            })
            break;
        case 'code':
            pos = ''
            screen.innerHTML =`<div class='code m-3'></div>` 
            check_projet(group_id)
            .then(data=>{
                if(data.error!=false){
                    document.querySelector(".code").innerHTML = file_model (data.contents);
                }
                else{
                    document.querySelector(".code").innerHTML = `<div class="code_id m-2">
                        ${settings.creator_id==my_id?(`<div class='upload_zip'>
                            <label class='w-100' for='code'><h4 class='text-center'>Update your project as zip</h4></label>
                            <input class='d-none' type='file' name='code' id='code' accept=".zip, .rar, .7zip" onchange='handle_file_change(event)'>
                        </div>`):('')}
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
let stop_upload = false
function handle_file_change(event){
    stop_upload = true
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    const codeFile = event.srcElement
    const file = codeFile.files[0]
    console.log(file)
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
        // Progress event listener
        request.upload.addEventListener('progress', function (e) {
            if (stop_upload) request.abort()
            if (e.lengthComputable) {
                progress = Math.round((e.loaded / e.total) * 100);
                const progressBar = document.querySelector('#progress');
                if (progressBar) {
                    console.log(progress)
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
                console.log('Request successful');
                console.log(JSON.parse(request.responseText)); 
            } else {
                // Request failed
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
    if(!document.querySelector('.file_name')) document.querySelector('.upload_zip').innerHTML+=`<div class='file_name d-flex justify-content-center gap-2'><h4>${file.name}  ---  ${formatFileSize(file.size)}</h4></div>`
    else document.querySelector('.file_name').innerHTML = `<h4>${file.name}  ---  ${formatFileSize(file.size)}</h4>`

}

function from_same_message_handle(from, previous = null,time=false){
    if(previous == null){
        from_same_person = 0
    }
    else if(from !=previous){
        from_same_person = 0
    }
    else if(!time){
        from_same_person = 0
    }
    else{
        from_same_person += 1
    }
}