let currentGame = null;
let simulation = null;
let svg = null;
let isSearchMode = false;
let gameState = {
    currentQuestion: 1,
    totalQuestions: 10,
    score: 0,
    isGameActive: false
};

// Fonction pour sauvegarder l'état du jeu dans localStorage
function saveGameState() {
    if (gameState.isGameActive) {
        const saveData = {
            gameState,
            currentGame,
            isSearchMode
        };
        localStorage.setItem('cinemaGameData', JSON.stringify(saveData));
        console.log('État du jeu sauvegardé:', saveData);
    }
}

// Fonction pour charger l'état du jeu depuis localStorage
function loadGameState() {
    const savedData = localStorage.getItem('cinemaGameData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            gameState = parsedData.gameState;
            currentGame = parsedData.currentGame;
            isSearchMode = parsedData.isSearchMode;
            
            console.log('État du jeu chargé:', parsedData);
            
            // Mise à jour de l'interface utilisateur avec les données chargées
            if (gameState.isGameActive) {
                document.getElementById('game-info').style.display = 'flex';
                document.getElementById('question-number').textContent = gameState.currentQuestion;
                document.getElementById('current-score').textContent = gameState.score;
                
                // Si nous sommes en mode jeu
                if (!isSearchMode) {
                    document.getElementById('puzzle-area').style.display = 'block';
                    document.getElementById('search-area').style.display = 'none';
                    document.getElementById('game-mode').classList.add('active');
                    document.getElementById('search-mode').classList.remove('active');
                    
                    // Recréer le graph avec les données existantes
                    if (currentGame && currentGame.target) {
                        recreateCurrentGameGraph();
                    }
                } else {
                    document.getElementById('puzzle-area').style.display = 'none';
                    document.getElementById('search-area').style.display = 'block';
                    document.getElementById('game-mode').classList.remove('active');
                    document.getElementById('search-mode').classList.add('active');
                }
            }
            
            return true;
        } catch (error) {
            console.error('Erreur lors du chargement des données sauvegardées:', error);
            return false;
        }
    }
    return false;
}

// Fonction pour recréer le graphe actuel du jeu
async function recreateCurrentGameGraph() {
    try {
        if (!currentGame || !currentGame.target) {
            console.error("Impossible de recréer le graphe: données incomplètes");
            return;
        }
        
        // Obtention des détails supplémentaires pour recréer le graphe
        const type = currentGame.type;
        const id = currentGame.target.id;
        
        // Ici, changez "data.type" à "type" et "data.data.id" à "id"
        const detailsResponse = await fetch(`/api/${type}s/${id}/details`);
        const details = await detailsResponse.json();
        
        // Créer des nœuds et des liens
        const nodes = [];
        const links = [];
        
        if (type === 'movie') {
            // Nœud central du film
            nodes.push({
                id: details.movie.id,
                name: details.movie.title,
                displayName: `${details.movie.title} (${details.movie.year})`,
                type: 'movie',
                isCenter: true,
                year: details.movie.year,
                imageUrl: details.movie.imageUrl,
                extract: details.movie.extract
            });
            
            // Acteurs
            if (details.actors && Array.isArray(details.actors)) {
                details.actors.forEach(actor => {
                    nodes.push({
                        ...actor,
                        type: 'actor',
                        imageUrl: actor.photoUrl,
                        biography: actor.biography
                    });
                    links.push({
                        source: details.movie.id,
                        target: actor.id
                    });
                });
            }
        } else {
            // Nœud central de l'acteur
            nodes.push({
                id: details.actor.id,
                name: details.actor.name,
                type: 'actor',
                isCenter: true,
                imageUrl: details.actor.photoUrl,
                biography: details.actor.biography
            });
            
            // Films
            if (details.movies && Array.isArray(details.movies)) {
                details.movies.forEach(movie => {
                    nodes.push({
                        id: movie.id,
                        name: movie.title,
                        displayName: `${movie.title} (${movie.year})`,
                        type: 'movie',
                        year: movie.year,
                        imageUrl: movie.imageUrl,
                        extract: movie.extract
                    });
                    links.push({
                        source: details.actor.id,
                        target: movie.id
                    });
                });
            }
        }
        
        // Mettre à jour le graphe
        updateGraph(nodes, links);
        
        // Restaurer la question
        document.getElementById('question').textContent = 
            `Quel est le nom de ce ${type === 'movie' ? 'film' : 'acteur'} ?`;
        
    } catch (error) {
        console.error('Erreur lors de la recréation du graphe:', error);
        showError('Erreur lors du chargement du jeu sauvegardé');
    }
}

// Initialiser le graphe D3
function initGraph() {
    const width = document.getElementById('graph-container').clientWidth;
    const height = document.getElementById('graph-container').clientHeight;
    
    svg = d3.select('#graph-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2));
}

// Mettre à jour le graphe
function updateGraph(nodes, links) {
    const width = document.getElementById('graph-container').clientWidth;
    const height = document.getElementById('graph-container').clientHeight;
    
    // Effacer le contenu existant
    svg.selectAll('*').remove();
    
    // Créer les lignes de connexion
    const link = svg.append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('class', 'link');
    
    // Créer les groupes de nœuds
    const node = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    // Ajouter les cercles des nœuds
    node.append('circle')
        .attr('r', d => d.isCenter ? 30 : 20)
        .style('fill', d => d.isCenter ? '#ff7f0e' : '#0ECBFF');
    
    // Ajouter le texte des nœuds
    node.append('text')
        .attr('dy', 4)
        .attr('text-anchor', 'middle')
        .text(d => d.displayName || d.name)
        .style('fill', 'black')
        .style('font-size', '12px');
    
    // Mettre à jour la simulation
    simulation.nodes(nodes);
    simulation.force('link').links(links);
    simulation.alpha(1).restart();
    
    // Mettre à jour les positions
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        node
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Ajouter l'événement de clic
    node.on('click', (event, d) => {
        if (!d.isCenter) {
            showNodeDetails(d);
        }
    });
}

// Gestionnaires d'événements de glissement
function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
}

function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
}

function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
}

// Afficher les détails du nœud
function showNodeDetails(node) {
    console.log('Afficher les détails du nœud:', node);
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';
    
    const details = document.createElement('div');
    details.className = 'node-details';
    
    if (node.type === 'movie') {
        console.log('Données du nœud film:', {
            name: node.name,
            year: node.year,
            imageUrl: node.imageUrl,
            extract: node.extract
        });
        
        details.innerHTML = `
            <h3>${node.name} (${node.year})</h3>
            ${node.imageUrl ? 
                `<img src="${node.imageUrl}" alt="${node.name} poster" class="node-image">` : 
                '<p class="no-image">Aucune affiche trouvée</p>'
            }
            ${node.extract ? 
                `<div class="extract">
                    <h4>Description</h4>
                    <p>${node.extract}</p>
                </div>` : 
                '<p class="no-extract">Aucune description disponible</p>'
            }
        `;
    } else if (node.type === 'actor') {
        console.log('Données du nœud acteur:', {
            name: node.name,
            imageUrl: node.imageUrl,
            biography: node.biography
        });
        
        details.innerHTML = `
            <h3>${node.name}</h3>
            ${node.imageUrl ? 
                `<img src="${node.imageUrl}" alt="${node.name} photo" class="node-image">` : 
                '<p class="no-image">Aucune photo trouvée</p>'
            }
            ${node.biography ? 
                `<div class="biography">
                    <h4>Biographie</h4>
                    <p>${node.biography}</p>
                </div>` : 
                '<p class="no-biography">Aucune biographie disponible</p>'
            }
        `;
    } else if (node.type === 'genre') {
        details.innerHTML = `
            <h3>Genre: ${node.name}</h3>
        `;
    }
    
    resultDiv.appendChild(details);
}

// Vérifier la réponse
async function verifyAnswer() {
    const answerInput = document.getElementById('answer-input');
    const answer = answerInput.value.trim();
    
    if (!answer) {
        showError('Veuillez entrer une réponse');
        return;
    }
    
    try {
        const response = await fetch('/api/game/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: currentGame.type,
                id: currentGame.target.id,
                answer: answer
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            showError(result.error);
            return;
        }
        
        // Mettre à jour le score
        if (result.correct) {
            gameState.score++;
            document.getElementById('current-score').textContent = gameState.score;
        }
        
        // Afficher le résultat
        document.getElementById('result').innerHTML = `
            <div class="${result.correct ? 'success-message' : 'error-message'}">
                <p>${result.correct ? 
                    'Correct !' : 
                    `Incorrect. La réponse correcte était : ${result.correctAnswer}`
                }</p>
            </div>
        `;
        
        // Désactiver l'entrée et les boutons
        answerInput.disabled = true;
        document.getElementById('submit-answer').disabled = true;
        document.getElementById('skip-question').disabled = true;
        
        // Vérifier si le jeu est terminé
        gameState.currentQuestion++;
        
        // Sauvegarder l'état du jeu
        saveGameState();
        
        if (gameState.currentQuestion > gameState.totalQuestions) {
            setTimeout(() => {
                endGame();
            }, 2000);
        } else {
            // Mettre à jour le numéro de la question
            document.getElementById('question-number').textContent = gameState.currentQuestion;
            // Commencer la prochaine question après 2 secondes
            setTimeout(() => {
                answerInput.value = '';
                answerInput.disabled = false;
                document.getElementById('submit-answer').disabled = false;
                document.getElementById('skip-question').disabled = false;
                document.getElementById('result').innerHTML = '';
                startNewQuestion();
            }, 2000);
        }
        
    } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        showError('Erreur lors de la vérification, essayez à nouveau');
    }
}

// Changer de mode
function switchMode(mode) {
    isSearchMode = mode === 'search';
    const gameModeBtn = document.getElementById('game-mode');
    const searchModeBtn = document.getElementById('search-mode');
    const startButton = document.getElementById('start-game');
    const questionDiv = document.getElementById('question');
    const inputArea = document.getElementById('input-area');
    const submitButton = document.getElementById('submit-answer');
    
    // Mettre à jour l'état des boutons
    gameModeBtn.classList.toggle('active', !isSearchMode);
    searchModeBtn.classList.toggle('active', isSearchMode);
    
    if (isSearchMode) {
        startButton.style.display = 'none';
        questionDiv.textContent = 'Entrez un nom de film ou d\'acteur pour rechercher:';
        inputArea.innerHTML = `
            <input type="text" id="search-input" placeholder="Entrez un nom de film ou d'acteur...">
            <button id="search-button">Rechercher</button>
        `;
        submitButton.style.display = 'none';
        
        // Ajouter les écouteurs d'événements de recherche
        document.getElementById('search-button').addEventListener('click', performSearch);
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    } else {
        startButton.style.display = 'block';
        questionDiv.textContent = '';
        inputArea.innerHTML = `
            <input type="text" id="answer-input" placeholder="Entrez votre réponse...">
            <button id="submit-answer">Soumettre</button>
        `;
        submitButton.style.display = 'block';
        
        // Supprimer les écouteurs d'événements de recherche
        document.getElementById('search-button')?.removeEventListener('click', performSearch);
        document.getElementById('search-input')?.removeEventListener('keypress', performSearch);
    }
    
    // Sauvegarder l'état du mode
    saveGameState();
}

// Effectuer la recherche
async function performSearch() {
    const searchTerm = document.getElementById('search-input').value.trim();
    if (!searchTerm) {
        console.log('Terme de recherche vide');
        return;
    }
    
    // Récupérer le type de recherche
    const searchType = document.querySelector('input[name="search-type"]:checked').value;
    console.log('Type de recherche:', searchType);
    console.log('Terme de recherche:', searchTerm);
    
    try {
        const url = `/api/search?query=${encodeURIComponent(searchTerm)}&type=${searchType}`;
        console.log('URL de requête:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Résultats de la recherche:', data);
        
        if (data.error) {
            document.getElementById('result').innerHTML = `
                <div class="error-message">
                    <p>${data.error}</p>
                </div>
            `;
            return;
        }
        
        // Créer les nœuds et les connexions
        const nodes = [];
        const links = [];
        
        if (data.type === 'movie' && data.results && data.results.length > 0) {
            const movie = data.results[0];  // utiliser le premier film correspondant
            console.log('Données de résultat films:', movie);
            
            // Ajouter le nœud du film
            nodes.push({
                id: movie.id,
                name: movie.title,
                displayName: `${movie.title} (${movie.year})`,
                isCenter: true,
                type: 'movie',
                year: movie.year,
                imageUrl: movie.imageUrl,
                extract: movie.extract
            });
            
            // Ajouter les nœuds des acteurs
            if (movie.Actors && Array.isArray(movie.Actors)) {
                console.log('Données de résultat acteurs:', movie.Actors);
                movie.Actors.forEach(actor => {
                    nodes.push({
                        id: actor.id,
                        name: actor.name,
                        type: 'actor',
                        imageUrl: actor.photoUrl,
                        biography: actor.biography
                    });
                    links.push({
                        source: movie.id,
                        target: actor.id
                    });
                });
            }
            
            // Ajouter les nœuds des genres
            if (movie.Genres && Array.isArray(movie.Genres)) {
                console.log('Données de résultat genres:', movie.Genres);
                movie.Genres.forEach((genre, index) => {
                    const genreId = `genre_${index}`;
                    nodes.push({
                        id: genreId,
                        name: genre.genre,
                        type: 'genre'
                    });
                    links.push({
                        source: movie.id,
                        target: genreId
                    });
                });
            }
        } else if (data.type === 'actor' && data.results && data.results.length > 0) {
            const actor = data.results[0];  // utiliser le premier acteur correspondant
            console.log('Données de résultat acteurs:', actor);
            
            // Ajouter le nœud de l'acteur
            nodes.push({
                id: actor.id,
                name: actor.name,
                isCenter: true,
                type: 'actor',
                imageUrl: actor.photoUrl,
                biography: actor.biography
            });
            
            // Ajouter les nœuds des films
            if (actor.Movies && Array.isArray(actor.Movies)) {
                console.log('Données de résultat films:', actor.Movies);
                actor.Movies.forEach(movie => {
                    nodes.push({
                        id: movie.id,
                        name: movie.title,
                        displayName: `${movie.title} (${movie.year})`,
                        type: 'movie',
                        year: movie.year,
                        imageUrl: movie.imageUrl,
                        extract: movie.extract
                    });
                    links.push({
                        source: actor.id,
                        target: movie.id
                    });
                    
                    // Ajouter les genres pour chaque film
                    if (movie.Genres && Array.isArray(movie.Genres)) {
                        movie.Genres.forEach((genre, index) => {
                            const genreId = `${movie.id}_genre_${index}`;
                            nodes.push({
                                id: genreId,
                                name: genre.genre,
                                type: 'genre'
                            });
                            links.push({
                                source: movie.id,
                                target: genreId
                            });
                        });
                    }
                });
            }
        } else {
            console.log('Aucun résultat trouvé');
            document.getElementById('result').innerHTML = `
                <div class="error-message">
                    <p>Aucun résultat trouvé</p>
                </div>
            `;
            return;
        }
        
        console.log('Nœuds créés:', nodes);
        console.log('Liens créés:', links);
        
        // Mettre à jour le graphe
        updateGraph(nodes, links);
        
        // Afficher les informations détaillées
        const searchResult = document.getElementById('search-result');
        if (data.type === 'movie' && data.results && data.results.length > 0) {
            const movie = data.results[0];
            searchResult.innerHTML = `
                <div class="search-details">
                    <h2>${movie.title} (${movie.year})</h2>
                    ${movie.imageUrl ? 
                        `<img src="${movie.imageUrl}" alt="${movie.title} poster" class="detail-image">` : 
                        '<p class="no-image">Aucune affiche trouvée</p>'
                    }
                    ${movie.extract ? 
                        `<div class="detail-extract">
                            <h3>Description</h3>
                            <p>${movie.extract}</p>
                        </div>` : 
                        '<p class="no-extract">Aucune description disponible</p>'
                    }
                    ${movie.Actors && movie.Actors.length > 0 ? 
                        `<div class="detail-actors">
                            <h3>Acteurs principaux</h3>
                            <ul>
                                ${movie.Actors.map(actor => `<li>${actor.name}</li>`).join('')}
                            </ul>
                        </div>` : 
                        ''
                    }
                </div>
            `;
        } else if (data.type === 'actor' && data.results && data.results.length > 0) {
            const actor = data.results[0];
            searchResult.innerHTML = `
                <div class="search-details">
                    <h2>${actor.name}</h2>
                    ${actor.photoUrl ? 
                        `<img src="${actor.photoUrl}" alt="${actor.name} photo" class="detail-image">` : 
                        '<p class="no-image">Aucune photo trouvée</p>'
                    }
                    ${actor.biography ? 
                        `<div class="detail-biography">
                            <h3>Biographie</h3>
                            <p>${actor.biography}</p>
                        </div>` : 
                        '<p class="no-biography">Aucune biographie disponible</p>'
                    }
                    ${actor.Movies && actor.Movies.length > 0 ? 
                        `<div class="detail-movies">
                            <h3>Films principaux</h3>
                            <ul>
                                ${actor.Movies.map(movie => `<li>${movie.title} (${movie.year})</li>`).join('')}
                            </ul>
                        </div>` : 
                        ''
                    }
                </div>
            `;
        } else {
            searchResult.innerHTML = `
                <div class="error-message">
                    <p>Aucun résultat trouvé</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Erreur de recherche:', error);
        document.getElementById('search-result').innerHTML = `
            <div class="error-message">
                <p>Erreur de recherche, essayez à nouveau</p>
            </div>
        `;
    }
}

// Démarrer une nouvelle partie
async function startGame() {
    try {
        // Réinitialiser l'état du jeu
        gameState = {
            currentQuestion: 1,
            totalQuestions: 10,
            score: 0,
            isGameActive: true
        };
        
        // Supprimer les données de jeu précédentes
        localStorage.removeItem('cinemaGameData');
        
        // Mettre à jour l'interface utilisateur
        document.getElementById('game-info').style.display = 'flex';
        document.getElementById('question-number').textContent = gameState.currentQuestion;
        document.getElementById('current-score').textContent = gameState.score;
        document.getElementById('answer-input').disabled = false;
        document.getElementById('submit-answer').disabled = false;
        document.getElementById('skip-question').disabled = false;
        
        // Commencer la première question
        await startNewQuestion();
        
    } catch (error) {
        console.error('Erreur lors du démarrage du jeu:', error);
        showError('Erreur lors du démarrage du jeu, essayez à nouveau');
    }
}

// Fonction pour démarrer une nouvelle question
async function startNewQuestion() {
    try {
        const response = await fetch('/api/game/random');
        const data = await response.json();
        
        if (data.error) {
            showError(data.error);
            return;
        }
        
        // Créer un tableau initial de nœuds et de liens
        const nodes = [{
            id: data.data.id,
            name: data.type === 'movie' ? data.data.title : data.data.name,
            type: data.type,
            isCenter: true
        }];
        const links = [];
        
        // Obtenir des informations détaillées
        const detailsResponse = await fetch(`/api/${data.type}s/${data.data.id}/details`);
        const details = await detailsResponse.json();
        
        // Mettre à jour les informations sur les nœuds
        if (data.type === 'movie') {
            nodes[0] = {
                ...nodes[0],
                name: details.movie.title,
                displayName: `${details.movie.title} (${details.movie.year})`,
                year: details.movie.year,
                imageUrl: details.movie.imageUrl,
                extract: details.movie.extract
            };
            
            // Ajouter les nœuds d'acteurs
            if (details.actors && Array.isArray(details.actors)) {
                details.actors.forEach(actor => {
                    nodes.push({
                        ...actor,
                        type: 'actor',
                        imageUrl: actor.photoUrl,
                        biography: actor.biography
                    });
                    links.push({
                        source: nodes[0].id,
                        target: actor.id
                    });
                });
            }
        } else {
            nodes[0] = {
                ...nodes[0],
                name: details.actor.name,
                imageUrl: details.actor.photoUrl,
                biography: details.actor.biography
            };
            
            // Ajouter les nœuds de films
            if (details.movies && Array.isArray(details.movies)) {
                details.movies.forEach(movie => {
                    nodes.push({
                        id: movie.id,
                        name: movie.title,
                        displayName: `${movie.title} (${movie.year})`,
                        type: 'movie',
                        year: movie.year,
                        imageUrl: movie.imageUrl,
                        extract: movie.extract
                    });
                    links.push({
                        source: nodes[0].id,
                        target: movie.id
                    });
                });
            }
        }
        
        // Mettre à jour le graphe
        updateGraph(nodes, links);
        
        // Définir l'état actuel du jeu
        currentGame = {
            target: nodes[0],
            type: data.type
        };
        
        // Afficher la question
        document.getElementById('question').textContent = 
            `Quel est le nom de ce ${data.type === 'movie' ? 'film' : 'acteur'} ?`;
        
        // Sauvegarder l'état du jeu
        saveGameState();
        
    } catch (error) {
        console.error('Erreur lors du démarrage de la question:', error);
        showError('Erreur lors du démarrage de la question, essayez à nouveau');
    }
}

// Fonction pour passer une question
function skipQuestion() {
    if (!gameState.isGameActive) return;
    
    // Désactiver l'entrée et les boutons
    document.getElementById('answer-input').disabled = true;
    document.getElementById('submit-answer').disabled = true;
    document.getElementById('skip-question').disabled = true;
    
    // Afficher le message de passage
    document.getElementById('result').innerHTML = `
        <div class="error-message">
            <p>Question passée</p>
        </div>
    `;
    
    // Vérifier si le jeu est terminé
    gameState.currentQuestion++;
    
    // Sauvegarder l'état du jeu
    saveGameState();
    
    if (gameState.currentQuestion > gameState.totalQuestions) {
        setTimeout(() => {
            endGame();
        }, 2000);
    } else {
        // Mettre à jour le numéro de la question
        document.getElementById('question-number').textContent = gameState.currentQuestion;
        // Démarrer la question suivante après 2 secondes
        setTimeout(() => {
            document.getElementById('answer-input').value = '';
            document.getElementById('answer-input').disabled = false;
            document.getElementById('submit-answer').disabled = false;
            document.getElementById('skip-question').disabled = false;
            document.getElementById('result').innerHTML = '';
            startNewQuestion();
        }, 2000);
    }
}

// 添加结束游戏函数
function endGame() {
    gameState.isGameActive = false;
    
    // 计算得分百分比
    const percentage = (gameState.score / gameState.totalQuestions) * 100;
    
    // 使用 SweetAlert2 显示结果
    Swal.fire({
        title: 'Game Over!',
        html: `
            <div class="score-result">
                <p>Votre score: ${gameState.score}/${gameState.totalQuestions}</p>
                <p>Pourcentage: ${percentage}%</p>
            </div>
        `,
        icon: percentage >= 70 ? 'success' : percentage >= 40 ? 'warning' : 'error',
        confirmButtonText: 'Play Again',
        showCancelButton: true,
        cancelButtonText: 'Quit'
    }).then((result) => {
        if (result.isConfirmed) {
            startGame();
        } else {
            // 重置游戏状态
            document.getElementById('game-info').style.display = 'none';
            document.getElementById('result').innerHTML = '';
            document.getElementById('answer-input').value = '';
            document.getElementById('answer-input').disabled = false;
            document.getElementById('submit-answer').disabled = false;
            document.getElementById('skip-question').disabled = false;
        }
    });
}

// 添加错误显示函数
function showError(message) {
    document.getElementById('result').innerHTML = `
        <div class="error-message">
            <p>${message}</p>
        </div>
    `;
}

// Écouteurs d'événements
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('game-mode').addEventListener('click', () => {
        document.getElementById('puzzle-area').style.display = 'block';
        document.getElementById('search-area').style.display = 'none';
        document.getElementById('game-mode').classList.add('active');
        document.getElementById('search-mode').classList.remove('active');
    });
    document.getElementById('search-mode').addEventListener('click', () => {
        document.getElementById('puzzle-area').style.display = 'none';
        document.getElementById('search-area').style.display = 'block';
        document.getElementById('game-mode').classList.remove('active');
        document.getElementById('search-mode').classList.add('active');
    });
    document.getElementById('quiz-mode').addEventListener('click', () => {
        document.getElementById('puzzle-area').style.display = 'block';
        document.getElementById('search-area').style.display = 'none';

        document.getElementById('game-mode').classList.remove('active');
        document.getElementById('search-mode').classList.remove('active');
        document.getElementById('quiz-mode').classList.add('active');
    });
    
    // 添加搜索按钮事件监听器
    document.getElementById('search-button').addEventListener('click', performSearch);
    
    // 添加搜索输入框回车事件监听器
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 添加跳过按钮事件监听器
    document.getElementById('skip-question').addEventListener('click', skipQuestion);
    
    // 添加提交答案事件监听器
    document.getElementById('submit-answer').addEventListener('click', verifyAnswer);
    
    // 添加回车键提交答案
    document.getElementById('answer-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyAnswer();
        }
    });
    
    // Initialiser le graphe
    initGraph();
    
    const gameLoaded = loadGameState();
    
    // Si le jeu n'a pas été chargé, initialiser en mode jeu par défaut
    if (!gameLoaded) {
        // Mode jeu par défaut
        document.getElementById('puzzle-area').style.display = 'block';
        document.getElementById('search-area').style.display = 'none';
        document.getElementById('game-mode').classList.add('active');
        document.getElementById('search-mode').classList.remove('active');
    }
});