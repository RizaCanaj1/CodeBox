let continue_btn = document.querySelector('.startup-wrapper .continue');
let skip_btn = document.querySelector('.startup-wrapper .skip');
let dont_skip_btn = document.querySelector('.startup-wrapper .dont_skip')
let startup_wrapper = document.querySelector('.startup-wrapper')
let selection_checkbox = document.querySelectorAll('.selection input[type="checkbox"]')
let selection_all_posts = document.querySelector('.selection.all_posts')
let hover_message = document.querySelector('.hover_message')
let first_setup = document.querySelector('.first_setup')
let next_setup = document.querySelector('.first_setup .next_setup')
let back_to_beginning = document.querySelector('.first_setup .back_to_beginning')
let back_to_first = document.querySelector('.second_setup .back_to_first')
let log_out = document.querySelector('.startup-wrapper .log_out')
let show_message = false
let selected_checkbox = []
continue_btn.onclick = ()=>{
    startup_wrapper.classList.add('continue_setup')
    setTimeout(()=>{show_message = true},3000)
}
back_to_beginning.onclick = ()=>{
    show_message = false;
    startup_wrapper.classList.add('back_to_start')
    setTimeout(()=>{startup_wrapper.classList.remove('back_to_start');startup_wrapper.classList.remove('continue_setup')},1000)
}
back_to_first.onclick = ()=>{
    startup_wrapper.classList.remove('continue_second_setup')
    setTimeout(()=>{
        first_setup.classList.remove('d-none')
    },1000)
}
skip_btn.onclick=()=>{
    skip_btn.classList.remove('text-danger')
    startup_wrapper.classList.add('skip_setup')
}
dont_skip_btn.onclick =()=>{
    skip_btn.classList.add('text-danger')
    startup_wrapper.classList.remove('skip_setup')
}
next_setup.onclick = ()=>{
    startup_wrapper.classList.add('continue_second_setup')
    setTimeout(()=>{
        first_setup.classList.add('d-none')
    },1000)
}
selection_checkbox.forEach(x=>{
    x.onchange = () =>{
        let miniselection = document.querySelector(`.selection .miniselection[for='${x.id}']`)
        if(miniselection){
            selected_checkbox = selected_checkbox.filter(id => id !== 'all')
            if(x.checked){
                miniselection.classList.add('selected')
                selected_checkbox.push(x.id)
            }
            else {
                selected_checkbox = selected_checkbox.filter(id => id !== x.id)
                miniselection.classList.remove('selected')
            }
            selection_all_posts.classList.remove('selected')
            const allChecked = [...selection_checkbox].every(checkbox => checkbox.checked);
            if (allChecked) {
                selected_checkbox = ['all']
                selection_all_posts.classList.add('selected')
                selection_checkbox.forEach(checkbox => checkbox.checked = false);
                document.querySelectorAll('.selection .miniselection').forEach(miniselection => miniselection.classList.remove('selected'));
            }
            check_continue (selected_checkbox)
        }
    }
});
selection_all_posts.onclick = ()=>{
    selection_checkbox.forEach(x=>{x.checked = false;document.querySelector(`.selection .miniselection[for='${x.id}']`).classList.remove('selected')})
    if (selection_all_posts.className.includes('selected')) {selection_all_posts.classList.remove('selected');selected_checkbox = []}
    else {selection_all_posts.classList.add('selected');selected_checkbox = ['all']}
    check_continue (selected_checkbox)
}
function check_continue (check_array){
    console.log(check_array)
    if(check_array.length>0) next_setup.classList.remove('d-none')
    else next_setup.classList.add('d-none')
}
window.addEventListener('mousemove', trackMouse);
function trackMouse(event) {
    if(show_message){
        const closestMiniselection = event.target.closest('.miniselection');
        const onMessage = event.target.closest('.hover_message');
        const onSelection = event.target.closest('.selection.interested_on');
        if (closestMiniselection) {
            const miniselections =  document.querySelector(".selection .miniselections")
            const selection = miniselections.parentElement
            handle_message_text(hover_message,closestMiniselection.textContent)
            const offsetY = miniselections.offsetHeight-1;
            hover_message.style.top = `${miniselections.getBoundingClientRect().top+offsetY}px`;
            hover_message.style.left = `${miniselections.getBoundingClientRect().left}px`;
            hover_message.style.width = `${selection.offsetWidth-20}px`
            hover_message.classList.add('show_message')
            console.log('Mouse is hovering over:', closestMiniselection.textContent);
        } 
        else if(!onMessage && !onSelection){
            hover_message.classList.remove('show_message')
            console.log('Mouse is not hovering over any .miniselection');
        }
    }
}
function handle_message_text (message,content) {
    switch (content) {
        case 'Invitations':
            message.innerHTML='Extend invitations to collaborate on other projects or invite others to join your projects.'
            break;
        case 'Showcase':
            message.innerHTML='Share your projects, samples, and templates, or simply browse through them.'
            break;
        case 'Questions':
            message.innerHTML="Don't hesitate to ask any questions. There are people here who can assist you!"
            break;
        case 'Community':
            message.innerHTML='Explore community posts about programming, as they often present diverse perspectives and topics for discussion.'
            break;
        default:
            message.innerHTML=content
            break;
    }
}
log_out.onclick = ()=>{
    let csrf = document.querySelector('meta[name="csrf-token"]').content
    fetch('/logout', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': csrf,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (response.ok) {
            window.location.href = '/';
        } else {
            console.error('Logout failed');
        }
    })
    .catch(error => {
        console.error('Logout failed:', error);
    });
}