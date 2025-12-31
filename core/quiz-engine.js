/**
 * MEKTEB.NET - Quiz Engine
 * Univerzalna logika za sve kvizove
 * Verzija: 1.1 (sa audio fajlovima)
 */

// Globalne varijable
let questions = [];
let currentQuestion = 0;
let score = 0;

/**
 * Zvučni efekat za odgovore
 * Koristi audio fajlove iz assets/sounds/
 */
function playSound(isCorrect) {
    try {
        const audio = new Audio(
            isCorrect 
                ? '../assets/sounds/correct.mp3' 
                : '../assets/sounds/wrong.mp3'
        );
        audio.volume = 0.5; // 50% volumena
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
 * Očekuje da postoji globalna varijabla: quizData
 * quizData = {
 *   allQuestions: [],  // Sva pitanja
 *   questionsToShow: 20  // Koliko pitanja prikazati
 * }
 */
function initQuiz() {
    // Provjeri da li postoji quizData
    if (typeof quizData === 'undefined') {
        console.error('quizData nije definisan! Svaki HTML mora imati quizData objekat.');
        return;
    }

    // Shuffle pitanja i uzmi prvih N
    const questionsToShow = quizData.questionsToShow || 20;
    questions = shuffleArray(quizData.allQuestions).slice(0, questionsToShow);
    
    // Shuffle opcije za svako pitanje, ali zadrži tačan odgovor
    questions.forEach(q => {
        const correctAnswer = q.answer;
        q.options = shuffleArray(q.options);
        q.answer = correctAnswer;
    });
    
    // Reset brojača
    currentQuestion = 0;
    score = 0;
    
    // Prikaži quiz screen
    document.getElementById('quizScreen').classList.add('active');
    document.getElementById('resultScreen').classList.remove('active');
    
    // Prikaži prvo pitanje
    showQuestion();
}

/**
 * Prikaz trenutnog pitanja
 */
function showQuestion() {
    const q = questions[currentQuestion];
    
    // Ažuriraj brojač pitanja
    document.getElementById('questionCounter').textContent = 
        `${currentQuestion + 1}/${questions.length}`;
    
    // Ažuriraj tekst pitanja
    document.getElementById('questionText').textContent = q.question;
    
    // Ažuriraj progress bar
    const progressPercentage = (currentQuestion / questions.length) * 100;
    document.getElementById('progressBar').style.width = `${progressPercentage}%`;
    
    // Kreiraj dugmad za opcije
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    q.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option;
        btn.onclick = () => selectAnswer(option);
        optionsContainer.appendChild(btn);
    });
}

/**
 * Odabir odgovora
 */
function selectAnswer(selected) {
    const q = questions[currentQuestion];
    const isCorrect = selected === q.answer;
    
    // Reprodukuj zvuk
    playSound(isCorrect);
    
    // Ako je tačno, povećaj score
    if (isCorrect) {
        score++;
    }
    
    // Označi sve dugmad
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
        btn.classList.add('disabled');
        
        // Označi tačan odgovor zeleno
        if (btn.textContent === q.answer) {
            btn.classList.add('correct');
        } 
        // Označi netačan odgovor crveno
        else if (btn.textContent === selected && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // Prikaži popup sa objašnjenjem
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
    // Zatvori popup
    document.getElementById('popupOverlay').classList.remove('active');
    
    // Povećaj brojač
    currentQuestion++;
    
    // Provjeri ima li još pitanja
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
    // Sakrij quiz screen, prikaži result screen
    document.getElementById('quizScreen').classList.remove('active');
    document.getElementById('resultScreen').classList.add('active');
    
    // Izračunaj procenat
    const percentage = Math.round((score / questions.length) * 100);
    
    // Prikaži score
    document.getElementById('resultScore').textContent = `${score}/${questions.length}`;
    document.getElementById('resultPercentage').textContent = `${percentage}% tačnih odgovora`;
    
    // Odredi emoji i poruku prema procentu
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
 * Auto-start kada se stranica učita
 */
document.addEventListener('DOMContentLoaded', function() {
    initQuiz();
});
