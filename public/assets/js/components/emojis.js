function show_emojis() {
    let emojis_text = '';
    return new Promise((resolve, reject) => {
        fetch('../assets/others/emojis.json')
            .then(response => response.json())
            .then(data => {
                document.querySelectorAll('.emojis_nav').forEach(e=>{
                    e.innerHTML =''
                    emojis_text = ''
                    let type_of_emojis = Object.keys(data);
                    type_of_emojis.forEach((x, index) => {
                        let formattedTitle = x.replace(/_/g, ' & ').toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                        e.innerHTML += `<h6 class='emoji_selector ${x}'><span class='emojis_title'>${formattedTitle}</span><span class='emojis_symbol'>${data[x].symbol}</span></h6>`;
                        if (index == 0) {
                            emojis_text += `<h5 class='emoji_title' id='${x}'>${formattedTitle}</h5>
                            <span class='emojis_group ${x}'>${data[x].emojis.split(' ').map(emoji => `<span class='emoji'>${emoji}</span>`).join('')}</span>
                            `;
                        } else {
                            emojis_text += `<br><hr><h5 class='emoji_title' id='${x}'>${formattedTitle}</h5>
                            <span class='emojis_group ${x}'>${data[x].emojis.split(' ').map(emoji => `<span class='emoji'>${emoji}</span>`).join('')}</span>
                            `;
                        }
                    });
                })
                
                resolve(emojis_text);
            })
            .catch(error=> reject(new Error('Error loading emojis. Check your internet connection')));
        });
}
function emojis_handler(input_field,emojis_text,emojis){
    const wrapper = emojis.querySelector('.emojis_wrapper');
    wrapper.innerHTML+=emojis_text
    let cursorPosition = null
    input_field.onclick=()=>{
        cursorPosition = input_field.selectionStart-2
    }
    input_field.onchange = ()=>{
        cursorPosition = input_field.selectionStart-2
    }
    const emojis_nav = emojis.querySelector('.emojis_nav')
    const emojis_selector = emojis.querySelectorAll('.emoji_selector')
    emojis.querySelectorAll('.emoji').forEach(e=>{e.onclick=()=>{
        cursorPosition+=2
        let selected_text = input_field.value.substring(input_field.selectionStart, input_field.selectionEnd)
        if(selected_text){
            const textBeforeCursor = input_field.value.substring(0, input_field.selectionStart);
            const textAfterCursor = input_field.value.substring(input_field.selectionEnd);
            const emoji = e.innerHTML;
            input_field.value = textBeforeCursor + emoji + textAfterCursor;
            input_field.setSelectionRange(cursorPosition + emoji.length, cursorPosition + emoji.length);
        }
        else{
            const textBeforeCursor = input_field.value.substring(0, cursorPosition);
            const textAfterCursor = input_field.value.substring(cursorPosition);
            const emoji = e.innerHTML;
            input_field.value = textBeforeCursor + emoji + textAfterCursor;
            input_field.setSelectionRange(cursorPosition + emoji.length, cursorPosition + emoji.length);
        }
    }})
    emojis_selector.forEach(e=>{e.onclick=()=>{
        emojis_selector.forEach(other=>{other.classList.remove('active_nav')})
        e.classList.add('active_nav')
        const wrapper_scroll_to = wrapper.querySelector(`#${e.className.split(' ')[1]}`);
        if (wrapper_scroll_to) {
            wrapper_scroll_to.scrollIntoView({ behavior: 'smooth' });
        }
    }})
    const emojiTypes = wrapper.querySelectorAll('.emojis_group');
    wrapper.onscroll=()=>{
        emojiTypes.forEach(emoji => {
            if(emoji.getBoundingClientRect().bottom-wrapper.getBoundingClientRect().top<0){
                emojis_nav.querySelector(`.${emoji.className.split(' ')[1]}`).classList.remove('active_nav')
            }
            else if(emoji.getBoundingClientRect().top-wrapper.getBoundingClientRect().top<0){
                emojis_nav.querySelector(`.${emoji.className.split(' ')[1]}`).classList.add('active_nav')
            }
            else if(wrapper.getBoundingClientRect().bottom-emoji.getBoundingClientRect().top<0){
                emojis_nav.querySelector(`.${emoji.className.split(' ')[1]}`).classList.remove('active_nav')
            }
            else if(emojiTypes[1].getBoundingClientRect().top-wrapper.getBoundingClientRect().bottom<0){
                emojis_nav.querySelector(`.${emoji.className.split(' ')[1]}`).classList.add('active_nav')
            }
        });
    }        
}