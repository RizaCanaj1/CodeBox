let rotated = false;
const add_post = document.querySelector('.add-post');
const posts = document.querySelectorAll('.post');
const caret = document.getElementById('caret');
console.log(caret)
const add_code = document.querySelector('.add-code');
const add_media = document.querySelector('.add-media');
const type_of_post = document.querySelector('.type_of_post');
const description = document.querySelector('.description');
const view_more = document.querySelectorAll('a[class^="pid-"]');
const comments_btn = document.querySelectorAll('.fa-comment');
const add_comment = document.querySelectorAll('.add-comment');
const my_story = document.querySelector('.m-story');
const popup = document.querySelector('.pop_up');
const notification_span = document.querySelector('.notifications_btn');
const notifications = document.querySelector('.notifications');
const notification = document.querySelectorAll('.notification');
let postUpdateInterval = null;

let comments = [];

caret.addEventListener('click', () => {
    if (rotated) {
        caret.classList.remove('rotate');
        add_post.classList.remove('opened');
        type_of_post.classList.add('d-none');
        description.classList.add('d-none');
    } else {
        caret.classList.add('rotate');
        add_post.classList.add('opened');
        type_of_post.classList.remove('d-none');
        description.classList.remove('d-none');
    }
    rotated = !rotated;
});
type_of_post.addEventListener('change',e=>{
    if(e.target.value){
        switch(e.target.value){
            case 'showcase':
                add_code.classList.remove('d-none');
                add_media.classList.add('d-none');
                break;
            case 'community':
                add_media.classList.remove('d-none');
                add_code.classList.add('d-none');
                break;
            default:
                add_code.classList.add('d-none');
                add_media.classList.add('d-none');
                break;
        }

    }
});
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
        my_story.classList.remove('open-story');
        removePostFocus();
    }
});
function removePostFocus() {
    const focusedPosts = document.querySelectorAll('.post-focus');
    focusedPosts.forEach(post => {
        post.classList.remove('post-focus');
    });
}
document.querySelector('#media').addEventListener('change',e=>{
    get_medi_name = e.target.value.split('\\')
    console.log(get_medi_name[get_medi_name.length-1])
})
window.addEventListener('scroll',()=>{

    if(window.scrollY>0){
        document.querySelector('.profile-chat').classList.toggle("sticky",window.scrollY>50)
    }
})
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
my_story.addEventListener('click',e=>{
    my_story.classList.add('open-story');
})
if (popup) {
    setTimeout(function() {
        popup.classList.add('remove_popup');
    }, 3000);
    setTimeout(function() {
        popup.classList.add('d-none');
    }, 3800);
}
notification_span.addEventListener('click',()=>{
    console.log(notifications.className.split(' '))
    if(notifications.className.split(' ')[1] =='d-none')
    notifications.classList.remove('d-none')
    else
    notifications.classList.add('d-none')
})

notifications.addEventListener('animationend', function() {
    console.log(notifications.scrollHeight)
    
    console.log('Transition has ended');
    if (notifications.scrollHeight > 350) {
        notifications.style.overflowY = 'scroll';
    } else {
        notifications.style.overflowY = 'hidden';
    }
    
});
notification.forEach(n =>{
    n.querySelector('h6').addEventListener('click',e=>{
        let type_of = e.target.className.split(' ')[2]
        n.classList.remove('delivered')
        let n_id = e.target.className.split(' ')[0].split('-')[1]
        fetch(`read_notification/${n_id}`, {
            method: 'GET'
        })
        switch(type_of.toLowerCase() ){
            case 'status':
                window.location.href = '../group/'+e.target.id.split('-')[1]
            break;
            case 'comment':
                window.location.href = '#'+e.target.id.split('-')[1]
                document.querySelectorAll('.selected-post').forEach(e=>e.classList.remove('selected-post'))
                document.getElementById(`${e.target.id.split('-')[1]}`).classList.add('selected-post')
            break;
            case 'applicant':
                window.location.href = '../applications/'+e.target.id.split('-')[1]
            break;
            default:
            break;
        }
    })
})
if(window.location.href.split('#')[1]!= ''){
    document.getElementById(`${window.location.href.split('#')[1]}`).classList.add('selected-post')
}