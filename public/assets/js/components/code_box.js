
let extension;
let code_boxes
let code_opened = false;
let code_animation = true
const show_code_animations = document.querySelectorAll('.codebox-animation');
let sorted_counter = 0
let search_index = 1;
console.log(document.querySelectorAll('.source-btn'))
show_code_animations.forEach(show_code_animation => {
    let post_id = show_code_animation.getAttribute('class').split(' ')[0]
    show_code_animation.addEventListener('click',e=>{
        show_code_animation.classList.add('btn-panimation');
        setTimeout(()=>{
            id=e.target.getAttribute('class').split(" ")[0];
            const post_codes = document.querySelectorAll(`.codeblock#${id}`);
            show_code_animation.classList.add('d-none');
            post_codes.forEach(post_code => {
                post_code.classList.remove('d-none');
                post_code.classList.add('d-flex');
            });
        },1000)
    })
    codeblock_event(post_id)
});
//codeblock_event()
function codeblock_event(id) {
    $(`.${id}.source-btn`).off('click').on('click', function(event) {
        code_opened=true;
        //let id = event.target.getAttribute('class').split(' ')[0];
        
        let code_box = document.querySelector(`pre#${id}`);
        let scroll_button = document.createElement('button');
        scroll_button.classList.add('scroll-button','d-none')
        scroll_button.innerHTML='<i class="fa-solid fa-chevron-up"></i>'
        scroll_button.onmouseover = function() {
            if(scroll_button.querySelectorAll('i').length == 1){
                scroll_button.innerHTML+='<br><i class="fa-solid fa-chevron-up"></i>'
                scroll_button.querySelectorAll('i').forEach(i =>{
                    i.classList.add('fa-xs')
                })
            }
        }
        scroll_button.onmouseout = function(){
            scroll_button.innerHTML='<i class="fa-solid fa-chevron-up"></i>'
            scroll_button.querySelectorAll('i').forEach(i =>{
                i.classList.remove('fa-xs')
            })
        }
        scroll_button.onclick = function(){
            code_box.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        
        console.log(id.split('-')[1]);
        jQuery.get(`./storage/codes/${event.target.innerText}`, function(data) {
            console.log(data)
            let code_bar = document.createElement('div')
            let search_icon = document.createElement('i')
            let search_bar = document.createElement('div')
            let counter = document.createElement('div')
            let show_searchbar = false
            code_bar.classList.add('code-bar')
            search_icon.classList.add('fa-solid','fa-magnifying-glass','fa-xs')
            search_bar.classList.add('d-none','code-search')
            search_bar.innerHTML='<input class="form-control" placeholder="Search"></input>'
            search_icon.addEventListener('click',()=>{
                search_bar.style.top = `auto`
                document.querySelectorAll(`pre[id^='pid-']`).forEach(x=>{if(x!=code_box){
                    let others_search = x.querySelector('.code-search')
                    let others_scroller = x.querySelector('.scroll-button')
                    remove_code(others_search,others_scroller)
                }})
                code_animation = false
                show_searchbar = !show_searchbar;
                if(search_bar.classList.contains('d-none')){
                    search_bar.classList.remove('d-none')
                }
                else{
                    search_bar.classList.add('d-none')
                }
            })
            search_bar.querySelector('input').onkeyup = e=>{
                sorted_counter = 0
                search_index=1
                let filter_lines = ()=>{
                    let markSearchSpans = Array.from(code_box.querySelectorAll('span.mark_search'));
                    if (e.target.value == '') {
                        return Array.from(code_box.querySelectorAll('span'));
                    } else {
                        return markSearchSpans.map(span => span.parentNode);
                    }
                }
                let searchTerm = e.target.value.toLowerCase();
                code_box.querySelectorAll('span[id^="line-"]').forEach(line => {
                    line.querySelectorAll('.mark_search').forEach(span => span.outerHTML = span.innerHTML);
                    const originalText = line.innerHTML
                    const lineText = originalText.replace(/<a>.*<\/a>/, '')
                    if (lineText.includes(searchTerm) && e.target.value != '') {
                        let regex = new RegExp(searchTerm, 'gi')
                        let mark_search = lineText.replace(regex, function (match) {
                            const uniqueId = `search_${search_index++}`;
                            return `<span class="mark_search" id="${uniqueId}">${match}</span>`;
                            
                        });
                        line.classList.remove('hide-code')
                        line.innerHTML = originalText.replace(/<\/a>.*$/, '</a>')
                        line.innerHTML += mark_search
                    }
                    else {
                        if(e.target.value == '') line.classList.remove('hide-code')
                        else line.classList.add('hide-code');
                        line.querySelectorAll('.mark_search').forEach(span => span.outerHTML = span.innerHTML);
                    }
                });
                
                counter.innerHTML=`<p>Found <a>${filter_lines().length}</a> matches</p><div class="d-flex gap-2"><input type="number" min="1" max="${filter_lines().length}" class='sorted_counter'></input><p>/${filter_lines().length}</p></div>`
                counter.querySelector('.sorted_counter').addEventListener("keyup",e=>{
                    if(e.target.value<e.target.min) e.target.value=e.target.min
                    if(e.target.value>e.target.max) e.target.value=e.target.max
                })
                counter.querySelector('.sorted_counter').addEventListener("change",e=>{
                    sorted_counter = e.target.value
                    code_box.scrollTop = parseInt(filter_lines()[sorted_counter-1].id.split('-')[1])*21 - 150
                    code_box.querySelectorAll(`span[id^='search_']`).forEach(s => s.classList.remove('scrolled_to'));
                    code_box.querySelector(`#search_${e.target.value}`).classList.add('scrolled_to');
                    console.log(code_box.getBoundingClientRect())
                    
                })
                code_box.querySelectorAll('span[id^="search_"]').forEach(searched=>{
                    searched.addEventListener('click',()=>{
                        sorted_counter = parseInt(searched.getAttribute('id').split('_')[1])
                        counter.querySelector('.sorted_counter').value=sorted_counter
                        searched.classList.add('scrolled_to')
                        code_box.querySelectorAll(`span[id^='search_']`).forEach(s => {if(s!=searched)s.classList.remove('scrolled_to')});
                    })
                })
            }
            
            search_bar.appendChild(counter)
            code_bar.appendChild(search_icon)
            code_bar.appendChild(search_bar)
            let button = document.createElement('button')
            let lines = []
            button.textContent = '.../'
            button.addEventListener('click', () => {
                code_animation = true
                code_opened=false
                code_box.innerHTML = 'Loading...'
                code_box.classList.add('d-flex')
                $.ajax({
                    url: '/get-post-code/' + id.split('-')[1],
                    type: 'GET',
                    success: function(response) {
                        code_box.innerHTML = ''
                        if (Array.isArray(response)) {
                            response.forEach(code => {
                                let ex =code.source.split('.')[code.source.split('.').length-1]
                                if(ex == 'html'){
                                    code_box.innerHTML += `<div><button class="${id} source-btn">${code.source}</button> <button class="${id} test-beta">Beta Open</button></div>`
                                }
                                else{
                                    code_box.innerHTML += `<button class="${id} source-btn">${code.source}</button>`
                                }
                            })
                            
                            codeblock_event(id)
                        }
                        console.log(response)
                    },
                    error: function(xhr, status, error) {
                        console.error(error)
                    }
                });
            });
            code_box.innerHTML = '';
            code_box.classList.remove('d-flex');
            code_box.appendChild(button);
            extension = event.target.innerText.split('.')[event.target.innerText.split('.').length-1]
            code_box.appendChild(document.createTextNode(event.target.innerText));
            if(extension=='html')
            console.log('right there')
            code_box.appendChild(document.createElement('br')); 
            code_box.appendChild(code_bar)
            code_box.appendChild(scroll_button);
            if(extension == 'json'){
                lines = JSON.stringify(data, null, 2).split(/\r?\n/);
            }
            else if(extension == 'xml'){
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(data, 'application/xml');
                const formattedXml = formatXml(xmlDoc.documentElement, 0);
                lines = formattedXml.split(/\r?\n/);
            }
            else{
                lines = data.split(/\r?\n/)
            }
            console.log(lines)
            animateCodeLines(code_box,lines);
            code_box.addEventListener("scroll", () => {
                document.querySelectorAll(`pre[id^='pid-']`).forEach(x=>{if(x!=code_box){
                    let others_search = x.querySelector('.code-search')
                    let others_scroller = x.querySelector('.scroll-button')
                    search_icon.addEventListener('click',()=>{console.log('hey');remove_code(others_search,others_scroller)})
                    if(others_search&&others_scroller) remove_code(others_search,others_scroller)
                }})
                console.log(code_box.id)
                if(show_searchbar){
                    search_bar.classList.remove('d-none')
                }
                if(code_box.scrollTop > 20){
                    search_bar.style.position='fixed'
                    search_bar.style.top = `${code_box.getBoundingClientRect().top+20}px`
                }
                else{
                    search_bar.style.position='absolute'
                    search_bar.style.top = `auto`
                }
                if(code_box.scrollTop > 200){   
                    scroll_button.classList.remove('d-none')
                    scroll_button.style.top = `${code_box.getBoundingClientRect().top+230}px`
                    code_box.classList.add('scrolled')
                }
                else{
                    scroll_button.classList.add('d-none')
                    code_box.classList.remove('scrolled')
                }
            })
            let remove_code = (searcher,scroller)=>{
                if(searcher&&scroller){
                    searcher.style.top = `${code_box.getBoundingClientRect().top}px`
                    scroller.style.top = `${code_box.getBoundingClientRect().top+320}px`
                    searcher.classList.add('d-none')
                    scroller.classList.add('d-none')
                }
            }
            window.addEventListener('scroll',()=>{
                remove_code(search_bar,scroll_button)
            })
        });
    });
    let test_beta = document.querySelectorAll('.test-beta')
    if(test_beta){
        test_beta.forEach(t=>{
            t.addEventListener('click',()=>{
                let t_id=t.getAttribute('class').split(' ')[0].split('-')[1]
                window.location.href = `../beta-test?id=${t_id}&file=${t.parentElement.children[0].innerText}`
                console.log(t.parentElement.children[0].innerText)
                console.log(t.getAttribute('class').split(' ')[0])
            })
            t.addEventListener('mouseover',e=>{
                t.alt = ''
            })
        })
    }
}

function animateCodeLines(code,lines, index = 0) {
    if (index < lines.length && code_opened) {
        const linkElement = document.createElement('a');
        linkElement.innerHTML = (index + 1) + '   ';

        const lineTextElement = document.createElement('span');
        lineTextElement.id = 'line-' + (index + 1);
        lineTextElement.appendChild(linkElement);
        lineTextElement.appendChild(document.createTextNode(lines[index]));
        code.appendChild(lineTextElement);
        code.appendChild(document.createElement('br'));
        if(code_animation){
            setTimeout(() => {
                animateCodeLines(code,lines, index + 1);
            }, 40);
        }
        else{
            animateCodeLines(code,lines, index + 1);
        }
    }
}