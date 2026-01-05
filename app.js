// --- GLOBAL DEĞİŞKENLER ---
let currentUser = null;
let currentAgendaId = null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-11
const daysOfWeek = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const specialDays = {
    "1_1": "Yılbaşı Tatili",
    "23_4": "Ulusal Egemenlik ve Çocuk Bayramı",
    "1_5": "Emek ve Dayanışma Günü",
    "19_5": "Atatürk'ü Anma, Gençlik ve Spor Bayramı",
    "15_7": "Demokrasi ve Milli Birlik Günü",
    "30_8": "Zafer Bayramı",
    "29_10": "Cumhuriyet Bayramı Kutlu Olsun",
    // Dini bayramlar dinamik olduğu için sabit listeye eklenmemiştir
};

// --- EKRAN GEÇİŞ FONKSİYONU ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    } else {
        // Hata Düzeltildi: Ters tırnak kullanıldı (Template Literal)
        console.error(`Hata: '${screenId}' ID'li ekran bulunamadı. HTML yapınızı kontrol edin.`);
        return;
    }

    if (screenId === 'ana-ekran' && currentUser) {
        renderCalendar(currentYear, currentMonth);
    }
}

// --- KİMLİK DOĞRULAMA (LOCAL STORAGE) ---

function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

function handleRegister() {
    const username = document.getElementById('kayit-kullanici-adi').value.trim();
    const email = document.getElementById('kayit-email').value.trim();
    const password = document.getElementById('kayit-sifre').value;
    const msg = document.getElementById('kayit-hata-mesaji');
    msg.textContent = '';

    if (!username || !email || !password) {
        msg.textContent = "Lütfen tüm alanları doldurun.";
        return;
    }

    const users = getUsers();
    if (users.find(u => u.email === email)) {
        msg.textContent = "Bu e-posta zaten kayıtlı.";
        return;
    }

    const newUser = { username, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    msg.textContent = "Kayıt başarılı! Giriş yapabilirsiniz.";
    msg.style.color = 'green';
    
    // Alanları temizle
    document.getElementById('kayit-kullanici-adi').value = '';
    document.getElementById('kayit-email').value = '';
    document.getElementById('kayit-sifre').value = '';
    
    setTimeout(() => showScreen('giris-ekrani'), 1500);
}

function handleLogin() {
    const email = document.getElementById('giris-email').value.trim();
    const password = document.getElementById('giris-sifre').value;
    const msg = document.getElementById('giris-hata-mesaji');
    msg.textContent = '';

    if (!email || !password) {
        msg.textContent = "Lütfen e-posta ve şifrenizi girin.";
        return;
    }

    const user = getUsers().find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUserEmail', user.email);
        // Hata Düzeltildi: Ters tırnak kullanıldı (Template Literal)
        document.getElementById('karsilama-mesaji').textContent = `Hoş Geldiniz, ${currentUser.username}`;
        
        // Alanları temizle
        document.getElementById('giris-email').value = '';
        document.getElementById('giris-sifre').value = '';
        showScreen('ana-ekran');
    } else {
        msg.textContent = "Hatalı e-posta veya şifre.";
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUserEmail');
    showScreen('auth-ekrani');
}

function checkAuthentication() {
    const email = localStorage.getItem('currentUserEmail');
    if (email) {
        const user = getUsers().find(u => u.email === email);
        if (user) {
            currentUser = user;
            // Hata Düzeltildi: Ters tırnak kullanıldı (Template Literal)
            document.getElementById('karsilama-mesaji').textContent = `Hoş Geldiniz, ${currentUser.username}`;
            showScreen('ana-ekran');
            return;
        }
    }
    showScreen('auth-ekrani');
}

// --- TAKVİM İŞLEVLERİ ---

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay(); // 0=Paz, 1=Pzt ...
}

function getAgendaKey() {
    // Hata Düzeltildi: Ters tırnak kullanıldı (Template Literal)
    return `${currentUser.email}_entries`;
}

function getAgendaEntries() {
    if (!currentUser) return {};
    return JSON.parse(localStorage.getItem(getAgendaKey())) || {};
}

function isSpecialDay(day, month) {
    // Hata Düzeltildi: Ters tırnak kullanıldı (Template Literal)
    const key = `${day}_${month + 1}`;
    return specialDays[key] || null;
}

function renderCalendar(year, month) {
    if (!currentUser) return; 

    const container = document.getElementById('takvim-container');
    container.innerHTML = '';
    
    document.getElementById('current-month-year').textContent = new Date(year, month).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

    const daysCount = getDaysInMonth(year, month);
    let firstDayIndex = getFirstDayOfMonth(year, month);
    // Pazartesi'yi ilk gün yapmak için ayarlama
    firstDayIndex = (firstDayIndex === 0) ? 6 : firstDayIndex - 1; 

    // Gün İsimleri Başlıkları
    daysOfWeek.forEach(day => {
        const dayName = document.createElement('div');
        dayName.className = 'gun-isimleri';
        dayName.textContent = day;
        container.appendChild(dayName);
    });

    // Boş Günler
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-day';
        container.appendChild(emptyDiv);
    }

    const agendaEntries = getAgendaEntries();

    // Günler
    for (let day = 1; day <= daysCount; day++) {
        const dayDiv = document.createElement('div');
        // Hata Düzeltildi: Ters tırnak kullanıldı (Template Literal)
        const dateString = `${day}-${month + 1}-${year}`; // KEY: 16-12-2025
        const dateObj = new Date(year, month, day);
        const dayOfWeek = dateObj.getDay();

        dayDiv.className = 'takvim-gun';
        dayDiv.textContent = day;
        dayDiv.dataset.date = dateString;

        // Hafta Sonu kontrolü (Pazar = 0, Cumartesi = 6)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayDiv.classList.add('weekend');
        }

        // Özel Gün kontrolü
        const specialDayName = isSpecialDay(day, month);
        if (specialDayName) {
            dayDiv.classList.add('special-day');
            dayDiv.title = specialDayName;
        }
        
        // Kayıt Kontrolü
        if (agendaEntries[dateString]) {
            dayDiv.classList.add('has-entry');
        }

        dayDiv.addEventListener('click', () => openAgendaPage(dateString));
        container.appendChild(dayDiv);
    }
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentYear, currentMonth);
}

// --- AJANDA SAYFASI İŞLEVLERİ ---

function resetAgendaPage() {
    document.getElementById('ajanda-baslik').textContent = '';
    document.getElementById('ozel-gun-bilgisi').textContent = '';
    document.getElementById('icerik-alani').innerHTML = '';
    document.getElementById('todo-list').innerHTML = '';
    
    // Varsayılan Stil Değerleri
    document.getElementById('sayfa-rengi').value = '#FFFFFF';
    document.getElementById('yazi-puntosu').value = 16;
    document.getElementById('sayfa-sekli').value = 'duz';
    document.getElementById('todo-renk').value = '#F8E1E7';
    
    // Stil sınıflarını temizle ve varsayılan rengi uygula
    document.getElementById('icerik-alani').className = 'ajanda-icerik'; 
    document.getElementById('todo-list-container').style.backgroundColor = '#F8E1E7';
    document.getElementById('icerik-alani').style.backgroundColor = '';
    document.getElementById('icerik-alani').style.fontSize = '';
}

function openAgendaPage(id) {
    currentAgendaId = id;
    resetAgendaPage();
    
    const baslikElement = document.getElementById('ajanda-baslik');
    const specialInfoElement = document.getElementById('ozel-gun-bilgisi');
    let initialData = null;

    if (!id.startsWith('new_') && !id.startsWith('custom_')) {
        // Tarihli kayıtlar
        const [day, monthIndex, year] = id.split('-').map(Number);
        const date = new Date(year, monthIndex - 1, day);
        
        baslikElement.textContent = date.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        const specialDayName = isSpecialDay(day, monthIndex - 1);
        if (specialDayName) {
            // Hata Düzeltildi: Ters tırnak kullanıldı (Template Literal)
            specialInfoElement.textContent = `⭐ ${specialDayName} ⭐`;
        }
        
        const entries = getAgendaEntries();
        initialData = entries[id];
    } else if (id === 'new') {
        // Yeni Özel Not oluşturma
        const userTitle = prompt("Lütfen yeni notunuz için bir başlık girin:");
        if (!userTitle) {
            showScreen('ana-ekran');
            return;
        }
        baslikElement.textContent = userTitle;
        // Hata Düzeltildi: Ters tırnak kullanıldı (Template Literal)
        currentAgendaId = `custom_${Date.now()}`; 
    }
    // else, mevcut custom kaydı yükleniyor.

    if (initialData) {
        loadAgendaData(initialData);
    } else {
        applyStyle(); // Varsayılan stilleri uygula
    }
    
    showScreen('ajanda-sayfasi');
}

function loadAgendaData(data) {
    // Stilleri Yükle
    document.getElementById('sayfa-rengi').value = data.style.bgColor || '#FFFFFF';
    document.getElementById('yazi-puntosu').value = data.style.fontSize || 16;
    document.getElementById('sayfa-sekli').value = data.style.shape || 'duz';
    document.getElementById('todo-renk').value = data.style.todoColor || '#F8E1E7';

    applyStyle();
    applyTodoColor(data.style.todoColor);

    // İçeriği Yükle
    document.getElementById('icerik-alani').innerHTML = data.content || '';

    // To-Do Listesini Yükle (false ile kaydetmeyi devre dışı bırak)
    (data.todoList || []).forEach(item => addTodoItem(item.text, item.completed, false)); 
}

function saveAgenda() {
    if (!currentAgendaId || !currentUser) return;

    // 1. Stil Ayarlarını Topla
    const styles = {
        bgColor: document.getElementById('sayfa-rengi').value,
        fontSize: document.getElementById('yazi-puntosu').value,
        shape: document.getElementById('sayfa-sekli').value,
        todoColor: document.getElementById('todo-renk').value,
    };

    // 2. To-Do Listesini Topla
    const todoList = [];
    document.querySelectorAll('#todo-list .todo-item').forEach(itemDiv => {
        const checkbox = itemDiv.querySelector('input[type="checkbox"]');
        const textSpan = itemDiv.querySelector('span');
        if (textSpan && checkbox) { 
             todoList.push({
                 text: textSpan.textContent,
                 completed: checkbox.checked
             });
        }
    });

    // 3. İçeriği Topla (HTML olarak)
    const content = document.getElementById('icerik-alani').innerHTML;

    // 4. Kayıt Nesnesini Oluştur
    const agendaData = {
        style: styles,
        todoList: todoList,
        content: content,
        timestamp: Date.now()
    };

    // 5. LocalStorage'a Kaydet
    const entries = getAgendaEntries();
    entries[currentAgendaId] = agendaData;

    localStorage.setItem(getAgendaKey(), JSON.stringify(entries));

    showScreen('ana-ekran');
}


// --- DÜZENLEME VE İÇERİK İŞLEVLERİ ---

function applyStyle() {
    const contentArea = document.getElementById('icerik-alani');
    
    // Sayfa Rengi
    contentArea.style.backgroundColor = document.getElementById('sayfa-rengi').value;

    // Yazı Puntosu
    // Hata Düzeltildi: Ters tırnak kullanıldı (Template Literal)
    contentArea.style.fontSize = `${document.getElementById('yazi-puntosu').value}px`;

    // Sayfa Şekli
    const shape = document.getElementById('sayfa-sekli').value;
    // Hata Düzeltildi: Ters tırnak kullanıldı (Template Literal)
    contentArea.className = `ajanda-icerik ${shape}`; 
}

function applyTodoColor(color = document.getElementById('todo-renk').value) {
    document.getElementById('todo-list-container').style.backgroundColor = color;
    document.getElementById('todo-renk').value = color;
}


function addTodoItem(text = null, completed = false, shouldSave = true) {
    const list = document.getElementById('todo-list');
    const inputElement = document.getElementById('new-todo-text');
    const newText = text !== null ? text : inputElement.value.trim();

    if (newText === '') return;

    const todoDiv = document.createElement('div');
    todoDiv.className = 'todo-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = completed;
    
    const textSpan = document.createElement('span');
    textSpan.textContent = newText;
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '❌';
    deleteButton.className = 'delete-todo';
    deleteButton.title = 'Sil';

    // Olay dinleyicileri
    checkbox.addEventListener('change', () => {
        if (shouldSave) saveAgenda();
    });
    deleteButton.addEventListener('click', () => {
        todoDiv.remove();
        if (shouldSave) saveAgenda();
    });
    
    todoDiv.appendChild(checkbox);
    todoDiv.appendChild(textSpan);
    todoDiv.appendChild(deleteButton);
    list.appendChild(todoDiv);

    if (text === null) {
        inputElement.value = '';
        if (shouldSave) saveAgenda(); 
    }
}

/**
 * Kullanıcının imleç konumuna HTML içeriği ekler. document.execCommand yerine kullanılır.
 * @param {string} html Eklenecek HTML dizesi
 */
function insertHtmlAtCaret(html) {
    const sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
        let range = sel.getRangeAt(0);
        range.deleteContents();
        
        // HTML içeriğini DOM fragment'ına dönüştür
        const el = document.createElement("div");
        el.innerHTML = html;
        let frag = document.createDocumentFragment();
        let node, lastNode;
        while ( (node = el.firstChild) ) {
            lastNode = frag.appendChild(node);
        }
        
        range.insertNode(frag);

        // İmleci eklenen içeriğin sonuna taşı
        if (lastNode) {
            range = range.cloneRange();
            range.setStartAfter(lastNode);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    } else {
        // Fallback: Seçim API'si desteklenmiyorsa veya odak yoksa içeriğin sonuna ekle
        document.getElementById('icerik-alani').innerHTML += html;
    }
}

function addLink() {
    const link = document.getElementById('link-input').value.trim();
    if (link) {
        const contentArea = document.getElementById('icerik-alani');
        contentArea.focus(); // İçerik alanını odakla
        // Hata Düzeltildi: Ters tırnak kullanıldı (Template Literal)
        const linkHTML = `<a href="${link}" target="_blank">${link}</a>&nbsp;`;
        insertHtmlAtCaret(linkHTML);
        document.getElementById('link-input').value = '';
    }
}

function handleFile(files) {
    if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            let elementHTML = '';
            if (file.type.startsWith('image/')) {
                // Fotoğraf
                // Hata Düzeltildi: Ters tırnak kullanıldı (Template Literal)
                elementHTML = `<img src="${e.target.result}" style="max-width:100%; height:auto; margin:10px 0;">`;
            } else {
                // Dosya (PDF, Doc vb.)
                // Hata Düzeltildi: Ters tırnak kullanıldı (Template Literal)
                elementHTML = `<p><i class="fas fa-file"></i> Dosya: <a href="${e.target.result}" download="${file.name}">${file.name}</a></p>`;
            }
            
            document.getElementById('icerik-alani').focus(); // İçerik alanını odakla
            insertHtmlAtCaret(elementHTML);
        };
        reader.readAsDataURL(file);
    }
}


// --- BAŞLANGIÇ VE OLAY DİNLEYİCİLERİ ---

window.onload = function() {
    // Sayfa yüklendiğinde kimlik kontrolü ve olay dinleyicilerini bağla
    checkAuthentication();
    attachEventListeners();
};

function attachEventListeners() {
    // Tüm elementlerin HTML'de mevcut olduğundan emin olun!

    // Kimlik Doğrulama
    document.getElementById('btn-kayit')?.addEventListener('click', handleRegister);
    document.getElementById('btn-giris')?.addEventListener('click', handleLogin);
    document.getElementById('btn-cikis')?.addEventListener('click', handleLogout);
    
    // Ekran Geçişleri
    document.getElementById('go-to-kayit')?.addEventListener('click', () => showScreen('kayit-ekrani'));
    document.getElementById('go-to-giris')?.addEventListener('click', () => showScreen('giris-ekrani'));
    document.getElementById('go-back-auth')?.addEventListener('click', () => showScreen('auth-ekrani'));
    document.getElementById('go-back-calendar')?.addEventListener('click', () => showScreen('ana-ekran'));
    
    // Takvim Navigasyonu
    document.getElementById('prev-month')?.addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month')?.addEventListener('click', () => changeMonth(1));
    
    // Ajanda İşlevleri
    document.getElementById('btn-agenda-save')?.addEventListener('click', saveAgenda);
    document.getElementById('btn-new-custom-note')?.addEventListener('click', () => openAgendaPage('new'));
    
    // Stil Ayarları
    document.getElementById('sayfa-rengi')?.addEventListener('change', applyStyle);
    document.getElementById('yazi-puntosu')?.addEventListener('change', applyStyle);
    document.getElementById('sayfa-sekli')?.addEventListener('change', applyStyle);
    document.getElementById('todo-renk')?.addEventListener('change', () => applyTodoColor());
    
    // To-Do Listesi
    document.getElementById('btn-add-todo')?.addEventListener('click', () => addTodoItem());
    // Enter tuşu ile To-Do ekleme
    document.getElementById('new-todo-text')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            addTodoItem();
        }
    }); // <-- Eksik ')' ve '}' parantezi düzeltildi

    // Zengin İçerik Ekleme
    document.getElementById('btn-add-link')?.addEventListener('click', addLink);
    
    // Fotoğraf ve Dosya yükleme dinleyicileri
    document.getElementById('file-input')?.addEventListener('change', (e) => {
        handleFile(e.target.files);
        e.target.value = ''; // Aynı dosyayı tekrar yüklemeyi sağlamak için input'u temizle
    }); // <-- Eksik ')' ve '}' parantezi düzeltildi
}
