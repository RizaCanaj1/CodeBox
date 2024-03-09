let first_text = document.querySelector('.first-text span')
let offsetX, offsetY;
let bodyContent = document.body.innerHTML;
let lines = bodyContent.split('\n');
let welcome_code = document.querySelector('.welcome_code pre')
let centerX, centerY;
let initialRotate = -15;  

let freezeRotation=false;


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
/* */;
console.log(document.body.outerHTML)
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

welcome_code.addEventListener('click',()=>{freezeRotation=!freezeRotation;console.log(freezeRotation)})
welcome_code.addEventListener('mouseout', (e) => {
    if(!freezeRotation){
        const welcomeRect = document.querySelector('.welcome').getBoundingClientRect();
        centerX = welcomeRect.left + welcomeRect.width / 2 ;
        centerY = welcomeRect.top + welcomeRect.height / 2 ;
        let x = e.clientX - centerX;
        let y = e.clientY - centerY;
    
            
        let rotateX = -y / 10;  
        let rotateY = initialRotate + x / 10;   
    
        rotateX = Math.max(initialRotate, Math.min(-initialRotate, rotateX));
        rotateY = Math.max(initialRotate, Math.min(-initialRotate, rotateY));
    
        welcome_code.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
    
});
window.addEventListener('keyup', (e) => {
    if (e.key === "Escape") {
        freezeRotation = false
    }
});
document.querySelector('.welcome').addEventListener('mouseout', e => {
    if (!document.querySelector('.welcome').contains(e.relatedTarget) && !freezeRotation) {
        welcome_code.style.transform = `rotateY(${initialRotate}deg)`;
    }
});