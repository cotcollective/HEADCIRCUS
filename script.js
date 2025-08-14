// --- SCRIPT FINAL COMPLET (CORRIGÉ POUR L'ORDRE DE CHARGEMENT) ---

console.log("Script.js chargé.");

// --- SÉLECTION DES ÉLÉMENTS HTML ---
const cases = document.querySelectorAll('.case');
const scoreDisplay = document.querySelector('#score');
const tempsRestantDisplay = document.querySelector('#temps-restant');
const startButton = document.querySelector('#startButton');
const imageUpload = document.querySelector('#imageUpload');
const loadingMessage = document.querySelector('#loadingMessage');
const faceCanvas = document.querySelector('#faceCanvas');
const fbLoginBtn = document.getElementById('fbLoginBtn');
const statusDiv = document.getElementById('status');
const shareBtn = document.getElementById('shareBtn');

// --- FONCTION PRINCIPALE DE DÉMARRAGE ---
function initializeApp() {
    console.log("Facebook SDK prêt. Initialisation de l'application.");

    // Le code qui dépend des éléments de la page est maintenant ici
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
                alert("Aucun visage détecté !");
                loadingMessage.textContent = "Prêt !";
                return;
            }
            const { x, y, width, height } = detection.detection.box;
            const ctx = faceCanvas.getContext('2d');
            faceCanvas.width = width;
            faceCanvas.height = height;
            ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
            imageTaupeURL = faceCanvas.toDataURL();
            loadingMessage.textContent = "Visage prêt ! Vous pouvez démarrer.";
        };
    });

    fbLoginBtn.addEventListener('click', () => {
        console.log("Clic sur le bouton de connexion Facebook.");
        FB.login(function(response) {
            if (response.authResponse) {
                console.log('Connexion Facebook réussie !');
                fetchFacebookUser();
            } else {
                console.log('Connexion annulée par l\'utilisateur.');
                statusDiv.innerHTML = 'Connexion annulée.';
            }
        }, {scope: 'public_profile'});
    });

    shareBtn.addEventListener('click', () => {
        const shareMessage = `J'ai fait ${score} points sur HEADCIRCUS ! Peux-tu battre mon score ?`;
        FB.ui({
            method: 'share',
            href: 'https://headcircus.local:8080', // ou 127.0.0.1
            quote: shareMessage
        }, function(response){
            if (response && !response.error_message) {
                console.log('Partage réussi !');
            } else {
                console.log('Partage annulé ou a échoué.');
            }
        });
    });

    startButton.addEventListener('click', demarrerJeu);
}

// --- CHARGEMENT DES MODÈLES FACE-API ---
const MODEL_URL = './models';
loadingMessage.textContent = "Chargement des modèles...";
console.log("Tentative de chargement des modèles depuis le dossier local:", MODEL_URL);

Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
]).then(() => {
    console.log("SUCCÈS : Modèles locaux chargés.");
    loadingMessage.textContent = "Prêt !";
}).catch((error) => {
    console.error("ERREUR : Échec du chargement des modèles locaux.", error);
    loadingMessage.textContent = "Erreur de chargement des modèles.";
});

// --- FONCTIONS (Ne changent pas) ---
function fetchFacebookUser() {
    statusDiv.innerHTML = 'Récupération des informations...';
    FB.api('/me', {fields: 'name, picture.type(large)'}, function(response) {
        if (response && !response.error) {
            console.log('Infos utilisateur récupérées:', response);
            statusDiv.innerHTML = `Connecté en tant que <strong>${response.name}</strong>`;
            imageTaupeURL = response.picture.data.url;
            loadingMessage.textContent = "Photo de profil prête !";
            document.getElementById('imageUpload').style.display = 'none';
            document.querySelector('label[for="imageUpload"]').style.display = 'none';
        } else {
            console.error("Erreur lors de la récupération des infos utilisateur", response.error);
            statusDiv.innerHTML = 'Erreur lors de la récupération des infos.';
        }
    });
}

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
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function() {
            positionAleatoire.style.backgroundImage = `url(${img.src})`;
        };
        img.src = imageTaupeURL;
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
        fbLoginBtn.disabled = false;
        loadingMessage.textContent = "Prêt !";
        shareBtn.style.display = 'inline-block';
    }
}

function demarrerJeu() {
    if (!imageTaupeURL) {
        alert("Veuillez d'abord choisir une image ou vous connecter à Facebook !");
        return;
    }
    score = 0;
    tempsRestant = 30;
    scoreDisplay.textContent = score;
    tempsRestantDisplay.textContent = tempsRestant;
    startButton.disabled = true;
    imageUpload.disabled = true;
    fbLoginBtn.disabled = true;
    shareBtn.style.display = 'none';
    timerTaupeId = setInterval(placerTaupe, 700);
    timerId = setInterval(decompte, 1000);
}