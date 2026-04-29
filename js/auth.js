import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, updateProfile, db, ref, set } from './firebase-config.js';

// DOM Elements
const authModal = document.getElementById('authModal');
const loginBtn = document.getElementById('loginBtn');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const authNavContainer = document.getElementById('authNavContainer');

// State
let currentUser = null;

// Toast Utility
export function showToast(message) {
  const toastContainer = document.getElementById('toastContainer');
  if(!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  toastContainer.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3000);
}

// Modal Toggles
if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    authModal.classList.add('active');
  });
}

if (closeAuthBtn) {
  closeAuthBtn.addEventListener('click', () => {
    authModal.classList.remove('active');
  });
}

// Tabs
if (tabLogin && tabRegister) {
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.style.display = 'flex';
    loginForm.style.display = 'none';
  });
}

// Forms Submission
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Logged in successfully!");
      authModal.classList.remove('active');
      loginForm.reset();
    } catch (error) {
      showToast(error.message);
    }
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    const phone = document.getElementById('registerPhone').value;
    const address = document.getElementById('registerAddress').value;
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Save extra details to Realtime DB
      await set(ref(db, 'users/' + userCredential.user.uid), {
        name: name,
        email: email,
        phone: phone,
        address: address
      });

      showToast("Account created successfully!");
      authModal.classList.remove('active');
      registerForm.reset();
    } catch (error) {
      showToast(error.message);
    }
  });
}

if (googleSignInBtn) {
  googleSignInBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      showToast("Logged in with Google!");
      authModal.classList.remove('active');
    } catch (error) {
      showToast(error.message);
    }
  });
}

// Auth State Observer
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user && authNavContainer) {
    // Logged in UI
    const isAdmin = user.uid === 'khjvyZ1dw1NzpCc6jXde7ERVpmi1';
    let html = `<div style="display: flex; align-items: center; gap: 1rem;">
                  <span style="font-weight: 500;">Hi, ${user.displayName || 'User'}</span>`;
    
    if (isAdmin) {
      html += `<a href="admin.html" class="nav-btn" style="color: var(--primary-color);">Admin</a>`;
    }
    
    html += `<button class="nav-btn" id="logoutBtn"><i class="fas fa-sign-out-alt"></i></button></div>`;
    authNavContainer.innerHTML = html;
    
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await signOut(auth);
      showToast("Logged out");
    });
  } else if (authNavContainer) {
    // Logged out UI
    authNavContainer.innerHTML = `<button class="btn-primary" id="loginBtn">Login / Sign Up</button>`;
    document.getElementById('loginBtn').addEventListener('click', () => {
      authModal.classList.add('active');
    });
  }
});

export { currentUser };
