let comments = []
let comments_text = []
function startCommentFetch(postId){
    postUpdateInterval = setInterval(() => {
        fetchComments(postId)
    }, 3000)
}
function fetchComments(postId) {
    comments = document.querySelectorAll(`#comments_id-${postId} .comment`)
    comments_text = []
    comments.forEach(c => {
        comments_text.push(c.innerHTML)
    });
    let comment = document.querySelector(`div#comments_id-${postId}`)
    fetch(`get-comments/${postId}`)
    .then(response => response.json())
    .then(data => {
        data.forEach((c,index) => {
            if(!comments_text.includes(formComment(c.content))){
                if(index>1){
                    if(data[index-1].user_id==c.user_id){
                        const preComment = Array.from(comment.querySelectorAll('.comment')).at(-1)
                        preComment.outerHTML+=`<pre class='comment' id='c-${c.id}' onclick='handle_comment_edit(event)'>${formComment(c.content)}</pre>`
                    }
                    else{
                        comment.innerHTML+=`
                        <div class='comment-wrapper d-flex justify-content-between'>
                            <div class='w-75'>
                                <pre class='comment' id='c-${c.id}' onclick='handle_comment_edit(event)>${formComment(c.content)}</pre>
                                <div class='d-flex gap-2 align-items-center ms-5'>
                                    <p>20h</p><p class='btn like'>Like</p><p class='btn reply'>Reply</p><p class='btn share'>Share</p><p class='btn report'>Report</p>
                                </div>
                            </div>
                            <div class='d-flex gap-2 image-name'>
                                <img class='user-image' src="${c.user_detail.profile ? `./storage/${c.user_detail.profile}` : './assets/images/user.png'}" alt="user">
                                <a href='/profile?id=${c.user_id}' class='username'>${c.user_detail.username}</a>
                            </div>
                        </div>`
                    }
                }
                else{
                    comment.innerHTML+=`
                    <div class='comment-wrapper d-flex justify-content-between'>
                        <div class='w-75'>
                            <pre class='comment' id='c-${c.id}' onclick='handle_comment_edit(event)>${formComment(c.content)}</pre>
                            <div class='d-flex gap-2 align-items-center ms-5'>
                                <p>20h</p><p class='btn like'>Like</p><p class='btn reply'>Reply</p><p class='btn share'>Share</p><p class='btn report'>Report</p>
                            </div>
                        </div>
                        <div class='d-flex gap-2 image-name'>
                            <img class='user-image' src="${c.user_detail.profile ? `./storage/${c.user_detail.profile}` : './assets/images/user.png'}" alt="user">
                            <a href='/profile?id=${c.user_id}' class='username'>${c.user_detail.username}</a>
                        </div>
                    </div>`
                }
            }
        })
        document.querySelector(`.counter-${postId}`).innerHTML = comments.length;
    })
    .catch(error => {
        console.log('Error fetching comments:', error);
    });
}

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
function comment_m(comments){
    let comments_group = []
    let model = comments.length > 0 ? comments.map((c, index) => {
        let formed_comment = formComment(c.content);
        const commentContent = `<pre class='comment' id='c-${c.id}' onclick='handle_comment_edit(event)'>${formed_comment}</pre>`;
        comments_group.push(commentContent);
        const userDetails = `
            <div class='d-flex gap-2 image-name'>
                <img class='user-image' src="${c.user_detail.profile ? `./storage/${c.user_detail.profile}` : './assets/images/user.png'}" alt="user">
                <a href='/profile?id=${c.user_id}' class='username'>${c.user_detail.username}</a>
            </div>`;
        if (index > 0 && comments[index - 1].user_id != c.user_id) {
            comments_group=[commentContent]
        }
        if (index < comments.length - 1 && comments[index + 1].user_id == c.user_id) {
            return '';
        }
        const commentWrapper = `
            <div class='comment-wrapper d-flex justify-content-between'>
                <div class='w-75'>
                    ${comments_group.join('')}
                    <div class='d-flex gap-2 align-items-center ms-5'>
                        <p>20h</p>
                        ${c.user_id == my_id ? ("<p class='btn edit' onclick='toggle_edit(event)'>Edit</p>"):("<p class='btn like'>Like</p>")}
                        <p class='btn reply'>Reply</p>
                        <p class='btn share'>Share</p>
                        <p class='btn report'>Report</p>
                    </div>
                </div>
                ${userDetails}
            </div>`;
        comments_group = [];
        
        return commentWrapper;
    }).join('')
    : "<p class='text-danger'>This post has no comments, be the first to comment</p>";
    return model;
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
function toggle_edit(e){
    const comment_parent = e.srcElement.parentElement.parentElement
    remove_comment_edit(comment_parent)
    comment_parent.classList.toggle('editing')
}
function remove_comment_edit (comment_parent){
    const other_edits = comment_parent.querySelectorAll('.edit_comment')
        if(other_edits.length>0) {
            console.log(other_edits)
            other_edits.forEach(x=>x.remove())
            comment_parent.querySelector('.comment.d-none').classList.remove('d-none')
        }
}
function handle_comment_edit(e){
    const comment = e.srcElement 
    const comment_parent = comment.parentElement
    if(comment_parent.className.includes('editing')){
        remove_comment_edit (comment_parent)
        comment.classList.add('d-none')
        const content = comment.textContent || comment.innerText;
        const input =`<div class='edit_comment d-flex flex-column gap-2'><input type='text' class='${comment.id}' id='content' name='content' onkeyup='edit_comment(event)' value='${content}'/><div class='d-flex gap-2 ms-2'><button class='btn btn-success' onclick='handle_save_comment(event)'>Save</button><button class='btn btn-danger'>Delete</button></div></div>`
        comment.outerHTML+=input
    }
}
function handle_save_comment(event){
    const input = event.srcElement.parentElement.parentElement.firstChild
    const comment_parent = event.srcElement.parentElement.parentElement.parentElement
    const selected_comment = comment_parent.querySelector('.comment.d-none')

    if(!comments_text.includes(input.value)){
        remove_comment_edit(comment_parent)
        console.log(selected_comment.id)
        selected_comment.innerHTML =  formComment(input.value)
        let csrf = document.querySelector('meta[name="csrf-token"]').content
        let form = { content: input.value, comment_id: selected_comment.id.split('-')[1] };
        console.log(JSON.stringify(form));
        fetch(`../edit-comment`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrf,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(form)
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error(error))
        
    }
    else{
        input.value=''
        input.placeholder = 'This comment exists!'
    }
    
}
function edit_comment (e){
    let input_value = e.target.value
    if(input_value == ''){
        e.target.parentElement.querySelector('.btn-success').classList.add('d-none')
    }
    else{
        e.target.parentElement.querySelector('.btn-success').classList.remove('d-none')
    }
}