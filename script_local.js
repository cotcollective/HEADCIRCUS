// --- SCRIPT VERSION LOCALE SEULEMENT ---

console.log("Script LOCAL démarré.");

// Récupération des éléments de la page
const cases = document.querySelectorAll('.case');
const scoreDisplay = document.querySelector('#score');
const tempsRestantDisplay = document.querySelector('#temps-restant');
const startButton = document.querySelector('#startButton');
const imageUpload = document.querySelector('#imageUpload');
const loadingMessage = document.querySelector('#loadingMessage');
const faceCanvas = document.querySelector('#faceCanvas');

// On charge les modèles depuis le dossier local
const MODEL_URL = './models';

loadingMessage.textContent = "Chargement des modèles...";
console.log("Tentative de chargement des modèles depuis le dossier local:", MODEL_URL);

Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
]).then(() => {
    console.log("SUCCÈS : Modèles locaux chargés.");
    loadingMessage.textContent = "Prêt à choisir une image !";
}).catch((error) => {
    console.error("ERREUR : Échec du chargement des modèles locaux.", error);
    loadingMessage.textContent = "Erreur de chargement. Vérifiez que le dossier 'models' et les 5 fichiers sont corrects.";
});


// Logique de l'upload de fichier
imageUpload.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) { return; }

    loadingMessage.textContent = "Analyse du visage...";
    const imageURL = URL.createObjectURL(file);
    const image = document.createElement('img');
    image.src = imageURL;
    
    image.onload = async () => {
        const detection = await faceapi.detectSingleFace(image).withFaceLandmarks();
        if (!detection) {
            alert("Aucun visage détecté ! Essayez une autre photo.");
            loadingMessage.textContent = "Prêt à choisir une image !";
            return;
        }
        
        console.log("SUCCÈS : Visage détecté. Découpage en cours...");
        const { x, y, width, height } = detection.detection.box;
        const ctx = faceCanvas.getContext('2d');
        faceCanvas.width = width;
        faceCanvas.height = height;
        ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
    
        imageTaupeURL = faceCanvas.toDataURL();
        loadingMessage.textContent = "Visage prêt ! Vous pouvez démarrer.";
    };
});

// Variables et fonctions du jeu (inchangées)
let score = 0;
let tempsRestant = 30;
let positionTaupe = null;
let timerId = null;
let timerTaupeId = null;
let imageTaupeURL = null;

function placerTaupe() {
    cases.forEach(caseElement => {
        caseElement.classList.remove('mole');
        caseElement.style.backgroundImage = 'none';
    });
    let positionAleatoire = cases[Math.floor(Math.random() * 9)];
    positionAleatoire.classList.add('mole');
    if (imageTaupeURL) {
        positionAleatoire.style.backgroundImage = `url(${imageTaupeURL})`;
        positionAleatoire.style.backgroundSize = 'cover';
        positionAleatoire.style.backgroundPosition = 'center';
        positionAleatoire.style.borderRadius = '50%';
    }
    positionTaupe = positionAleatoire.id;
}
cases.forEach(caseElement => {
    caseElement.addEventListener('mousedown', () => {
        if (caseElement.id === positionTaupe && timerId) {
            score++;
            scoreDisplay.textContent = score;
            positionTaupe = null;
            caseElement.classList.remove('mole');
            caseElement.style.backgroundImage = 'none';
        }
    });
});
function decompte() {
    tempsRestant--;
    tempsRestantDisplay.textContent = tempsRestant;
    if (tempsRestant === 0) {
        clearInterval(timerId);
        clearInterval(timerTaupeId);
        alert('Partie terminée ! Votre score est de ' + score);
        startButton.disabled = false;
        imageUpload.disabled = false;
        loadingMessage.textContent = "Prêt à choisir une image !";
    }
}
function demarrerJeu() {
    if (!imageTaupeURL) {
        alert("Veuillez d'abord choisir une image et attendre l'analyse !");
        return;
    }
    score = 0;
    tempsRestant = 30;
    scoreDisplay.textContent = score;
    tempsRestantDisplay.textContent = tempsRestant;
    startButton.disabled = true;
    imageUpload.disabled = true;
    timerTaupeId = setInterval(placerTaupe, 700);
    timerId = setInterval(decompte, 1000);
}
startButton.addEventListener('click', demarrerJeu);