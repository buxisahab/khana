import { db, ref, onValue } from './firebase-config.js';
import { addToCart } from './cart.js';
import { showToast } from './auth.js';

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme');

if (currentTheme) {
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      updateThemeIcon('light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      updateThemeIcon('dark');
    }
  });
}

function updateThemeIcon(theme) {
  if (!themeToggle) return;
  if (theme === 'dark') {
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }
}

// Fetch and Display Products
const foodFeed = document.getElementById('foodFeed');
let allProducts = [];

if (foodFeed) {
  const productsRef = ref(db, 'products');
  onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    foodFeed.innerHTML = ''; // Clear skeletons
    allProducts = [];
    
    if (data) {
      Object.keys(data).forEach(key => {
        allProducts.push({ id: key, ...data[key] });
      });
      renderProducts(allProducts);
    } else {
      foodFeed.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No products found. Be the first to add some from Admin!</p>';
    }
  }, (error) => {
    showToast("Error loading products: " + error.message);
  });
}

function renderProducts(products) {
  if (!foodFeed) return;
  foodFeed.innerHTML = '';
  
  if (products.length === 0) {
    foodFeed.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No products match your criteria.</p>';
    return;
  }
  
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'food-card glass';
    card.innerHTML = `
      <div class="food-img-container">
        <img src="${product.image}" alt="${product.name}" class="food-img" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
      </div>
      <div class="food-info">
        <div class="food-category">${product.category}</div>
        <div class="food-title">${product.name}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem; flex: 1;">
          ${product.description || ''}
        </div>
        <div class="food-bottom">
          <div class="food-price">₹${parseFloat(product.price).toFixed(2)}</div>
          <button class="add-to-cart-btn" data-id="${product.id}">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
    `;
    foodFeed.appendChild(card);
  });
  
  // Attach add to cart events
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Find closest button in case icon is clicked
      const button = e.target.closest('.add-to-cart-btn');
      const id = button.dataset.id;
      const product = allProducts.find(p => p.id === id);
      if (product) {
        addToCart(product);
      }
    });
  });
}

// Category Filtering
const categoryChips = document.querySelectorAll('.category-chip');
if (categoryChips.length > 0) {
  categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      // Update active class
      categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      
      const category = chip.dataset.category;
      if (category === 'All') {
        renderProducts(allProducts);
      } else {
        const filtered = allProducts.filter(p => p.category === category);
        renderProducts(filtered);
      }
    });
  });
}

// Search Filtering
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    
    // Reset category to All
    const allChip = document.querySelector('.category-chip[data-category="All"]');
    if(allChip) {
      categoryChips.forEach(c => c.classList.remove('active'));
      allChip.classList.add('active');
    }
    
    const filtered = allProducts.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.description && p.description.toLowerCase().includes(query))
    );
    renderProducts(filtered);
  });
}

// Bottom Navigation
const bNavHome = document.getElementById('bNavHome');
const bNavCart = document.getElementById('bNavCart');
const bNavOrders = document.getElementById('bNavOrders');
const bNavProfile = document.getElementById('bNavProfile');

const heroSection = document.querySelector('.hero');
const categoryContainer = document.getElementById('categoryContainer');
const userOrdersSection = document.getElementById('userOrdersSection');
const userOrdersList = document.getElementById('userOrdersList');

if (bNavHome && bNavOrders && heroSection && categoryContainer && userOrdersSection) {
  const navItems = [bNavHome, bNavCart, bNavOrders, bNavProfile];
  
  function setActiveNav(activeBtn) {
    navItems.forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
  }

  const dNavHome = document.getElementById('dNavHome');
  const dNavOrders = document.getElementById('dNavOrders');
  const desktopNavLogo = document.getElementById('desktopNavLogo');

  function goHome() {
    heroSection.style.display = 'flex';
    categoryContainer.style.display = 'flex';
    foodFeed.style.display = 'grid';
    userOrdersSection.style.display = 'none';
    if(dNavHome) { dNavHome.style.color = 'var(--primary-color)'; dNavOrders.style.color = 'var(--text-primary)'; }
  }

  function goOrders() {
    heroSection.style.display = 'none';
    categoryContainer.style.display = 'none';
    foodFeed.style.display = 'none';
    userOrdersSection.style.display = 'grid';
    if(dNavOrders) { dNavOrders.style.color = 'var(--primary-color)'; dNavHome.style.color = 'var(--text-primary)'; }
    fetchUserOrders();
  }

  if (dNavHome) dNavHome.addEventListener('click', (e) => { e.preventDefault(); goHome(); if(bNavHome) setActiveNav(bNavHome); });
  if (dNavOrders) dNavOrders.addEventListener('click', (e) => { e.preventDefault(); goOrders(); if(bNavOrders) setActiveNav(bNavOrders); });
  if (desktopNavLogo) desktopNavLogo.addEventListener('click', (e) => { e.preventDefault(); goHome(); if(bNavHome) setActiveNav(bNavHome); });

  bNavHome.addEventListener('click', () => {
    setActiveNav(bNavHome);
    goHome();
  });

  bNavCart.addEventListener('click', () => {
    setActiveNav(bNavCart);
    document.getElementById('cartDrawer').classList.add('active');
  });

  bNavOrders.addEventListener('click', () => {
    setActiveNav(bNavOrders);
    goOrders();
  });

  bNavProfile.addEventListener('click', () => {
    setActiveNav(bNavProfile);
    import('./auth.js').then(module => {
      if (!module.currentUser) {
        document.getElementById('authModal').classList.add('active');
      } else {
        document.getElementById('profileModal').classList.add('active');
      }
    });
  });
}

function fetchUserOrders() {
  import('./auth.js').then(module => {
    if (!module.currentUser) {
      userOrdersList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Please login to view your orders.</p>';
      return;
    }
    const ordersRef = ref(db, `users/${module.currentUser.uid}/orders`);
    onValue(ordersRef, (snapshot) => {
      userOrdersList.innerHTML = '';
      const data = snapshot.val();
      if (data) {
        const ordersArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        ordersArray.sort((a, b) => b.timestamp - a.timestamp);
        
        ordersArray.forEach(order => {
          const itemsStr = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
          const dateStr = new Date(order.timestamp).toLocaleString();
          
          let statusClass = 'status-pending';
          if(order.status === 'Preparing') statusClass = 'status-preparing';
          if(order.status === 'Out for Delivery') statusClass = 'status-delivery';
          if(order.status === 'Delivered') statusClass = 'status-delivered';

          const card = document.createElement('div');
          card.className = 'glass';
          card.style.cssText = 'padding: 1.5rem; margin-bottom: 1rem; border-radius: var(--radius-sm);';
          card.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="font-weight: 600;">Order #${order.id.substring(1, 8)}</span>
              <span class="status-badge ${statusClass}">${order.status}</span>
            </div>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">${dateStr}</div>
            <div style="margin-bottom: 1rem;">${itemsStr}</div>
            <div style="font-weight: 600; color: var(--primary-color);">Total: ₹${order.total}</div>
          `;
          userOrdersList.appendChild(card);
        });
      } else {
        userOrdersList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">You have no past orders yet.</p>';
      }
    });
  });
}
