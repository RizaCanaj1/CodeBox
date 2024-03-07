if(window.location.pathname =='/dashboard'){
    document.querySelector('.posts').innerHTML='<div class="odd"></div><div class="even"></div>'
}
else{
    document.querySelector('.posts').innerHTML=''
}

fetch(`get-posts`).then(response=>response.json())
.then(data=>{
    for(let i = 0; i<data.length;i++){
        let post = data[i]
        if(window.location.pathname =='/dashboard'){
            if(i%2==0)
            document.querySelector('.posts .even').innerHTML+= createpost(post);
            else 
            document.querySelector('.posts .odd').innerHTML+= createpost(post);
        }
        else{
            document.querySelector('.posts').innerHTML+= createpost(post);
        }
    }
    data.forEach(post=>{
        
    })
})
.then(()=>{
    const posts = document.querySelectorAll('.post');
    const view_more = document.querySelectorAll('a[class^="pid-"]');
    const comments_btn = document.querySelectorAll('.fa-comment');
    let postUpdateInterval = null;
    let comments = [];
    document.querySelectorAll('form.add-comment').forEach(add_comment=>{
        add_comment.addEventListener('submit', function(event) {
            event.preventDefault();
            let post_id = parseInt(add_comment.getAttribute('id').split('-')[1])
            comments = document.querySelectorAll(`#comments_id-${post_id} p`)
            let comments_text = []
            comments.forEach(c => {
                comments_text.push(c.innerHTML)
                console.log(comments)
            });
            const formData = new FormData(this);
            formData.append('_token', document.querySelector('meta[name="csrf-token"]').content);
            fetch(`add-comment/${post_id}`, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                this.querySelector('input[type="text"]').value = '';
                console.log('Form submitted successfully!', response);
                comments.forEach(c => {if(c.className =='text-danger')c.classList.add('d-none')})
                fetchComments(post_id,comments_text);
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
    
    function fetchComments(postId) {
        comments = document.querySelectorAll(`#comments_id-${postId} p`)
        
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
                if(comments_text.includes(c.content)){
                }
                else{
                    comment.innerHTML+=`<p>${c.content}</p>`
                }
            });
          })
        .catch(error => {
            console.error('Error fetching comments:', error);
        });
    }
    function startCommentFetch(postId){
        comments = document.querySelectorAll(`#comments_id-${postId} p`)
        let comments_text = []
        comments.forEach(c => {
            comments_text.push(c.innerHTML)
        });
        postUpdateInterval = setInterval(() => {
            fetchComments(postId,comments_text)
        }, 3000)
    }
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
    function removePostFocus() {
        const focusedPosts = document.querySelectorAll('.post-focus');
        focusedPosts.forEach(post => {
            post.classList.remove('post-focus');
        });
    }
    window.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            removePostFocus();
        }
    });
})
function createpost(post){
    
    let comments = post.comments
    let type = post.type
    switch (type) {
        case 'question':
            return `
            <div class="pid-${post.id} post pquestion mt-4 ms-4 bg-light" id="${post.id}">
                <div class='title-from d-flex justify-content-between gap-2'>
                    <h3>${post.title}</h3>
                    <div class='from d-flex gap-3'>
                        <a href="/profile?id=${post.user_id}">${post.username}</a>
                        <img src="./assets/images/user.png" alt="user">
                    </div>
                </div>
                <div class='pdescription'>
                    <p>${post.content}</p>
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
                <div class='d-none comments' id="comments_id-${post.id}">
                    <hr>
                    ${(comments.length > 0 ? comments.map(comment => `<p>${comment.content}</p>`).join('') : "<p class='text-danger'>This post has no comments, be the first to comment</p>")}
                </div>
                <form class='add-comment d-none justify-content-between gap-2' id="fid-${post.id}"><input class='form-control' type="text" name='content'>
                    <button class='btn btn-dark'>Send</button>
                </form>
            </div>`
            break;
        case 'showcase':
            return `
            <div class="pid-${post.id} post pshowcase mt-4 ms-4 bg-light" id="${post.id}">
                <div class='title-from d-flex justify-content-between gap-2'>
                    <h3 >${post.title}</h3>
                    <div class='from d-flex gap-3'>
                        <a href="/profile?id=${post.user_id}">${post.username}</a>
                        <img src="./assets/images/user.png" alt="user">
                    </div>
                </div>
                <div class='pdescription'>
                    <p>${post.content}</p>
                </div>
                <div class='d-flex justify-content-center'>
                    <button class="pid-${post.id} seethrow-btn codebox-animation"><p class="pid-${post.id}"><<span class="pid-${post.id} m_between_code"></span>/<span class="pid-${post.id} nr_of_code">${post.code.length}CodeBox</span><span class="pid-${post.id} m_between_code"></span>></p></button>
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
                <div class='d-none comments' id="comments_id-${post.id}">
                    <hr>
                    ${(comments.length > 0 ? comments.map(comment => `<p>${comment.content}</p>`).join('') : "<p class='text-danger'>This post has no comments, be the first to comment</p>")}
                </div>
                <form class='add-comment d-none justify-content-between gap-2' id="fid-${post.id}"><input class='form-control' type="text" name='content'>
                    <button class='btn btn-dark'>Send</button>
                </form>
            </div>`
            break;
        case 'invitation':
            return `
            <div class="pid-${post.id} post pinvitation mt-4 ms-4 bg-light" id="${post.id}">
                <div class='title-from d-flex justify-content-between gap-2'>
                    <h3>${post.title}</h3>
                    <div class='from d-flex gap-3'>
                        <a href="/profile?id=${post.user_id}">${post.username}</a>
                        <img src="./assets/images/user.png" alt="user">
                    </div>
                </div>
                <div class='pdescription'>
                    <p>${post.content}</p> 
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
            <div class="pid-${post.id} post pcommunity mt-4 ms-4 mb-4 bg-light" id="${post.id}">
                <div class='title-from d-flex justify-content-between gap-2'>
                    <h3 class='w-75'>${post.title}</h3>
                    <div class='from d-flex gap-3'>
                        <a href="/profile?id=${post.user_id}">${post.username}</a>
                        <img src="./assets/images/user.png" alt="user">
                    </div>
                </div>
                <div class='pdescription'>
                    <p>${post.content}</p>
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
                    <div class='d-none comments' id="comments_id-${post.id}">
                        <hr>
                        ${(comments.length > 0 ? comments.map(comment => `<p>${comment.content}</p>`).join('') : "<p class='text-danger'>This post has no comments, be the first to comment</p>")}
                    </div>
                    <form class='add-comment d-none justify-content-between gap-2' id="fid-${post.id}">
                        <input class='form-control' type="text" name='content'>
                        <button class='btn btn-dark'>Send</button>
                    </form>
                </div>
            </div>`
            break;
        default:
            break;
    }
}