const group_features = document.querySelectorAll('div[class^="feature-"]')
const screen = document.querySelector('div.screen')
let user_document = null;
let from_same_person = 0;
let group_id = (window.location.href.split('/')[window.location.href.split('/').length-1]).split(/[?#]/)[0]
console.log(group_id)
let fill_message = ``
let my_id = 2;
let chats = []
/*let chats = [{
    from:1,
    content:'Hey'
},{
    from:1,
    content:'How are u'
},{
    from:3,
    content:'Fine'
},{
    from:4,
    content:'Okay'
},{
    from:1,
    content:'Doing okay'
},{
    from:5,
    content:'1'
},{
    from:1,
    content:'Hey3'
},{
    from:1,
    content:'Hey1'
},{
    from:3,
    content:'Hey2'
},{
    from:3,
    content:'Hey3'
},{
    from:1,
    content:'Hey3'
},{
    from:1,
    content:'Hey3'
},{
    from:1,
    content:'Hey3'
},{
    from:1,
    content:'Hey3'
},{
    from:1,
    content:'Hey3'
},{
    from:1,
    content:'Hey3'
},{
    from:1,
    content:'Hey3'
},{
    from:1,
    content:'Hey3'
},{
    from:2,
    content:'Hey3'
},{
    from:2,
    content:'Hey3'
}]*/

let code = null
let users = null
let settings = null;
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
            
            let update_chats = (chats) =>{
                chats.forEach((chat,index)=>{
                    if(index < 1){
                        from_same_message_handle(chat.from_user_id)
                    }
                    else {
                        const chatElement = screen.querySelector('.chat');
                        if(chat.from_user_id != chats[index-1].from_user_id){
                            fill_message = ''
                            for(let x = index - from_same_person -1; x < index ; x++){
                                fill_message += `<pre>${chats[x].content}</pre>`
                            }
                            if(chats[index-1].from_user_id!= my_id){
                                chatElement.innerHTML += `
                                <div class="message-others d-flex mt-3 mx-3 ">
                                    <img class="message-profile-image" src="../assets/images/user.png" alt="User-image">
                                    <div class='msg my-auto ms-2 me-2'>${fill_message}</div>
                                </div>`
                            }
                            else{
                                chatElement.innerHTML += `
                                <div class="message-me mt-3 mx-3 d-flex flex-row-reverse">
                                    <img class="message-profile-image" src="../assets/images/user.png" alt="User-image">
                                    <div class='msg my-auto ms-2 me-2'>${fill_message}</div>
                                </div>`
                            }
                            
                        }
                        else if(index == chats.length-1){
                            fill_message = ''
                            for(let x = index - from_same_person -1; x <= index ; x++){
                                fill_message += `<pre>${chats[x].content}</pre>`
                            }
                            if(chats[index-1].from_user_id!= my_id){
                                chatElement.innerHTML += `
                                <div class="message-others d-flex mt-3 mx-3 ">
                                    <img class="message-profile-image" src="../assets/images/user.png" alt="User-image">
                                    <div class='msg my-auto ms-2 me-2'>${fill_message}</div>
                                </div>`
                            }
                            else{
                                chatElement.innerHTML += `
                                <div class="message-me mt-3 mx-3 d-flex flex-row-reverse">
                                    <img class="message-profile-image" src="../assets/images/user.png" alt="User-image">
                                    <div class='msg my-auto ms-2 me-2'>${fill_message}</div>
                                </div>`
                            }
                        }
                        else{
                            fill_message = `<pre>${chat.content}</pre>`
                        }
                        from_same_message_handle(chat.from_user_id,chats[index-1].from_user_id)
                    }
                })
            }
            fetch(`../group_chat/${group_id}`)
            .then(response => response.json())
            .then(data=>{
                chats=data
                update_chats(data)
            })
            screen.innerHTML +=`<form  class='message_form position-absolute w-100 d-flex gap-5 justify-content-center align-items-center'><div class='emojis position-absolute w-100'><div class="emojis_nav position-sticky d-flex justify-content-center align-items-center"></div><div class='emojis_wrapper position-absolute w-100 pt-2 px-4'><h5 id="loading_emojis">Loading Emojis</h5></div></div><textarea class='chat_msg w-75' name='content'></textarea><p class='emojis_btn'><i class="fa-solid fa-icons"></i></p><button class='send_message'>></button></form>`
            const emojis_btn = screen.querySelector('.emojis_btn')
            const emojis = screen.querySelector('.emojis_wrapper')
            const chat_msg = screen.querySelector('.chat_msg')
            const send_message = screen.querySelector('.send_message')
            emojis_btn.onclick = ()=>{
                if (emojis.classList.contains('show_emojis')) {emojis.classList.remove('show_emojis');}
                else {emojis.classList.add('show_emojis');}
            }
            show_emojis().then(emojis_text=>{
                document.getElementById('loading_emojis').remove()
                emojis_handler(chat_msg,emojis_text)
            })
            .catch(error=>{
                emojis.innerHTML=`<h5 class='text-danger'>${error}</h5>`
                emojis.style.overflowY = 'hidden'
            })
            send_message.onclick=(e)=>{
                e.preventDefault()
                let csrf = document.querySelector('meta[name="csrf-token"]').content
                console.log(csrf)
                let new_message = {from_user_id:my_id,content:`${chat_msg.value}`}
                console.log(chats[chats.length-1])
                if(chats[chats.length-1].from_user_id == my_id){
                    const chatElement = screen.querySelector('.chat .message-me:last-child .msg');
                    console.log(chatElement)
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
                console.log(new_message)
                chats.push(new_message)
                chat_msg.value=''
            //method='post' action='../send_group_message/${group_id}'
                fetch(`../send_group_message/${parseInt(group_id)}`, {
                    method: 'post',
                    body: JSON.stringify(new_message),
                    headers: {
                        'X-CSRF-TOKEN': csrf,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }).then(response => response.json())
                .then(data => console.log(data))
                .catch(error => {console.error(error)});
            }
            
            
            const chatElement = screen.querySelector('.chat')
            if(chatElement.scrollHeight>chatElement.clientHeight){
                chatElement.style.overflowY='scroll';
                chatElement.scrollTop = chatElement.scrollHeight;
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
            document.querySelector(".settings").innerHTML+= `<div class="grup_id m-2 d-flex gap-2 align-items-center" id="user-${settings.group_id}">
                <p class='ms-2'>${settings.group_id}</p>
            </div>`
            user_document = document.querySelectorAll('.user')
            user_document.forEach(user=>{
                user.querySelector('img').addEventListener('dblclick',()=>{
                    window.location.href=`../profile?id=${user.id.split('-')[1]}`
                })
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
function from_same_message_handle(from, previous = null){
    if(previous == null){
        from_same_person = 0
    }
    else if(from !=previous){
        from_same_person = 0
    }
    else{
        from_same_person += 1
    }
}