/**
 * MEKTEB.NET - Advanced Quiz Engine
 * Podrška za: Standard, Checkbox, Reorder, Match
 * Verzija: 2.0
 */

// Globalne varijable
let questions = [];
let currentQuestion = 0;
let score = 0;

/**
 * Zvučni efekat za odgovore
 */
function playSound(isCorrect) {
    try {
        const audio = new Audio(
            isCorrect 
                ? '../assets/sounds/correct.mp3' 
                : '../assets/sounds/wrong.mp3'
        );
        audio.volume = 0.5;
        audio.play().catch(err => {
            console.log('Audio reprodukcija blokirana:', err);
        });
    } catch (error) {
        console.log('Audio greška:', error);
    }
}

/**
 * Shuffle array funkcija
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Inicijalizacija kviza
 */
function initQuiz() {
    if (typeof quizData === 'undefined') {
        console.error('quizData nije definisan!');
        return;
    }

    const questionsToShow = quizData.questionsToShow || 20;
    questions = shuffleArray(quizData.allQuestions).slice(0, questionsToShow);
    
    // Shuffle opcije za standardna pitanja, ali zadrži tačan odgovor
    questions = questions.map(q => {
        if (!q.type || q.type === 'standard') {
            const correctAnswer = q.answer;
            return {
                ...q,
                options: shuffleArray(q.options),
                answer: correctAnswer
            };
        }
        return q;
    });
    
    currentQuestion = 0;
    score = 0;
    
    document.getElementById('quizScreen').classList.add('active');
    document.getElementById('resultScreen').classList.remove('active');
    
    showQuestion();
}

/**
 * Prikaz trenutnog pitanja
 */
function showQuestion() {
    const q = questions[currentQuestion];
    
    // Ažuriraj brojač
    document.getElementById('questionCounter').textContent = 
        `${currentQuestion + 1}/${questions.length}`;
    
    // Ažuriraj progress bar
    const progressPercentage = (currentQuestion / questions.length) * 100;
    document.getElementById('progressBar').style.width = `${progressPercentage}%`;
    
    // Ažuriraj tekst pitanja
    document.getElementById('questionText').textContent = q.question;
    
    // Prikaži odgovarajući tip pitanja
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    const type = q.type || 'standard';
    
    switch(type) {
        case 'checkbox':
            renderCheckboxQuestion(q, optionsContainer);
            break;
        case 'reorder':
            renderReorderQuestion(q, optionsContainer);
            break;
        case 'match':
            renderMatchQuestion(q, optionsContainer);
            break;
        default:
            renderStandardQuestion(q, optionsContainer);
    }
}

/**
 * STANDARD pitanje - Jedan tačan odgovor
 */
function renderStandardQuestion(q, container) {
    q.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option;
        btn.onclick = () => checkStandardAnswer(option);
        container.appendChild(btn);
    });
}

function checkStandardAnswer(selected) {
    const q = questions[currentQuestion];
    const isCorrect = selected === q.answer;
    
    if (isCorrect) score++;
    playSound(isCorrect);
    
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
        btn.classList.add('disabled');
        if (btn.textContent === q.answer) {
            btn.classList.add('correct');
        } else if (btn.textContent === selected && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    showPopup(isCorrect, q.explanation);
}

/**
 * CHECKBOX pitanje - Više tačnih odgovora
 */
function renderCheckboxQuestion(q, container) {
    const submitBtn = document.createElement('button');
    submitBtn.className = 'submit-btn';
    submitBtn.textContent = 'Potvrdi odgovor';
    submitBtn.onclick = () => checkCheckboxAnswer();
    
    q.options.forEach(option => {
        const label = document.createElement('label');
        label.className = 'checkbox-option';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = option;
        checkbox.className = 'checkbox-input';
        
        const span = document.createElement('span');
        span.textContent = option;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    });
    
    container.appendChild(submitBtn);
}

function checkCheckboxAnswer() {
    const q = questions[currentQuestion];
    const checkboxes = document.querySelectorAll('.checkbox-input');
    const selected = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    // Provjeri da li je odabrano nešto
    if (selected.length === 0) {
        alert('Molimo odaberite bar jedan odgovor!');
        return;
    }
    
    // Provjeri da li su svi tačni i nema netačnih
    const correct = q.correct;
    const isCorrect = selected.length === correct.length && 
                      selected.every(item => correct.includes(item));
    
    if (isCorrect) score++;
    playSound(isCorrect);
    
    // Označi odgovore
    const labels = document.querySelectorAll('.checkbox-option');
    labels.forEach(label => {
        const checkbox = label.querySelector('input');
        const value = checkbox.value;
        
        checkbox.disabled = true;
        
        if (correct.includes(value)) {
            label.classList.add('correct');
        } else if (selected.includes(value)) {
            label.classList.add('incorrect');
        }
    });
    
    // Ukloni submit dugme
    document.querySelector('.submit-btn').remove();
    
    showPopup(isCorrect, q.explanation);
}

/**
 * REORDER pitanje - Poredaj po redu
 */
function renderReorderQuestion(q, container) {
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'reorder-container';
    
    // Shuffle items
    const shuffledItems = shuffleArray([...q.items]);
    
    shuffledItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'reorder-item';
        itemDiv.textContent = item.text;
        itemDiv.dataset.order = item.order;
        itemDiv.dataset.currentIndex = index;
        
        // Up button
        if (index > 0) {
            const upBtn = document.createElement('button');
            upBtn.className = 'reorder-btn';
            upBtn.textContent = '▲';
            upBtn.onclick = () => moveItem(index, index - 1);
            itemDiv.appendChild(upBtn);
        }
        
        // Down button
        if (index < shuffledItems.length - 1) {
            const downBtn = document.createElement('button');
            downBtn.className = 'reorder-btn';
            downBtn.textContent = '▼';
            downBtn.onclick = () => moveItem(index, index + 1);
            itemDiv.appendChild(downBtn);
        }
        
        itemsContainer.appendChild(itemDiv);
    });
    
    container.appendChild(itemsContainer);
    
    const submitBtn = document.createElement('button');
    submitBtn.className = 'submit-btn';
    submitBtn.textContent = 'Potvrdi redoslijed';
    submitBtn.onclick = () => checkReorderAnswer();
    container.appendChild(submitBtn);
}

function moveItem(fromIndex, toIndex) {
    const container = document.querySelector('.reorder-container');
    const items = Array.from(container.children);
    
    // Swap
    const temp = items[fromIndex];
    items[fromIndex] = items[toIndex];
    items[toIndex] = temp;
    
    // Clear and re-render
    container.innerHTML = '';
    items.forEach((item, newIndex) => {
        item.dataset.currentIndex = newIndex;
        
        // Remove old buttons
        item.querySelectorAll('.reorder-btn').forEach(btn => btn.remove());
        
        // Add new buttons
        if (newIndex > 0) {
            const upBtn = document.createElement('button');
            upBtn.className = 'reorder-btn';
            upBtn.textContent = '▲';
            upBtn.onclick = () => moveItem(newIndex, newIndex - 1);
            item.appendChild(upBtn);
        }
        
        if (newIndex < items.length - 1) {
            const downBtn = document.createElement('button');
            downBtn.className = 'reorder-btn';
            downBtn.textContent = '▼';
            downBtn.onclick = () => moveItem(newIndex, newIndex + 1);
            item.appendChild(downBtn);
        }
        
        container.appendChild(item);
    });
}

function checkReorderAnswer() {
    const q = questions[currentQuestion];
    const items = document.querySelectorAll('.reorder-item');
    
    let isCorrect = true;
    items.forEach((item, index) => {
        const expectedOrder = index + 1;
        const actualOrder = parseInt(item.dataset.order);
        
        if (expectedOrder !== actualOrder) {
            isCorrect = false;
            item.classList.add('incorrect');
        } else {
            item.classList.add('correct');
        }
        
        // Disable buttons
        item.querySelectorAll('.reorder-btn').forEach(btn => btn.disabled = true);
    });
    
    if (isCorrect) score++;
    playSound(isCorrect);
    
    document.querySelector('.submit-btn').remove();
    
    showPopup(isCorrect, q.explanation);
}

/**
 * MATCH pitanje - Spoji parove
 */
function renderMatchQuestion(q, container) {
    const matchContainer = document.createElement('div');
    matchContainer.className = 'match-container';
    
    // Shuffle right side
    const shuffledRight = shuffleArray([...q.pairs.map(p => p.right)]);
    
    q.pairs.forEach((pair, index) => {
        const pairDiv = document.createElement('div');
        pairDiv.className = 'match-pair';
        
        const leftDiv = document.createElement('div');
        leftDiv.className = 'match-left';
        leftDiv.textContent = pair.left;
        
        const select = document.createElement('select');
        select.className = 'match-select';
        select.dataset.correctAnswer = pair.right;
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Odaberi --';
        select.appendChild(defaultOption);
        
        shuffledRight.forEach(rightText => {
            const option = document.createElement('option');
            option.value = rightText;
            option.textContent = rightText;
            select.appendChild(option);
        });
        
        pairDiv.appendChild(leftDiv);
        pairDiv.appendChild(select);
        matchContainer.appendChild(pairDiv);
    });
    
    container.appendChild(matchContainer);
    
    const submitBtn = document.createElement('button');
    submitBtn.className = 'submit-btn';
    submitBtn.textContent = 'Potvrdi parove';
    submitBtn.onclick = () => checkMatchAnswer();
    container.appendChild(submitBtn);
}

function checkMatchAnswer() {
    const selects = document.querySelectorAll('.match-select');
    
    // Provjeri da li su svi spareni
    let allSelected = true;
    selects.forEach(select => {
        if (!select.value) allSelected = false;
    });
    
    if (!allSelected) {
        alert('Molimo spojite sve parove!');
        return;
    }
    
    let isCorrect = true;
    selects.forEach(select => {
        const correctAnswer = select.dataset.correctAnswer;
        const selected = select.value;
        
        select.disabled = true;
        
        if (selected === correctAnswer) {
            select.classList.add('correct');
        } else {
            select.classList.add('incorrect');
            isCorrect = false;
        }
    });
    
    const q = questions[currentQuestion];
    if (isCorrect) score++;
    playSound(isCorrect);
    
    document.querySelector('.submit-btn').remove();
    
    showPopup(isCorrect, q.explanation);
}

/**
 * Prikaz popup-a sa rezultatom
 */
function showPopup(isCorrect, explanation) {
    document.getElementById('popupIcon').textContent = isCorrect ? '✅' : '❌';
    document.getElementById('popupTitle').textContent = isCorrect ? 'Tačno!' : 'Netačno!';
    document.getElementById('popupTitle').className = 'popup-title ' + (isCorrect ? 'correct' : 'incorrect');
    document.getElementById('popupExplanation').textContent = explanation;
    document.getElementById('popupOverlay').classList.add('active');
}

/**
 * Sljedeće pitanje
 */
function nextQuestion() {
    document.getElementById('popupOverlay').classList.remove('active');
    
    currentQuestion++;
    
    if (currentQuestion < questions.length) {
        showQuestion();
    } else {
        showResults();
    }
}

/**
 * Prikaz rezultata
 */
function showResults() {
    document.getElementById('quizScreen').classList.remove('active');
    document.getElementById('resultScreen').classList.add('active');
    
    const percentage = Math.round((score / questions.length) * 100);
    
    document.getElementById('resultScore').textContent = `${score}/${questions.length}`;
    document.getElementById('resultPercentage').textContent = `${percentage}% tačnih odgovora`;
    
    let emoji, message;
    if (percentage >= 90) {
        emoji = '🌟';
        message = 'Izvrsno! Odličan rezultat!';
    } else if (percentage >= 70) {
        emoji = '✨';
        message = 'Vrlo dobro! Svaka čast!';
    } else if (percentage >= 50) {
        emoji = '📚';
        message = 'Dobro! Nastavi učiti!';
    } else {
        emoji = '💪';
        message = 'Potrebno je više učenja!';
    }
    
    document.getElementById('resultEmoji').textContent = emoji;
    document.getElementById('resultMessage').textContent = message;
}

/**
 * Restart kviza
 */
function restartQuiz() {
    initQuiz();
}

/**
 * Auto-start
 */
document.addEventListener('DOMContentLoaded', function() {
    initQuiz();
});
