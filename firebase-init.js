// ARQUIVO: firebase-init.js (CORRIGIDO E CENTRALIZADO)

const firebaseConfig = {
  apiKey: "AIzaSyAlrFEfblJVGn_EQ-P31OkdOgGcjraYrUI",
  authDomain: "cardapionovo-aec53.firebaseapp.com",
  projectId: "cardapionovo-aec53",
  storageBucket: "cardapionovo-aec53.firebasestorage.app",
  messagingSenderId: "438070835683",
  appId: "1:438070835683:web:bfe502d674da3b924148d6"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Disponibiliza as instâncias para serem usadas globalmente
const db = firebase.firestore();
const auth = firebase.auth();
