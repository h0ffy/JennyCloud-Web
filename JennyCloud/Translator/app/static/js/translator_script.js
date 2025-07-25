const canvas = document.getElementById('neuralCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
const particleColor = 'rgba(172, 139, 255, 0.7)'; // Light purple with transparency
const lineColor = 'rgba(172, 139, 255, 0.3)'; // Light purple with more transparency

// Particle Class
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1.5;
        this.speedY = Math.random() * 2 - 1.5;
    }
    draw() {
        ctx.fillStyle = particleColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width || this.x < 0) {
            this.speedX = -this.speedX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.speedY = -this.speedY;
        }

        this.draw();
    }
}

// Create particle array
function init() {
    particlesArray = [];
    const currentNumberOfParticles = (canvas.width * canvas.height) / 4000;
    for (let i = 0; i < currentNumberOfParticles; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particlesArray.push(new Particle(x, y));
    }
}

// Connect particles
function connect() {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x))
                + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
            const maxDistanceSquared = 20000; 

            if (distance < maxDistanceSquared) {
                opacityValue = 1 - (distance / maxDistanceSquared); 
                ctx.strokeStyle = `rgba(172, 139, 255, ${opacityValue})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
    connect();
}

// Resize listener
window.addEventListener('resize', function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init(); // Re-initialize particles on resize
});

// Set initial display state for elements
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('headerContainer').style.display = 'flex'; // Ensure it's visible initially
    document.getElementById('mainContentContainer').style.display = 'block'; // Ensure it's visible

    // Avatar Dropdown Logic
    const avatarButton = document.getElementById('avatarButton');
    const avatarDropdown = document.getElementById('avatarDropdown');

    if (avatarButton && avatarDropdown) {
        avatarButton.addEventListener('click', (event) => {
            event.stopPropagation(); 
            avatarDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (event) => {
            if (avatarDropdown.classList.contains('active') && !avatarDropdown.contains(event.target) && event.target !== avatarButton) {
                avatarDropdown.classList.remove('active');
            }
        });
    }

    // Navigation Menu Dropdown Logic
    const navMenuButton = document.getElementById('navMenuButton');
    const navMenuDropdown = document.getElementById('navMenuDropdown');

    if (navMenuButton && navMenuDropdown) {
        navMenuButton.addEventListener('click', (event) => {
            event.stopPropagation(); 
            navMenuDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (event) => {
            if (navMenuDropdown.classList.contains('active') && !navMenuDropdown.contains(event.target) && event.target !== navMenuButton) {
                navMenuDropdown.classList.remove('active');
            }
        });
    }
});

// Initial setup for particle animation
init();
animate();
