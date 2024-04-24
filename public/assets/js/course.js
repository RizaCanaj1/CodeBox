let path = window.location.pathname.slice(1)[0].toUpperCase() +window.location.pathname.slice(2)
let actived = document.querySelector(`a[data-type="${path}"]`)
let teachers = document.querySelector('.teachers')
let add_teacher_button = document.querySelector('.add_teacher_button')
let add_teacher_btn = add_teacher_button.querySelector('.btn-add-t')
let adding_teacher=false
let add_course_button = document.querySelector('.add_course_button')
let add_course_btn = add_teacher_button.querySelector('.btn-add-c')
let adding_course=false
let twrapper = document.querySelector('.twrapper')
let more_teacher_btn = ''
let maxTeachersShown = 3
actived.classList.add('active')
actived.addEventListener('click', e=>{
    e.preventDefault();
});
fetch(`get_role`)
.then(response=>response.json())
.then(role=>{
    if(role =='admin'){
        add_teacher_button.classList.remove('d-none')
        console.log(add_course_button)
        add_course_button.classList.remove('d-none')
        window.addEventListener('click',e=>{
            add_course_btn = e.target.closest('.btn-add-c')
            add_course_button = document.querySelector('.add_course_button')
            add_teacher_btn = e.target.closest('.btn-add-t')
            add_teacher_button = document.querySelector('.add_teacher_button')
            if(add_course_btn) add_course_btn.onclick = ()=>{
                document.querySelector('.form_add_course').classList.remove('d-none')
                adding_course = true
                add_course_button.classList.remove('shifting')
                add_course_button.classList.add('d-none')
                close_teacher_form()
            }
            if(add_teacher_btn) add_teacher_btn.onclick =()=>{
                document.querySelector('.form_add_teacher').classList.remove('d-none')
                adding_teacher = true
                add_teacher_button.classList.remove('shifting')
                add_teacher_button.classList.add('d-none')
                close_course_form()
                
            }
           
        })
    }
})
let close_teacher_form = ()=>{
    if(adding_teacher) add_teacher_button.classList.add('shifting')
    setTimeout(()=>{add_teacher_button.classList.remove('d-none'); add_teacher_button.classList.remove('shifting')},300)
    document.querySelector('.form_add_teacher').classList.add('d-none')
    adding_teacher = false
}
let close_course_form = ()=>{
    if(adding_course) add_course_button.classList.add('shifting')
    setTimeout(()=>{add_course_button.classList.remove('d-none'); add_course_button.classList.remove('shifting')},300)
    document.querySelector('.form_add_course').classList.add('d-none')
    adding_course = false
}
window.addEventListener('keyup',e=>{
    if(e.key=='Escape' && (adding_teacher||adding_course)){
        close_teacher_form()
        close_course_form()
    }
})
let theight = 320
fetch(`get_teachers`)
.then(response=>response.json())
.then(t=>{
    function handleHoverEffect() {
        twrapper.querySelectorAll('.teacher').forEach((x) => {
            x.addEventListener('mouseenter', () => {
                theight += 120;
                twrapper.querySelector('.teachers').style.height = theight + 'px';
            });
            x.addEventListener('mouseleave', () => {
                theight -= 120;
                twrapper.querySelector('.teachers').style.height = theight + 'px';
                document.querySelectorAll('.teachers .btext:has(span.dots)').forEach(element=>{
                    if(element.parentElement.parentElement == x && element.parentElement.parentElement.classList.contains('expanded')){
                        theight -= 120;
                        twrapper.querySelector('.teachers').style.height = theight + 'px';
                        const bioId = element.getAttribute('id');
                        element.innerHTML = element.innerHTML .substring(0, 50) + '<span class="dots">...More</span>';
                        document.querySelector(`.teacher#t-${bioId}`).classList.remove('expanded');
                    }    
                });
                
            });
        });
    }
    if(t.length>0){
        let tposition = 0
        t.forEach(teacher => {
            tposition++
            teachers.setAttribute('data-quantity',t.length)
            teachers.innerHTML+=`
            <div class='teacher mt-3 p-4 ${(tposition == 1)?('left'):((tposition == 2)?('middle'):('right'))}' id='t-${teacher.id}'>
                <div class='d-flex flex-column align-items-center gap-3'>
                    <img src="./assets/images/user.png" alt="user">
                    <h4><a href="${(teacher.user_id)?(`./profile?id=${teacher.user_id}`):('')}">${teacher.name}</a></h4>
                </div>
                ${(teacher.bio)?(`<div class='bio'><h4>Bio:</h4><p class='btext' id="${teacher.id}">${(teacher.bio.split('').length<=50)?(teacher.bio):(teacher.bio.substring(0, 50) + `<span class="dots" >...More</span>`)}</p></div>`):('')}
                
                <div class='to_courses flex-column align-items-center'><buton class='btn btn-outline-secondary courses_btn'> Courses </buton></div>
            </div>`
            if(tposition == 3) tposition = 0
            if (document.querySelector('.dots')) {
                document.addEventListener('click', function (event) {
                    if (event.target.classList.contains('dots')) {
                        const bioElement = event.target.parentElement;
                        if(bioElement){
                            const bioId = bioElement.getAttribute('id');
                            if (!event.target.closest('.teacher').classList.contains('expanded')) {
                                bioElement.innerHTML = teacher.bio + '<span class="dots">...Less</span>';
                                document.querySelector(`.teacher#t-${bioId}`).classList.add('expanded');
                            } else {
                                theight -= 240;
                                twrapper.querySelector('.teachers').style.height = theight + 'px';
                                bioElement.innerHTML = teacher.bio.substring(0, 50) + '<span class="dots">...More</span>';
                                document.querySelector(`.teacher#t-${bioId}`).classList.remove('expanded');
                            }
                        }
                        
                    }
                });
            }
            document.querySelector('.add_course #teacher').innerHTML+=`<option value="${teacher.id}" data-name="${teacher.name}">ID:${teacher.id} Name:${teacher.name}</option>`
        });
        if (t.length > maxTeachersShown) {
            twrapper.innerHTML+=`<div class='mt-4 more_teachers d-flex justify-content-center align-items-center'><buton class='btn btn-outline-secondary btn-more-teachers'> More </buton></div>`
        
            more_teacher_btn = twrapper.querySelector('.btn-more-teachers');
            more_teacher_btn.onclick = () => {
                if (t.length > maxTeachersShown) {
                    maxTeachersShown += 3;
                    if(t.length > maxTeachersShown-3 ){
                        more_teacher_btn.classList.add('less');
                        more_teacher_btn.innerHTML = 'Less';
                    }
                    theight += 320;
                }
                else {
                    more_teacher_btn.classList.remove('less');
                    more_teacher_btn.innerHTML = 'More';
                    theight -= 320;
                    maxTeachersShown -= 3;
                }
                twrapper.querySelector('.teachers').style.height = theight + 'px';
            };
        }
        handleHoverEffect();
    }
    else{
        teachers.innerHTML+=`<p class='text-danger'>No teachers added yet<p>`
    }
    
})

fetch(`get-not-teachers`)
.then(response=>response.json())
.then(users=>users.forEach(user => {
    console.log(users)
    document.querySelector('.add_teacher #user').innerHTML+=`<option value="${user.id}" data-name="${user.name}">ID:${user.id} Name:${user.name}</option>`
}))
document.querySelector('.add_teacher #user').addEventListener('change',e=>{
    if(e.target.value=='' || e.target.value=='none') {
        document.querySelector('.add_teacher #id').value = null
    }
    else {
        update_t_info()
        document.querySelector('.add_teacher #id').value = e.target.value
    }
    document.querySelectorAll('.add_teacher #user option').forEach(option => {
        option.style.display = '';
    });
})
document.querySelector('.add_teacher #id').addEventListener('change',e=>{
    document.querySelector('.add_teacher #user').value = e.target.value
    if(document.querySelector('.add_teacher #user').value =='' || document.querySelector('.add_teacher #user').value =='none'){
        document.querySelector('.add_teacher #user').value ='none'
        document.querySelector('.add_teacher #name').value = ''
        document.querySelectorAll('.add_teacher #user option').forEach(option => {
            option.style.display = '';
        });
    }
    
    else update_t_info()
})
document.querySelector('.add_teacher #name').addEventListener('change', e => {
    document.querySelector('.add_teacher #id').value=''
    const selectedName = e.target.value.toLowerCase();
    const options = [...document.querySelector('.add_teacher #user').options];
    options.forEach(option => {
        const optionValue = option.getAttribute('data-name').toLowerCase(); // Convert to lowercase for case-insensitive comparison
        if (!optionValue.includes(selectedName)) {
            option.style.display = 'none'; // Hide options that don't include the selected name
        } else {
            option.style.display = ''; // Show options that include the selected name
        }
    });
});
function update_t_info(){
    document.querySelector('.add_teacher #name').value = document.querySelector('.add_teacher #user').options[document.querySelector('.add_teacher #user').selectedIndex].getAttribute('data-name')
}
//
document.querySelector('.add_course #teacher').addEventListener('change',e=>{
    if(e.target.value=='' || e.target.value=='none') {
        document.querySelector('.add_course #id').value = null
    }
    else {
        document.querySelector('.add_course #id').value = e.target.value
    }
    document.querySelectorAll('.add_course #teacher option').forEach(option => {
        option.style.display = '';
    });
})
document.querySelector('.add_course #id').addEventListener('change',e=>{
    document.querySelector('.add_course #teacher').value = e.target.value
    if(document.querySelector('.add_course #teacher').value =='' || document.querySelector('.add_course #teacher').value =='none'){
        document.querySelector('.add_course #teacher').value ='none'
        document.querySelector('.add_course #name').value = ''
        document.querySelectorAll('.add_course #teacher option').forEach(option => {
            option.style.display = '';
        });
    }
})
document.querySelector('.add_course #name').addEventListener('change', e => {
    document.querySelector('.add_course #id').value=''
    const selectedName = e.target.value.toLowerCase();
    const options = [...document.querySelector('.add_course #teacher').options];
    options.forEach(option => {
        const optionValue = option.getAttribute('data-name').toLowerCase(); 
        if (!optionValue.includes(selectedName)) {
            option.style.display = 'none'; 
        } else {
            option.style.display = '';
        }
    });
});


document.querySelector('.CodeBox').addEventListener('click',()=>{
    window.location.href='dashboard'
})