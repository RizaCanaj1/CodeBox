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
let uploaded_profile = document.querySelector('.startup-wrapper .second_setup #profile_photo_path')
let profile_image = document.querySelector('.second_setup .profile-image img')
let profile_hover = document.querySelector('.second_setup .profile_hover')
let remove_image = document.querySelector('.second_setup .remove_image')
let bio = document.querySelector('.second_setup #bio')
let hiddenBio = document.querySelector('.second_setup .hidden_textarea');
let bio_length = document.querySelector('.second_setup .bio_length')
let finish_setup = document.querySelector('.second_setup .finish_setup')
let add_social = document.querySelector('.second_setup .add_social')
let forbidden_words = []
let cv = document.querySelector('.second_setup #cv')
let show_cv = document.querySelector('.second_setup .show_cv')
let view_cv = show_cv.querySelector('.view_cv')
let focus_cv = document.querySelector('.focus_cv')
let close_focus = focus_cv.querySelector('.close_focus')
let remove_cv = [focus_cv.querySelector('.remove_cv'),show_cv.querySelector('.remove_cv')]
let added_social = document.querySelector('.second_setup .added_social')
let errors_element = document.querySelector('.errors')
let show_message = false
let selected_checkbox = []
let lang = 'eng'
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
        } 
        else if(!onMessage && !onSelection){
            hover_message.classList.remove('show_message')
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
remove_image.onclick = ()=>{
    const delay = 500
    profile_image.classList.add('update_image')
    profile_hover.classList.add('updating')
    uploaded_profile.value = ''
    remove_image.classList.add('d-none')
    setTimeout(()=>{profile_image.src = '../assets/images/user.png'},delay)
    setTimeout(()=>{profile_image.classList.remove('update_image')},delay*2)
    setTimeout(()=>{profile_hover.classList.remove('updating')},delay*3)
}
uploaded_profile.onchange = ()=>{
    const p_image = uploaded_profile.files[0];
    const maxSizeMB = 2;
    const delay = 500
    remove_image.classList.add('d-none')
    if(p_image){
        if (p_image.size > maxSizeMB * 1024 * 1024) {
            alert('File size exceeds the maximum limit of ' + maxSizeMB + 'MB');
            uploaded_profile.value = ''; 
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            profile_image.classList.add('update_image')
            profile_hover.classList.add('updating')
            setTimeout(()=>{profile_image.src = event.target.result},delay)
            setTimeout(()=>{profile_image.classList.remove('update_image')},delay*2)
            setTimeout(()=>{profile_hover.classList.remove('updating');remove_image.classList.remove('d-none')},delay*3)
        };
        reader.readAsDataURL(p_image);
    }
}
bio.addEventListener('input', (e) => {
    check_abuse(bio)
    let length = bio_length.querySelector('.length')
    let bioContentWithBr = bio.value.replace(/\n/g, '<br>');
    hiddenBio.innerHTML = bioContentWithBr;
    let lastLetter = hiddenBio.innerHTML[hiddenBio.innerHTML.length - 1];
    hiddenBio.querySelectorAll('.last_letter').forEach(span => span.outerHTML = span.innerHTML);
    hiddenBio.innerHTML = `${hiddenBio.innerHTML.slice(0, -1)}<span class='last_letter'>${lastLetter}</span>`
    let elementPosition = bio_length.getBoundingClientRect();
    let lastLetterPosition = hiddenBio.querySelector('.last_letter')
    if(lastLetterPosition.getBoundingClientRect().x >= elementPosition.x-5 && lastLetterPosition.getBoundingClientRect().y >= elementPosition.y)
    bio_length.classList.add('move_down')
    if(lastLetterPosition.getBoundingClientRect().y < elementPosition.y-30)
    bio_length.classList.remove('move_down')
    hiddenBio.scrollTop = bio.scrollTop;
    bio.addEventListener('scroll', function() {
        hiddenBio.scrollTop = bio.scrollTop;
    });
    let max_length = bio_length.querySelector('.max-length')
    let max = parseInt(max_length.innerHTML);
    if (bio.value.length > max && e.key != 'Backspace') {
        bio.value = bio.value.substring(0, bio.value.length - 1);
    } else {
        length.innerHTML = bio.value.length;
    }
     if(bio.value.length >= 200){
        bio_length.classList.add('text-danger')
        bio_length.classList.remove('text-warning')
    }
    else if(bio.value.length >= 150){
        bio_length.classList.add('text-warning')
        bio_length.classList.remove('text-danger')
    }
    else{
        bio_length.classList.remove('text-danger')
        bio_length.classList.remove('text-warning')
    }
});
let social_input = document.querySelector('.second_setup .social_input')
let prefix_input = document.getElementById('prefix')
let contacts_array = []
let social_selection = document.getElementById('social_media')
let linkInput = document.getElementById('social_link');
let added_link = null
let social_links = []
let social_only = ''
social_selection.addEventListener('change', function() {
    social_only = linkInput.value.split('/')[linkInput.value.split('/').length-1]
    console.log(social_only)
    selectedMedia = this.value;
    document.querySelectorAll(`.removable-icons a`).forEach(l => {
        l.classList.remove('active')
    });
    if(!selectedMedia==''){
        social_input.classList.remove('d-none')
        if(social_only.length>0){
            add_social.classList.remove('d-none')
        }
    }
    else{
        social_input.classList.add('d-none')
        add_social.classList.add('d-none')
    }
    if (selectedMedia === 'Instagram') {
        added_link = 'https://www.instagram.com/';
        linkInput.style.width='190px'
    } else if (selectedMedia === 'Facebook') {
        added_link = 'https://www.facebook.com/';
        linkInput.style.width='190px'
    } else if (selectedMedia === 'LinkedIn') {
        added_link = 'https://www.linkedin.com/in/';
        linkInput.style.width='190px'
    } else if (selectedMedia === 'YouTube') {
        added_link = 'https://www.youtube.com/channel/';
        linkInput.style.width='250px'
    }
    document.querySelectorAll('.removable-icons .remove-btn').forEach(x=>{x.classList.remove('d-none')})
    prefix_input.value = selectedMedia+'/'
    linkInput.placeholder = ''
    if(contacts_array.includes(selectedMedia)){
        let old_link = document.querySelector(`.removable-icons #${selectedMedia.toLowerCase()}-link`)
        old_link.classList.add('active')
        console.log(old_link)
        if(old_link) {linkInput.value = old_link.href.split('/')[old_link.href.split('/').length-1];document.querySelector(`#${selectedMedia.toLowerCase()}-icon .remove-btn`).classList.add('d-none')}
        else linkInput.value = '';
    }
    else{
        console.log('hey')
    }
});
linkInput.addEventListener('keyup', function(e) {
    social_only = linkInput.value.split('/')[linkInput.value.split('/').length-1]
    add_social.classList.remove('d-none')
    if(linkInput.value==''){
        add_social.classList.add('d-none')
    }
    if(linkInput.value.includes('/')){
        linkInput.value = social_only
    }
});
console.log(add_social)
add_social.onclick = ()=>{
    let update_social_link = ()=>{
        social_links=[]
        contacts_array.forEach(x=>{
            console.log(x)
            social_links.push(added_social.querySelector(`#${x.toLowerCase()}-link`).href)
        })
    }
    social_input.classList.add('d-none')
    add_social.classList.add('d-none')
    added_social.classList.remove('d-none')
    document.querySelectorAll(`.removable-icons a`).forEach(l => {
        l.classList.remove('active')
    });
    if(contacts_array.includes(selectedMedia)){
        console.log(selectedMedia)
        let old_link = document.querySelector(`.removable-icons #${social_selection.value.toLowerCase()}-link`)
        if(old_link) {old_link.href = linkInput.value}
        document.querySelector(`#${selectedMedia.toLowerCase()}-icon .remove-btn`).classList.remove('d-none')
    }
    else{
        if (social_selection.value == 'Instagram') {
        added_social.innerHTML +=`<span class='removable-icons' id='instagram-icon'><a href="${added_link+social_only}" id='instagram-link'><i class="fa-brands fa-instagram fa-2x instagram-icon"></i></a><span class='remove-btn'></span></span>`
        } else if (selectedMedia == 'Facebook') {
            added_social.innerHTML +=`<span class='removable-icons' id='facebook-icon'><a href="${added_link+social_only}" id='facebook-link'><i class="fa-brands fa-facebook fa-2x facebook-icon"></i></a><span class='remove-btn'></span></span>`
        } else if (selectedMedia == 'LinkedIn') {
            added_social.innerHTML +=`<span class='removable-icons' id='linkedin-icon'><a href="${added_link+social_only}" id='linkedin-link'><i class="fa-brands fa-linkedin fa-2x linkedin-icon"></i></a><span class='remove-btn'></span></span>`
        } else if (selectedMedia == 'YouTube') {
            added_social.innerHTML += `<span class='removable-icons' id='youtube-icon'><a href="${added_link+social_only}" id='youtube-link'><i class="fa-brands fa-youtube fa-2x youtube-icon"></i></a><span class='remove-btn'></span></span>`
        }
    }
    linkInput.value = ''
    console.log(linkInput)
    contacts_array.push(selectedMedia)
    social_selection.value=''
    added_social.querySelectorAll('.removable-icons').forEach(icon =>{
        console.log(icon)
        icon.querySelector('.remove-btn').onclick = ()=>{
            contacts_array = contacts_array.filter(x=>x.toLowerCase()!=icon.id.split('-')[0])
            icon.classList.add('opacity-0')
            setTimeout(()=>{
                icon.remove();
            },1000)
            update_social_link()
        }
        update_social_link()
    })
    
    added_social.querySelectorAll('.removable-icons')
}
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
cv.onchange = () => {
    const cv_file = cv.files[0];
    show_cv.querySelector('.cv_images').innerHTML = '';
    if (cv_file) {
        const type = cv_file.type;
        let pdf_to_img = (pdfDataUri) => {
            let pdfData;
            if (typeof pdfDataUri !== 'undefined') {
                pdfData = Uint8Array.from(atob(pdfDataUri.split(',')[1]), c => c.charCodeAt(0));
                const downloadLink = document.createElement('a');
                const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });
                const pdfUrl = URL.createObjectURL(pdfBlob);
                downloadLink.href = pdfUrl;
                downloadLink.download = 'document.pdf';
                downloadLink.click();
            } else {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    pdfData = new Uint8Array(event.target.result);
                    convertPdfToImages(pdfData);
                };
                reader.readAsArrayBuffer(cv_file);
            }
        };
        
        const convertPdfToImages = async (pdfData) => {
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            const pageCount = pdf.numPages;
            if (pageCount > 3) {
                show_cv.classList.add('d-none');
                focus_cv.classList.add('d-none')
                alert('The PDF document cannot have more than 3 pages.');
                return;
            }
            let allImageData = [];
            for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
                const page = await pdf.getPage(pageNumber);
                const scale = 1.5;
                const viewport = page.getViewport({ scale });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                await page.render(renderContext).promise;
                const imageData = canvas.toDataURL('image/jpeg');
                allImageData.push(imageData);
            }
            allImageData.forEach((imageData, imageIndex) => displayImage(imageData, pageCount, imageIndex));
            if (pageCount > 1) handle_cv_carousel();
        };
        if (type.includes('image')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageData = event.target.result;
                displayImage(imageData,1,0);
            };
            reader.readAsDataURL(cv_file);
        } 
        else if (type.includes('application/pdf')) {
            pdf_to_img ()
        }
        else if (type.includes('')) {

        } 
        else {alert('Unsupported file format.')}
        show_cv.classList.remove('d-none')
    } 
    else {show_cv.classList.add('d-none')}
};
function displayImage(imageData,imageCount,imageIndex) {
        const img = new Image();
        img.src = imageData;
        img.classList.add('cv_image');
        img.alt = 'User-CV';
    if(imageCount==1){
        show_cv.querySelector('.cv_images').classList.remove('cv_carousel')
        show_cv.querySelector('.cv_images').appendChild(img.cloneNode(true));
    }
    else{
        show_cv.querySelector('.cv_images').appendChild(img.cloneNode(true));
    }
}
function handle_cv_carousel (){
    let on_page = 0
    const right_indicator = document.createElement('div');
    right_indicator.textContent = '>';
    right_indicator.classList.add('right_indicator')
    const left_indicator = document.createElement('div');
    left_indicator.classList.add('left_indicator')
    left_indicator.classList.add('opacity-0')
    left_indicator.classList.add('d-none')
    left_indicator.textContent = '<';
    let shown_images = ()=>{
        return show_cv.querySelectorAll('.cv_images img').length
    }
    show_cv.querySelector('.cv_images').classList.add('cv_carousel')
    show_cv.querySelector('.cv_images').appendChild(left_indicator);
    show_cv.querySelector('.cv_images').appendChild(right_indicator);
    let cv_images = show_cv.querySelectorAll('.cv_images img')
    if(cv_images.length>2){
        for(let i=2;i<cv_images.length;i++){
            cv_images[i].classList.add(`image_hidden`)
            cv_images[i].classList.add(`d-none`)
        }
    }
    if (cv_images.length>0){
        cv_images[1].classList.add(`image_right`)
    }
    right_indicator.onclick=()=>{
        left_indicator.classList.remove('d-none')
        setTimeout(()=>{
            left_indicator.classList.remove('opacity-0')
        },100)
        on_page++
        cv_images[on_page].classList.remove(`image_right`)
        cv_images[on_page-1].classList.add(`image_left`)
        if(cv_images.length-1>on_page){
            cv_images[on_page+1].classList.remove(`d-none`)
            cv_images[on_page+1].classList.remove(`image_hidden`)
            cv_images[on_page+1].classList.add(`image_right`)
        }
        if (on_page==cv_images.length-1){
            right_indicator.classList.add('opacity-0')
            setTimeout(()=>{
                right_indicator.classList.add('d-none')
            },300)
        }
        if(on_page>1){
            cv_images[on_page-2].classList.add(`image_hidden`)
            setTimeout(()=>{
                cv_images[on_page-2].classList.add(`d-none`)
            },200)
        }
        const imgLeft = document.querySelector('.cv_carousel img.image_left');
        if (shown_images() === 3 && on_page>=1) {
            imgLeft.style.marginLeft = '-111px';
            imgLeft.style.marginRight = '-58px';
        }else {
            imgLeft.style.marginLeft = '';
            imgLeft.style.marginRight = '';
        }
    }
    left_indicator.onclick=()=>{
        right_indicator.classList.remove('d-none')
        setTimeout(()=>{
            right_indicator.classList.remove('opacity-0')
        },100)
        cv_images[on_page].classList.add(`image_right`)
        cv_images[on_page-1].classList.remove(`image_left`)
        on_page--
        if(on_page-1>=0){
            cv_images[on_page-1].classList.remove(`d-none`)
            cv_images[on_page-1].classList.remove(`image_hidden`)
        }
        if (on_page==0){
            left_indicator.classList.add('opacity-0')
            setTimeout(()=>{
                left_indicator.classList.add('d-none')
            },300)
        }
        if(cv_images.length-on_page>2){
            cv_images[on_page+2].classList.add(`image_hidden`)
            setTimeout(()=>{
                cv_images[on_page+2].classList.add(`d-none`)
            },200)
        }
        const imgLeft = document.querySelector('.cv_carousel img.image_left');

        if (shown_images() === 3 && on_page>=1) {
            imgLeft.style.transitio = 'all 0s';
            imgLeft.style.marginLeft = '-111px';
            imgLeft.style.marginRight = '-58px';
        } else {
            document.querySelector('.cv_carousel img:not(.image_left):not(image_right):not(image_hidden)').style=''
        }
    }
}

view_cv.onclick = ()=>{
    focus_cv.querySelector('.cv_images').innerHTML=''
    let focused_image = show_cv.querySelector('.cv_images img:not(.image_left):not(image_right):not(image_hidden)')
    focus_cv.querySelector('.cv_images').appendChild(focused_image.cloneNode(true));
    focus_cv.classList.remove('d-none')
}
close_focus.onclick = ()=>{
    focus_cv.classList.add('d-none')
}
remove_cv.forEach(btn => { btn.onclick = ()=>{
    cv.value = ''; 
    show_cv.classList.add('d-none')
    focus_cv.classList.add('d-none')
    show_cv.querySelector('img').src = ''
    focus_cv.querySelector('img').src = ''
}});
function check_abuse (text_field){
    const last_line = text_field.value.split('\n')[text_field.value.split('\n').length-1]
    if(text_field.value.length==1 && (text_field.value == ' '||text_field.value == '\n')){
        text_field.value='';
    }
    if(text_field.value.length>1){
        if((text_field.value[text_field.value.length-1]==' ' && text_field.value[text_field.value.length-2]==' ')||(text_field.value[text_field.value.length-1]=='\n' && text_field.value[text_field.value.length-2]=='\n')){
            text_field.value=text_field.value.slice(0, -1)
        }
        if(last_line.length==1 && (last_line == ' '||last_line == '\n')){
            text_field.value=text_field.value.slice(0, -1);
        }
        if (text_field.value.split(' ').length > 1) {
            const penultimateWord = text_field.value.split(' ')[text_field.value.split(' ').length - 2];
            if (forbidden_words.includes(penultimateWord.toLowerCase())) {
                const stars = '*'.repeat(penultimateWord.length);
                text_field.value = text_field.value.slice(0, -penultimateWord.length - 1) + stars + ' ';
            }
        }
        if(text_field.value.split('\n').length>1){
            const penultimateLine = text_field.value.split('\n')[text_field.value.split('\n').length-2]
            if(penultimateLine.length<20){
                text_field.value=text_field.value.slice(0, -1)
            }
        }
    }
}
function check_total_abuse (text_field) {
    let words = text_field.value.split(/\s+/);
    words.forEach((word, index) => {
        if (forbidden_words.includes(word.toLowerCase())) {
            words[index] = '*'.repeat(word.length);
        }
    });
    let modifiedBio = words.join(' ');
    text_field.value = modifiedBio;
    
}
function check_nr_of_abuse(text_field){
    let words = text_field.value.split(/\s+/);
    let wordsWithOnlyStars = words.filter(word => /^[\*]{2,}$/.test(word));
    return wordsWithOnlyStars.length;
}
fetch('assets/others/rules.json')
.then(response => response.json())
.then(data => {
    forbidden_words = data.banned_words;
})

finish_setup.onclick = () => {
    finish_setup.classList.add('d-none')
    let errors = []
    check_total_abuse(bio)
    let abussive_words = check_nr_of_abuse(bio)
    if(abussive_words>1){
        errors.push({'Warning':'Your text contains too many abusive words. Please be mindful of the language you use.'})
    }
    if (errors.length == 0) {
        
        console.log('Lang', lang);
        if (selected_checkbox.length == 0) selected_checkbox = ['all'];
        console.log(selected_checkbox);
        if (social_links.length > 0) console.log('Social links', social_links);
        else console.log('No Social Media uploaded');
        console.log(social_links)
        function image_convertor(image, callback) {
            if (image) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const file = e.target.result;
                    console.log('Base64-encoded image data:', file);
                    callback(file); // Pass the file data to the callback function
                };
                reader.readAsDataURL(image);
            }
        }
        if (uploaded_profile.files[0]) {
            console.log('Profile image', uploaded_profile.files[0])
        }

        else console.log('No profile image uploaded');
        if (cv.files[0]) console.log('CV', cv.files[0]);
        else console.log('No CV uploaded');
        if (bio.value.length > 0) console.log('Bio', bio.value);
        else console.log('No bio uploaded');
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        let get_media = (url)=>{
            const regex = /www\.(\w+)\.com/;
            const match = url.match(regex);
            if (match && match.length > 1) {
                return match[1];
            }
            return null;
        }
        let social_medias = []
        social_links.forEach(link=>{
            social_medias.push({social_name:get_media(link),social_link:link})
        })
        function promiseToString(promise) {
            return new Promise((resolve, reject) => {
                promise.then(result => {
                    resolve(String(result));
                }).catch(error => {
                    reject(error);
                });
            });
        }
        image_convertor(uploaded_profile.files[0], (profile_image) => {
            let user_form = { 
                profile_image:profile_image,
                bio: bio.value,
                cv:cv.files[0],
                post_type:selected_checkbox,
                social_media:social_medias
            };
        
            console.log(user_form); 
            fetch(`/upload_user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(user_form)
            })
            .then(response => {
                if (response.headers.get('content-type').includes('application/json')) {
                    return response.json();
                } else {
                    response.text().then(html => {
                        document.getElementById('responseFrame').srcdoc = html;
                    });
                }
            })
            .then(data => console.log(data))
            .catch(error => {
                if (error.headers.get('content-type').includes('text/html')) {
                    error.text().then(html => {
                        document.getElementById('responseFrame').srcdoc = html;
                    });
                } else {
                    document.getElementById('responseFrame').srcdoc = `<p>Error: ${error.message}</p>`;
                }
            });
        });
    
    }
    else{
        errors_element.innerHTML=''
        errors.forEach(error=>{
            for (const key in error) {
                errors_element.innerHTML+=`
                <p class='error_text text-white d-flex align-items-center gap-2'>
                    <span class='error_key'>${key}</span><span class='error_message'>${error[key]}</span>
                </p>
                `
        }})
        errors=[]
    }
    
};