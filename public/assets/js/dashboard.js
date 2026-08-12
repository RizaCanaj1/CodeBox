let rotated = false;
const add_post = document.querySelector('.add-post');

const caret = document.getElementById('caret');
const add_code = document.querySelector('.add-code');
const add_media = document.querySelector('.add-media');
const type_of_post = document.querySelector('.type_of_post');
const add_post_form = document.querySelector('.add_post_form')
const invitation_fields = document.querySelector('.composer-invitation-fields');



// Filter sidebar used to link to /invitation, /showcase, etc. — routes
// that are commented out in web.php and 404. Filters the already-loaded
// feed client-side by type instead (click again to clear).
const dashboardFilter = document.getElementById('dashboardFilter');
if (dashboardFilter) {
    let activeFilterType = null;
    dashboardFilter.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const type = link.dataset.type;
            activeFilterType = activeFilterType === type ? null : type;
            dashboardFilter.querySelectorAll('a').forEach(l => l.classList.toggle('active', l.dataset.type === activeFilterType));
            document.querySelectorAll('.posts .post').forEach(post => {
                post.classList.toggle('filtered-out', activeFilterType !== null && !post.classList.contains('p' + activeFilterType));
            });
        });
    });
}

const popup = document.querySelector('.pop_up');
const notification_span = document.querySelector('.notifications_btn');
const notifications = document.querySelector('.notifications');
const notification = document.querySelectorAll('.notification');



caret.addEventListener('click', () => {
    if (rotated) {
        caret.classList.remove('rotate');
        add_post.classList.remove('opened');
        add_post_form.classList.add('d-none');
    } else {
        caret.classList.add('rotate');
        add_post.classList.add('opened');
        add_post_form.classList.remove('d-none');
    }
    rotated = !rotated;
});
type_of_post.addEventListener('change',e=>{
    if(e.target.value){
        switch(e.target.value){
            case 'showcase':
                add_code.classList.remove('d-none');
                add_media.classList.add('d-none');
                invitation_fields.classList.add('d-none');
                break;
            case 'community':
                add_media.classList.remove('d-none');
                add_code.classList.add('d-none');
                invitation_fields.classList.add('d-none');
                break;
            case 'invitation':
                add_code.classList.add('d-none');
                add_media.classList.add('d-none');
                invitation_fields.classList.remove('d-none');
                break;
            default:
                add_code.classList.add('d-none');
                add_media.classList.add('d-none');
                invitation_fields.classList.add('d-none');
                break;
        }

    }
});
window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        removePostFocus();
    }
});
document.querySelector('#media').addEventListener('change',e=>{
    get_medi_name = e.target.value.split('\\')
    console.log(get_medi_name[get_medi_name.length-1])
})
// .profile-chat used to need this to fake being sticky via a JS scroll
// listener toggling a class; the redesigned sidebar uses real CSS
// `position: sticky` now, so there's nothing left for this to do.

if (popup) {
    setTimeout(function() {
        popup.classList.add('remove_popup');
    }, 3000);
    setTimeout(function() {
        popup.classList.add('d-none');
    }, 3800);
}
notification_span.addEventListener('click',()=>{
    if(notifications.className.split(' ')[1] =='d-none')
    notifications.classList.remove('d-none')
    else
    notifications.classList.add('d-none')
})
// Used to toggle overflow-y via a `notifications.scrollHeight > 350` check
// on 'animationend' (from a CSS keyframe that no longer exists in the
// redesign) — the notifications panel just scrolls past a fixed
// max-height in CSS now (see .notifications in dashboard.css).

notification.forEach(n =>{
    n.querySelector('h6').addEventListener('click',e=>{
        let type_of = e.target.className.split(' ')[1]
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
            case 'friend_request':
                window.location.href = '../friends'
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
