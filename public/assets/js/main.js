let first_text = document.querySelector('.first-text span')
let offsetX, offsetY;
let bodyContent = document.body.innerHTML;
let lines = bodyContent.split('\n');
let welcome_code = document.querySelector('.welcome_code pre')
let centerX, centerY;
let initialRotate = -15;  
let freezeRotation=false;
const welcome = document.querySelector('.welcome')
first_text.addEventListener('click', () => {
    first_text.classList.add('clicked');
    let clicked = document.querySelector('.first-text span.clicked');
    clicked.addEventListener('click', () => {
        clicked.classList.add('second');
        let start_page = document.querySelector('.first-text span.second');
        start_page.addEventListener('click', () => {
            window.location.href='/dashboard'
        });
    });
});
lines.forEach(function (line, index) {
    const lineSpan = document.createElement('span');
    lineSpan.id = 'line-' + (index);
    lineSpan.classList.add('line');
    let parts = line.trim().match(/[^<>]+|[<>]+/g);

    if (parts) {
        parts.forEach((part, index) => {
            if (part === '<' || part === '>' || part === '><') {
                createAndAppendSpan(lineSpan, part, 'arrow');
            } else {
                if (index > 0) {
                    const previousPart = parts[index - 1];
                    const spanClass = (previousPart === '>') ? 'outside' : 'inside';
                    createAndAppendSpan(lineSpan, part, spanClass);
                } else {
                    createAndAppendSpan(lineSpan, part, 'outside');
                }
            }
        });
    }
    if(index>0){
        welcome_code.appendChild(lineSpan);
        welcome_code.appendChild(document.createTextNode('\n'));
    }
});
function createAndAppendSpan(line, text, className) {
    const span = document.createElement('span');
    span.innerText = text;
    span.classList.add(className);
    line.appendChild(span);
}
welcome_code.addEventListener('click',()=>freezeRotation=!freezeRotation)
let scrollInterval = null;

const startScroll = (direction) => {
    console.log(scrollInterval)
    if (!scrollInterval) {
        scrollInterval = setInterval(() => {
            welcome.scrollBy(0, direction === 'down' ? 2 : -2);
        }, 10); 
    }
};

const stopScroll = () => {
    console.log('hey')
    if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
    }
};
welcome_code.addEventListener('mouseout', (e) => {
    if (!freezeRotation) {
        const welcomeRect = document.querySelector('.welcome').getBoundingClientRect();
        const centerX = welcomeRect.left + welcomeRect.width / 2;
        const centerY = welcomeRect.top + welcomeRect.height / 2;
        const x = e.clientX - centerX;
        const y = e.clientY - centerY;
        const yPercentage = ((y*100)/window.innerHeight)
        let rotateX = -y / 10;
        let rotateY = initialRotate + x / 10;
        rotateX = Math.max(initialRotate, Math.min(-initialRotate, rotateX));
        rotateY = Math.max(initialRotate, Math.min(-initialRotate, rotateY));
        welcome_code.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        if (yPercentage > 30) {
            startScroll('down');
        } else if (yPercentage < -30) {
            startScroll('up');
        } else {
            stopScroll();
        }
    }
    else{stopScroll();}
});
window.addEventListener('keyup', (e) => {
    if (e.key === "Escape") {
        freezeRotation = false
    }
});
document.querySelector('.welcome').addEventListener('mouseout', e => {
    if (!document.querySelector('.welcome').contains(e.relatedTarget) && !freezeRotation) {
        welcome_code.style.transform = `rotateY(${initialRotate}deg)`;
        stopScroll();
    }
});
document.querySelector('.section_text').addEventListener('mouseenter', () => {
    const children = [...document.querySelector('.dots').children];
    children.forEach(dot => {
        dot.style.animationName = 'jump_dots';
        dot.style.animationIterationCount = 'infinite';
    });
});

document.querySelector('.section_text').addEventListener('mouseleave', ()=> {
    const children = [...document.querySelector('.dots').children];
    children.forEach(dot => {
        const dotsContainerRect = document.querySelector('.dots').getBoundingClientRect();
        const dotRect = dot.getBoundingClientRect();
        const translateY = dotRect.top - dotsContainerRect.top - 9;
        dot.style.setProperty('--recent_dot_height', translateY + 'px');
        dot.style.animationName = 'stop_dots';
        dot.style.animationPlayState = 'running';
        dot.style.animationIterationCount = 'unset';
        console.log(translateY);
    });
});
//welcome-scene
let w_scene = document.querySelector('.welcome-scene')
let scene_btn = document.querySelector('.welcome-scene .center-position')
let logo_text = document.querySelector('.welcome-scene .scene-logo-text')
let has_started = localStorage.getItem("c-box");
if(!has_started){
    document.body.style.overflowY='hidden'
    scene_btn.onclick = ()=>{
        localStorage.setItem("c-box", "started");
        scene_btn.parentElement.classList.add('scene-start')
        setTimeout(()=>{
            logo_text.classList.remove('d-none')
        },2500)
        setTimeout(()=>{
            document.body.style.overflowY='scroll'
        },8000)
    }
}
else{
    w_scene.classList.add('d-none')
    document.body.style.overflowY='scroll'
}