let first_text = document.querySelector('.first-text span')

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