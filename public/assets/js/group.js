const group_features = document.querySelectorAll('div[class^="feature-"]')
const screen = document.querySelector('div.screen')
let user_document = null;
let from_same_person = 0;
let group_id = window.location.href.split('/')[window.location.href.split('/').length-1]
let fill_message = ``
let my_id = 1;
let chats = [{
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
}]
let code = null
let users = null
let settings = null;
screenUpdate('chats')
console.log(group_features)
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
            screen.innerHTML = `<div class="chat m-3"> `
            chats.forEach((chat,index)=>{
                if(index < 1){
                    from_same_message_handle(chat.from)
                }
                else {
                    if(chat.from != chats[index-1].from){
                        console.log(chats[index-1].from)
                        fill_message = ''
                        for(let x = index - from_same_person -1; x < index ; x++){
                            fill_message += `<pre>${chats[x].content}</pre>`
                        }
                        if(chats[index-1].from!= my_id){
                            screen.innerHTML += `
                            <div class="message-others d-flex mt-3 mx-3 ">
                                <img class="message-profile-image" src="../assets/images/user.png" alt="User-image">
                                <div class='msg my-auto ms-2 me-2'>${fill_message}</div>
                            </div>`
                        }
                        else{
                            screen.innerHTML += `
                            <div class="message-me mt-3 mx-3 d-flex flex-row-reverse">
                                <img class="message-profile-image" src="../assets/images/user.png" alt="User-image">
                                <div class='msg my-auto ms-2 me-2'>${fill_message}</div>
                            </div>`
                        }
                        
                    }
                    else if(index == chats.length-1){
                        console.log(chats[index-1].from)
                        fill_message = ''
                        for(let x = index - from_same_person -1; x <= index ; x++){
                            fill_message += `<pre>${chats[x].content}</pre>`
                        }
                        if(chats[index-1].from!= my_id){
                            screen.innerHTML += `
                            <div class="message-others d-flex mt-3 mx-3 ">
                                <img class="message-profile-image" src="../assets/images/user.png" alt="User-image">
                                <div class='msg my-auto ms-2 me-2'>${fill_message}</div>
                            </div>`
                        }
                        else{
                            screen.innerHTML += `
                            <div class="message-me mt-3 mx-3 d-flex flex-row-reverse">
                                <img class="message-profile-image" src="../assets/images/user.png" alt="User-image">
                                <div class='msg my-auto ms-2 me-2'>${fill_message}</div>
                            </div>`
                        }
                    }
                    else{
                        fill_message = `<pre>${chat.content}</pre>`
                    }
                    from_same_message_handle(chat.from,chats[index-1].from)
                }
            })
            screen.innerHTML +=`</div>`
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
            console.log(user_document)
            break;
        case 'settings':
            screen.innerHTML =`<div class='settings m-3'>
                <h3>Settings</h3>
            </div>` 
                console.log(settings)
                    document.querySelector(".settings").innerHTML+= `<div class="grup_id m-2 d-flex gap-2 align-items-center" id="user-${settings.group_id}">
                        <p class='ms-2'>${settings.group_id}</p>
                    </div>`
            
            user_document = document.querySelectorAll('.user')
            user_document.forEach(user=>{
                user.querySelector('img').addEventListener('dblclick',()=>{
                    window.location.href=`../profile?id=${user.id.split('-')[1]}`
                })
            })
            console.log()
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