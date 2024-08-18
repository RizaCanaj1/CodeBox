let closest_post
let current_page = 1
let nr_of_posts = ''
let last_page = null
let post_even = null
let post_odd = null
let my_id 
fetch('../authid')
.then(response=>response.json())
.then(data=>my_id = data)
if(window.location.pathname =='/dashboard'){
    document.querySelector('.posts').innerHTML='<div class="odd"></div><div class="even"></div>'
    post_even = document.querySelector('.posts .even')
    post_odd = document.querySelector('.posts .odd')
}
else{
    document.querySelector('.posts').innerHTML=''
}
let postUpdateInterval = null;
let hovered_post = null;
let delayTimer = null;
let currentPostId = null;
let viewed=[]
window.addEventListener('mousemove', function(event) {
    if(event.target.closest('.post')){
        closest_post = event.target.closest('.post')
        currentPostId = closest_post.className.split(' ')[0].split('-')[1];
        if(!viewed.includes(currentPostId)){
            hovered_post = closest_post;
            if(!delayTimer) delayTimer = setTimeout(countView, 8000);
        }
    }
    else{
        hovered_post = null;
        currentPostId = null;
        clearTimeout(delayTimer);
        delayTimer = null;
    }
});

function countView() {
    viewed.push(currentPostId)
    
    fetch(`count-view/${currentPostId}`)
    .catch(error=>console.log(error))
    hovered_post = null;
    currentPostId = null;
    clearTimeout(delayTimer);
    delayTimer = null;
}
function get_posts(page){
    let postsHTML = [];
    fetch(`get-posts?page=${page}`).then(response=>response.json())
    .then(data=>{
        let from = data.from - 1
        let p = data.current_page
        nr_of_posts = data.total - data.from + 1 
        last_page = data.last_page
        data = data.data
        for (let i = 0; i < data.length ; i++) {
            let post = data[i];
            let postHTML = createpost(post, i);
            postsHTML.push(postHTML);
        }
        for (let i = 0; i < data.length ; i++) {
            let post_div = document.createElement('div')
            post_div.innerHTML = postsHTML[i];
            post_div = post_div;
            if (i % 2 == 0) post_odd.appendChild(post_div)
            else post_even.appendChild(post_div)
            setTimeout(()=>{let d = document.querySelector(`.post.pid-${data[i].id}`);d.style.animation='none';d.style.opacity= '1';},3500)
            if(i==data.length-1){
                const all_posts = document.querySelectorAll('.post')
                show_emojis().then(emojis_text=>{
                    all_posts.forEach(p=>{
                        const emojis = p.querySelector(`.emojis`)
                        const emojis_btn = p.querySelector(`.emojis_btn`)
                        const emojis_wrapper = p.querySelector('.emojis_wrapper')
                        if(emojis&&emojis_btn&&emojis_wrapper){
                            emojis_btn.onclick = ()=>{
                                if (emojis_wrapper.classList.contains('show_emojis')) {emojis_wrapper.classList.remove('show_emojis');}
                                else {emojis_wrapper.classList.add('show_emojis');}
                            }
                            document.getElementById('loading_emojis').remove()
                            const input_field = p.querySelector(`.comment_input`)
                            emojis_handler(input_field,emojis_text,emojis)
                        }
                    })
                })
                .catch(error=>{
                    const emojis_wrapper = document.querySelectorAll('.emojis_wrapper')
                    emojis_wrapper.forEach(x=>{
                        x.innerHTML=`<h5 class='text-danger'>${error}</h5>`
                        x.style.overflowY = 'hidden'
                    })
                })
            }
           
        }
    })
    current_page++
    
}

setTimeout(() => {
    window.onscroll = () => {
        if (isBottom() && current_page <= last_page) {
            get_posts(current_page);
        }
    };
}, 3500);
function isBottom() { return window.innerHeight + window.scrollY >= document.body.offsetHeight-20; }
if(window.location.pathname =='/dashboard'){
    if(last_page>current_page || current_page==1){
        get_posts(current_page) 
    }
}
else{
    let user_id = url.searchParams.get('id');
    fetch(`get-posts-from-user/${user_id}`).then(response=>response.json())
    .then(data=>{
        data = data.data
        let type_of_posts = []
        let post_selector = document.querySelector('.post-selector div')
        post_selector.innerHTML=''
        data.forEach((post,i)=>{
            document.querySelector('.posts').innerHTML+= createpost(post,i);
            if (!type_of_posts.includes(post.type)) {
                type_of_posts.push(post.type);
                let type = post.type.charAt(0).toUpperCase() + post.type.slice(1);
                post_selector.innerHTML+=`<h3 class='actived'>${type}</h3>`
            }
        })
        if(type_of_posts.length==0){
            post_selector.innerHTML+=`<h3 class='no_posts actived'>This user has no posts yet</h3>`
        }
        let post_selectors = document.querySelectorAll('.post-selector .p-selector h3')
        post_selectors.forEach(selector => {
            selector.addEventListener('click',()=>{
                let actived=document.querySelectorAll('.actived').length
                if(selector.className=='actived' && actived>1){
                    selector.classList.remove('actived')
                    document.querySelectorAll(`.p${selector.innerText.toLowerCase()}`).forEach(removePost=>{
                        removePost.style.opacity='1';
                        removePost.style.animation='removepost 1s forwards'
                        removePost.classList.add('remove-post')
                    })
                }
                else{
                    selector.classList.add('actived')
                    document.querySelectorAll(`.p${selector.innerText.toLowerCase()}`).forEach(showPost=>{
                        showPost.style.opacity='1';
                        showPost.style.animation='none'
                        showPost.classList.remove('remove-post')
                    })
                }
                if(selector.className.split(' ')[0]!='no_posts') post_selection(selector)
            })
        });
    })
}
function removePostFocus() {
    const focusedPosts = document.querySelectorAll('.post-focus');
    focusedPosts.forEach(post => {
        post.classList.remove('post-focus');
    });
}
setTimeout(()=>{
    const posts = document.querySelectorAll('.post');
    const view_more = document.querySelectorAll('a[class^="pid-"]');
    open_code_box()
    update_comments()
    document.querySelectorAll('form.add-comment').forEach(add_comment=>{
        add_comment.addEventListener('submit', function(event) {
            event.preventDefault();
            let post_id = parseInt(add_comment.getAttribute('id').split('-')[1])
            const formData = new FormData(this);
            formData.append('_token', document.querySelector('meta[name="csrf-token"]').content);
            fetch(`add-comment/${post_id}`, {
                method: 'POST',
                body: formData
            })
            .then(response =>response.json())
            .then((data) => {
                this.querySelector('input[type="text"]').value = '';
                comments.forEach(c => {if(c.className =='text-danger')c.remove()})
                fetchComments(post_id,null);
                this.querySelector('input[type="text"]').placeholder = data.message;
                setTimeout(() => {
                    this.querySelector('input[type="text"]').placeholder = '';
                }, 2000);
            })
            .catch(error => {
                console.error(error)
            });
        });
    })
    posts.forEach(post=>{
        post.addEventListener('dblclick',e=>{
            post.classList.add('post-focus')
            checkCollision(post)
        })
    })
    function checkCollision(post) {
        const focusedPosts = document.querySelectorAll('.post-focus');
        focusedPosts.forEach(fpost=>{
          if(focusedPosts.length >1){
              if(fpost !== post){
                  const rect1 = post.getBoundingClientRect();
                  const rect2 = fpost.getBoundingClientRect();
                  if (
                      rect1.top < rect2.bottom &&
                      rect1.bottom > rect2.top &&
                      rect1.left < rect2.right &&
                      rect1.right > rect2.left
                  ) {
                      fpost.classList.remove('post-focus')
                  }
              }
          }
        })
      }
      view_more.forEach(view=>{
        view.addEventListener('click',()=>{
            let post_id = view.getAttribute('class');
            let post = document.querySelector(`div.${post_id}`);
            post.classList.add('post-focus');
            checkCollision(post);
        })
    })
    window.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            removePostFocus();
        }
    });
    let allPosts = document.querySelectorAll('.post')
    let move_content = ''
    allPosts.forEach(p => {
        p.addEventListener('mouseover',e=>{
            if(e.target.className.split(' ')[0]=='draggable_post'){
                p.draggable=true
            }
            else{
                p.draggable=false
            }
        })
        p.addEventListener('dragstart',e=>{
            drag_status = true
            draggedX = e.clientY-p.getBoundingClientRect().top
            draggedY = e.clientY-p.getBoundingClientRect().top
            move_content = p.innerHTML
        })
        p.addEventListener('dragend',()=>{
            setTimeout(()=>{
                p.innerHTML = closest_post.innerHTML
                closest_post.innerHTML = move_content
                p.classList.add('update_post')
                closest_post.classList.add('update_post')
                setTimeout(()=>{
                    document.querySelectorAll('.update_post').forEach(x=>x.classList.remove('update_post'))
                    update_comments()
                    open_code_box()
                },300)
                
            },50)
        })
    });
    
    let post_settings = document.querySelectorAll('.post_settings')
    post_settings.forEach(btn=>{
        btn.onclick = () => {
            let p_id = btn.className.split(' ')[0]
            let s_post = document.querySelector(`.${p_id}`)
            let settings = s_post.querySelector(`.settings`)
            let hide = settings.querySelector('.hide')
            hide.onclick=()=>{
                s_post.style.opacity='1';
                s_post.style.animation='none';
                setTimeout(()=>{s_post.classList.add('opacity-0')},100)
                
                setTimeout(()=>{s_post.classList.add('d-none')},400)
            }
            if(!btn.className.includes('settings_opened')) {
                btn.classList.add('settings_opened')
                settings.classList.add('open')
            }
            else {
                btn.classList.remove('settings_opened')
                settings.classList.remove('open')
            }
        }
    })
},1000)

function escapeHtml(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) {
        return map[m];
    });
}
function createpost(post,i){
    let undo_hide = `<p class='text-danger d-none hide_post'>You won't see this post again! <span class='seethrow-btn text-success'>Undo</span></p>`
    let comments = post.comments
    let type = post.type
    let comment_model = comment_m(comments)
    let views = ()=>{
        if(post.views_count==1) return `<button class='seethrow-btn views_count'>${post.views_count} view</button>`
        if(post.views_count>0) return `<button class='seethrow-btn views_count'>${post.views_count} views</button>`
        return `<p class='views_count'>${post.views_count} views</p>`
    }
    let comment_form = `
    <div class='d-none comments' id="comments_id-${post.id}">
        ${comment_model}
    </div>
    <form class='add-comment d-none justify-content-between gap-2' id="fid-${post.id}">
        <input class='form-control comment_input' type="text" name='content'>
        <div class='emojis position-absolute w-100'><div class="emojis_nav position-sticky d-flex justify-content-center align-items-center"></div><div class='emojis_wrapper position-absolute w-100 pt-2 px-4'><h5 id="loading_emojis">Loading Emojis</h5></div></div><p class='emojis_btn'><i class="fa-solid fa-icons"></i></p>
        <div class='form-group d-flex justify-content-between gap-2'><div class='info-icon'><i class="fa-solid fa-info fa-lg"></i><div class='info-box'><p>By typing '<|' in your comment , you start a code box, which makes it easier to read and nacivage your code. You can close the box by typing '|>' at the end of your code (not doing so, will automatiacally assume that the code is through the end of your comment). <p></div></div><button class='btn btn-dark'>Send</button></div>
    </form>`
    let settings_form = `<div class='settings bg-light d-flex flex-column justify-content-evenly'>
        <button class='seethrow-btn hide'>Hide</button>
        <button class='seethrow-btn report'>Report</button>
        <button class='seethrow-btn block'>Block</button>
    </div>`
    let profile = `
    <div class='draggable_post title-from d-flex justify-content-between gap-2'>
        <h3 class='draggable_post'>${escapeHtml(post.title)}</h3>
        ${(window.location.pathname == '/dashboard') ? (
            `<div class='from d-flex gap-3'>
                <a href="/profile?id=${post.user_id}">${post.username}</a>
                <div>
                    <img src="${post.profile ? `./storage/${post.profile}` : './assets/images/user.png'}" alt="user">
                    ${settings_form}
                </div>
            </div>`
        ) : ('')}
    </div>
    `;
    switch (type) {
        case 'question':
            return `
            ${undo_hide}
            <div class="pid-${post.id} post pquestion ms-4 bg-light" id="${post.id}" style='--show_post_delay:${i * 0.2}s'>
                ${profile}
                <div class='pdescription'>
                    <p>${escapeHtml(post.content)}</p>
                </div>
                <div class='d-flex justify-content-between mt-4'>
                    <div class='d-flex w-75 gap-2'> 
                        <i class="comments_id-${post.id} fa-solid fa-comment fa-lg pt-2"></i>
                        <p class="counter-${post.id}">${comments.length}</p>
                        <i class="fa-solid fa-box-open fa-lg pt-2"></i><p>5</p>
                        <a href="/${post.type}">#${post.type}</a>
                    </div>
                    <div class='d-flex gap-3'>${views()}<button class='pid-${post.id} seethrow-btn post_settings'><span>.</span><span>.</span><span>.</span></button></div>
                </div>
                ${comment_form}
            </div>`
            break;
        case 'showcase':
            let button = (id,source) =>{return `<button class="pid-${id} source-btn" onclick="open_code(event,${id})">${source}</button>`}
            return `
            ${undo_hide}
            <div class="pid-${post.id} post pshowcase ms-4 bg-light" id="${post.id}" style='--show_post_delay:${i * 0.3}s'>
                ${profile}
                <div class='pdescription'>
                    <p>${escapeHtml(post.content)}</p>
                </div>
                <div class='d-flex justify-content-center'>
                    <button class="pid-${post.id} seethrough-btn codebox-animation"><p class="pid-${post.id}"><<span class="pid-${post.id} m_between_code"></span>/<span class="pid-${post.id} nr_of_code">${post.code.length}CodeBox</span><span class="pid-${post.id} m_between_code"></span>></p></button>
                    <p><pre class='codeblock d-none align-items-center flex-column' id="pid-${post.id}">${post.code.map(source => `${(source.split(".")[1] == 'html') ?`<div>${button(post.id,source)}<button class="pid-${post.id} test-beta" title='This feature is still in development. This works only for simple HTML files for now'> Beta Open</button></div>`:button(post.id,source)}`).join('')}</pre></p>
                </div>
                <div class='d-flex justify-content-between mt-4'>
                    <div class='d-flex w-75 gap-2'> 
                        <i class="comments_id-${post.id} fa-solid fa-comment fa-lg pt-2"></i>
                        <p class="counter-${post.id}">${comments.length}</p>
                        <i class="fa-solid fa-box-open fa-lg pt-2" id='box_id-${post.id}'></i><p>5</p>
                        <a href="/${post.type}">#${post.type}</a>
                    </div>
                    <div class='d-flex gap-3'>${views()}<button class='pid-${post.id} seethrow-btn post_settings'><span>.</span><span>.</span><span>.</span></button></div>
                </div>
                ${comment_form}
            </div>`
            break;
        case 'invitation':
            return `
            ${undo_hide}
            <div class="pid-${post.id} post pinvitation ms-4 bg-light" id="${post.id}" style='--show_post_delay:${i * 0.3}s'>
                ${profile}
                <div class='pdescription'>
                    <p>${escapeHtml(post.content)}</p> 
                </div>
                <div class='d-flex justify-content-between'>
                    <div class='d-flex gap-2'>
                        ${(my_id != post.user_id)?(`${(post.applied > 0 ?
                            (post.applied >= 5 && post.invitation_status == 'refused' ?
                                `<a class="p-2 bg-danger text-white rounded-3">Contact the owner for more information!</a>` :
                                (post.invitation_status == 'approved' ?
                                    `<a href="/group/${post.id}" class="btn btn-secondary">Group</a>` :
                                    (post.invitation_status == 'pending' ?
                                        `<a href='applications/${post.id}' class="p-2 bg-warning text-white rounded-3">Wait for response</a>` :
                                        `<a href='applications/${post.id}' class="btn btn-outline-primary">Apply</a>`
                                    )
                                )
                            ) :
                            `<a href='applications/${post.id}' class="btn btn-outline-primary">Apply</a>`
                        )}`):(`<a href='applications/${post.id}' class="btn btn-outline-success">View applications</a>`)}
                        <div class='pt-2 d-flex gap-1'>
                            <i class="fa-solid fa-box-open fa-lg pt-2 mt-1"></i><p>5</p>
                            <a href="/${post.type}">#${post.type}</a>
                        </div>
                    </div>
                    <button class='pid-${post.id} seethrow-btn post_settings'><span>.</span><span>.</span><span>.</span></button>
                </div>
            </div>`
            break;
        case 'community':
            return `
            ${undo_hide}
            <div class="pid-${post.id} post pcommunity ms-4 mb-4 bg-light" id="${post.id}" style='--show_post_delay:${i * 0.3}s'>
                ${profile}
                <div class='pdescription'>
                    <p>${escapeHtml(post.content)}</p>
                    ${(post.media.length > 1 ?
                    `${(post.media.length < 4 ? post.media.map(source => `
                        <img src="./storage/media/${source}" alt="${source}">`).join('') :
                        `<div class='p-mimage'>
                            ${post.media.slice(0, 3).map((source, index) => `
                                ${index > 1 ? `<img class='hidden-images'  src="./storage/media/${source}" alt="laravel">` : `<img src="./storage/media/${source}" alt="laravel">`}
                                `).join('')}
                            <a class="pid-${post.id}">View More</a>
                        </div>`)}` :(post.media.length === 1 ?
                    `<div class='pimage d-flex justify-content-center'>
                        <img src="./storage/media/${post.media[0]}" alt="laravel">
                    </div>` :
                    `<div class='pimage d-flex justify-content-center'>
                        <img src="./assets/images/laravel.png" alt="laravel">
                    </div>`))}
                    <div class='d-flex justify-content-between mt-4'>
                        <div class='d-flex w-75 gap-2'> 
                            <i class="comments_id-${post.id} fa-solid fa-comment fa-lg pt-2"></i>
                            <p class="counter-${post.id}">${comments.length}</p>
                            <i class="fa-solid fa-box-open fa-lg pt-2"></i><p>5</p>
                            <a href="/${post.type}">#${post.type}</a>
                        </div>
                        <div class='d-flex gap-3'>${views()}<button class='pid-${post.id} seethrow-btn post_settings'><span>.</span><span>.</span><span>.</span></button></div>
                    </div>
                </div>
                ${comment_form}
            </div>`
            break;
        default:
            break;
        
    }
}