function createNavbar() {
    const navbar = document.createElement('nav');
    navbar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: white;
        padding: 10px 20px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 1000;
    `;

    const homeLink = document.createElement('a');
    homeLink.href = '/';
    homeLink.textContent = '🏠 Home';
    homeLink.style.cssText = `
        text-decoration: none;
        color: #333;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 5px;
    `;

    const currentAppName = document.createElement('span');
    currentAppName.textContent = document.title;
    currentAppName.style.cssText = `
        color: #4CAF50;
        font-weight: bold;
    `;

    navbar.appendChild(homeLink);
    navbar.appendChild(currentAppName);

    // Add padding to body to account for fixed navbar
    document.body.style.paddingTop = '60px';

    return navbar;
}

// Add navbar when the script loads
document.body.insertBefore(createNavbar(), document.body.firstChild); 