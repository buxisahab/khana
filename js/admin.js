import { db, ref, set, push, onValue, remove, update, auth, signOut, onAuthStateChanged, signInWithEmailAndPassword } from './firebase-config.js';

// Elements for login toggle
const adminLoginContainer = document.getElementById('adminLoginContainer');
const adminDashboardLayout = document.getElementById('adminDashboardLayout');
const adminLoginForm = document.getElementById('adminLoginForm');

// Auth Guard
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Not logged in, show login box
    adminLoginContainer.style.display = 'flex';
    adminDashboardLayout.style.display = 'none';
  } else if (user.uid !== 'khjvyZ1dw1NzpCc6jXde7ERVpmi1') {
    // Logged in but not admin
    alert("Access Denied! Your current UID is: " + user.uid + "\nThis does not match the admin UID. Logging out.");
    await signOut(auth);
    adminLoginContainer.style.display = 'flex';
    adminDashboardLayout.style.display = 'none';
  } else {
    // Is admin, show dashboard
    adminLoginContainer.style.display = 'none';
    adminDashboardLayout.style.display = 'flex';
  }
});

// Admin Login Submission
if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminLoginEmail').value;
    const password = document.getElementById('adminLoginPassword').value;
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the UI switch if successful
    } catch (error) {
      showToast("Login failed: " + error.message);
    }
  });
}

// Simple toast for admin
function showToast(message) {
  const toastContainer = document.getElementById('toastContainer');
  if(!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  toastContainer.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3000);
}

// Navigation
const navProducts = document.getElementById('navProducts');
const navOrders = document.getElementById('navOrders');
const productsSection = document.getElementById('productsSection');
const ordersSection = document.getElementById('ordersSection');
const navLogout = document.getElementById('navLogout');

if (navProducts && navOrders) {
  navProducts.addEventListener('click', (e) => {
    e.preventDefault();
    navProducts.classList.add('active');
    navOrders.classList.remove('active');
    productsSection.style.display = 'block';
    ordersSection.style.display = 'none';
  });

  navOrders.addEventListener('click', (e) => {
    e.preventDefault();
    navOrders.classList.add('active');
    navProducts.classList.remove('active');
    ordersSection.style.display = 'block';
    productsSection.style.display = 'none';
  });
}

if (navLogout) {
  navLogout.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      // onAuthStateChanged will automatically show the login box
    } catch (error) {
      showToast(error.message);
    }
  });
}

// Add Product Modal
const addProductBtn = document.getElementById('addProductBtn');
const productModal = document.getElementById('productModal');
const closeProductModal = document.getElementById('closeProductModal');
const productForm = document.getElementById('productForm');

if (addProductBtn) {
  addProductBtn.addEventListener('click', () => {
    productModal.classList.add('active');
  });
}

if (closeProductModal) {
  closeProductModal.addEventListener('click', () => {
    productModal.classList.remove('active');
  });
}

// Save Product
if (productForm) {
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('prodName').value;
    const price = document.getElementById('prodPrice').value;
    const desc = document.getElementById('prodDesc').value;
    const image = document.getElementById('prodImage').value;
    const category = document.getElementById('prodCategory').value;
    
    try {
      const productData = {
        name,
        price: parseFloat(price),
        description: desc,
        image,
        category
      };
      
      const newProdRef = push(ref(db, 'products'));
      await set(newProdRef, productData);
      
      showToast("Product added successfully!");
      productForm.reset();
      productModal.classList.remove('active');
    } catch (error) {
      showToast("Failed to add product: " + error.message);
    }
  });
}

// Seed Demo Data
const seedDemoBtn = document.getElementById('seedDemoBtn');
if (seedDemoBtn) {
  seedDemoBtn.addEventListener('click', async () => {
    if(!confirm("Add 5 demo products?")) return;
    
    const demoProducts = [
      { name: "Spicy Pepperoni Pizza", price: 14.99, description: "Hand-tossed crust topped with rich tomato sauce, mozzarella, and spicy pepperoni.", category: "Pizza", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80" },
      { name: "Classic Smash Cheeseburger", price: 8.99, description: "Double beef patty, melted cheddar, lettuce, tomato, and our secret sauce.", category: "Burger", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80" },
      { name: "Fresh Mint Lemonade", price: 4.50, description: "Refreshing freshly squeezed lemons blended with ice and mint leaves.", category: "Drinks", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80" },
      { name: "Mediterranean Caesar Salad", price: 10.99, description: "Crisp romaine, cherry tomatoes, croutons, parmesan, and grilled chicken.", category: "Healthy", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80" },
      { name: "Decadent Lava Cake", price: 7.99, description: "Warm chocolate cake with a gooey molten center, served with vanilla ice cream.", category: "Desserts", image: "https://images.unsplash.com/photo-1563805042-7684c8e9e533?w=500&q=80" }
    ];
    
    seedDemoBtn.innerText = "Seeding...";
    seedDemoBtn.disabled = true;
    try {
      for(const p of demoProducts) {
        await set(push(ref(db, 'products')), p);
      }
      showToast("Demo products seeded successfully!");
    } catch(err) {
      showToast("Seeding failed: " + err.message);
    } finally {
      seedDemoBtn.innerHTML = `<i class="fas fa-seedling"></i> Seed Demo Data`;
      seedDemoBtn.disabled = false;
    }
  });
}

// Fetch and Display Products
const productsTableBody = document.getElementById('productsTableBody');

if (productsTableBody) {
  const productsRef = ref(db, 'products');
  onValue(productsRef, (snapshot) => {
    productsTableBody.innerHTML = '';
    const data = snapshot.val();
    
    if (data) {
      Object.keys(data).forEach(key => {
        const product = data[key];
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--radius-sm);"></td>
          <td><strong>${product.name}</strong></td>
          <td><span class="category-chip" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;">${product.category}</span></td>
          <td style="color: var(--primary-color); font-weight: 600;">₹${parseFloat(product.price).toFixed(2)}</td>
          <td>
            <button class="nav-btn delete-prod" data-id="${key}" style="color: var(--primary-color);"><i class="fas fa-trash"></i></button>
          </td>
        `;
        productsTableBody.appendChild(tr);
      });
      
      // Attach delete events
      document.querySelectorAll('.delete-prod').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          if(confirm("Are you sure you want to delete this product?")) {
            const id = e.target.closest('button').dataset.id;
            try {
              await remove(ref(db, `products/${id}`));
              showToast("Product deleted");
            } catch (error) {
              showToast("Delete failed: " + error.message);
            }
          }
        });
      });
      
    } else {
      productsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No products available. Add one!</td></tr>';
    }
  });
}

// Fetch and Display Orders
const ordersTableBody = document.getElementById('ordersTableBody');

if (ordersTableBody) {
  const ordersRef = ref(db, 'orders');
  onValue(ordersRef, (snapshot) => {
    ordersTableBody.innerHTML = '';
    const data = snapshot.val();
    
    if (data) {
      // Sort to show newest first
      const ordersArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      ordersArray.sort((a, b) => b.timestamp - a.timestamp);
      
      ordersArray.forEach(order => {
        const itemsStr = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
        const dateStr = new Date(order.timestamp).toLocaleString();
        
        let statusClass = 'status-pending';
        if(order.status === 'Preparing') statusClass = 'status-preparing';
        if(order.status === 'Out for Delivery') statusClass = 'status-delivery';
        if(order.status === 'Delivered') statusClass = 'status-delivered';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${order.id.substring(1, 8)}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${dateStr}</div>
          </td>
          <td>
            <div><strong>${order.userName}</strong></div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${order.userEmail}</div>
          </td>
          <td>
            <div style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.9rem;" title="${itemsStr}">${itemsStr}</div>
            <div style="font-weight: 600; margin-top: 0.5rem;">₹${order.total}</div>
          </td>
          <td>
            <span class="status-badge ${statusClass}">${order.status}</span>
          </td>
          <td>
            <select class="status-select" data-id="${order.id}" data-userid="${order.userId}" style="padding: 0.4rem; border-radius: var(--radius-sm); border: 1px solid var(--glass-border); background: var(--bg-color); color: var(--text-primary); outline: none;">
              <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
              <option value="Out for Delivery" ${order.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
              <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            </select>
          </td>
        `;
        ordersTableBody.appendChild(tr);
      });
      
      // Attach status change events
      document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
          const newStatus = e.target.value;
          const orderId = e.target.dataset.id;
          const userId = e.target.dataset.userid;
          
          try {
            // Update in global orders
            await update(ref(db, `orders/${orderId}`), { status: newStatus });
            
            // Update in user's orders
            await update(ref(db, `users/${userId}/orders/${orderId}`), { status: newStatus });
            
            showToast("Order status updated to " + newStatus);
          } catch (error) {
            showToast("Update failed: " + error.message);
          }
        });
      });
      
    } else {
      ordersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No orders yet.</td></tr>';
    }
  });
}
