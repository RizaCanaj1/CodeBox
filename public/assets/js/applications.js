let applications = document.querySelector('.applications')
let applicant = document.querySelector('.applicant')
let back_to_applicants = document.querySelector('.back_to_applicants')
console.log(applicant)
function openApplications(){
    applications.classList.remove('d-none')
}
function closeApplications(){
    applications.classList.add('hide-animation')
    applications.classList.add('hide-applications')
    setTimeout(()=>{
        applications.classList.add('d-none')
        applications.classList.remove('hide-applications')
        applications.classList.remove('hide-animation')
    },300)
}
let user_application_buttons = document.querySelectorAll('a[class^="show-user"]')
console.log(user_application_buttons)
user_application_buttons.forEach(button=>{
    button.addEventListener('click',()=>{
        let user_id = parseInt(button.getAttribute('class').split(' ')[0].split('-')[2]);
        fetch(`../get-user/${user_id}`)
        .then(response => response.json())
        .then(user=>{
            document.querySelector('.user-name').innerHTML=`${user.name}`
        })
        
        applications.classList.add('hide-animation')
        setTimeout(function() {
            applicant.classList.add('d-none')
            applications.classList.add('d-none-applications')
            applications.classList.remove('hide-animation')
        }, 300)
    })
})
back_to_applicants.addEventListener('click',()=>{
    applicant.classList.add('hide-animation')
    setTimeout(function() {
        applicant.classList.remove('hide-animation')
        applications.classList.remove('d-none-applications')
        applicant.classList.add('d-none')
    }, 300)
})

/*
<button class='back_to_applicants'><i class="fa-solid fa-arrow-rotate-left fa-l p-2 rounded-circle"></i></button>
                            <img class='user-img rounded-circle' src="../assets/images/user.png" alt="user">
                            <div class='bg-dark text-white ms-4 p-2 rounded-3 w-75'>
                                <h4 class="text-center mb-3">Ylber Veliu</h4>
                                <div class="d-flex justify-content-around align-items-center">
                                    <div>
                                        <h6>Projects:  <a href="" class='text-danger'>26</a></h6>
                                        <h6>Rating:  <a href="" class='text-danger'>95%</a></h6>
                                        <h6>Score:  65140</h6>
                                    </div>
                                    <div>
                                        <button class="btn btn-primary">Message</button>
                                    </div>
                                </div>
                                <div class='mt-2 d-flex justify-content-center gap-4'>
                                    <button class='btn btn-success'><i class="fa-solid fa-check"></i>Aprove</button>
                                    <button class='btn btn-danger'><i class="fa-solid fa-xmark"></i>Refuse</button> 
                                </div>
                            </div>
*/