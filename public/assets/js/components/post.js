let closest_post
let current_page = 1
let nr_of_posts = ''
let last_page = null
let post_even = null
let post_odd = null
if(window.location.pathname =='/dashboard'){
show_emojis().then(e=>{console.log(e)})
    document.querySelector('.posts').innerHTML='<div class="odd"></div><div class="even"></div>'
    post_even = document.querySelector('.posts .even')
    post_odd = document.querySelector('.posts .odd')
}
else{
    document.querySelector('.posts').innerHTML=''
}
let postUpdateInterval = null;
let comments = [];
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
    console.log('Counting view for post:', hovered_post);
    fetch(`count-view/${currentPostId}`)
    .then(response=>response.json())
    .then(data=>console.log(data))
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
        console.log(data)
        let from = data.from - 1
        let p = data.current_page
        nr_of_posts = data.total - data.from + 1 
        last_page = data.last_page
        data = data.data
        console.log(nr_of_posts)
            for (let i = 0; i < data.length ; i++) {
                let post = data[i];
                let postHTML = createpost(post, i);
                postsHTML.push(postHTML);
            }
            for (let i = 0; i < data.length ; i++) {
                if (i % 2 == 0) post_odd.innerHTML += postsHTML[i];
                else post_even.innerHTML += postsHTML[i];
                setTimeout(()=>{let d = document.querySelector(`.post.pid-${data[i].id}`);d.style.animation='none';d.style.opacity= '1';},3500)
                if(i==data.length-1){
                    const emojis_btn = document.querySelector('.emojis_btn')
                    const emojis = document.querySelector('.emojis_wrapper')
                    emojis_btn.onclick = ()=>{
                        if (emojis.classList.contains('show_emojis')) {emojis.classList.remove('show_emojis');}
                        else {emojis.classList.add('show_emojis');}
                    }
                    show_emojis().then(emojis_text=>{
                        document.getElementById('loading_emojis').remove()
                        const input_field = document.querySelector('.comment_input')
                        emojis_handler(input_field,emojis_text)
                    })
                    .catch(error=>{
                        console.error(error)
                        emojis.innerHTML=`<h5 class='text-danger'>${error}</h5>`
                        emojis.style.overflowY = 'hidden'
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
function update_comments(){
    const comments_btn = document.querySelectorAll('.fa-comment');
    comments_btn.forEach(comment_btn =>{
        comment_btn.addEventListener('click',e=>{
            let id = e.target.getAttribute('class').split(" ");
            if(id[(id.length-1)]=='o-comments'){
                e.target.classList.remove('o-comments');
                document.querySelector(`#${id[0]}`).classList.add('d-none');
                document.querySelector(`#fid-${id[0].split('-')[1]}`).classList.add('d-none');
                document.querySelector(`#fid-${id[0].split('-')[1]}`).classList.remove('d-flex');
                clearInterval(postUpdateInterval);
            }
            else{
                e.target.classList.add('o-comments');
                document.querySelector(`#${id[0]}`).classList.remove('d-none');
                document.querySelector(`#fid-${id[0].split('-')[1]}`).classList.remove('d-none');
                document.querySelector(`#fid-${id[0].split('-')[1]}`).classList.add('d-flex');
                startCommentFetch(parseInt(id[0].split('-')[1]));
            }
        })
    })
    
}
function startCommentFetch(postId){
    postUpdateInterval = setInterval(() => {
        fetchComments(postId)
    }, 3000)
}
function fetchComments(postId) {
    comments = document.querySelectorAll(`#comments_id-${postId} pre.comment`)
    
    let comments_text = []
    comments.forEach(c => {
        comments_text.push(c.innerHTML)
    });
    let comment = document.querySelector(`div#comments_id-${postId}`)
    fetch(`get-comments/${postId}`)
    .then(response => response.json())
    .then(data => {
        document.querySelector(`.counter-${postId}`).innerHTML=data.length;
        data.forEach(c => {
            if(!comments_text.includes(formComment(c.content))){
                comment.innerHTML+=`<pre class='comment'>${formComment(c.content)}</pre>`
            }
        });
      })
    .catch(error => {
        console.error('Error fetching comments:', error);
    });
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
            .then(() => {
                this.querySelector('input[type="text"]').value = '';
                comments.forEach(c => {if(c.className =='text-danger')c.classList.add('d-none')})
                fetchComments(post_id);
                this.querySelector('input[type="text"]').placeholder = 'Comment added successfully';
                setTimeout(() => {
                    this.querySelector('input[type="text"]').placeholder = '';
                }, 2000);
            })
            .catch(error => {
                this.querySelector('input[type="text"]').value = '';
                this.querySelector('input[type="text"]').placeholder = 'Error occurred! Comment was not added';
                setTimeout(() => {
                    this.querySelector('input[type="text"]').placeholder = '';
                }, 2000);
                console.error('Error:', error);
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
function formComment(comment) {
    let constructed_comment = '';
    let check_starts = 0;
    let check_ends = 0;
    var parts = comment.split(/(<\|)|(\|>)/).filter(Boolean);
    parts.forEach(part => {
        if (parts.length > 1) {
            if (part === '<|') {
                check_starts++;
                constructed_comment += `<pre class="comment_code">`;
            } else if (part === '|>') {
                check_ends++;
                constructed_comment += '</pre>';
            } else {
                constructed_comment += `${escapeHtml(part)}`;
            }
        } else if (parts.length === 1 && part === '<|') {
            check_starts++
            check_ends++
            constructed_comment += `${escapeHtml(part)}`;
        }
    });
    if (check_starts !== check_ends) {
        constructed_comment += '</pre>';
    }
    else if(check_starts == 0 && check_ends == 0){
        constructed_comment += `${escapeHtml(comment)}`;
    }
    return constructed_comment;
}

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
    let views = ()=>{
        if(post.views_count==1) return `<button class='seethrow-btn views_count'>${post.views_count} view</button>`
        if(post.views_count>0) return `<button class='seethrow-btn views_count'>${post.views_count} views</button>`
        return `<p class='views_count'>${post.views_count} views</p>`
    }
    let comment_form = `
    <div class='d-none comments' id="comments_id-${post.id}">
        <hr>
        ${(comments.length > 0 ? comments.map(comment => `<div class='comment-wrapper d-flex justify-content-between'><pre class='comment'>${formComment(comment.content)}</pre><div class='d-flex gap-2 image-name'><img class='user-image' src="${comment.user_detail.profile ? `./storage/${comment.user_detail.profile}` : './assets/images/user.png'}" alt="user"><a href='/profile?id=${comment.user_id}' class='username'>${comment.user_detail.username}</a></div></div>`).join('') : "<p class='text-danger'>This post has no comments, be the first to comment</p>")}
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
            return `
            ${undo_hide}
            <div class="pid-${post.id} post pshowcase ms-4 bg-light" id="${post.id}" style='--show_post_delay:${i * 0.3}s'>
                ${profile}
                <div class='pdescription'>
                    <p>${escapeHtml(post.content)}</p>
                </div>
                <div class='d-flex justify-content-center'>
                    <button class="pid-${post.id} seethrough-btn codebox-animation"><p class="pid-${post.id}"><<span class="pid-${post.id} m_between_code"></span>/<span class="pid-${post.id} nr_of_code">${post.code.length}CodeBox</span><span class="pid-${post.id} m_between_code"></span>></p></button>
                    <p><pre class='codeblock d-none align-items-center flex-column' id="pid-${post.id}">${post.code.map(source => `${(source.split(".")[1] == 'html') ?`<div><button class="pid-${post.id} source-btn">${source}</button><button class="pid-${post.id} test-beta" title='This feature is still in development. This works only for simple HTML files for now'> Beta Open</button></div>`:`<button class="pid-${post.id} source-btn">${source}</button>`}`).join('')}</pre></p>
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
                        ${(post.auth_id != post.user_id)?(`${(post.applied > 0 ?
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