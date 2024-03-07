
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

let url = new URL(window.location.href);
let user_id = url.searchParams.get('id');
let type_of_posts = []
let post_selector = document.querySelector('.post-selector div')
let post = document.querySelector('.posts')
let profile_name = document.querySelector('.profile-name')
post_selector.innerHTML=''
post.innerHTML=''
profile_name.innerHTML=''
fetch(`get-user/${user_id}`)
.then(response=>{
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
})
.then(data=>{
    document.querySelector('.profile-name').innerHTML=data.name
})
.catch(error => {
    document.querySelector('.container').innerHTML="<h1 class='text-danger no_user_found'>This user doesn't exist</h1>"
})
fetch(`get-posts-from-user/${user_id}`)
.then(response => response.json())
.then(data => {
    data.forEach(post=>{
        if (!type_of_posts.includes(post.type)) {
            type_of_posts.push(post.type);
            let type = post.type.charAt(0).toUpperCase() + post.type.slice(1);
            post_selector.innerHTML+=`<h3 class='actived'>${type}</h3>`
        }
        document.querySelector('.posts').innerHTML+=`
        <div class="post m-5 ${post.type} p-3">
            <div class='title'>
                <h4>${post.title}</h4>
            </div>
            <div class='description'>
                <p>${post.content}</p>
            </div>
        </div>`
    })
    if(type_of_posts.length==0){
        post_selector.innerHTML+=`<h3 class='no_posts actived'>This user has no posts yet</h3>`
    }
    let post_selectors = document.querySelectorAll('.post-selector div h3')
    post_selectors.forEach(selector => {
        selector.addEventListener('click',()=>{
            let actived=document.querySelectorAll('.actived').length
            if(selector.className=='actived' && actived>1){
                selector.classList.remove('actived')
            }
            else{
                selector.classList.add('actived')
            }
            if(selector.className.split(' ')[0]!='no_posts') post_selection(selector)
        })
    });
  })
.catch(error => {
    console.error('Error getting posts:', error);
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