import { db, ref, push, set, get, child } from './firebase-config.js';
import { currentUser, showToast } from './auth.js';

let cart = [];
const deliveryFee = 2.99;

const floatingCartBtn = document.getElementById('floatingCartBtn');
const cartDrawer = document.getElementById('cartDrawer');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartBadge = document.getElementById('cartBadge');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartDelivery = document.getElementById('cartDelivery');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');

// Toggle Drawer
if (floatingCartBtn && cartDrawer) {
  floatingCartBtn.addEventListener('click', () => {
    cartDrawer.classList.add('active');
  });
  
  closeCartBtn.addEventListener('click', () => {
    cartDrawer.classList.remove('active');
  });
}

// Add to Cart
export function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  updateCartUI();
  showToast(`${product.name} added to cart`);
}

// Update UI
function updateCartUI() {
  if (!cartItemsContainer) return;
  
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">Your cart is empty</p>';
    cartBadge.innerText = '0';
    cartSubtotal.innerText = '₹0.00';
    cartDelivery.innerText = '₹0.00';
    cartTotal.innerText = '₹0.00';
    return;
  }
  
  let subtotal = 0;
  let totalItems = 0;
  
  cart.forEach((item, index) => {
    subtotal += item.price * item.quantity;
    totalItems += item.quantity;
    
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-price">₹${parseFloat(item.price).toFixed(2)}</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn dec" data-index="${index}">-</button>
        <span>${item.quantity}</span>
        <button class="qty-btn inc" data-index="${index}">+</button>
      </div>
    `;
    cartItemsContainer.appendChild(itemEl);
  });
  
  cartBadge.innerText = totalItems;
  cartSubtotal.innerText = `₹${subtotal.toFixed(2)}`;
  cartDelivery.innerText = `₹${deliveryFee.toFixed(2)}`;
  cartTotal.innerText = `₹${(subtotal + deliveryFee).toFixed(2)}`;
  
  // Attach events
  document.querySelectorAll('.qty-btn.inc').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.target.dataset.index;
      cart[idx].quantity += 1;
      updateCartUI();
    });
  });
  
  document.querySelectorAll('.qty-btn.dec').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.target.dataset.index;
      if (cart[idx].quantity > 1) {
        cart[idx].quantity -= 1;
      } else {
        cart.splice(idx, 1);
      }
      updateCartUI();
    });
  });
}

// Checkout
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
      showToast("Your cart is empty!");
      return;
    }
    
    if (!currentUser) {
      showToast("Please login to place an order");
      document.getElementById('authModal').classList.add('active');
      cartDrawer.classList.remove('active');
      return;
    }
    
    // Check Profile
    checkoutBtn.innerText = 'Checking profile...';
    checkoutBtn.disabled = true;
    try {
      const snapshot = await get(child(ref(db), `users/${currentUser.uid}`));
      const userData = snapshot.val();
      if (!userData || !userData.phone || !userData.address) {
        document.getElementById('profileModal').classList.add('active');
        cartDrawer.classList.remove('active');
        checkoutBtn.innerText = 'Place Order';
        checkoutBtn.disabled = false;
        return;
      }
    } catch(err) {
      checkoutBtn.innerText = 'Place Order';
      checkoutBtn.disabled = false;
      showToast("Error checking profile: " + err.message);
      return;
    }
    
    checkoutBtn.innerText = 'Processing...';
    checkoutBtn.disabled = true;
    
    try {
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const total = subtotal + deliveryFee;
      
      const orderData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'Guest',
        items: cart,
        total: total.toFixed(2),
        status: 'Pending',
        timestamp: Date.now()
      };
      
      const orderRef = push(ref(db, 'orders'));
      await set(orderRef, orderData);
      
      // Also save under user's node
      const userOrderRef = ref(db, `users/${currentUser.uid}/orders/${orderRef.key}`);
      await set(userOrderRef, orderData);
      
      showToast("Order placed successfully! 🍕");
      cart = [];
      updateCartUI();
      cartDrawer.classList.remove('active');
    } catch (error) {
      showToast("Failed to place order: " + error.message);
    } finally {
      checkoutBtn.innerText = 'Place Order';
      checkoutBtn.disabled = false;
    }
  });
}

// Profile Completion Modal
const profileModal = document.getElementById('profileModal');
const closeProfileBtn = document.getElementById('closeProfileBtn');
const profileForm = document.getElementById('profileForm');

if (closeProfileBtn) {
  closeProfileBtn.addEventListener('click', () => profileModal.classList.remove('active'));
}

if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const phone = document.getElementById('profilePhone').value;
    const address = document.getElementById('profileAddress').value;
    try {
      await set(ref(db, 'users/' + currentUser.uid), {
        name: currentUser.displayName || 'Guest',
        email: currentUser.email || '',
        phone: phone,
        address: address
      });
      showToast("Profile updated! You can now place your order.");
      profileModal.classList.remove('active');
      cartDrawer.classList.add('active');
    } catch (err) {
      showToast("Error updating profile: " + err.message);
    }
  });
}
