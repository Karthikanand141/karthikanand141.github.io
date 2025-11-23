// Show logged-in user or Sign In link
const signinLink = document.getElementById("signin-link");
const user = localStorage.getItem("user");

if (user && signinLink) {
  signinLink.textContent = "Hello, " + user.split("@")[0];
  signinLink.href = "#";
  signinLink.addEventListener("click", () => {
    if (confirm("Sign out?")) {
      localStorage.removeItem("user");
      location.reload();
    }
  });
}



// ======== Initialize Cart ========
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ======== Update Cart Count in Navbar ========
function updateCartCount() {
  const cartCountEl = document.getElementById("cart-count");
  if (cartCountEl) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountEl.textContent = totalItems;
  }
}
updateCartCount();

// ======== Add to Cart Function ========
function addToCart(product) {
  const existingItem = cart.find((item) => item.name === product.name);
  if (existingItem) {
    existingItem.quantity += product.quantity;
  } else {
    cart.push(product);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  alert(`${product.quantity} × ${product.name} added to cart!`);
}

// ======== Buy Now Function ========
function buyNow(product) {
  // Save only the selected item for quick purchase
  localStorage.setItem("cart", JSON.stringify([product]));
  window.location.href = "cart.html";
}

// ======== Handle Add to Cart & Buy Now Buttons ========
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("add-cart") || e.target.classList.contains("buy-now")) {
    const menuItem = e.target.closest(".menu-item");
    const name = menuItem.querySelector("h3").textContent.trim();

    // Support both $ and ₹ symbols
    const priceText = menuItem.querySelector(".price").textContent.trim();
    const price = parseFloat(priceText.replace(/[₹$]/g, ""));

    const image = menuItem.querySelector("img").getAttribute("src");
    const quantity = parseInt(menuItem.querySelector(".quantity-control select").value);

    const product = { name, price, image, quantity };

    if (e.target.classList.contains("add-cart")) {
      addToCart(product);
    } else if (e.target.classList.contains("buy-now")) {
      buyNow(product);
    }
  }
});
