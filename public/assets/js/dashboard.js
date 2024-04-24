let rotated = false;
const add_post = document.querySelector('.add-post');

const caret = document.getElementById('caret');
const add_code = document.querySelector('.add-code');
const add_media = document.querySelector('.add-media');
const type_of_post = document.querySelector('.type_of_post');
const description = document.querySelector('.description');



const my_story = document.querySelector('.m-story');
const popup = document.querySelector('.pop_up');
const notification_span = document.querySelector('.notifications_btn');
const notifications = document.querySelector('.notifications');
const notification = document.querySelectorAll('.notification');



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





window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        my_story.classList.remove('open-story');
        removePostFocus();
    }
});

document.querySelector('#media').addEventListener('change',e=>{
    get_medi_name = e.target.value.split('\\')
    console.log(get_medi_name[get_medi_name.length-1])
})
window.addEventListener('scroll',()=>{
    if(window.scrollY>0){
        document.querySelector('.profile-chat').classList.toggle("sticky",window.scrollY>50)
    }
})

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
        .then(
            fetch(`get_notifications`)
            .then(response=>response.json())
            .then(data=>{ 
                if(parseInt(notification_span.innerHTML)!=data.delivered){
                   
                    notification_span.classList.add('updating')
                    setTimeout(()=>{notification_span.classList.remove('updating'); notification_span.innerHTML = data.delivered},300)
                }
            })
        )
        
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
setTimeout(()=>{
    if(window.location.href.split('#')[1]!= undefined){
        window.location.href = '#'+window.location.href.split('#')[1]
        document.getElementById(`${window.location.href.split('#')[1]}`).classList.add('selected-post')
    }
},1000)
