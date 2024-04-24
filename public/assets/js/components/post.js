let closest_post
if(window.location.pathname =='/dashboard'){
    document.querySelector('.posts').innerHTML='<div class="odd"></div><div class="even"></div>'
}
else{
    document.querySelector('.posts').innerHTML=''
}

let postUpdateInterval = null;
let comments = [];
window.addEventListener('mousemove', function(event) {
    if(event.target.closest('.post'))
    closest_post = event.target.closest('.post')
});
if(window.location.pathname =='/dashboard'){
    fetch(`get-posts`).then(response=>response.json())
    .then(data=>{
        for(let i = 0; i<data.length;i++){
            let post = data[i]
            if(i%2==0)
            document.querySelector('.posts .even').innerHTML+= createpost(post);
            else 
            document.querySelector('.posts .odd').innerHTML+= createpost(post);
        }
        
    })
}

else{
    
    let user_id = url.searchParams.get('id');
    
    fetch(`get-posts-from-user/${user_id}`).then(response=>response.json())
    .then(data=>{
        let type_of_posts = []
        let post_selector = document.querySelector('.post-selector div')
        post_selector.innerHTML=''
        data.forEach(post=>{
            document.querySelector('.posts').innerHTML+= createpost(post);
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
                        removePost.classList.add('remove-post')
                    })
                }
                else{
                    selector.classList.add('actived')
                    document.querySelectorAll(`.p${selector.innerText.toLowerCase()}`).forEach(showPost=>{
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
function createpost(post){
    
    let comments = post.comments
    let type = post.type
    let comment_form = `
    <div class='d-none comments' id="comments_id-${post.id}">
        <hr>
        ${(comments.length > 0 ? comments.map(comment => `<pre class='comment'>${formComment(comment.content)}</pre>`).join('') : "<p class='text-danger'>This post has no comments, be the first to comment</p>")}
    </div>
    <form class='add-comment d-none justify-content-between gap-2' id="fid-${post.id}">
        <input class='form-control' type="text" name='content'>
        <div class='form-group d-flex justify-content-between gap-2'><div class='info-icon'><i class="fa-solid fa-info fa-lg"></i><div class='info-box'><p>By typing '<|' in your comment , you start a code box, which makes it easier to read and nacivage your code. You can close the box by typing '|>' at the end of your code (not doing so, will automatiacally assume that the code is through the end of your comment). <p></div></div><button class='btn btn-dark'>Send</button></div>
    </form>`
    let profile = `
    <div class='draggable_post title-from d-flex justify-content-between gap-2'>
        <h3 class='draggable_post'>${escapeHtml(post.title)}</h3>
        ${(window.location.pathname == '/dashboard') ? (
            `<div class='from d-flex gap-3'>
                <a href="/profile?id=${post.user_id}">${post.username}</a>
                <img src="${post.profile ? `./storage/${post.profile}` : './assets/images/user.png'}" alt="user">
            </div>`
        ) : ('')}
    </div>
    `;
    switch (type) {
        case 'question':
            return `
            <div class="pid-${post.id} post pquestion ms-4 bg-light" id="${post.id}">
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
                    <p>Views:4k</p>
                </div>
                ${comment_form}
            </div>`
            break;
        case 'showcase':
            return `
            <div class="pid-${post.id} post pshowcase ms-4 bg-light" id="${post.id}">
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
                        <i class="fa-solid fa-box-open fa-lg pt-2" id='box_id-1'></i><p>5</p>
                        <a href="/${post.type}">#${post.type}</a>
                    </div>
                    <p>Views:4k</p>
                </div>
                ${comment_form}
            </div>`
            break;
        case 'invitation':
            return `
            <div class="pid-${post.id} post pinvitation ms-4 bg-light" id="${post.id}">
                ${profile}
                <div class='pdescription'>
                    <p>${escapeHtml(post.content)}</p> 
                </div>
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
            </div>`
            break;
        case 'community':
            return `
            <div class="pid-${post.id} post pcommunity ms-4 mb-4 bg-light" id="${post.id}">
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
                        <p>Views:4k</p>
                    </div>
                    ${comment_form}
                </div>
            </div>`
            break;
        default:
            break;
    }
}