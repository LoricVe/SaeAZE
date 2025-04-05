// Types de questions possibles
const QUIZ_TYPES = {
    ACTOR_IN_MOVIE: 'actor_in_movie',
    MOVIE_BY_ACTOR: 'movie_by_actor',
    MOVIES_BY_YEAR: 'movies_by_year'
};

// État global du quiz
let currentQuiz = {
    type: null,
    question: '',
    answers: [],
    userAnswers: [],
    correctAnswers: [],
    timeLeft: 300, // 5 minutes
    timer: null,
    isComplete: false,
    hintsUsed: 0,
    maxHints: 3,
    hintsInfo: []
};

// Clé pour le localStorage
const QUIZ_STORAGE_KEY = 'movieQuizState';

// Fonction pour sauvegarder l'état du quiz dans localStorage
function saveQuizState() {
    // On crée une copie de l'état actuel sans le timer (qui ne peut pas être sérialisé)
    const quizStateToSave = { ...currentQuiz };
    delete quizStateToSave.timer; // Supprimer la référence au timer

    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(quizStateToSave));
}

// Fonction pour charger l'état du quiz depuis localStorage
function loadQuizState() {
    const savedState = localStorage.getItem(QUIZ_STORAGE_KEY);
    
    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            
            // Restaurer l'état (sans écraser le timer)
            currentQuiz = { 
                ...parsedState,
                timer: null // Réinitialiser le timer
            };
            
            return true; // État chargé avec succès
        } catch (error) {
            console.error('Erreur lors du chargement de l\'état du quiz:', error);
            return false;
        }
    }
    
    return false; // Pas d'état sauvegardé
}

// Fonction pour effacer l'état sauvegardé
function clearQuizState() {
    localStorage.removeItem(QUIZ_STORAGE_KEY);
}

// Fonction pour basculer vers le mode quiz
function switchToQuizMode() {
    isSearchMode = false;
    
    // Mise à jour de l'état des boutons
    document.getElementById('game-mode').classList.remove('active');
    document.getElementById('search-mode').classList.remove('active');
    document.getElementById('quiz-mode').classList.add('active');
    
    // Sauvegarder l'état actuel du game-area
    const originalGameArea = document.getElementById('game-area').innerHTML;
    
    // Afficher l'interface du quiz avec le système d'indices
    document.getElementById('game-area').innerHTML = `
        <div id="quiz-container">
            <div id="quiz-controls">
                <button id="start-quiz" class="primary-btn">Démarrer un nouveau quiz</button>
                <div id="quiz-type-selector" style="display: none;">
                    <h3>Sélectionnez un type de quiz :</h3>
                   <select id="quiz-type">
                    <option value="${QUIZ_TYPES.ACTOR_IN_MOVIE}">Acteurs dans un film spécifique</option>
                    <option value="${QUIZ_TYPES.MOVIE_BY_ACTOR}">Films avec un acteur spécifique</option>
                    <option value="${QUIZ_TYPES.MOVIES_BY_YEAR}">Films sortis une année spécifique</option>
</select>
                    <button id="generate-quiz" class="primary-btn">Générer le quiz</button>
                </div>
            </div>
            <div id="quiz-area" style="display: none;">
                <div id="quiz-header">
                    <h2 id="quiz-question"></h2>
                    <div id="quiz-info">
                        <div id="quiz-timer">Temps restant: <span id="timer-minutes">5</span> min <span id="timer-seconds">00</span> sec</div>
                        <div id="quiz-progress">Réponses: <span id="answers-count">0</span>/<span id="total-answers">0</span></div>
                        <div id="hint-info">Indices disponibles: <span id="hints-count">3</span></div>
                    </div>
                </div>
                <div id="quiz-input-area">
                    <input type="text" id="quiz-answer-input" placeholder="Entrez votre réponse...">
                    <button id="quiz-submit" class="primary-btn">Soumettre</button>
                    <button id="quiz-hint" class="hint-btn">Indice</button>
                </div>
                <div id="hint-display"></div>
                <div id="quiz-answers-container">
                    <h3>Réponses trouvées:</h3>
                    <ul id="found-answers"></ul>
                </div>
                <div id="quiz-results" style="display: none;">
                    <h3>Résultats du quiz</h3>
                    <div id="results-content"></div>
                    <button id="restart-quiz" class="primary-btn">Recommencer</button>
                </div>
            </div>
        </div>
    `;
    
    // Stocker l'état original pour pouvoir y revenir
    window.originalGameArea = originalGameArea;
    
    // Ajouter les écouteurs d'événements pour le quiz
    document.getElementById('start-quiz').addEventListener('click', startNewQuiz);
    document.getElementById('generate-quiz').addEventListener('click', generateQuiz);
    document.getElementById('quiz-submit').addEventListener('click', submitQuizAnswer);
    document.getElementById('quiz-hint').addEventListener('click', showHint);
    document.getElementById('restart-quiz').addEventListener('click', () => {
        clearQuizState(); // Effacer l'état sauvegardé
        document.getElementById('quiz-area').style.display = 'none';
        document.getElementById('quiz-type-selector').style.display = 'block';
        document.getElementById('quiz-results').style.display = 'none';
    });
    
    // Ajouter l'écouteur d'événements pour la touche Entrée
    document.getElementById('quiz-answer-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitQuizAnswer();
        }
    });
    
    // Vérifier s'il y a un quiz en cours
    if (loadQuizState() && currentQuiz.type && !currentQuiz.isComplete) {
        // Restaurer l'état du quiz
        restoreQuizInterface();
    }
}

// Fonction pour démarrer un nouveau quiz
function startNewQuiz() {
    // Effacer l'état du quiz précédent
    clearQuizState();
    showQuizTypeSelector();
}

// Fonction pour afficher le sélecteur de type de quiz
function showQuizTypeSelector() {
    document.getElementById('quiz-type-selector').style.display = 'block';
    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('quiz-results').style.display = 'none';
}

// Fonction pour restaurer l'interface du quiz avec l'état sauvegardé
function restoreQuizInterface() {
    // Mettre à jour l'interface avec les données sauvegardées
    document.getElementById('quiz-question').textContent = currentQuiz.question;
    document.getElementById('total-answers').textContent = currentQuiz.correctAnswers.length;
    document.getElementById('answers-count').textContent = currentQuiz.userAnswers.length;
    document.getElementById('hints-count').textContent = currentQuiz.maxHints - currentQuiz.hintsUsed;
    
    // Afficher la zone du quiz
    document.getElementById('quiz-type-selector').style.display = 'none';
    document.getElementById('quiz-area').style.display = 'block';
    document.getElementById('quiz-results').style.display = 'none';
    
    // Restaurer les réponses trouvées
    const foundAnswers = document.getElementById('found-answers');
    foundAnswers.innerHTML = '';
    currentQuiz.userAnswers.forEach(answer => {
        const li = document.createElement('li');
        li.textContent = answer.charAt(0).toUpperCase() + answer.slice(1);
        foundAnswers.appendChild(li);
    });
    
    // Restaurer les indices affichés
    const hintDisplay = document.getElementById('hint-display');
    hintDisplay.innerHTML = '';
    for (let i = 0; i < currentQuiz.hintsUsed; i++) {
        // Trouver un indice à afficher (peut être amélioré pour afficher les indices exacts utilisés)
        const unusedAnswers = currentQuiz.correctAnswers.filter(
            answer => !currentQuiz.userAnswers.includes(answer)
        );
        
        if (unusedAnswers.length > 0) {
            const index = Math.min(i, unusedAnswers.length - 1);
            const answer = unusedAnswers[index];
            const answerHintInfo = currentQuiz.hintsInfo.find(info => info.answer === answer);
            
            if (answerHintInfo && i < answerHintInfo.hints.length) {
                const hintElement = document.createElement('div');
                hintElement.className = 'hint-item';
                hintElement.innerHTML = `<strong>Indice ${i + 1}:</strong> ${answerHintInfo.hints[i]}`;
                hintDisplay.appendChild(hintElement);
            }
        }
    }
    
    // Mettre à jour l'affichage du minuteur
    updateTimerDisplay(currentQuiz.timeLeft);
    
    // Désactiver le bouton d'indice si tous les indices ont été utilisés
    document.getElementById('quiz-hint').disabled = currentQuiz.hintsUsed >= currentQuiz.maxHints;
    
    // Redémarrer le minuteur
    startQuizTimer();
}

// Fonction pour générer un quiz
async function generateQuiz() {
    try {
        const quizType = document.getElementById('quiz-type').value;
        
        // Réinitialiser l'état du quiz
        resetQuiz();
        currentQuiz.type = quizType;
        
        // Récupérer les données du quiz depuis l'API
        const response = await fetch(`/api/quiz/generate?type=${quizType}`);
        const quizData = await response.json();
        
        if (quizData.error) {
            throw new Error(quizData.error);
        }
        
        // Mettre à jour l'état du quiz avec les données reçues
        currentQuiz.question = quizData.question;
        currentQuiz.correctAnswers = quizData.answers.map(answer => 
            typeof answer === 'string' ? answer.toLowerCase() : answer.name.toLowerCase()
        );
        
        // Initialiser les informations d'indices pour chaque réponse
        currentQuiz.hintsInfo = currentQuiz.correctAnswers.map(answer => {
            return {
                answer: answer,
                // Créer des indices basiques (première lettre, longueur, etc.)
                hints: [
                    `Première lettre: ${answer.charAt(0).toUpperCase()}`,
                    `Nombre de lettres: ${answer.length}`,
                    `Commence par: ${answer.substring(0, 2).toUpperCase()}`
                ]
            };
        });
        
        // Afficher le quiz
        document.getElementById('quiz-question').textContent = quizData.question;
        document.getElementById('total-answers').textContent = currentQuiz.correctAnswers.length;
        document.getElementById('answers-count').textContent = 0;
        document.getElementById('hints-count').textContent = currentQuiz.maxHints;
        document.getElementById('quiz-type-selector').style.display = 'none';
        document.getElementById('quiz-area').style.display = 'block';
        document.getElementById('quiz-results').style.display = 'none';
        document.getElementById('hint-display').innerHTML = '';
        
        // Afficher le temps initial au format minutes:secondes
        updateTimerDisplay(currentQuiz.timeLeft);
        
        // Sauvegarder l'état initial
        saveQuizState();
        
        // Démarrer le minuteur
        startQuizTimer();
        
    } catch (error) {
        console.error('Erreur lors de la génération du quiz:', error);
        alert('Une erreur est survenue lors de la génération du quiz. Veuillez réessayer.');
    }
}

// Fonction pour réinitialiser l'état du quiz
function resetQuiz() {
    // Arrêter le minuteur s'il est en cours
    if (currentQuiz.timer) {
        clearInterval(currentQuiz.timer);
    }
    
    // Réinitialiser l'état
    currentQuiz = {
        type: null,
        question: '',
        answers: [],
        userAnswers: [],
        correctAnswers: [],
        timeLeft: 300,
        timer: null,
        isComplete: false,
        hintsUsed: 0,
        maxHints: 3,
        hintsInfo: []
    };
    
    // Effacer l'état sauvegardé
    clearQuizState();
    
    // Effacer l'interface
    document.getElementById('found-answers').innerHTML = '';
    document.getElementById('quiz-answer-input').value = '';
    document.getElementById('quiz-answer-input').disabled = false;
    document.getElementById('quiz-submit').disabled = false;
    document.getElementById('quiz-hint').disabled = false;
    
    // Réinitialiser l'affichage du minuteur
    updateTimerDisplay(currentQuiz.timeLeft);
    
    // Effacer les indices affichés
    if (document.getElementById('hint-display')) {
        document.getElementById('hint-display').innerHTML = '';
    }
}

// Fonction pour mettre à jour l'affichage du minuteur
function updateTimerDisplay(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    
    document.getElementById('timer-minutes').textContent = minutes;
    document.getElementById('timer-seconds').textContent = seconds < 10 ? `0${seconds}` : seconds;
}

// Fonction pour démarrer le minuteur du quiz
function startQuizTimer() {
    // Arrêter le minuteur existant s'il y en a un
    if (currentQuiz.timer) {
        clearInterval(currentQuiz.timer);
    }
    
    currentQuiz.timer = setInterval(() => {
        currentQuiz.timeLeft--;
        
        // Mettre à jour l'affichage du minuteur
        updateTimerDisplay(currentQuiz.timeLeft);
        
        // Sauvegarder l'état toutes les 10 secondes
        if (currentQuiz.timeLeft % 10 === 0) {
            saveQuizState();
        }
        
        if (currentQuiz.timeLeft <= 0 || currentQuiz.isComplete) {
            clearInterval(currentQuiz.timer);
            endQuiz();
        }
    }, 1000);
}

// Fonction pour soumettre une réponse
function submitQuizAnswer() {
    if (currentQuiz.isComplete) return;
    
    const answerInput = document.getElementById('quiz-answer-input');
    const answer = answerInput.value.trim().toLowerCase();
    
    if (!answer) return;
    
    // Vérifier si la réponse est correcte et n'a pas déjà été donnée
    if (currentQuiz.correctAnswers.includes(answer) && !currentQuiz.userAnswers.includes(answer)) {
        // Ajouter la réponse à la liste des réponses trouvées
        currentQuiz.userAnswers.push(answer);
        
        // Mettre à jour l'affichage
        const foundAnswers = document.getElementById('found-answers');
        const li = document.createElement('li');
        li.textContent = answer.charAt(0).toUpperCase() + answer.slice(1);
        foundAnswers.appendChild(li);
        
        // Mettre à jour le compteur
        document.getElementById('answers-count').textContent = currentQuiz.userAnswers.length;
        
        // Sauvegarder l'état après chaque bonne réponse
        saveQuizState();
        
        // Vérifier si toutes les réponses ont été trouvées
        if (currentQuiz.userAnswers.length === currentQuiz.correctAnswers.length) {
            currentQuiz.isComplete = true;
            saveQuizState(); // Sauvegarder l'état final
            clearInterval(currentQuiz.timer);
            setTimeout(endQuiz, 500);
        }
    }
    
    // Effacer le champ de saisie
    answerInput.value = '';
}

// Fonction pour afficher un indice
function showHint() {
    // Vérifier si le quiz est terminé ou si tous les indices ont été utilisés
    if (currentQuiz.isComplete || currentQuiz.hintsUsed >= currentQuiz.maxHints) {
        return;
    }
    
    // Déterminer quelles réponses n'ont pas encore été trouvées
    const missedAnswers = currentQuiz.correctAnswers.filter(
        answer => !currentQuiz.userAnswers.includes(answer)
    );
    
    if (missedAnswers.length === 0) {
        return; // Toutes les réponses ont été trouvées
    }
    
    // Sélectionner une réponse aléatoire parmi celles non trouvées
    const randomIndex = Math.floor(Math.random() * missedAnswers.length);
    const selectedAnswer = missedAnswers[randomIndex];
    
    // Trouver les infos d'indice pour cette réponse
    const answerHintInfo = currentQuiz.hintsInfo.find(info => info.answer === selectedAnswer);
    
    if (answerHintInfo && answerHintInfo.hints.length > 0) {
        // Sélectionner un indice basé sur le nombre d'indices déjà utilisés
        const hintIndex = Math.min(currentQuiz.hintsUsed, answerHintInfo.hints.length - 1);
        const hint = answerHintInfo.hints[hintIndex];
        
        // Afficher l'indice
        const hintDisplay = document.getElementById('hint-display');
        const hintElement = document.createElement('div');
        hintElement.className = 'hint-item';
        hintElement.innerHTML = `<strong>Indice ${currentQuiz.hintsUsed + 1}:</strong> ${hint}`;
        hintDisplay.appendChild(hintElement);
        
        // Mettre à jour le compteur d'indices
        currentQuiz.hintsUsed++;
        document.getElementById('hints-count').textContent = currentQuiz.maxHints - currentQuiz.hintsUsed;
        
        // Sauvegarder l'état après utilisation d'un indice
        saveQuizState();
        
        // Désactiver le bouton d'indice si tous les indices ont été utilisés
        if (currentQuiz.hintsUsed >= currentQuiz.maxHints) {
            document.getElementById('quiz-hint').disabled = true;
        }
    }
}

// Fonction pour terminer le quiz
function endQuiz() {
    // Arrêter le minuteur
    clearInterval(currentQuiz.timer);
    
    // Marquer le quiz comme terminé
    currentQuiz.isComplete = true;
    
    // Calculer le score
    const score = (currentQuiz.userAnswers.length / currentQuiz.correctAnswers.length) * 100;
    const formattedScore = Math.round(score);
    
    // Déterminer les réponses manquées
    const missedAnswers = currentQuiz.correctAnswers.filter(
        answer => !currentQuiz.userAnswers.includes(answer)
    );
    
    // Calculer le temps utilisé (en minutes et secondes)
    const totalTimeInSeconds = 300 - currentQuiz.timeLeft;
    const minutesUsed = Math.floor(totalTimeInSeconds / 60);
    const secondsUsed = totalTimeInSeconds % 60;
    const timeUsedFormatted = `${minutesUsed} min ${secondsUsed < 10 ? '0' : ''}${secondsUsed} sec`;
    
    // Afficher les résultats
    const resultsContent = document.getElementById('results-content');
    resultsContent.innerHTML = `
        <div class="score-display">
            <h2>Score: ${formattedScore}%</h2>
            <p>Vous avez trouvé ${currentQuiz.userAnswers.length} sur ${currentQuiz.correctAnswers.length} réponses.</p>
            <p>Temps utilisé: ${timeUsedFormatted} sur 5 min 00 sec</p>
            <p>Indices utilisés: ${currentQuiz.hintsUsed} sur ${currentQuiz.maxHints}</p>
        </div>
    `;
    
    // Afficher les réponses manquées s'il y en a
    if (missedAnswers.length > 0) {
        const missedList = document.createElement('div');
        missedList.className = 'missed-answers';
        missedList.innerHTML = `
            <h4>Réponses que vous avez manquées:</h4>
            <ul>
                ${missedAnswers.map(answer => 
                    `<li>${answer.charAt(0).toUpperCase() + answer.slice(1)}</li>`
                ).join('')}
            </ul>
        `;
        resultsContent.appendChild(missedList);
    }
    
    // Afficher la section de résultats
    document.getElementById('quiz-results').style.display = 'block';
    
    // Désactiver l'entrée de réponses
    document.getElementById('quiz-answer-input').disabled = true;
    document.getElementById('quiz-submit').disabled = true;
    document.getElementById('quiz-hint').disabled = true;
    
    // Sauvegarder l'état final du quiz (pour l'historique)
    saveQuizState();
}

// Ajouter un gestionnaire d'événements pour la page "beforeunload"
window.addEventListener('beforeunload', () => {
    // Sauvegarder l'état du quiz si un quiz est en cours et non terminé
    if (currentQuiz.type && !currentQuiz.isComplete) {
        saveQuizState();
    }
});

// Ajouter au code existant
document.addEventListener('DOMContentLoaded', () => {
    const existingDOMLoaded = document.removeEventListener;
    
    // Ajouter un écouteur d'événements pour le bouton de mode quiz
    document.getElementById('quiz-mode')?.addEventListener('click', () => switchToQuizMode());
});

// Fonction pour mettre à jour le graphe avec les résultats du quiz
function updateGraphWithQuizResults(data) {
    // Réutilisation de la fonction updateGraph existante avec les données du quiz
    const nodes = [];
    const links = [];
    
    if (data.centerNode) {
        // Ajouter le nœud central
        nodes.push({
            id: data.centerNode.id,
            name: data.centerNode.name || data.centerNode.title,
            displayName: data.centerNode.title ? `${data.centerNode.title} (${data.centerNode.year})` : data.centerNode.name,
            isCenter: true,
            type: data.centerNode.type
        });
        
        // Ajouter les nœuds liés
        if (data.relatedNodes && Array.isArray(data.relatedNodes)) {
            data.relatedNodes.forEach(node => {
                nodes.push({
                    id: node.id,
                    name: node.name || node.title,
                    displayName: node.title ? `${node.title} (${node.year})` : node.name,
                    type: node.type
                });
                
                // Créer un lien entre le nœud central et ce nœud
                links.push({
                    source: data.centerNode.id,
                    target: node.id
                });
            });
        }
    }
    
    // Utiliser la fonction existante pour mettre à jour le graphe
    if (typeof updateGraph === 'function' && nodes.length > 0) {
        updateGraph(nodes, links);
    }
}