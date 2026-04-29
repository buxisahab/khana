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
          <div class="food-price">$${parseFloat(product.price).toFixed(2)}</div>
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
