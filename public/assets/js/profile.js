let url = new URL(window.location.href);
let user_id = url.searchParams.get('id');
let post = document.querySelector('.posts')
let profile_name = document.querySelector('.profile-name')
let add_button = document.querySelector('.profile-bar .btn-add')
let edit_button = document.querySelector('.profile-bar .btn-edit')
let add_contact = document.querySelector('.m-info .add-icon')
let new_contact = document.querySelector('.m-info .new-social')
let remove_button = document.querySelectorAll('.m-info .remove-btn')
let bio = document.querySelector('.m-info .bio')
let bio_editor = document.querySelector('.m-info #bio')
let add_social_btn = document.querySelector('.m-info .add_social')
let save_changes = document.querySelector('.save_changes')
let discard_changes = document.querySelector('.discard_changes')
let contacts = document.querySelectorAll('.removable-icons')
let contacts_element = document.querySelector('.contacts')
let social_selection = document.getElementById('social')
let contacts_array = []
let old_bio = ''
let added = false;
function post_selection(selected){
    let selected_posts =  document.querySelectorAll(`.posts .${selected.innerText.toLowerCase()}`)
    if(selected.className=='actived'){
        selected_posts.forEach(selected_post=>{
            selected_post.classList.remove('d-none')
            setTimeout(()=>{ selected_post.classList.remove('remove-post')},100)
        })
    }
    else{
        selected_posts.forEach(selected_post=>{
            selected_post.classList.add('remove-post')
            setTimeout(()=>{ selected_post.classList.add('d-none')},100)
        })
    }

}
profile_name.innerHTML=''
fetch(`get-user/${user_id}`)
.then(response=>{
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
})
.then(data=>{
    console.log(data)
    document.querySelector('.profile-name').innerHTML=data.username
    if(data.profile){
        document.querySelector('.profile-image').src=`./storage/${data.profile}`
    }
    if(data.bio){
        bio.innerHTML=data.bio
    }
    if(data.social_media){
        data.social_media.forEach(s=>{
            contacts_element.innerHTML +=`<span class='removable-icons' id='${s.social_media}-icon'><a href="${s.media_link}" id='${s.social_media}-link'><i class="fa-brands fa-${s.social_media} fa-2x ${s.social_media}-icon"></i></a><span class='remove-btn d-none'></span></span>`
        })
        remove_button = document.querySelectorAll('.m-info .remove-btn')
        initialise_remove_buttons()
    }
})
.catch(() => {
    document.querySelector('.container').innerHTML="<h1 class='text-danger no_user_found'>This user doesn't exist</h1>"
})
fetch(`get-friend-status/${user_id}`)
.then(response=>response.json())
.then(data=>{
    if(data.length >0){
        added = true
        if(data[0].status =='no_respond'){
            add_button.innerHTML='Requested'
            add_button.classList.add('added')
        }
    }
    console.log(data)
})
fetch('authid')
.then(response=>response.json())
.then(authid=>{
    if(authid != user_id){
        add_button.classList.remove('d-none')
        setTimeout(() => {
            add_button.classList.remove('opacity-0')
        }, 10);
    }
    else{
        edit_button.classList.remove('d-none')
        setTimeout(() => {
            edit_button.classList.remove('opacity-0')
        }, 10);
    }
})
add_button.addEventListener('click',()=>{
    if(!added){
        add_button.classList.add('added')
        fetch(`add-friend/${user_id}`)
        .then(response=>console.log(response))
        .catch(error=>console.log(error))
        let index = add_button.innerHTML.length
        let smoothRemoveInterval = setInterval(() => {
            add_button.innerHTML = add_button.innerHTML.slice(0, -1);
            index--;
            if (index === 0) {
                clearInterval(smoothRemoveInterval);
                let text = "Requested";
                let currentIndex = 0;
                let smoothAddInterval = setInterval(() => {
                    add_button.innerHTML += text[currentIndex];
                    currentIndex++;
                    if (currentIndex === text.length) {
                        clearInterval(smoothAddInterval);
                    }
                }, 50);
            }
        }, 50)
    }
    added = true;
})
window.addEventListener('scroll',()=>{
    let profile = document.querySelector('.profile-bar');
    if(window.scrollY<200){
        profile.classList.remove('right-bar')
    }
    if(window.scrollY>450){
        profile.classList.add('right-bar')
    }
})
edit_button.onclick = ()=>{
    old_bio = bio.innerHTML.split('')
    edit_button.classList.add('opacity-0')
    add_contact.classList.remove('d-none')
    add_contact.classList.remove('opacity-0')
    bio_editor.classList.remove('d-none')
    bio_editor.classList.remove('hide-bio-editor')
    bio_editor.value = ''
    remove_button.forEach(btn=>{
        btn.classList.remove('opacity-0')
        btn.classList.remove('d-none')
    })
    setTimeout(()=>{
        edit_button.classList.add('d-none')
    },300)
    
    let time = 2500/(bio.innerHTML.split('').length)
    bio.innerHTML.split('').forEach((s, index) => {
        setTimeout(() => {
            bio.innerHTML = bio.innerHTML.slice(0, -1);
        }, (index + 1) * time); 
    });
    old_bio.forEach((l,index)=>{
        setTimeout(() => {
            bio_editor.value +=l;
        }, (index + 1) * time); 
        setTimeout(()=>{
            bio_editor.readOnly=false;
            save_changes.classList.remove('d-none')
            discard_changes.classList.remove('d-none')
        },2500)
    })
}
let removed_social=[];
initialise_remove_buttons()
function initialise_remove_buttons(){
    remove_button.forEach(btn=>{
        btn.onclick = e =>{
            let removed = e.target.parentElement.firstChild.id.split('-')[0]
            if(e.target.parentElement.className.includes('select-icon')){
                e.target.parentElement.classList.remove('select-icon')
                removed_social = removed_social.filter(x=>x!=removed)
            }
            else{
                removed_social.push(removed)
                e.target.parentElement.classList.add('select-icon')
            }
        }
    })
}

save_changes.addEventListener('click',()=>{
    contacts_array =[]
    remove_button = document.querySelectorAll('.m-info .remove-btn')
    initialise_remove_buttons()
    bio.innerHTML=''
    console.log(removed_social)
    if(removed_social.length>0)
    removed_social.forEach(r=>{
        const remove_social = document.querySelector(`#${r}-icon`)
        if (remove_social) {
            remove_social.classList.add('hide-social')
            setTimeout(()=>{remove_social.remove();},600)
        }
    })
    setTimeout(()=>{
        contacts = document.querySelectorAll('.removable-icons')
        contacts.forEach(c=>{
            contacts_array.push(c.id.split('-')[0])
        })
    },600)
    add_contact.classList.remove('editing')
    new_contact.classList.add('d-none')
    save_changes.classList.add('d-none')
    discard_changes.classList.add('d-none')
    add_contact.classList.add('opacity-0')
    bio_editor.readOnly=true
    console.log(edit_button)
    bio_editor.classList.add('hide-bio-editor')
    let new_bio = bio_editor.value.split('')
    console.log(bio_editor.value.split(''))
    let time = 2500/(new_bio.length)
    new_bio.forEach((b,index)=>{
        setTimeout(() => {
            bio.innerHTML +=b;
        }, (index + 1) * time);
    })
    remove_button.forEach(btn=>{
        btn.classList.add('opacity-0')
    })
    setTimeout(()=>{
        edit_button.classList.remove('d-none')
        edit_button.classList.remove('opacity-0')
        add_contact.classList.add('d-none')
        remove_button.forEach(btn=>{
            btn.classList.add('d-none')
        })
    },2500)
    
    
})
discard_changes.addEventListener('click',()=>{
    bio.innerHTML=''
    add_contact.classList.remove('editing')
    new_contact.classList.add('d-none')
    save_changes.classList.add('d-none')
    discard_changes.classList.add('d-none')
    add_contact.classList.add('opacity-0')
    bio_editor.readOnly=true
    bio_editor.classList.add('hide-bio-editor')
    let time = 2500/(old_bio.length)
    old_bio.forEach((b,index)=>{
        setTimeout(() => {
            bio.innerHTML +=b;
        }, (index + 1) * time);
    })
    remove_button.forEach(btn=>{
        btn.classList.add('opacity-0')
        btn.parentElement.classList.remove('select-icon')
    })
    setTimeout(()=>{
        edit_button.classList.remove('d-none')
        edit_button.classList.remove('opacity-0')
        add_contact.classList.add('d-none')
        remove_button.forEach(btn=>{
            btn.classList.add('d-none')
        })
    },2500)
})
add_contact.onclick = () =>{
    if(add_contact.className.includes('editing')){
        add_contact.classList.remove('editing')
        new_contact.classList.add('d-none')
    }
    else{
        add_contact.classList.add('editing')
        new_contact.classList.remove('d-none')
    }
    
    
}
let selectedMedia
let prefix = '';
let linkInput = document.getElementById('link');
social_selection.addEventListener('change', function() {
    selectedMedia = this.value;
    document.querySelectorAll(`.removable-icons a`).forEach(l => {
        l.classList.remove('active')
    });
    if (selectedMedia === 'Instagram') {
        prefix = 'https://www.instagram.com/';
        linkInput.placeholder = prefix + "username"; 
    } else if (selectedMedia === 'Facebook') {
        prefix = 'https://www.facebook.com/';
        linkInput.placeholder = prefix + "username"; 
    } else if (selectedMedia === 'LinkedIn') {
        prefix = 'https://www.linkedin.com/in/';
        linkInput.placeholder = prefix + "username"; 
    } else if (selectedMedia === 'YouTube') {
        prefix = 'https://www.youtube.com/channel/';
        linkInput.placeholder = prefix + "username"; 
    }
    else{
        prefix=''
        linkInput.placeholder = "Social-Media-Link"; 
    }
    console.log(contacts_array)
    if(contacts_array.includes(selectedMedia.toLowerCase())){
        let old_link = document.querySelector(`.removable-icons #${selectedMedia.toLowerCase()}-link`)
        old_link.classList.add('active')
        if(old_link) linkInput.value = old_link.href;
        else linkInput.value = prefix;
        console.log(old_link)
    }
    else{
        linkInput.value = prefix;
    }
    
    
});
linkInput.addEventListener('keyup', function() {
    add_social_btn.classList.remove('d-none')
    if (!linkInput.value.startsWith(prefix) && selectedMedia!='') {
        linkInput.value = prefix; 
    }
    if(linkInput.value==''){
        add_social_btn.classList.add('d-none')
    }    
});
contacts.forEach(c=>{
    contacts_array.push(c.id.split('-')[0])
})
add_social_btn.onclick = ()=>{
    document.querySelectorAll(`.removable-icons a`).forEach(l => {
        l.classList.remove('active')
    });
    console.log(linkInput.value)
    if(contacts_array.includes(social_selection.value.toLowerCase())){
        let old_link = document.querySelector(`.removable-icons #${social_selection.value.toLowerCase()}-link`)
        console.log(contacts_array)
        console.log(social_selection.value)
        console.log(old_link)
        if(old_link) old_link.href = linkInput.value;
    }
    else{
        console.log(contacts_array)
        console.log(social_selection.value)
        if (social_selection.value == 'Instagram') {
            contacts_element.innerHTML +=`<span class='removable-icons' id='instagram-icon'><a href="${linkInput.value}" id='instagram-link'><i class="fa-brands fa-instagram fa-2x instagram-icon"></i></a><span class='remove-btn d-none'></span></span>`
        } else if (selectedMedia == 'Facebook') {
            contacts_element.innerHTML +=`<span class='removable-icons' id='facebook-icon'><a href="${linkInput.value}" id='facebook-link'><i class="fa-brands fa-facebook fa-2x facebook-icon"></i></a><span class='remove-btn d-none'></span></span>`
        } else if (selectedMedia == 'LinkedIn') {
            contacts_element.innerHTML +=`<span class='removable-icons' id='linkedin-icon'><a href="${linkInput.value}" id='linkedin-link'><i class="fa-brands fa-linkedin fa-2x linkedin-icon"></i></a><span class='remove-btn d-none'></span></span>`
        } else if (selectedMedia == 'YouTube') {
            contacts_element.innerHTML += `<span class='removable-icons' id='youtube-icon'><a href="${linkInput.value}" id='youtube-link'><i class="fa-brands fa-youtube fa-2x youtube-icon"></i></a><span class='remove-btn d-none'></span></span>`
        }
    }
    social_selection.value=''
    linkInput.value = ''
    linkInput.placeholder = 'Social-Media-Link'
    add_social_btn.classList.add('d-none')
}