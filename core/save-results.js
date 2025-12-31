/**
 * MEKTEB AUTO-SAVE RESULTS
 * Automatski sprema rezultate kviza u WordPress bazu
 * Dodaj OVAJ script na kraju SVAKOG kviza (prije </body>)
 */

(function() {
    const API_URL = 'https://mekteb.net/wp-json/mekteb/v1';
    
    console.log('🔌 Auto-save modul učitan');
    
    /**
     * Provjerava da li je korisnik prijavljen
     */
    function isUserLoggedIn() {
        const userData = localStorage.getItem('mektebUser');
        if (!userData) {
            console.log('⚠️ Korisnik nije prijavljen - rezultat neće biti spremljen');
            return false;
        }
        try {
            const user = JSON.parse(userData);
            return user && user.id;
        } catch (e) {
            console.error('❌ Greška pri čitanju user podataka:', e);
            return false;
        }
    }
    
    /**
     * Detektuje naziv kviza iz URL-a ili stranice
     */
    function getQuizName() {
        // Pokušaj iz URL-a (npr. /nivo1/1a.html -> "1A")
        const urlPath = window.location.pathname;
        const match = urlPath.match(/\/([^\/]+)\.html$/);
        if (match) {
            return match[1].toUpperCase();
        }
        
        // Pokušaj iz title taga
        const title = document.title;
        const titleMatch = title.match(/KVIZ\s+([^\s-]+)/i);
        if (titleMatch) {
            return titleMatch[1].toUpperCase();
        }
        
        // Fallback
        return 'UNKNOWN';
    }
    
    /**
     * Sprema rezultat u WordPress bazu
     */
    async function saveResult(score, total, time) {
        if (!isUserLoggedIn()) {
            console.log('⏭️ Preskačem spremanje - korisnik nije prijavljen');
            return;
        }
        
        const userData = JSON.parse(localStorage.getItem('mektebUser'));
        const quizName = getQuizName();
        
        const payload = {
            user_id: userData.id,
            quiz: quizName,
            score: score,
            total: total,
            time: time
        };
        
        console.log('💾 Spremam rezultat:', payload);
        
        try {
            const response = await fetch(API_URL + '/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Rezultat uspješno spremljen!');
                console.log('   User:', userData.name);
                console.log('   Kviz:', quizName);
                console.log('   Rezultat:', score + '/' + total);
                console.log('   Vrijeme:', time + 's');
            } else {
                console.error('❌ API vratio grešku:', data.message);
            }
        } catch (error) {
            console.error('🔥 Greška pri spremanju:', error);
        }
    }
    
    /**
     * DETEKTOVANJE ZAVRŠETKA KVIZA
     * 
     * Ova funkcija pokušava detektovati kada se kviz završi
     * i automatski sprema rezultat.
     */
    
    // Metoda 1: Slušaj za pritiskom dugmeta "Završi kviz" ili slično
    document.addEventListener('click', function(e) {
        const target = e.target;
        
        // Ako je kliknuto dugme sa tekstom koji ukazuje na kraj kviza
        if (target.tagName === 'BUTTON' || target.classList.contains('submit-btn')) {
            const btnText = target.textContent.toLowerCase();
            
            if (btnText.includes('završi') || btnText.includes('submit') || btnText.includes('provjeri')) {
                console.log('🎯 Detektovan klik na završno dugme');
                
                // Pričekaj malo da se rezultat izračuna
                setTimeout(checkAndSaveResult, 1000);
            }
        }
    });
    
    /**
     * Pokušaj pronaći rezultat na stranici
     */
    function checkAndSaveResult() {
        // Traži div/span sa rezultatom
        // Primjer: "Vaš rezultat: 18/20" ili "Tačnih odgovora: 18"
        
        let score = null;
        let total = null;
        let time = 0;
        
        // Metoda 1: Traži u tekstu stranice
        const bodyText = document.body.innerText;
        
        // Pattern: "18/20", "18 od 20", "Tačnih: 18/20"
        const patterns = [
            /(\d+)\s*\/\s*(\d+)/,
            /(\d+)\s+od\s+(\d+)/i,
            /tačnih[:\s]*(\d+)\s*\/\s*(\d+)/i,
            /score[:\s]*(\d+)\s*\/\s*(\d+)/i
        ];
        
        for (let pattern of patterns) {
            const match = bodyText.match(pattern);
            if (match) {
                score = parseInt(match[1]);
                total = parseInt(match[2]);
                console.log('✅ Pronađen rezultat:', score + '/' + total);
                break;
            }
        }
        
        // Metoda 2: Traži u specifičnim elementima
        if (score === null) {
            // Traži elemente sa id/class koji mogu sadržavati rezultat
            const resultElements = document.querySelectorAll(
                '#result, #score, .result, .score, .final-score, [id*="result"], [class*="result"]'
            );
            
            resultElements.forEach(el => {
                const text = el.textContent;
                const match = text.match(/(\d+)\s*\/\s*(\d+)/);
                if (match) {
                    score = parseInt(match[1]);
                    total = parseInt(match[2]);
                    console.log('✅ Pronađen rezultat u elementu:', el.tagName, score + '/' + total);
                }
            });
        }
        
        // Metoda 3: Provjeri globalnu JavaScript varijablu (ako postoji)
        if (typeof window.quizScore !== 'undefined' && typeof window.quizTotal !== 'undefined') {
            score = window.quizScore;
            total = window.quizTotal;
            console.log('✅ Pronađen rezultat u globalnim varijablama:', score + '/' + total);
        }
        
        // Pokušaj pronaći vrijeme
        const timeMatch = bodyText.match(/(\d+)\s*sekund/i);
        if (timeMatch) {
            time = parseInt(timeMatch[1]);
        }
        
        // Ako smo uspjeli pronaći rezultat, spremi ga
        if (score !== null && total !== null) {
            console.log('📊 Spreman za spremanje:', { score, total, time });
            saveResult(score, total, time);
        } else {
            console.log('⚠️ Nisam mogao pronaći rezultat na stranici');
            console.log('   Možeš ručno pozvati: window.mektebSaveResult(score, total, time)');
        }
    }
    
    /**
     * Javna funkcija za ručno spremanje
     * Kvizovi mogu direktno pozvati: window.mektebSaveResult(18, 20, 180)
     */
    window.mektebSaveResult = function(score, total, time = 0) {
        console.log('📞 Ručno pozvano spremanje rezultata');
        saveResult(score, total, time);
    };
    
    console.log('✅ Auto-save modul spreman');
    console.log('   📌 Za ručno spremanje pozovi: window.mektebSaveResult(score, total, time)');
})();
