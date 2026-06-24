/* ==========================================================================
   VoyageAI Tours Client-Side Logic (Modal Auth & Landing Page Integration)
   ========================================================================== */

const API_BASE = "https://multi-agent-travel-planner-pq02.onrender.com";

// Global App State
const state = {
    token: localStorage.getItem("token") || null,
    username: localStorage.getItem("username") || null,
    trips: [],
    activeTrip: null,
    pendingTripPlan: null // Stores parameters if user clicks "Plan Trip" before logging in
};

// DOM Elements
const elements = {
    // Auth Modal & Forms
    authModal: document.getElementById("authModal"),
    closeAuthModalBtn: document.getElementById("closeAuthModalBtn"),
    authTabs: document.querySelectorAll(".auth-tab"),
    loginForm: document.getElementById("loginForm"),
    signupForm: document.getElementById("signupForm"),
    loginUsername: document.getElementById("loginUsername"),
    loginPassword: document.getElementById("loginPassword"),
    signupUsername: document.getElementById("signupUsername"),
    signupEmail: document.getElementById("signupEmail"),
    signupPassword: document.getElementById("signupPassword"),
    loginError: document.getElementById("loginError"),
    signupError: document.getElementById("signupError"),
    signupSuccess: document.getElementById("signupSuccess"),
    toggleToSignup: document.getElementById("toggleToSignup"),
    toggleToLogin: document.getElementById("toggleToLogin"),
    
    // Header & Navigation
    anonActions: document.getElementById("anonActions"),
    userProfile: document.getElementById("userProfile"),
    usernameDisplay: document.getElementById("usernameDisplay"),
    logoutBtn: document.getElementById("logoutBtn"),
    navLoginBtn: document.getElementById("navLoginBtn"),
    navSignupBtn: document.getElementById("navSignupBtn"),
    navDashLink: document.getElementById("navDashLink"),
    landingNav: document.getElementById("landingNav"),

    // Landing Page
    landingSection: document.getElementById("landingSection"),
    heroExploreBtn: document.getElementById("heroExploreBtn"),
    heroDemoBtn: document.getElementById("heroDemoBtn"),

    // Dashboard
    dashboardSection: document.getElementById("dashboardSection"),
    newTripBtn: document.getElementById("newTripBtn"),
    heroPlanBtn: document.getElementById("heroPlanBtn"),
    tripsList: document.getElementById("tripsList"),
    emptyState: document.getElementById("emptyState"),
    emptyStateBtn: document.getElementById("emptyStateBtn"),
    tripSearchInput: document.getElementById("tripSearchInput"),
    statTotalTrips: document.getElementById("statTotalTrips"),
    statSpentBudget: document.getElementById("statSpentBudget"),

    // Wizard Form
    wizardSection: document.getElementById("wizardSection"),
    backToDashboardBtn: document.getElementById("backToDashboardBtn"),
    tripForm: document.getElementById("tripForm"),
    tripSource: document.getElementById("tripSource"),
    tripDestination: document.getElementById("tripDestination"),
    tripDate: document.getElementById("tripDate"),
    tripDays: document.getElementById("tripDays"),
    tripBudget: document.getElementById("tripBudget"),
    preferencesChips: document.getElementById("preferencesChips"),
    tripRequirements: document.getElementById("tripRequirements"),
    wizardProgressFill: document.getElementById("wizardProgressFill"),
    prevStepBtn: document.getElementById("prevStepBtn"),
    nextStepBtn: document.getElementById("nextStepBtn"),
    submitTripBtn: document.getElementById("submitTripBtn"),

    // Loading Screen
    loadingSection: document.getElementById("loadingSection"),
    loadingTitle: document.getElementById("loadingTitle"),
    loadingDescription: document.getElementById("loadingDescription"),
    terminalLogs: document.getElementById("terminalLogs"),

    // Details View
    detailsSection: document.getElementById("detailsSection"),
    backToDashFromDetails: document.getElementById("backToDashFromDetails"),
    detailsDestTitle: document.getElementById("detailsDestTitle"),
    detailsMetaSubtitle: document.getElementById("detailsMetaSubtitle"),
    destinationHighlights: document.getElementById("destinationHighlights"),
    detailsTabs: document.querySelectorAll(".details-tab"),
    tabContents: document.querySelectorAll(".tab-content"),
    expandAllDays: document.getElementById("expandAllDays"),
    collapseAllDays: document.getElementById("collapseAllDays"),
    
    // Tab Contents
    itineraryTimeline: document.getElementById("itineraryTimeline"),
    hotelList: document.getElementById("hotelList"),
    recommendedTransport: document.getElementById("recommendedTransport"),
    altTransportList: document.getElementById("altTransportList"),
    weatherForecastGrid: document.getElementById("weatherForecastGrid"),
    weatherSuggestionsList: document.getElementById("weatherSuggestionsList"),
    budgetTotalVal: document.getElementById("budgetTotalVal"),
    budgetSpentVal: document.getElementById("budgetSpentVal"),
    budgetRemainingVal: document.getElementById("budgetRemainingVal"),
    budgetBars: document.getElementById("budgetBars"),
    budgetRingFill: document.getElementById("budgetRingFill"),
    budgetPercentVal: document.getElementById("budgetPercentVal"),
    budgetStatusAlert: document.getElementById("budgetStatusAlert"),
    budgetStatusText: document.getElementById("budgetStatusText"),
    finalRecScore: document.getElementById("finalRecScore"),
    finalRecHotel: document.getElementById("finalRecHotel"),
    finalRecTransport: document.getElementById("finalRecTransport"),
    aiRecommendationsList: document.getElementById("aiRecommendationsList")
};

// Wizard State Manager
let wizardCurrentStep = 1;
const wizardTotalSteps = 3;

const isDashboardPage = !!document.getElementById("dashboardSection");

// ==========================================
// Initialization & Navigation
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initApp();
    setupEventListeners();
    if (isDashboardPage) {
        handleLocalStoragePrefills();
    } else {
        // Check for category filter parameters on page load
        const urlParams = new URLSearchParams(window.location.search);
        const filterParam = urlParams.get('filter');
        if (filterParam) {
            const chip = document.querySelector(`.filter-chip[data-filter="${filterParam}"]`);
            if (chip) {
                // Ensure function is executed after DOM and script binds finish
                setTimeout(() => {
                    window.filterTripsByCategory(filterParam, chip);
                }, 100);
            }
        }
    }
    initTranslatorWidget();
});

function injectAndInitAuthModal() {
    const authModal = document.getElementById("authModal");
    if (!authModal) return;

    if (!authModal.querySelector(".modal-card-wrapper")) {
        authModal.innerHTML = `
            <div class="modal-card-wrapper">
                <button id="closeAuthModalBtn" class="close-modal-btn"><i class="fa-solid fa-xmark"></i></button>
                
                <section id="authSection" class="auth-container">
                    <!-- Left quote showcase panel -->
                    <div class="auth-showcase">
                        <div class="showcase-content">
                            <h2>VoyageAI Tours</h2>
                            <p class="showcase-quote">"Travel is the only purchase that enriches you in ways beyond material wealth."</p>
                        </div>
                        <div class="cloud-decoration cloud-1"></div>
                        <div class="cloud-decoration cloud-2"></div>
                    </div>

                    <!-- Right Form Panel -->
                    <div class="auth-card">
                        <div class="auth-body">
                            <!-- Login Form -->
                            <form id="loginForm" class="auth-form active-form">
                                <h2>Welcome</h2>
                                <p class="auth-subtitle">Login with Email</p>
                                
                                <div class="form-group">
                                    <label for="loginUsername">Email Id / Username</label>
                                    <div class="input-with-icon">
                                        <input type="text" id="loginUsername" required placeholder="thisuix@mail.com">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="loginPassword">Password</label>
                                    <div class="input-with-icon">
                                        <input type="password" id="loginPassword" required placeholder="••••••••••••••">
                                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility('loginPassword')">
                                            <i class="fa-regular fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="forgot-pwd-row">
                                    <a href="#" class="forgot-link">Forgot your password?</a>
                                </div>
                                
                                <button type="submit" class="btn btn-primary btn-block btn-blue">
                                    LOGIN
                                </button>
                                
                                <div class="divider-text"><span>OR</span></div>
                                
                                <!-- Social Logins -->
                                <div class="social-login-row">
                                    <button type="button" class="btn-social google" onclick="openOAuthPopup('google')"><i class="fa-brands fa-google"></i></button>
                                    <button type="button" class="btn-social facebook" onclick="openOAuthPopup('facebook')"><i class="fa-brands fa-facebook-f"></i></button>
                                    <button type="button" class="btn-social apple" onclick="openOAuthPopup('apple')"><i class="fa-brands fa-apple"></i></button>
                                </div>

                                <div class="auth-toggle-msg">
                                    Don't have account? <a href="#" id="toggleToSignup">Register Now</a>
                                </div>

                                <div class="auth-error" id="loginError"></div>
                            </form>

                            <!-- Signup Form -->
                            <form id="signupForm" class="auth-form">
                                <h2>Join Us</h2>
                                <p class="auth-subtitle">Create Account</p>
                                
                                <div class="form-group">
                                    <label for="signupUsername">Username</label>
                                    <div class="input-with-icon">
                                        <input type="text" id="signupUsername" required placeholder="Choose a username">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="signupEmail">Email Address</label>
                                    <div class="input-with-icon">
                                        <input type="email" id="signupEmail" required placeholder="you@example.com">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="signupPassword">Password</label>
                                    <div class="input-with-icon">
                                        <input type="password" id="signupPassword" required placeholder="Create strong password">
                                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility('signupPassword')">
                                            <i class="fa-regular fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <button type="submit" class="btn btn-primary btn-block btn-blue">
                                    REGISTER
                                </button>
                                
                                <div class="auth-toggle-msg">
                                    Already have an account? <a href="#" id="toggleToLogin">Login Now</a>
                                </div>
                                <div class="auth-error" id="signupError"></div>
                                <div class="auth-success" id="signupSuccess"></div>
                            </form>
                        </div>
                        
                        <!-- Landmarks Silhouette Art at bottom -->
                        <div class="landmarks-silhouette">
                            <svg viewBox="0 0 400 60" preserveAspectRatio="none">
                                <path d="M 0 60 L 0 45 L 5 45 L 5 40 L 10 35 L 10 25 L 12 25 L 12 15 L 14 15 L 14 5 L 16 5 L 16 15 L 18 15 L 18 25 L 20 25 L 20 35 L 25 40 L 25 45 L 30 45 L 30 60 M 35 60 L 35 48 L 45 48 L 45 35 L 48 35 L 48 20 L 52 20 L 52 35 L 55 35 L 55 48 L 65 48 L 65 60 M 70 60 L 70 50 L 78 50 L 78 40 L 74 40 L 74 15 L 82 15 L 82 40 L 78 40 L 78 50 L 86 50 L 86 60 M 90 60 L 92 60 L 92 35 L 94 35 L 94 30 L 98 25 L 98 15 L 100 12 L 102 12 L 104 15 L 104 25 L 108 30 L 108 35 L 110 35 L 110 60 M 115 60 L 115 30 L 125 30 L 125 10 L 135 10 L 135 30 L 145 30 L 145 60 M 150 60 L 150 50 L 155 45 L 155 30 L 160 30 L 160 20 L 165 20 L 165 15 L 170 15 L 170 20 L 175 20 L 175 30 L 180 30 L 180 45 L 185 50 L 185 60" stroke="#0ea5e9" stroke-width="1.5" fill="none" opacity="0.3"></path>
                            </svg>
                        </div>
                    </div>
                </section>
            </div>
        `;
    }

    // Now re-cache the modal elements in elements object
    elements.closeAuthModalBtn = document.getElementById("closeAuthModalBtn");
    elements.loginForm = document.getElementById("loginForm");
    elements.signupForm = document.getElementById("signupForm");
    elements.loginUsername = document.getElementById("loginUsername");
    elements.loginPassword = document.getElementById("loginPassword");
    elements.signupUsername = document.getElementById("signupUsername");
    elements.signupEmail = document.getElementById("signupEmail");
    elements.signupPassword = document.getElementById("signupPassword");
    elements.loginError = document.getElementById("loginError");
    elements.signupError = document.getElementById("signupError");
    elements.signupSuccess = document.getElementById("signupSuccess");
    elements.toggleToSignup = document.getElementById("toggleToSignup");
    elements.toggleToLogin = document.getElementById("toggleToLogin");
}

function initApp() {
    // Inject language dropdown selector in the header actions
    injectLanguageSelector();

    // Inject auth modal HTML markup dynamically if #authModal exists
    injectAndInitAuthModal();

    // Check header login status UI
    updateHeaderAuthUI();

    if (isDashboardPage) {
        if (!state.token) {
            location.href = "index.html";
            return;
        }

        // Set min date for wizard form to today
        const today = new Date().toISOString().split("T")[0];
        if (elements.tripDate) {
            elements.tripDate.setAttribute("min", today);
            elements.tripDate.value = today;
        }

        showDashboard();
    } else {
        // We are on index.html, about.html, or trips.html
        setupFamousTripsListeners();
        if (document.querySelector(".hero-slides")) {
            initHeroSlider();
        }
        initScrollReveal();

        // Translate the initial page
        const savedLang = localStorage.getItem("app_lang") || "en";
        applyLanguage(savedLang);
    }
}

// Hero Carousel Slideshow Logic
function initHeroSlider() {
    const slides = document.querySelectorAll(".hero-slide");
    const dots = document.querySelectorAll(".indicator-dot");
    const titleEl = document.getElementById("heroTitle");
    const subtitleEl = document.getElementById("heroSubtitle");
    const currNumEl = document.getElementById("heroCurrNum");
    const previewImgEl = document.getElementById("heroPreviewImg");
    const previewChangeBtn = document.getElementById("previewChangeBtn");

    if (!slides.length) return;

    const heroSlidesData = [
        {
            title: "Let's\nGet Lost.",
            subtitle: "Curated travel experiences for the wild at heart."
        },
        {
            title: "EXPERIENCE MODERN TOKYO.",
            subtitle: "Dive into neon-lit streets, historic temples, and exquisite culinary adventures customized for your style."
        },
        {
            title: "ROMANCE IN PARIS.",
            subtitle: "Stroll along the Seine, explore world-class museums, and enjoy cozy sidewalk cafes curated by AI."
        },
        {
            title: "WILD HORIZONS.",
            subtitle: "Immerse yourself in lush, untamed forests and reconnect with nature's pure essence."
        }
    ];

    const previewImages = [
        "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=400&q=80", // Camper van
        "https://images.unsplash.com/photo-1533240332313-0db49b439ad3?auto=format&fit=crop&w=400&q=80", // Adventure/Zip line
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80", // Tropical beach
        "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=400&q=80"  // India
    ];
    let currentPreviewIndex = 0;

    let currentSlide = 0;
    let slideInterval = null;

    function startTimer() {
        stopTimer();
        slideInterval = setInterval(nextSlide, 6000);
    }

    function stopTimer() {
        if (slideInterval) {
            clearInterval(slideInterval);
            slideInterval = null;
        }
    }

    function goToSlide(index) {
        if (index < 0 || index >= slides.length) return;

        // Deactivate current slide and dot
        slides[currentSlide].classList.remove("active");
        if (dots[currentSlide]) dots[currentSlide].classList.remove("active");

        currentSlide = index;

        // Activate new slide and dot
        slides[currentSlide].classList.add("active");
        if (dots[currentSlide]) dots[currentSlide].classList.add("active");

        // Update active slide number
        if (currNumEl) {
            currNumEl.textContent = String(currentSlide + 1).padStart(2, "0");
        }

        // Fade text out, change contents, fade back in with smooth slide-up
        if (titleEl && subtitleEl) {
            titleEl.style.opacity = 0;
            titleEl.style.transform = "translateY(15px)";
            subtitleEl.style.opacity = 0;
            subtitleEl.style.transform = "translateY(15px)";

            setTimeout(() => {
                const currentData = heroSlidesData[currentSlide];
                titleEl.innerHTML = currentData.title.replace(/\n/g, "<br>");
                subtitleEl.textContent = currentData.subtitle;
                
                // For Slide 0, add serif-title class
                if (currentSlide === 0) {
                    titleEl.classList.add("serif-title");
                } else {
                    titleEl.classList.remove("serif-title");
                }

                titleEl.style.opacity = 1;
                titleEl.style.transform = "translateY(0)";
                subtitleEl.style.opacity = 1;
                subtitleEl.style.transform = "translateY(0)";
            }, 300);
        }
    }

    function nextSlide() {
        let next = (currentSlide + 1) % slides.length;
        goToSlide(next);
    }

    // Set initial transition styles and class
    if (titleEl && subtitleEl) {
        titleEl.style.transition = "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
        subtitleEl.style.transition = "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
        titleEl.style.transform = "translateY(0)";
        subtitleEl.style.transform = "translateY(0)";
        titleEl.classList.add("serif-title");
    }

    // Add click listeners to indicator dots
    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            goToSlide(index);
            startTimer();
        });
    });

    // Preview change action
    if (previewChangeBtn && previewImgEl) {
        previewChangeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            currentPreviewIndex = (currentPreviewIndex + 1) % previewImages.length;
            previewImgEl.style.backgroundImage = `url('${previewImages[currentPreviewIndex]}')`;
        });
    }

    // Start rotation
    startTimer();
}

// Scroll Reveal Observer Logic
function initScrollReveal() {
    const revealElements = document.querySelectorAll(".reveal-on-scroll");
    if (!revealElements.length) return;

    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("revealed");
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => observer.observe(el));
}

function updateHeaderAuthUI() {
    if (state.token) {
        if (elements.anonActions) elements.anonActions.style.display = "none";
        if (elements.userProfile) elements.userProfile.style.display = "flex";
        if (elements.navDashLink) elements.navDashLink.style.display = "inline-block";
        if (elements.usernameDisplay) elements.usernameDisplay.textContent = state.username;
    } else {
        if (elements.anonActions) elements.anonActions.style.display = "flex";
        if (elements.userProfile) elements.userProfile.style.display = "none";
        if (elements.navDashLink) elements.navDashLink.style.display = "none";
    }
}

function handleLocalStoragePrefills() {
    const prefillStr = localStorage.getItem("pendingTripPrefill");
    if (prefillStr) {
        try {
            const prefill = JSON.parse(prefillStr);
            triggerPrefilledWizard(prefill.destination, prefill.days, prefill.budget, prefill.vibes);
        } catch (e) {
            console.error("Error loading prefilled wizard states", e);
        }
        localStorage.removeItem("pendingTripPrefill");
    }
}

window.openOAuthPopup = function(provider) {
    const width = 500;
    const height = 600;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    window.open(
        `oauth-mock.html?provider=${provider}`,
        "OAuthPopup",
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
    );
};

// Listen to message returns from OAuth Popup Choice
window.addEventListener("message", async (event) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data && event.data.type === 'oauth-success') {
        const { provider, email, name } = event.data;
        const username = `${provider}_${name.replace(/\s+/g, "").toLowerCase()}`;
        const password = "mockOAuthPassword123!";
        
        try {
            let response = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const regResponse = await fetch(`${API_BASE}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email, password })
                });
                
                if (!regResponse.ok) {
                    const err = await regResponse.json();
                    throw new Error(err.detail || "Mock Social Registration failed");
                }
                
                response = await fetch(`${API_BASE}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });
                
                if (!response.ok) {
                    throw new Error("Mock Social Authentication failed");
                }
            }
            
            const data = await response.json();
            saveAuth(data.token, username);
            hideAuthModal();
            
            if (state.pendingTripPlan) {
                const trip = state.pendingTripPlan;
                state.pendingTripPlan = null;
                if (isDashboardPage) {
                    triggerPrefilledWizard(trip.destination, trip.days, trip.budget, trip.vibes);
                } else {
                    localStorage.setItem("pendingTripPrefill", JSON.stringify(trip));
                    location.href = "dashboard.html";
                }
            } else {
                if (isDashboardPage) {
                    showDashboard();
                } else {
                    location.href = "dashboard.html";
                }
            }
        } catch (err) {
            alert("Social Login failed: " + err.message);
        }
    }
});

function setupEventListeners() {
    // Toggle User Profile Dropdown Menu
    const navUserBadge = document.getElementById("navUserBadge");
    const profileDropdown = document.getElementById("profileDropdown");
    const userProfileDiv = document.getElementById("userProfile");
    if (navUserBadge && profileDropdown) {
        navUserBadge.addEventListener("click", (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle("show");
            if (userProfileDiv) {
                userProfileDiv.classList.toggle("open");
            }
        });
        document.addEventListener("click", (e) => {
            if (!navUserBadge.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove("show");
                if (userProfileDiv) {
                    userProfileDiv.classList.remove("open");
                }
            }
        });
    }

    // Header navigation login/register buttons to open modal
    if (elements.navLoginBtn) elements.navLoginBtn.addEventListener("click", () => showAuthModal("login"));
    if (elements.navSignupBtn) elements.navSignupBtn.addEventListener("click", () => showAuthModal("signup"));
    
    // Modal close actions
    if (elements.closeAuthModalBtn) elements.closeAuthModalBtn.addEventListener("click", hideAuthModal);
    if (elements.authModal) {
        elements.authModal.addEventListener("click", (e) => {
            if (e.target === elements.authModal) hideAuthModal();
        });
    }

    // Form inside modal toggle links
    if (elements.toggleToSignup) {
        elements.toggleToSignup.addEventListener("click", (e) => {
            e.preventDefault();
            switchAuthTab("signup");
        });
    }
    if (elements.toggleToLogin) {
        elements.toggleToLogin.addEventListener("click", (e) => {
            e.preventDefault();
            switchAuthTab("login");
        });
    }

    // Auth Forms Submit
    if (elements.loginForm) elements.loginForm.addEventListener("submit", handleLogin);
    if (elements.signupForm) elements.signupForm.addEventListener("submit", handleSignup);
    if (elements.logoutBtn) elements.logoutBtn.addEventListener("click", logout);

    // Dashboard Actions
    if (elements.newTripBtn) elements.newTripBtn.addEventListener("click", showWizard);
    if (elements.heroPlanBtn) elements.heroPlanBtn.addEventListener("click", showWizard);
    if (elements.emptyStateBtn) elements.emptyStateBtn.addEventListener("click", showWizard);
    if (elements.backToDashboardBtn) elements.backToDashboardBtn.addEventListener("click", showDashboard);
    if (elements.backToDashFromDetails) elements.backToDashFromDetails.addEventListener("click", showDashboard);

    // Landing Hero Actions
    if (elements.heroExploreBtn) {
        elements.heroExploreBtn.addEventListener("click", () => {
            location.href = "trips.html";
        });
    }
    if (elements.heroDemoBtn) {
        elements.heroDemoBtn.addEventListener("click", () => {
            alert("VoyageAI Tours presentation video loading... (Demonstration only)");
        });
    }

    // Filter Trips Search Input
    if (elements.tripSearchInput) {
        elements.tripSearchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            const cards = elements.tripsList.querySelectorAll(".trip-card");
            cards.forEach(card => {
                const dest = card.querySelector(".trip-dest").textContent.toLowerCase();
                if (dest.includes(query)) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });
        });
    }

    // Form Wizard Step Navigation
    if (elements.nextStepBtn) elements.nextStepBtn.addEventListener("click", navigateWizardNext);
    if (elements.prevStepBtn) elements.prevStepBtn.addEventListener("click", navigateWizardPrev);

    // Form Wizard Chips
    if (elements.preferencesChips) {
        elements.preferencesChips.addEventListener("click", (e) => {
            if (e.target.classList.contains("chip")) {
                e.target.classList.toggle("selected");
            }
        });
    }

    // Trip Wizard Submit
    if (elements.tripForm) elements.tripForm.addEventListener("submit", handleCreateTrip);

    // Details Tabs Toggle
    if (elements.detailsTabs) {
        elements.detailsTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                elements.detailsTabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");

                const contentId = tab.dataset.content;
                if (elements.tabContents) {
                    elements.tabContents.forEach(content => {
                        if (content.id === contentId) {
                            content.classList.add("active-content");
                        } else {
                            content.classList.remove("active-content");
                        }
                    });
                }

                if (contentId === "budgetTab") {
                    setTimeout(animateBudgetVisuals, 100);
                }
            });
        });
    }

    // Itinerary Accordion Expand/Collapse All controls
    if (elements.expandAllDays) {
        elements.expandAllDays.addEventListener("click", () => {
            document.querySelectorAll(".day-section").forEach(sec => sec.classList.add("expanded"));
        });
    }
    if (elements.collapseAllDays) {
        elements.collapseAllDays.addEventListener("click", () => {
            document.querySelectorAll(".day-section").forEach(sec => sec.classList.remove("expanded"));
        });
    }
}

// Prefill Famous Trip Planning logic
function setupFamousTripsListeners() {
    const planButtons = document.querySelectorAll(".famous-plan-btn");
    planButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const destination = btn.dataset.destination;
            const days = btn.dataset.days;
            const budget = btn.dataset.budget;
            const vibes = btn.dataset.vibes ? btn.dataset.vibes.split(",") : [];

            if (state.token) {
                if (isDashboardPage) {
                    triggerPrefilledWizard(destination, days, budget, vibes);
                } else {
                    localStorage.setItem("pendingTripPrefill", JSON.stringify({ destination, days, budget, vibes }));
                    location.href = "dashboard.html";
                }
            } else {
                state.pendingTripPlan = { destination, days, budget, vibes };
                showAuthModal("login");
                if (elements.loginError) {
                    elements.loginError.textContent = "Please log in or sign up first to plan this trip!";
                    elements.loginError.style.color = "#f97316";
                }
            }
        });
    });
}

// Client-side search filtering for showcased/famous trips
window.filterTripsList = function() {
    const input = document.getElementById("tripSearchFilter");
    if (!input) return;
    const filter = input.value.toLowerCase().trim();
    const cards = document.querySelectorAll("#famousTripsGrid .famous-card");
    const activeChip = document.querySelector(".filter-chip.active");
    const categoryFilter = activeChip ? activeChip.dataset.filter : "all";

    cards.forEach(card => {
        const name = card.dataset.name || "";
        const category = card.dataset.category || "";
        
        const matchesSearch = name.includes(filter);
        const matchesCategory = (categoryFilter === "all" || category === categoryFilter);

        if (matchesSearch && matchesCategory) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
};

// Client-side category filtering for showcased/famous trips
window.filterTripsByCategory = function(category, btn) {
    const chips = document.querySelectorAll(".filter-chip");
    chips.forEach(c => c.classList.remove("active"));
    if (btn) btn.classList.add("active");

    const input = document.getElementById("tripSearchFilter");
    const filter = input ? input.value.toLowerCase().trim() : "";
    const cards = document.querySelectorAll("#famousTripsGrid .famous-card");

    cards.forEach(card => {
        const name = card.dataset.name || "";
        const cardCategory = card.dataset.category || "";
        
        const matchesSearch = name.includes(filter);
        const matchesCategory = (category === "all" || cardCategory === category);

        if (matchesSearch && matchesCategory) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
};

function triggerPrefilledWizard(dest, days, budget, vibes) {
    showWizard();
    if (elements.tripDestination) elements.tripDestination.value = dest;
    if (elements.tripDays) elements.tripDays.value = days;
    if (elements.tripBudget) elements.tripBudget.value = budget;

    // Reset preferences chips selection
    if (elements.preferencesChips) {
        elements.preferencesChips.querySelectorAll(".chip").forEach(chip => {
            chip.classList.remove("selected");
            if (vibes.includes(chip.dataset.val)) {
                chip.classList.add("selected");
            }
        });
    }
}

// Global section routing helper
window.navigateToSection = function(sectionId) {
    if (!elements.landingNav) return;
    const links = elements.landingNav.querySelectorAll(".nav-link");
    links.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active");
        }
    });

    // Toggle views
    if (elements.dashboardSection) elements.dashboardSection.style.display = "none";
    if (elements.wizardSection) elements.wizardSection.style.display = "none";
    if (elements.detailsSection) elements.detailsSection.style.display = "none";
    if (elements.landingSection) elements.landingSection.style.display = "flex";

    // Scroll smoothly to target section
    if (sectionId === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (sectionId === "about") {
        const aboutEl = document.getElementById("aboutSection");
        if (aboutEl) aboutEl.scrollIntoView({ behavior: "smooth" });
    } else if (sectionId === "trips") {
        const tripsEl = document.getElementById("tripsSection");
        if (tripsEl) tripsEl.scrollIntoView({ behavior: "smooth" });
    }
};

// Modal handlers
// Modal handlers
window.startPlanning = function() {
    if (state.token) {
        location.href = "dashboard.html";
    } else {
        showAuthModal("login");
    }
};

window.showAuthModal = function(tab = "login") {
    elements.authModal.style.display = "flex";
    switchAuthTab(tab);
};

window.hideAuthModal = function() {
    elements.authModal.style.display = "none";
    state.pendingTripPlan = null; // Clear if modal dismissed
};

window.switchAuthTab = function(tab) {
    if (tab === "login") {
        elements.loginForm.classList.add("active-form");
        elements.signupForm.classList.remove("active-form");
        elements.loginError.textContent = "";
    } else {
        elements.loginForm.classList.remove("active-form");
        elements.signupForm.classList.add("active-form");
        elements.signupError.textContent = "";
        elements.signupSuccess.textContent = "";
    }
};

// Password toggle helper (accessible globally)
window.togglePasswordVisibility = function(id) {
    const input = document.getElementById(id);
    const btnIcon = input.nextElementSibling.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        btnIcon.className = 'fa-regular fa-eye-slash';
    } else {
        input.type = 'password';
        btnIcon.className = 'fa-regular fa-eye';
    }
};

// ==========================================
// Auth Handling
// ==========================================
async function handleLogin(e) {
    e.preventDefault();
    elements.loginError.textContent = "";
    
    const username = elements.loginUsername.value.trim();
    const password = elements.loginPassword.value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Authentication failed");
        }

        const data = await response.json();
        saveAuth(data.token, username);
        
        hideAuthModal();
        
        // Check if there was a pending trip card selected
        if (state.pendingTripPlan) {
            const trip = state.pendingTripPlan;
            state.pendingTripPlan = null;
            if (isDashboardPage) {
                triggerPrefilledWizard(trip.destination, trip.days, trip.budget, trip.vibes);
            } else {
                localStorage.setItem("pendingTripPrefill", JSON.stringify(trip));
                location.href = "dashboard.html";
            }
        } else {
            if (isDashboardPage) {
                showDashboard();
            } else {
                location.href = "dashboard.html";
            }
        }
        
        // Clear inputs
        elements.loginUsername.value = "";
        elements.loginPassword.value = "";
    } catch (err) {
        elements.loginError.textContent = err.message;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    elements.signupError.textContent = "";
    elements.signupSuccess.textContent = "";
    
    const username = elements.signupUsername.value.trim();
    const email = elements.signupEmail.value.trim();
    const password = elements.signupPassword.value;

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Registration failed");
        }

        elements.signupSuccess.textContent = "Account created successfully! Logging in...";
        
        // Auto login on register success
        setTimeout(async () => {
            try {
                const loginRes = await fetch(`${API_BASE}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });
                if (loginRes.ok) {
                    const loginData = await loginRes.json();
                    saveAuth(loginData.token, username);
                    hideAuthModal();
                    
                    if (state.pendingTripPlan) {
                        const trip = state.pendingTripPlan;
                        state.pendingTripPlan = null;
                        if (isDashboardPage) {
                            triggerPrefilledWizard(trip.destination, trip.days, trip.budget, trip.vibes);
                        } else {
                            localStorage.setItem("pendingTripPrefill", JSON.stringify(trip));
                            location.href = "dashboard.html";
                        }
                    } else {
                        if (isDashboardPage) {
                            showDashboard();
                        } else {
                            location.href = "dashboard.html";
                        }
                    }
                }
            } catch (err) {
                switchAuthTab("login");
            }
        }, 1200);
    } catch (err) {
        elements.signupError.textContent = err.message;
    }
}

function saveAuth(token, username) {
    state.token = token;
    state.username = username;
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
}

function logout() {
    state.token = null;
    state.username = null;
    state.trips = [];
    state.activeTrip = null;
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    
    if (isDashboardPage) {
        location.href = "index.html";
    } else {
        updateHeaderAuthUI();
    }
}

// ==========================================
// UI View State Swaps
// ==========================================
function showLandingPage() {
    hideAllSections();
    if (elements.anonActions) elements.anonActions.style.display = "flex";
    if (elements.userProfile) elements.userProfile.style.display = "none";
    if (elements.navDashLink) elements.navDashLink.style.display = "none";
    if (elements.landingSection) elements.landingSection.style.display = "flex";
    
    // Reset active nav tab to HOME
    if (elements.landingNav) {
        elements.landingNav.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
        const homeNav = elements.landingNav.querySelector('[href="index.html"]');
        if (homeNav) homeNav.classList.add("active");
    }
    window.scrollTo({ top: 0, behavior: "instant" });
}

async function showDashboard() {
    hideAllSections();
    if (elements.anonActions) elements.anonActions.style.display = "none";
    if (elements.userProfile) elements.userProfile.style.display = "flex";
    if (elements.navDashLink) elements.navDashLink.style.display = "inline-block";
    if (elements.usernameDisplay) elements.usernameDisplay.textContent = state.username;
    if (elements.dashboardSection) elements.dashboardSection.style.display = "block";
    
    // Highlight dashboard link in nav
    if (elements.landingNav) {
        elements.landingNav.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
        if (elements.navDashLink) elements.navDashLink.classList.add("active");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    if (elements.tripSearchInput) elements.tripSearchInput.value = "";
    await loadTripsList();

    // Apply translations
    applyLanguage(localStorage.getItem("app_lang") || "en");
}

function showWizard() {
    hideAllSections();
    if (elements.anonActions) elements.anonActions.style.display = "none";
    if (elements.userProfile) elements.userProfile.style.display = "flex";
    if (elements.navDashLink) elements.navDashLink.style.display = "inline-block";
    if (elements.wizardSection) elements.wizardSection.style.display = "block";
    if (elements.tripForm) elements.tripForm.reset();
    
    if (elements.preferencesChips) {
        elements.preferencesChips.querySelectorAll(".chip").forEach(chip => {
            chip.classList.remove("selected");
        });
    }

    wizardCurrentStep = 1;
    updateWizardUI();
}

function hideAllSections() {
    if (elements.landingSection) elements.landingSection.style.display = "none";
    if (elements.dashboardSection) elements.dashboardSection.style.display = "none";
    if (elements.wizardSection) elements.wizardSection.style.display = "none";
    if (elements.detailsSection) elements.detailsSection.style.display = "none";
    if (elements.loadingSection) elements.loadingSection.style.display = "none";
}

// Multi-step Wizard Navigation
function updateWizardUI() {
    document.querySelectorAll(".wizard-step").forEach(step => {
        step.classList.remove("active-step");
        if (parseInt(step.dataset.step, 10) === wizardCurrentStep) {
            step.classList.add("active-step");
        }
    });

    document.querySelectorAll(".wizard-stepper .step-node").forEach(node => {
        const stepNum = parseInt(node.dataset.step, 10);
        node.classList.remove("active", "complete");
        
        if (stepNum === wizardCurrentStep) {
            node.classList.add("active");
        } else if (stepNum < wizardCurrentStep) {
            node.classList.add("complete");
        }
    });

    const progressPercent = ((wizardCurrentStep - 1) / (wizardTotalSteps - 1)) * 100;
    elements.wizardProgressFill.style.width = `${progressPercent}%`;

    if (wizardCurrentStep === 1) {
        elements.prevStepBtn.style.display = "none";
    } else {
        elements.prevStepBtn.style.display = "inline-flex";
    }

    if (wizardCurrentStep === wizardTotalSteps) {
        elements.nextStepBtn.style.display = "none";
        elements.submitTripBtn.style.display = "inline-flex";
    } else {
        elements.nextStepBtn.style.display = "inline-flex";
        elements.submitTripBtn.style.display = "none";
    }
}

function validateWizardStep(stepNum) {
    if (stepNum === 1) {
        if (!elements.tripSource.value.trim() || !elements.tripDestination.value.trim() || !elements.tripDate.value || !elements.tripDays.value) {
            alert("Please fill in all routing and schedule fields.");
            return false;
        }
        if (parseInt(elements.tripDays.value, 10) <= 0 || parseInt(elements.tripDays.value, 10) > 30) {
            alert("Duration must be between 1 and 30 days.");
            return false;
        }
    } else if (stepNum === 2) {
        if (!elements.tripBudget.value || parseFloat(elements.tripBudget.value) < 1000) {
            alert("Please provide a valid budget (minimum ₹1,000).");
            return false;
        }
    }
    return true;
}

function navigateWizardNext() {
    if (validateWizardStep(wizardCurrentStep)) {
        if (wizardCurrentStep < wizardTotalSteps) {
            wizardCurrentStep++;
            updateWizardUI();
        }
    }
}

function navigateWizardPrev() {
    if (wizardCurrentStep > 1) {
        wizardCurrentStep--;
        updateWizardUI();
    }
}

// ==========================================
// Dashboard Data Loading & Stats Update
// ==========================================
async function loadTripsList() {
    elements.tripsList.innerHTML = "";
    elements.emptyState.style.display = "none";
    
    try {
        const response = await fetch(`${API_BASE}/trip/`, {
            headers: { "Authorization": `Bearer ${state.token}` }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) throw new Error("Failed to load trips");

        state.trips = await response.json();
        updateDashboardStats(state.trips);

        if (state.trips.length === 0) {
            elements.emptyState.style.display = "flex";
            return;
        }

        const currentLang = localStorage.getItem("app_lang") || "en";
        const t = translationDict[currentLang] || translationDict["en"];

        state.trips.forEach(trip => {
            const card = document.createElement("div");
            card.className = "trip-card glass-panel";
            card.addEventListener("click", () => loadTripDetails(trip.trip_id));
            
            const dateStr = trip.travel_date;
            
            card.innerHTML = `
                <div class="trip-card-header">
                    <div>
                        <div class="trip-dest">${trip.destination}</div>
                        <div class="trip-dates"><i class="fa-regular fa-calendar"></i> ${dateStr}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="trip-badge">${trip.days} ${t.days || 'Days'}</span>
                        <button class="delete-trip-btn" title="Delete Trip"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="trip-card-footer">
                    <div class="trip-budget-info">
                        <span class="trip-budget-label">${t.label_budget_limit || 'Budget Limit'}</span>
                        <span class="trip-budget-val">₹${Number(trip.budget).toLocaleString()}</span>
                    </div>
                    <div class="trip-go-btn">
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            `;
            
            const deleteBtn = card.querySelector(".delete-trip-btn");
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteTrip(trip.trip_id, trip.destination);
            });

            elements.tripsList.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        elements.tripsList.innerHTML = `<p class="auth-error" style="grid-column: span 3;">Error loading dashboard: ${err.message}</p>`;
    }
}

function updateDashboardStats(trips) {
    if (elements.statTotalTrips) {
        elements.statTotalTrips.textContent = trips.length;
    }
    if (elements.statSpentBudget) {
        const totalBudget = trips.reduce((sum, trip) => sum + parseFloat(trip.budget || 0), 0);
        elements.statSpentBudget.textContent = `₹${totalBudget.toLocaleString()}`;
    }
}

async function deleteTrip(tripId, destinationName) {
    if (!confirm(`Are you sure you want to delete your trip to ${destinationName}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/trip/${tripId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${state.token}` }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) throw new Error("Failed to delete trip");
        
        await loadTripsList();
    } catch (err) {
        console.error(err);
        alert(`Error deleting trip: ${err.message}`);
    }
}

// ==========================================
// Trip Details Loading & Rendering
// ==========================================
async function loadTripDetails(tripId) {
    hideAllSections();
    elements.loadingSection.style.display = "flex";
    
    elements.loadingTitle.textContent = "Retrieving Swarm Data...";
    elements.loadingDescription.textContent = "Accessing database vault to retrieve collaborative sub-agent summaries.";
    resetAgentLoaderSteps();
    clearTerminalLogs();

    const animInterval = runSimulatedTerminalLogs(true);

    try {
        const response = await fetch(`${API_BASE}/trip/${tripId}`, {
            headers: { "Authorization": `Bearer ${state.token}` }
        });

        clearInterval(animInterval);

        if (!response.ok) throw new Error("Could not fetch trip plan details");

        const tripPlan = await response.json();
        state.activeTrip = tripPlan;
        
        setAllStepsComplete();
        appendTerminalLog("success", "[SYSTEM] Swarm data retrieved successfully. Entering details view.");
        
        setTimeout(() => {
            renderTripPlan(tripPlan);
        }, 500);
    } catch (err) {
        clearInterval(animInterval);
        elements.loadingSection.style.display = "none";
        alert(err.message);
        showDashboard();
    }
}

function getTranslatedCategory(category, lang) {
    const categoriesMap = {
        en: { transport: "Transport", hotel: "Hotel", food: "Food", activities: "Activities", shopping: "Shopping", miscellaneous: "Miscellaneous" },
        hi: { transport: "परिवहन", hotel: "होटल", food: "भोजन", activities: "गतिविधियां", shopping: "खरीदारी", miscellaneous: "विविध" },
        te: { transport: "ರವಾಣಾ", hotel: "ಹೋಟಲ್", food: "ಆಹಾರ", activities: "ಕಾರ್ಯಕಲಾಪాలు", shopping: "షాಪಿಂಗ್", miscellaneous: "ಇತರ ఖర్చులు" },
        es: { transport: "Transporte", hotel: "Hotel", food: "Comida", activities: "Actividades", shopping: "Compras", miscellaneous: "Varios" },
        fr: { transport: "Transport", hotel: "Hôtel", food: "Nourriture", activities: "Activités", shopping: "Achats", miscellaneous: "Divers" },
        de: { transport: "Transport", hotel: "Unterkunft", food: "Verpflegung", activities: "Aktivitäten", shopping: "Einkaufen", miscellaneous: "Sonstiges" },
        ta: { transport: "போக்குவரத்து", hotel: "ஹோட்டல்", food: "உணவு", activities: "செயல்பாடுகள்", shopping: "ஷாப்பிங்", miscellaneous: "இதரவை" },
        kn: { transport: "ಸಾರಿಗೆ", hotel: "ಹೋಟೆಲ್", food: "ಆಹಾರ", activities: "ಚಟುವಟಿಕೆಗಳು", shopping: "ಖರೀದಿ", miscellaneous: "ಇತರ ವೆಚ್ಚಗಳು" }
    };
    const langMap = categoriesMap[lang] || categoriesMap["en"];
    return langMap[category.toLowerCase()] || category;
}

function getTranslatedBudgetStatus(remaining, lang) {
    const statusMap = {
        en: {
            over: `Over budget limit! Plan exceeds limit by ₹${Math.abs(remaining).toLocaleString()}.`,
            under: `Under Budget! Preserved reserve buffer of ₹${remaining.toLocaleString()}.`
        },
        hi: {
            over: `बजट सीमा से अधिक! योजना सीमा से ₹${Math.abs(remaining).toLocaleString()} अधिक है।`,
            under: `बजट के अंदर! ₹${remaining.toLocaleString()} का सुरक्षित बफर बचा है।`,
        },
        te: {
            over: `బడ్జెట్ పరిమిತಿ దాటిపోయింది! ప్రణాళಿಕ పరిమిತಿ కంటే ₹${Math.abs(remaining).toLocaleString()} ఎక్కువగా ఉంది.`,
            under: `బడ్జెట్ పరిమితి లోపల! ₹${remaining.toLocaleString()} నిల్ವ ಬಫರ್ ಸಂರಕ್ಷಿಸಬడింది.`
        },
        es: {
            over: `¡Excede el presupuesto! El plan supera el límite por ₹${Math.abs(remaining).toLocaleString()}.`,
            under: `¡Bajo presupuesto! Reserva conservada de ₹${remaining.toLocaleString()}.`
        },
        fr: {
            over: `Dépassement de budget! Le plan dépasse la limite de ₹${Math.abs(remaining).toLocaleString()}.`,
            under: `Sous budget! Réserve conservée de ₹${remaining.toLocaleString()}.`
        },
        de: {
            over: `Budgetüberschreitung! Der Plan überschreitet das Limit um ₹${Math.abs(remaining).toLocaleString()}.`,
            under: `Im Budget! Reservepuffer von ₹${remaining.toLocaleString()} erhalten.`
        },
        ta: {
            over: `பட்ஜெட் வரம்பை தாண்டியது! திட்டம் வரம்பை விட ₹${Math.abs(remaining).toLocaleString()} அதிகமாக உள்ளது.`,
            under: `பட்ஜெட்டுக்குள்! ₹${remaining.toLocaleString()} பாதுகாப்பு இருப்பு உள்ளது.`
        },
        kn: {
            over: `ಬಡ್ಜೆಟ್ ಮಿತಿ ಮೀರಿದೆ! ಯೋಜನೆ ಮಿತಿಗಿಂತ ₹${Math.abs(remaining).toLocaleString()} ಹೆಚ್ಚಾಗಿದೆ.`,
            under: `ಬಡ್ಜೆಟ್ ಮಿತಿಯಲ್ಲಿ! ₹${remaining.toLocaleString()} ಗಳ ಸುರಕ್ಷಿತ ಬಫರ್ ಉಳಿದಿದೆ.`
        }
    };
    const langMap = statusMap[lang] || statusMap["en"];
    return remaining < 0 ? langMap.over : langMap.under;
}

async function renderTripPlan(plan) {
    const currentLang = localStorage.getItem("app_lang") || "en";

    // Intercept rendering to check if we need to request translation of plan details
    if (currentLang !== "en") {
        if (plan._translatedLang !== currentLang) {
            if (!state.translatedTrips) state.translatedTrips = {};
            const cacheKey = `${plan.trip_id}_${currentLang}`;
            if (state.translatedTrips[cacheKey]) {
                renderTripPlan(state.translatedTrips[cacheKey]);
                return;
            }

            // Show translation loading state
            hideAllSections();
            elements.loadingSection.style.display = "flex";
            elements.loadingTitle.textContent = "Translating Travel Plan...";
            elements.loadingDescription.textContent = `Deploying Translator Agent to translate itinerary parameters into your selected language. Please wait...`;

            try {
                const response = await fetch(`${API_BASE}/translator/translate-plan`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${state.token}`
                    },
                    body: JSON.stringify({
                        plan: plan,
                        target_lang: currentLang
                    })
                });

                if (response.ok) {
                    const translated = await response.json();
                    translated._translatedLang = currentLang;
                    state.translatedTrips[cacheKey] = translated;
                    renderTripPlan(translated);
                    return;
                }
            } catch (err) {
                console.error("Translation agent request failed, using original English format", err);
            }
        }
    }

    hideAllSections();
    elements.detailsSection.style.display = "block";
    
    // Set ticket attributes
    if (document.getElementById("detailsTripId")) {
        document.getElementById("detailsTripId").textContent = `#${plan.trip_id.slice(-4)}`;
    }
    if (document.getElementById("detailsSourceCity")) {
        document.getElementById("detailsSourceCity").textContent = plan.source;
        const srcCode = (plan.transport && plan.transport.source_code) ? plan.transport.source_code : plan.source.substring(0, 3);
        document.getElementById("detailsSourceCode").textContent = srcCode.toUpperCase();
    }
    if (document.getElementById("detailsDestCode")) {
        const destCode = (plan.transport && plan.transport.destination_code) ? plan.transport.destination_code : plan.destination.substring(0, 3);
        document.getElementById("detailsDestCode").textContent = destCode.toUpperCase();
    }
    const t = translationDict[currentLang] || translationDict["en"];

    elements.detailsDestTitle.textContent = plan.destination;
    elements.detailsMetaSubtitle.innerHTML = `
        <i class="fa-solid fa-route"></i> ${(t.nav_home === 'INICIO' || t.nav_home === 'ACCUEIL' || t.nav_home === 'STARTSEITE') ? 'De' : (t.label_source || 'From')} ${plan.source} &nbsp;&bull;&nbsp; 
        <i class="fa-solid fa-calendar-days"></i> ${plan.travel_date} &nbsp;&bull;&nbsp;
        <i class="fa-solid fa-clock"></i> ${plan.days} ${t.days || 'Days'} &nbsp;&bull;&nbsp;
        <i class="fa-solid fa-indian-rupee-sign"></i> ${t.label_budget_limit || 'Budget Limit'}: ₹${Number(plan.budget).toLocaleString()}
    `;

    // Render Highlights tags
    elements.destinationHighlights.innerHTML = "";
    if (plan.destination_highlights && plan.destination_highlights.length > 0) {
        plan.destination_highlights.forEach(hl => {
            const name = (typeof hl === 'object' && hl !== null) ? hl.name : hl;
            const location = (typeof hl === 'object' && hl !== null) ? hl.location : plan.destination;
            const a = document.createElement("a");
            a.className = "highlight-tag vibe-match-link";
            a.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ", " + location)}`;
            a.target = "_blank";
            a.title = `Search "${name}" on Google Maps`;
            a.innerHTML = `<i class="fa-solid fa-location-dot" style="margin-right: 5px; font-size: 0.85em; opacity: 0.9;"></i>${name}`;
            elements.destinationHighlights.appendChild(a);
        });
    }

    // Render Places to Visit vertical cards in placesTab
    const placesListVertical = document.getElementById("placesListVertical");
    if (placesListVertical) {
        placesListVertical.innerHTML = "";
        if (plan.destination_highlights && plan.destination_highlights.length > 0) {
            plan.destination_highlights.forEach(async (hl) => {
                const name = (typeof hl === 'object' && hl !== null) ? hl.name : hl;
                const location = (typeof hl === 'object' && hl !== null) ? hl.location : plan.destination;
                const rating = (typeof hl === 'object' && hl !== null) ? hl.rating : 4.5;
                const apiImg = (typeof hl === 'object' && hl !== null) ? hl.image_url : null;

                const placeCard = document.createElement("div");
                placeCard.className = "vertical-place-card glass-panel";
                
                const localDetails = getLocalPlaceDetails(name, plan.destination);
                let imgUrl = apiImg || localDetails.img;
                let desc = localDetails.desc;
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ", " + location)}`;
                
                // Safe class/id friendly name
                const safeName = name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                const cardImgId = `place-img-${safeName}`;
                const cardDescId = `place-desc-${safeName}`;
                
                // Render as an img element instead of background-image div to support native onerror fallback
                placeCard.innerHTML = `
                    <img class="place-card-img" id="${cardImgId}" src="${imgUrl}" alt="${name}" onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80'">
                    <div class="place-card-info">
                        <h4>${name} <span class="rating-badge" style="margin-left: 10px; font-size: 0.75rem; color: #fbbf24;"><i class="fa-solid fa-star"></i> ${rating}</span></h4>
                        <p id="${cardDescId}">${desc}</p>
                        <a href="${mapsUrl}" target="_blank" class="btn btn-secondary btn-sm place-map-btn">
                            <i class="fa-solid fa-map-pin"></i> ${t.btn_view_map || 'View on Google Maps'}
                        </a>
                    </div>
                `;
                placesListVertical.appendChild(placeCard);

                // Immediately fetch from Wikipedia search & summaries to override preset defaults with exact location data
                const onlineDetails = await fetchPlaceDetailsOnline(name, plan.destination);
                if (onlineDetails) {
                    const imgEl = document.getElementById(cardImgId);
                    const descEl = document.getElementById(cardDescId);
                    
                    if (!apiImg && onlineDetails.img && imgEl) {
                        imgEl.src = onlineDetails.img;
                    }
                    if (onlineDetails.desc && descEl) {
                        descEl.textContent = onlineDetails.desc;
                    }
                }
            });
        } else {
            placesListVertical.innerHTML = `<p class="no-places-msg">No highlights suggested by the planning swarm.</p>`;
        }
    }

    elements.detailsTabs[0].click();

    // 1. ITINERARY TIMELINE
    elements.itineraryTimeline.innerHTML = "";
    plan.itinerary.forEach((day, index) => {
        const section = document.createElement("div");
        section.className = "day-section";
        if (index === 0) section.classList.add("expanded");
        
        section.innerHTML = `
            <div class="day-marker">${day.day}</div>
            <div class="day-content-card glass-panel">
                <div class="day-header" onclick="this.parentElement.parentElement.classList.toggle('expanded')">
                    <h4><i class="fa-solid fa-route"></i> Day ${day.day} Planning Swarm</h4>
                    <span class="day-cost">Est. Spend: ₹${Number(day.estimated_spend).toLocaleString()}</span>
                    <i class="fa-solid fa-chevron-down accordion-icon"></i>
                </div>
                <div class="time-slots-wrapper">
                    <div class="time-slots">
                        <div class="time-slot slot-morning">
                            <div class="time-slot-header">
                                <span class="time-tag"><i class="fa-solid fa-mug-hot"></i> Morning</span>
                                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.destination + ' ' + day.morning)}" target="_blank" class="map-explore-btn" title="Explore on Google Maps">
                                    <i class="fa-solid fa-map-location-dot"></i> Maps
                                </a>
                            </div>
                            <div class="time-slot-text">${day.morning}</div>
                        </div>
                        <div class="time-slot slot-afternoon">
                            <div class="time-slot-header">
                                <span class="time-tag"><i class="fa-solid fa-compass"></i> Afternoon</span>
                                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.destination + ' ' + day.afternoon)}" target="_blank" class="map-explore-btn" title="Explore on Google Maps">
                                    <i class="fa-solid fa-map-location-dot"></i> Maps
                                </a>
                            </div>
                            <div class="time-slot-text">${day.afternoon}</div>
                        </div>
                        <div class="time-slot slot-evening">
                            <div class="time-slot-header">
                                <span class="time-tag"><i class="fa-solid fa-utensils"></i> Evening</span>
                                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.destination + ' ' + day.evening)}" target="_blank" class="map-explore-btn" title="Explore on Google Maps">
                                    <i class="fa-solid fa-map-location-dot"></i> Maps
                                </a>
                            </div>
                            <div class="time-slot-text">${day.evening}</div>
                        </div>
                        <div class="time-slot slot-night">
                            <div class="time-slot-header">
                                <span class="time-tag"><i class="fa-solid fa-moon"></i> Night</span>
                                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.destination + ' ' + day.night)}" target="_blank" class="map-explore-btn" title="Explore on Google Maps">
                                    <i class="fa-solid fa-map-location-dot"></i> Maps
                                </a>
                            </div>
                            <div class="time-slot-text">${day.night}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        elements.itineraryTimeline.appendChild(section);
    });

    // 2. STAYS & TRANSPORT
    elements.hotelList.innerHTML = "";
    plan.hotels.forEach(hotel => {
        const card = document.createElement("div");
        card.className = "hotel-card";
        
        let starsHtml = "";
        const fullStars = Math.floor(hotel.rating);
        for(let i=0; i<fullStars; i++) starsHtml += '<i class="fa-solid fa-star"></i>';
        if(hotel.rating % 1 !== 0) starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
        
        const amenitiesHtml = hotel.features.map(f => `<span class="amenity-badge">${f}</span>`).join("");

        card.innerHTML = `
            <div class="hotel-info">
                <h4>${hotel.name}</h4>
                <div class="hotel-meta">
                    <span class="hotel-rating">${starsHtml} ${hotel.rating}</span>
                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + ', ' + hotel.location)}" target="_blank" class="hotel-location-link" title="View on Google Maps" onclick="event.stopPropagation();"><i class="fa-solid fa-map-pin"></i> ${hotel.location}</a>
                </div>
                <div class="hotel-amenities">
                    ${amenitiesHtml}
                </div>
            </div>
            <div class="hotel-price-box" style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                <div class="hotel-cost">₹${Number(hotel.total_cost).toLocaleString()}</div>
                <div class="hotel-nightly">₹${Number(hotel.cost_per_night).toLocaleString()} / night</div>
                <a href="https://www.google.com/travel/hotels?q=${encodeURIComponent(hotel.name + ' ' + hotel.location)}" target="_blank" class="btn btn-primary btn-sm btn-orange book-now-btn" style="margin-top: 6px; padding: 6px 12px; font-size: 0.75rem; border-radius: var(--radius-sm);" onclick="event.stopPropagation();"><i class="fa-solid fa-calendar-check"></i> Book Now</a>
            </div>
        `;

        elements.hotelList.appendChild(card);
    });

    // Recommended Transport Box
    const tRec = plan.transport;
    const cheapestFlight = (tRec.available_options && tRec.available_options.length > 0)
        ? (tRec.available_options.find(opt => opt.cost === tRec.recommended_cost) || tRec.available_options[0])
        : null;

    const recommendedProvider = cheapestFlight ? cheapestFlight.provider : "Flight";
    const recommendedDep = cheapestFlight ? cheapestFlight.departure_time : "N/A";
    const recommendedDur = cheapestFlight ? cheapestFlight.duration : "N/A";

    // Format travel date for Google Flights (DD-MM-YYYY -> YYYY-MM-DD)
    let formattedDate = "";
    if (plan.travel_date) {
        const dateParts = plan.travel_date.split("-");
        if (dateParts.length === 3) {
            if (dateParts[0].length === 4) {
                formattedDate = plan.travel_date;
            } else {
                formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            }
        }
    }

    const fromLocation = (plan.transport && plan.transport.source_code) ? plan.transport.source_code : plan.source.split(',')[0].trim();
    const toLocation = (plan.transport && plan.transport.destination_code) ? plan.transport.destination_code : plan.destination.split(',')[0].trim();
    let recQuery = `Flights from ${fromLocation} to ${toLocation}`;
    if (formattedDate) {
        recQuery += ` on ${formattedDate}`;
    }
    if (recommendedProvider && recommendedProvider !== "Flight" && recommendedProvider !== "N/A" && recommendedProvider !== "Unknown Airline") {
        const cleanProvider = recommendedProvider.split('+')[0].trim();
        const isCargo = /cargo|fedex|dhl|ups|freight|logistics|cargolux|amazon air|prime air|atlas air/i.test(cleanProvider);
        if (!isCargo) {
            recQuery += ` with ${cleanProvider}`;
        }
    }
    const recBookingUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(recQuery)}`;

    elements.recommendedTransport.innerHTML = `
        <span class="rec-title-badge"><i class="fa-solid fa-thumbs-up"></i> Swarm Selection</span>
        <div class="trans-main-row">
            <div class="trans-mode"><i class="fa-solid fa-plane"></i> ${recommendedProvider}</div>
            <div class="trans-cost">₹${Number(tRec.recommended_cost).toLocaleString()}</div>
        </div>
        <div class="trans-details">
            <div><strong>Departure:</strong> ${recommendedDep}</div>
            <div><strong>Duration:</strong> ${recommendedDur}</div>
        </div>
        <div class="trans-reason">
            "${tRec.reason}"
        </div>
        <a href="${recBookingUrl}" target="_blank" class="btn btn-primary btn-sm btn-block" style="margin-top: 16px; text-decoration: none; text-align: center;">
            <i class="fa-solid fa-ticket"></i> Book Now
        </a>
    `;

    // Render Alternative Flights
    elements.altTransportList.innerHTML = "";
    if (tRec.available_options && tRec.available_options.length > 0) {
        tRec.available_options.forEach(opt => {
            const isCheapest = (cheapestFlight && opt.cost === cheapestFlight.cost && opt.provider === cheapestFlight.provider && opt.departure_time === cheapestFlight.departure_time);
            
            const item = document.createElement("div");
            item.className = "alt-trans-item";
            
            if (isCheapest) {
                item.style.borderColor = "var(--success)";
                item.style.background = "var(--success-light)";
            }

            const badgeHtml = isCheapest 
                ? `<span class="rec-title-badge" style="margin: 0 0 0 10px; padding: 2px 8px; font-size: 0.65rem;"><i class="fa-solid fa-star"></i> Cheapest</span>` 
                : "";

            const fromLocationOpt = (plan.transport && plan.transport.source_code) ? plan.transport.source_code : plan.source.split(',')[0].trim();
            const toLocationOpt = (plan.transport && plan.transport.destination_code) ? plan.transport.destination_code : plan.destination.split(',')[0].trim();
            let optQuery = `Flights from ${fromLocationOpt} to ${toLocationOpt}`;
            if (formattedDate) {
                optQuery += ` on ${formattedDate}`;
            }
            const provider = opt.provider || opt.mode;
            if (provider && provider !== "Flight" && provider !== "N/A" && provider !== "Unknown Airline") {
                const cleanProvider = provider.split('+')[0].trim();
                const isCargo = /cargo|fedex|dhl|ups|freight|logistics|cargolux|amazon air|prime air|atlas air/i.test(cleanProvider);
                if (!isCargo) {
                    optQuery += ` with ${cleanProvider}`;
                }
            }
            const optBookingUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(optQuery)}`;

            item.innerHTML = `
                <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                    <div class="alt-trans-mode">
                        <i class="fa-solid fa-plane"></i> ${opt.provider || opt.mode} ${badgeHtml}
                    </div>
                    <div style="color: var(--text-secondary); font-size: 0.78rem;">
                        Dep: ${opt.departure_time || '12:00'} (${opt.duration})
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 14px;">
                    <strong style="font-size: 0.95rem; color: var(--text-primary);">₹${Number(opt.cost).toLocaleString()}</strong>
                    <a href="${optBookingUrl}" target="_blank" class="btn btn-primary btn-sm" style="padding: 6px 12px; font-size: 0.75rem; text-decoration: none; text-align: center;">Book Now</a>
                </div>
            `;
            elements.altTransportList.appendChild(item);
        });
    }

    // 3. WEATHER FORECAST
    elements.weatherForecastGrid.innerHTML = "";
    const weatherCards = [];
    
    plan.weather.forecast.forEach((w, idx) => {
        const wCard = document.createElement("div");
        wCard.className = "weather-card";
        
        const dateParts = w.date.split("-");
        const dayNumber = dateParts[0] || "";
        const monthLabel = w.day_label || "";
        
        let weatherIcon = "fa-cloud-sun";
        const cond = w.condition.toLowerCase();
        if (cond.includes("rain") || cond.includes("shower")) weatherIcon = "fa-cloud-showers-heavy";
        else if (cond.includes("sunny") || cond.includes("clear")) weatherIcon = "fa-sun";
        else if (cond.includes("thunder") || cond.includes("storm")) weatherIcon = "fa-cloud-bolt";
        else if (cond.includes("snow")) weatherIcon = "fa-snowflake";
        else if (cond.includes("cloud") || cond.includes("overcast")) weatherIcon = "fa-cloud";

        let tempMin = w.temp_min;
        let tempMax = w.temp_max;
        if (!tempMin || !tempMax) {
            const numericTemp = parseFloat(w.temperature) || 25;
            const unit = w.temperature && w.temperature.includes("F") ? "°F" : "°C";
            if (!tempMax) tempMax = w.temperature || (numericTemp + "°C");
            if (!tempMin) tempMin = (Math.round((numericTemp - 6) * 10) / 10) + unit;
        }
        
        const displayMax = tempMax.replace("°C", "°").replace("°F", "°");
        const displayMin = tempMin.replace("°C", "°").replace("°F", "°");

        wCard.style.cssText = "background: #1f2937; border-radius: 18px; padding: 16px 12px; min-width: 95px; text-align: center; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s;";
        
        wCard.innerHTML = `
            <div style="font-size: 0.95rem; font-weight: 800; color: #fff;">
                ${dayNumber} <span style="font-size: 0.75rem; color: #9ca3af; font-weight: 600; display: block; margin-top: 1px;">${monthLabel}</span>
            </div>
            <div style="height: 38px; display: flex; align-items: center; justify-content: center; margin: 2px 0;">
                <i class="fa-solid ${weatherIcon}" style="font-size: 1.5rem; color: #fec006;"></i>
            </div>
            <div style="font-size: 1rem; font-weight: 800; color: #fff;">${displayMax}</div>
            <div style="font-size: 0.78rem; color: #9ca3af; font-weight: 600;">${displayMin}</div>
        `;
        
        wCard.addEventListener("click", () => {
            weatherCards.forEach(c => c.classList.remove("active"));
            wCard.classList.add("active");
            showHourlyForecast(w);
        });
        
        elements.weatherForecastGrid.appendChild(wCard);
        weatherCards.push(wCard);
    });

    // Function to render Google Weather style hourly forecast
    function showHourlyForecast(dayData) {
        const hourlyCard = document.getElementById("hourlyWeatherCard");
        const hourlyRow = document.getElementById("weatherHourlyRow");
        const dayLabel = document.getElementById("selectedDayLabel");
        if (!hourlyCard || !hourlyRow || !dayLabel) return;
        
        dayLabel.textContent = `${dayData.day_label || 'Day'} (${dayData.date}) Overview`;
        
        // Update top stats panel details dynamically if elements exist
        const condEl = document.getElementById("currentDayCond");
        if (condEl) condEl.textContent = dayData.condition || "Clear";
        
        const baseTemp = parseFloat(dayData.temperature) || parseFloat(dayData.temp_max) || 25;
        
        const aqEl = document.getElementById("currentAirQuality");
        if (aqEl) aqEl.innerHTML = `<span style="display:inline-block; width:8px; height:8px; background:#10b981; border-radius:50%; margin-right:6px;"></span>${dayData.air_quality || "50 (Good)"}`;
        
        const windEl = document.getElementById("currentWind");
        if (windEl) windEl.innerHTML = `${dayData.wind || "13 km/h"} <i class="fa-solid fa-arrow-right" style="transform: rotate(${(Math.random()*360).toFixed(0)}deg); font-size:0.8rem; color:#9ca3af; margin-left:4px;"></i>`;
        
        const humEl = document.getElementById("currentHumidity");
        if (humEl) humEl.textContent = dayData.humidity || "54%";
        
        const feelsEl = document.getElementById("currentFeelsLike");
        if (feelsEl) feelsEl.textContent = dayData.feels_like || `${Math.round(baseTemp - 1.5)}°`;
        
        const visEl = document.getElementById("currentVisibility");
        if (visEl) visEl.textContent = dayData.visibility || "5 km";
        
        const uvEl = document.getElementById("currentUVIndex");
        if (uvEl) uvEl.textContent = dayData.uv_index || "2";
        
        const pressEl = document.getElementById("currentPressure");
        if (pressEl) pressEl.textContent = dayData.pressure || "1011 mb";
        
        const dewEl = document.getElementById("currentDewPoint");
        if (dewEl) dewEl.textContent = dayData.dew_point || `${Math.round(baseTemp - 5)}°`;

        // Remove existing hourly items
        hourlyRow.innerHTML = "";
        
        let hourly = dayData.hourly;
        if (!hourly || hourly.length === 0) {
            // Generate fallback mock hourly data based on temperature
            const dayCondition = dayData.condition || "Clear";
            const hours = [
                { time: "7 AM", offset: -2.0 }, { time: "9 AM", offset: -0.5 }, { time: "11 AM", offset: 1.5 }, 
                { time: "1 PM", offset: 3.5 }, { time: "3 PM", offset: 4.0 }, { time: "5 PM", offset: 2.8 }, 
                { time: "7 PM", offset: 1.0 }, { time: "9 PM", offset: -0.5 }, { time: "11 PM", offset: -1.5 }, 
                { time: "1 AM", offset: -2.5 }, { time: "3 AM", offset: -3.5 }, { time: "5 AM", offset: -4.0 }
            ];
            hourly = hours.map(h => {
                const randomOffset = Math.random() * 0.8 - 0.4;
                const temp = Math.round((baseTemp + h.offset + randomOffset) * 10) / 10;
                return {
                    time: h.time,
                    temp: temp,
                    condition: dayCondition
                };
            });
        }
        
        if (hourly && hourly.length > 0) {
            hourly.forEach(hour => {
                const hItem = document.createElement("div");
                hItem.style.cssText = "display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-width: 68px; text-align: center; gap: 8px; position: relative; padding-top: 10px; z-index: 5;";
                
                let weatherIcon = "fa-cloud-sun";
                const cond = hour.condition.toLowerCase();
                if (cond.includes("rain") || cond.includes("shower")) weatherIcon = "fa-cloud-showers-heavy";
                else if (cond.includes("sunny") || cond.includes("clear")) weatherIcon = "fa-sun";
                else if (cond.includes("thunder") || cond.includes("storm")) weatherIcon = "fa-cloud-bolt";
                else if (cond.includes("snow")) weatherIcon = "fa-snowflake";
                else if (cond.includes("cloud") || cond.includes("overcast")) weatherIcon = "fa-cloud";
                
                hItem.innerHTML = `
                    <span style="font-size: 0.78rem; color: #9ca3af; font-weight: 600;">${hour.time}</span>
                    <div style="height: 30px; display: flex; align-items: center; justify-content: center; margin: 4px 0;">
                        <i class="fa-solid ${weatherIcon}" style="font-size: 1.25rem; color: #fec006;"></i>
                    </div>
                    <span style="font-size: 0.95rem; font-weight: 700; color: #fff;">${Math.round(parseFloat(hour.temp))}°</span>
                `;
                hourlyRow.appendChild(hItem);
            });
            
            // Build visual area graph line inside hourlySparklineCanvas
            const sparklineCanvas = document.getElementById("hourlySparklineCanvas");
            if (sparklineCanvas) {
                const temps = hourly.map(h => parseFloat(h.temp));
                const minTemp = Math.min(...temps);
                const maxTemp = Math.max(...temps);
                const range = maxTemp - minTemp || 1;
                
                const points = temps.map((temp, index) => {
                    const x = (index / (temps.length - 1)) * 1000;
                    const y = 60 - ((temp - minTemp) / range) * 45;
                    return `${x},${y}`;
                });
                
                const pathD = `M ${points.join(" L ")}`;
                const areaD = `${pathD} L 1000,75 L 0,75 Z`;
                
                sparklineCanvas.innerHTML = `
                    <svg viewBox="0 0 1000 75" preserveAspectRatio="none" style="width: 100%; height: 100%; display: block;">
                        <defs>
                            <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#fec006" stop-opacity="0.2"/>
                                <stop offset="100%" stop-color="#fec006" stop-opacity="0.0"/>
                            </linearGradient>
                        </defs>
                        <path d="${areaD}" fill="url(#sparklineGrad)"/>
                        <path d="${pathD}" fill="none" stroke="#fec006" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                        ${points.map((pt, idx) => {
                            const [x, y] = pt.split(",");
                            return `<circle cx="${x}" cy="${y}" r="4.5" fill="#fff" stroke="#fec006" stroke-width="2.5" />`;
                        }).join("")}
                    </svg>
                `;
            }
            
            hourlyCard.style.display = "block";
        } else {
            hourlyCard.style.display = "none";
        }
    }

    // Auto-select the first day hourly
    if (plan.weather.forecast.length > 0) {
        showHourlyForecast(plan.weather.forecast[0]);
        if (weatherCards.length > 0) {
            weatherCards[0].classList.add("active");
        }
    }

    // Interactive chips (Overview, Precipitation, Wind, etc.)
    document.querySelectorAll(".weather-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".weather-chip").forEach(c => {
                c.style.background = "#1f2937";
                c.style.color = "#9ca3af";
                c.classList.remove("active-chip");
            });
            chip.style.background = "#fec006";
            chip.style.color = "#111827";
            chip.classList.add("active-chip");
            
            // Toggle/simulate weather data parameters when switching categories
            const activeCardIdx = weatherCards.findIndex(c => c.classList.contains("active"));
            const dayData = plan.weather.forecast[activeCardIdx !== -1 ? activeCardIdx : 0];
            if (dayData) {
                showHourlyForecast(dayData);
            }
        });
    });

    // Interactive View buttons (Chart / List)
    document.querySelectorAll(".weather-view-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".weather-view-btn").forEach(b => {
                b.style.background = "transparent";
                b.style.color = "#9ca3af";
                b.classList.remove("active-view");
            });
            btn.style.background = "#374151";
            btn.style.color = "#fff";
            btn.classList.add("active-view");
            
            const chartCanvas = document.getElementById("hourlySparklineCanvas");
            if (btn.textContent.includes("List")) {
                if (chartCanvas) chartCanvas.style.opacity = "0.05"; // dim sparkline in list view
            } else {
                if (chartCanvas) chartCanvas.style.opacity = "1";
            }
        });
    });

    elements.weatherSuggestionsList.innerHTML = "";
    plan.weather.suggestions.forEach(s => {
        const li = document.createElement("li");
        li.style.cssText = "display: flex; align-items: flex-start; gap: 8px; color: #cbd5e1; font-size: 0.82rem; line-height: 1.4;";
        li.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #10b981; font-size: 0.95rem; margin-top: 1px;"></i> <span>${s}</span>`;
        elements.weatherSuggestionsList.appendChild(li);
    });

    // 4. BUDGET ANALYSIS
    elements.budgetTotalVal.textContent = `₹${Number(plan.budget).toLocaleString()}`;
    elements.budgetSpentVal.textContent = `₹${Number(plan.budget_analysis.total_spent).toLocaleString()}`;
    
    const remaining = plan.budget_analysis.remaining_budget;
    elements.budgetRemainingVal.textContent = `₹${Number(remaining).toLocaleString()}`;
    
    if (remaining < 0) {
        elements.budgetRemainingVal.className = "stat-value text-danger";
        elements.budgetStatusAlert.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
        elements.budgetStatusAlert.style.color = "var(--danger)";
        elements.budgetStatusAlert.style.borderColor = "rgba(239, 68, 68, 0.18)";
        elements.budgetStatusAlert.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${getTranslatedBudgetStatus(remaining, currentLang)}`;
    } else {
        elements.budgetRemainingVal.className = "stat-value text-success";
        elements.budgetStatusAlert.style.backgroundColor = "var(--success-light)";
        elements.budgetStatusAlert.style.color = "var(--success)";
        elements.budgetStatusAlert.style.borderColor = "rgba(16, 185, 129, 0.15)";
        elements.budgetStatusAlert.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${getTranslatedBudgetStatus(remaining, currentLang)}</span>`;
    }

    // Budget Bars Rendering
    elements.budgetBars.innerHTML = "";
    const breakdown = plan.budget_analysis.breakdown;
    const totalSpent = plan.budget_analysis.total_spent || 1;
    
    for (const [category, cost] of Object.entries(breakdown)) {
        const percentage = Math.min((cost / totalSpent) * 100, 100);
        const barItem = document.createElement("div");
        barItem.className = "budget-bar-item";
        barItem.innerHTML = `
            <div class="bar-labels">
                <span class="bar-cat">${capitalizeFirstLetter(getTranslatedCategory(category, currentLang))}</span>
                <span class="bar-val">₹${Number(cost).toLocaleString()} (${Math.round(percentage)}%)</span>
            </div>
            <div class="bar-bg">
                <div class="bar-fill" data-width="${percentage}%" style="width: 0%;"></div>
            </div>
        `;
        elements.budgetBars.appendChild(barItem);
    }

    // Final recommendation summary
    elements.finalRecScore.textContent = plan.final_recommendation.overall_score.toFixed(1);
    elements.finalRecHotel.textContent = plan.final_recommendation.hotel;
    elements.finalRecTransport.textContent = plan.final_recommendation.transport;

    // AI Tips list rendered with Agent Avatars
    elements.aiRecommendationsList.innerHTML = "";
    plan.ai_recommendations.forEach(tip => {
        const item = document.createElement("div");
        item.className = "ai-tip-item";
        
        let agentName = "Swarm Coordinator";
        let avatarIcon = "fa-network-wired";
        
        const tipLower = tip.toLowerCase();
        if (tipLower.includes("weather") || tipLower.includes("rain") || tipLower.includes("temperature")) {
            agentName = "Weather Agent";
            avatarIcon = "fa-cloud-sun";
        } else if (tipLower.includes("budget") || tipLower.includes("save") || tipLower.includes("cost") || tipLower.includes("expensive")) {
            agentName = "Budget Agent";
            avatarIcon = "fa-chart-pie";
        } else if (tipLower.includes("hotel") || tipLower.includes("stay") || tipLower.includes("resort")) {
            agentName = "Hotel Agent";
            avatarIcon = "fa-hotel";
        } else if (tipLower.includes("transit") || tipLower.includes("flight") || tipLower.includes("train")) {
            agentName = "Transit Agent";
            avatarIcon = "fa-plane-departure";
        }

        if (tipLower.includes("could not be loaded") || tipLower.includes("failed")) {
            item.style.borderColor = "var(--danger)";
            item.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="color: var(--danger);"></i> <div><strong>System Warning:</strong> ${tip}</div>`;
        } else {
            item.innerHTML = `<i class="fa-solid ${avatarIcon}"></i> <div><strong>${agentName}:</strong> ${tip}</div>`;
        }
        elements.aiRecommendationsList.appendChild(item);
    });

    // Apply translations
    applyLanguage(localStorage.getItem("app_lang") || "en");
}

function animateBudgetVisuals() {
    if (!state.activeTrip) return;
    
    // 1. Animate circular gauge ring
    const total = state.activeTrip.budget || 1;
    const spent = state.activeTrip.budget_analysis.total_spent || 0;
    const percentage = Math.min(Math.round((spent / total) * 100), 100);
    
    const offset = 314 - (314 * percentage / 100);
    
    if (elements.budgetRingFill) {
        elements.budgetRingFill.style.strokeDashoffset = offset;
    }
    if (elements.budgetPercentVal) {
        elements.budgetPercentVal.textContent = `${percentage}%`;
    }

    // 2. Animate budget breakdown bars
    document.querySelectorAll(".budget-bar-item .bar-fill").forEach(bar => {
        const targetWidth = bar.getAttribute("data-width");
        setTimeout(() => {
            bar.style.width = targetWidth;
        }, 150);
    });
}

// ==========================================
// Trip Wizard Plan Creation
// ==========================================
async function handleCreateTrip(e) {
    e.preventDefault();

    const source = elements.tripSource.value.trim();
    const destination = elements.tripDestination.value.trim();
    const rawDate = elements.tripDate.value; 
    const days = parseInt(elements.tripDays.value, 10);
    const budget = parseFloat(elements.tripBudget.value);
    const requirements = elements.tripRequirements.value.trim();

    // Convert date YYYY-MM-DD -> DD-MM-YYYY
    const dateParts = rawDate.split("-");
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

    // Collect preferences chips
    const preferences = [];
    elements.preferencesChips.querySelectorAll(".chip.selected").forEach(chip => {
        preferences.push(chip.dataset.val);
    });

    hideAllSections();
    elements.loadingSection.style.display = "flex";
    
    elements.loadingTitle.textContent = "Deploying Swarm Coordinator...";
    elements.loadingDescription.textContent = "Establishing secure agent threads. Submitting requirements payload.";
    
    resetAgentLoaderSteps();
    clearTerminalLogs();

    const logsInterval = runSimulatedTerminalLogs(false);

    const payload = {
        source,
        destination,
        travel_date: formattedDate,
        days,
        budget,
        preferences,
        additional_requirements: requirements
    };

    try {
        const response = await fetch(`${API_BASE}/trip/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${state.token}`
            },
            body: JSON.stringify(payload)
        });

        clearInterval(logsInterval);

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Multi-Agent planner failed to generate itinerary.");
        }

        const plan = await response.json();
        
        setAllStepsComplete();
        appendTerminalLog("success", "[SYSTEM] Swarm plan compilation verified. Redirecting...");
        
        setTimeout(() => {
            renderTripPlan(plan);
        }, 500);
    } catch (err) {
        clearInterval(logsInterval);
        elements.loadingSection.style.display = "none";
        alert(err.message);
        showWizard();
    }
}

// ==========================================
// Loading Overlay Swarm Simulator
// ==========================================
const stepConfigs = [
    { id: "step-coord", label: "Coordinator", order: 0 },
    { id: "step-dest", label: "Destination", order: 1 },
    { id: "step-weather", label: "Weather", order: 2 },
    { id: "step-hotel", label: "Hotels", order: 3 },
    { id: "step-transport", label: "Transport", order: 4 },
    { id: "step-budget", label: "Budget", order: 5 },
    { id: "step-llm", label: "LLM Expert", order: 6 }
];

function resetAgentLoaderSteps() {
    stepConfigs.forEach(step => {
        const el = document.getElementById(step.id);
        if (el) {
            el.className = "agent-step-node";
            el.querySelector(".step-icon").innerHTML = `<i class="fa-solid fa-circle-minus"></i>`;
        }
    });
}

function setAllStepsComplete() {
    stepConfigs.forEach(step => {
        const el = document.getElementById(step.id);
        if (el) {
            el.className = "agent-step-node complete";
            el.querySelector(".step-icon").innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
        }
    });
}

function clearTerminalLogs() {
    elements.terminalLogs.innerHTML = "";
}

function appendTerminalLog(type, text) {
    const entry = document.createElement("p");
    entry.className = `log-entry ${type}`;
    
    const now = new Date();
    const timeStr = `[${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}]`;
    
    entry.textContent = `${timeStr} ${text}`;
    elements.terminalLogs.appendChild(entry);
    
    elements.terminalLogs.scrollTop = elements.terminalLogs.scrollHeight;
}

const simulatedLogSequence = [
    { step: 0, type: "system", text: "Initializing agent stack orchestration threads..." },
    { step: 0, type: "agent-coordinator", text: "[Coordinator] Launching task pipeline context." },
    { step: 0, type: "agent-coordinator", text: "[Coordinator] Submitting configurations payload." },
    { step: 1, type: "agent-dest", text: "[DestinationAgent] Fetching local tourism registers and landmarks..." },
    { step: 1, type: "agent-dest", text: "[DestinationAgent] Tagging beach/cultural venues matching preference parameters." },
    { step: 2, type: "agent-weather", text: "[WeatherAgent] Establishing satellite socket with global database..." },
    { step: 2, type: "agent-weather", text: "[WeatherAgent] Fetching day-by-day forecast coordinates. Rain limits analyzed." },
    { step: 3, type: "agent-hotel", text: "[HotelAgent] Querying active local accommodations matching cost budget..." },
    { step: 3, type: "agent-hotel", text: "[HotelAgent] Retreived 3 candidate resorts. Sourcing real ratings." },
    { step: 4, type: "agent-transport", text: "[TransportAgent] Querying available flight coordinates and arrival estimates..." },
    { step: 4, type: "agent-transport", text: "[TransportAgent] Running price-to-duration algorithms for optimal speed." },
    { step: 5, type: "agent-budget", text: "[BudgetAgent] Running category allocation audit [Hotel, Travel, Dining]..." },
    { step: 5, type: "agent-budget", text: "[BudgetAgent] Recalculating allocations. Optimization fits within budget limits." },
    { step: 6, type: "agent-coordinator", text: "[Coordinator] Compiling structured parameters. Discarding poor choices." },
    { step: 6, type: "system", text: "Invoking Groq LLM recommender engine..." }
];

function runSimulatedTerminalLogs(isDetailsRetrieveOnly = false) {
    let logIndex = 0;
    const intervalMs = isDetailsRetrieveOnly ? 250 : 800;
    
    const firstStepNode = document.getElementById(stepConfigs[0].id);
    if (firstStepNode) {
        firstStepNode.className = "agent-step-node active";
        firstStepNode.querySelector(".step-icon").innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
    }

    appendTerminalLog("system", "[SYSTEM] Establishing secure socket layer with agent swarm core...");

    const interval = setInterval(() => {
        if (logIndex < simulatedLogSequence.length) {
            const currentLog = simulatedLogSequence[logIndex];
            
            appendTerminalLog(currentLog.type, currentLog.text);
            
            const activeStep = stepConfigs[currentLog.step];
            const nodeEl = document.getElementById(activeStep.id);
            if (nodeEl && !nodeEl.classList.contains("complete")) {
                if (currentLog.step > 0) {
                    const prevStep = stepConfigs[currentLog.step - 1];
                    const prevNode = document.getElementById(prevStep.id);
                    if (prevNode) {
                        prevNode.className = "agent-step-node complete";
                        prevNode.querySelector(".step-icon").innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
                    }
                }
                
                nodeEl.className = "agent-step-node active";
                nodeEl.querySelector(".step-icon").innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
                elements.loadingDescription.textContent = `Active Thread: ${activeStep.label} Agent processing...`;
            }

            logIndex++;
        } else {
            clearInterval(interval);
        }
    }, intervalMs);

    return interval;
}

// ==========================================
// Formatting Helpers
// ==========================================
function capitalizeFirstLetter(string) {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getLocalPlaceDetails(placeName, destinationName) {
    if (!placeName) {
        return {
            img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80",
            desc: "Explore this amazing attraction. Perfect vibe match choice curated by the VoyageAI multi-agent swarm.",
            isFallback: true
        };
    }
    
    const key = placeName.toLowerCase().trim();
    
    const PLACE_IMAGES = {
        // Hyderabad
        "charminar": "https://images.unsplash.com/photo-1599930104167-91a56614138e?auto=format&fit=crop&w=400&q=80",
        "golconda fort": "https://images.unsplash.com/photo-1599661046289-e31887fd9f11?auto=format&fit=crop&w=400&q=80",
        "hussain sagar": "https://images.unsplash.com/photo-1627894481066-b33a0c54f2a7?auto=format&fit=crop&w=400&q=80",
        "qutub shahi tombs": "https://images.unsplash.com/photo-1600100397608-f010e42ecb76?auto=format&fit=crop&w=400&q=80",
        "birla mandir": "https://images.unsplash.com/photo-1609137144813-2d14878be3fd?auto=format&fit=crop&w=400&q=80",
        "salar jung museum": "https://images.unsplash.com/photo-1601887389937-0b02c26b6c3c?auto=format&fit=crop&w=400&q=80",
        "chowmahalla palace": "https://images.unsplash.com/photo-1585129638847-3bb0e8dc0148?auto=format&fit=crop&w=400&q=80",
        "ramoji film city": "https://images.unsplash.com/photo-1533240332313-0db49b439ad3?auto=format&fit=crop&w=400&q=80",
        
        // Chennai
        "marina beach": "https://images.unsplash.com/photo-1589136777351-fdc9c9400c73?auto=format&fit=crop&w=400&q=80",
        "kapaleeswarar temple": "https://images.unsplash.com/photo-1609137144813-2d14878be3fd?auto=format&fit=crop&w=400&q=80",
        "elliots beach": "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=400&q=80",
        "mahabalipuram": "https://images.unsplash.com/photo-1581335805244-67253503a5fe?auto=format&fit=crop&w=400&q=80",
        "santhome cathedral": "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=400&q=80",
        
        // Tokyo
        "shibuya": "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=400&q=80",
        "senso-ji": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80",
        "tokyo tower": "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=400&q=80",
        "harajuku": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80",
        "shinjuku": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=80",
        "meiji": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=400&q=80",

        // Paris
        "eiffel": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80",
        "louvre": "https://images.unsplash.com/photo-1601887389937-0b02c26b6c3c?auto=format&fit=crop&w=400&q=80",
        "notre dame": "https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=400&q=80",
        "champs-elysees": "https://images.unsplash.com/photo-1509060464153-44667396260f?auto=format&fit=crop&w=400&q=80",
        "seine": "https://images.unsplash.com/photo-1499856138868-7521360ee28a?auto=format&fit=crop&w=400&q=80",
        "montmartre": "https://images.unsplash.com/photo-1509060464153-44667396260f?auto=format&fit=crop&w=400&q=80",
        
        // Ooty
        "ooty lake": "https://images.unsplash.com/photo-1595818947514-49c869ea22e5?auto=format&fit=crop&w=400&q=80",
        "botanical": "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=400&q=80",
        "doddabetta": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80",

        // Mumbai
        "gateway": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=400&q=80",
        "marine drive": "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=400&q=80",
        "elephanta": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=400&q=80",

        // Bangalore
        "lalbagh": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=400&q=80",
        "cubbon": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=400&q=80",
        "bangalore palace": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=400&q=80"
    };

    // First do direct matches or starts-with
    for (const placeKey in PLACE_IMAGES) {
        if (key.includes(placeKey) || placeKey.includes(key)) {
            return {
                img: PLACE_IMAGES[placeKey],
                desc: getPlaceDescription(placeName, destinationName),
                isFallback: false
            };
        }
    }

    // Default fallbacks with isFallback = true
    let fallbackImg = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80";
    if (key.includes("beach") || key.includes("sea") || key.includes("ocean") || key.includes("coast")) {
        fallbackImg = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80";
    } else if (key.includes("temple") || key.includes("shrine") || key.includes("church") || key.includes("cathedral") || key.includes("mosque") || key.includes("basilica") || key.includes("mandir")) {
        fallbackImg = "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=400&q=80";
    } else if (key.includes("park") || key.includes("garden") || key.includes("lake") || key.includes("river") || key.includes("valley") || key.includes("nature") || key.includes("forest")) {
        fallbackImg = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=80";
    } else if (key.includes("museum") || key.includes("gallery") || key.includes("palace") || key.includes("castle") || key.includes("fort")) {
        fallbackImg = "https://images.unsplash.com/photo-1601887389937-0b02c26b6c3c?auto=format&fit=crop&w=400&q=80";
    } else if (key.includes("mall") || key.includes("market") || key.includes("bazaar") || key.includes("street") || key.includes("crossing") || key.includes("tower") || key.includes("square")) {
        fallbackImg = "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=400&q=80";
    } else if (key.includes("mountain") || key.includes("peak") || key.includes("hill") || key.includes("trek") || key.includes("climb")) {
        fallbackImg = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80";
    }

    return {
        img: fallbackImg,
        desc: getPlaceDescription(placeName, destinationName),
        isFallback: true
    };
}

// Resolve place name to correct description
function getPlaceDescription(placeName, destinationName) {
    if (!placeName) return "";
    
    const key = placeName.toLowerCase().trim();
    const destName = destinationName || "your destination";
    
    const PLACE_DESCRIPTIONS = {
        // Hyderabad
        "charminar": "A magnificent 16th-century mosque with four grand arches and signature minarets, standing as the legendary heart and iconic symbol of Hyderabad.",
        "golconda fort": "A monumental medieval citadel and fortress complex, legendary for its brilliant acoustic engineering, royal palaces, and historic vaults that stored the Koh-i-Noor diamond.",
        "hussain sagar": "A grand, historical heart-shaped lake built in 1563, featuring a towering 18-meter monolithic statue of Lord Buddha carved out of white granite standing majestically in its center.",
        "qutub shahi tombs": "An architectural marvel housing the grand dome-shaped tombs of the founding rulers of Hyderabad, beautifully blending Persian, Pathan, and Hindu masonry styles.",
        "birla mandir": "A stunning hilltop temple constructed entirely of 2,000 tons of pure white Rajasthani marble, offering a peaceful sanctuary and panoramic views of the twin cities.",
        "salar jung museum": "One of the three National Museums of India, boasting an extraordinary collection of vintage clocks, oil paintings, marble sculptures, and historical relics from around the world.",
        "chowmahalla palace": "The opulent official residence of the Nizams of Hyderabad, featuring lush green gardens, grand ceremonial halls, and a collection of vintage royal cars.",
        "ramoji film city": "The world's largest integrated film studio complex, showcasing massive realistic film sets, live action shows, and themed amusement parks.",
        
        // Chennai
        "marina beach": "The longest natural urban beach in India, offering a vibrant atmosphere, golden sands, historic statues, and beautiful views of the Bay of Bengal.",
        "kapaleeswarar temple": "A sacred 7th-century Hindu temple dedicated to Lord Shiva, renowned for its colorful Dravidian style tower (Gopuram) and ancient tank.",
        "elliots beach": "A calm, picturesque beach in Besant Nagar, featuring the historical Karl Schmidt Memorial monument and cozy seaside cafes.",
        "mahabalipuram": "An ancient seaport containing rock-cut temples, stone relief carvings, and the iconic Shore Temple, showcasing Pallava dynasty craftsmanship.",
        "santhome cathedral": "A majestic Neo-Gothic Roman Catholic cathedral built over the tomb of St. Thomas, one of the twelve apostles of Jesus.",

        // Tokyo
        "shibuya": "The world's most famous and busiest pedestrian intersection, surrounded by towering neon billboards, shopping plazas, and trendy cafes.",
        "senso-ji": "Tokyo's oldest and most significant temple, dedicated to the Bodhisattva Kannon and approached via the historic Nakamise shopping street.",
        "tokyo tower": "An iconic orange-and-white communications structure inspired by the Eiffel Tower, providing panoramic observation decks over Tokyo Bay.",
        "harajuku": "The world-famous center of Japanese teen culture and street style, filled with colorful boutiques, crepe stands, and cosplay shops.",
        "shinjuku": "A skyscraper district hosting the busiest railway station in the world, the Hanazono Shrine, and the lush Shinjuku Gyoen National Garden.",

        // Paris
        "eiffel": "The global emblem of France, this magnificent iron lattice tower stands majestically on the Champ de Mars by the Seine River.",
        "louvre": "The world's largest art museum and historic royal palace, housing thousands of masterpieces including the Mona Lisa and Venus de Milo.",
        "notre dame": "A world-famous Gothic cathedral located on the Île de la Cité, celebrated for its stained glass rose windows and gargoyles."
    };

    // First do direct matches or starts-with
    for (const placeKey in PLACE_DESCRIPTIONS) {
        if (key.includes(placeKey) || placeKey.includes(key)) {
            return PLACE_DESCRIPTIONS[placeKey];
        }
    }

    // Keyword defaults
    if (key.includes("beach") || key.includes("sea") || key.includes("ocean") || key.includes("coast")) {
        return `A beautiful sandy beach in ${destName}, perfect for viewing sunrises and enjoying coastal snacks.`;
    }
    if (key.includes("temple") || key.includes("shrine") || key.includes("church") || key.includes("cathedral") || key.includes("mosque") || key.includes("basilica") || key.includes("mandir")) {
        return `A peaceful religious sanctuary in ${destName}, featuring intricate sacred architecture and local cultural significance.`;
    }
    if (key.includes("park") || key.includes("garden") || key.includes("lake") || key.includes("river") || key.includes("valley") || key.includes("nature") || key.includes("forest")) {
        return `A tranquil green space in ${destName}, perfect for walking, relaxing, and enjoying natural views.`;
    }
    if (key.includes("museum") || key.includes("gallery") || key.includes("palace") || key.includes("castle") || key.includes("fort")) {
        return `A historic landmark in ${destName} hosting a wealth of cultural exhibits, royal antiquities, and architectural marvels.`;
    }
    if (key.includes("mall") || key.includes("market") || key.includes("bazaar") || key.includes("street") || key.includes("crossing") || key.includes("tower") || key.includes("square")) {
        return `A lively commercial area in ${destName}, filled with local vendors, shopping spots, and active street scenes.`;
    }
    if (key.includes("mountain") || key.includes("peak") || key.includes("hill") || key.includes("trek") || key.includes("climb")) {
        return `A scenic high-altitude destination in ${destName}, offering fresh mountain air, trails, and breathtaking summit vistas.`;
    }

    return `Explore this amazing attraction in ${destName}. Perfect vibe match choice curated by the VoyageAI multi-agent swarm.`;
}

// Query Wikipedia REST APIs dynamically to search for places and fetch exact images & descriptions
async function fetchPlaceDetailsOnline(placeName, destinationName) {
    try {
        // Query Wikipedia Search API to find the best matching page title
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(placeName)}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
                const bestTitle = searchData.query.search[0].title;
                
                // Get summary from Wikipedia REST API for the resolved title
                const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`;
                const summaryRes = await fetch(summaryUrl);
                if (summaryRes.ok) {
                    const summaryData = await summaryRes.json();
                    return {
                        img: (summaryData.thumbnail && summaryData.thumbnail.source) ? summaryData.thumbnail.source : null,
                        desc: summaryData.extract || null
                    };
                }
            }
        }
    } catch (e) {
        console.error("Wikipedia fetch failed for:", placeName, e);
    }
    return null;
}

// Dataset of top worldwide destinations for adventure styles
const adventureDestinationsData = {
    trekking: [
        { name: "Everest Base Camp, Nepal", desc: "The ultimate high-altitude mountain climb in the heart of the Himalayas.", map: "https://www.google.com/maps/search/?api=1&query=Everest+Base+Camp+Nepal", img: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=150&auto=format&fit=crop&q=60" },
        { name: "Tour du Mont Blanc, Europe", desc: "Europe's most famous Alpine trek crossing France, Italy, and Switzerland.", map: "https://www.google.com/maps/search/?api=1&query=Tour+du+Mont+Blanc", img: "https://images.unsplash.com/photo-1533240332313-0db49b439ad3?w=150&auto=format&fit=crop&q=60" },
        { name: "Inca Trail to Machu Picchu, Peru", desc: "Historic ancient stone trail traversing cloud forests and high Andes mountain passes.", map: "https://www.google.com/maps/search/?api=1&query=Inca+Trail+Machu+Picchu+Peru", img: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=150&auto=format&fit=crop&q=60" },
        { name: "Mount Kilimanjaro Summit, Tanzania", desc: "Climb Africa's tallest peak, passing through dramatic ecological zones.", map: "https://www.google.com/maps/search/?api=1&query=Mount+Kilimanjaro+Tanzania", img: "https://images.unsplash.com/photo-1589553460730-dfbeb6b439e0?w=150&auto=format&fit=crop&q=60" },
        { name: "Milford Track, Fiordland, New Zealand", desc: "Walk through pristine glacial valleys, ancient rainforests, and mountain passes.", map: "https://www.google.com/maps/search/?api=1&query=Milford+Track+New+Zealand", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=150&auto=format&fit=crop&q=60" }
    ],
    ballooning: [
        { name: "Cappadocia Volcanic Valleys, Turkey", desc: "Drift past rock valleys and hundreds of colorful balloons floating at sunrise.", map: "https://www.google.com/maps/search/?api=1&query=Cappadocia+Turkey", img: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=150&auto=format&fit=crop&q=60" },
        { name: "Serengeti National Park, Tanzania", desc: "Sunrise balloon flight over massive wildebeest herds migrating across the savanna.", map: "https://www.google.com/maps/search/?api=1&query=Serengeti+National+Park+Tanzania", img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=60" },
        { name: "Jaipur Amber Fort Drift, Rajasthan, India", desc: "Soar silently above historic palaces, hill castles, and desert landscapes.", map: "https://www.google.com/maps/search/?api=1&query=Amber+Fort+Jaipur", img: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=150&auto=format&fit=crop&q=60" },
        { name: "Napa Valley Vineyards, California, USA", desc: "Calm morning flights floating directly over rolling vineyards and wine country.", map: "https://www.google.com/maps/search/?api=1&query=Napa+Valley+California", img: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=150&auto=format&fit=crop&q=60" },
        { name: "Albuquerque Fiesta, New Mexico, USA", desc: "Home of the world's largest hot air balloon festival hosting over 500 balloons.", map: "https://www.google.com/maps/search/?api=1&query=Albuquerque+Balloon+Fiesta", img: "https://images.unsplash.com/photo-1516893842880-5d8aada7ac05?w=150&auto=format&fit=crop&q=60" }
    ],
    canopy: [
        { name: "Bali Jungle Swings, Ubud, Indonesia", desc: "Famous swings hovering above thick jungle canopies, canyons, and rivers.", map: "https://www.google.com/maps/search/?api=1&query=Bali+Swing+Ubud", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=150&auto=format&fit=crop&q=60" },
        { name: "Monteverde Cloud Forest, Costa Rica", desc: "Birthplace of canopy ziplining, offering massive cable glides through mist.", map: "https://www.google.com/maps/search/?api=1&query=Monteverde+Cloud+Forest+Costa+Rica", img: "https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=150&auto=format&fit=crop&q=60" },
        { name: "Queenstown Gorges, New Zealand", desc: "High-speed canopy ziplining crossing rocky riverbeds and pine-filled peaks.", map: "https://www.google.com/maps/search/?api=1&query=Queenstown+Zipline", img: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=150&auto=format&fit=crop&q=60" },
        { name: "Arenal Volcano Canopy, Costa Rica", desc: "Zipline tracks with views of active volcanoes, valleys, and hot springs.", map: "https://www.google.com/maps/search/?api=1&query=Arenal+Volcano+Canopy+Costa+Rica", img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=150&auto=format&fit=crop&q=60" },
        { name: "Chamonix Accro Park, French Alps", desc: "Climb canopy obstacles and rope swings directly below massive glaciers.", map: "https://www.google.com/maps/search/?api=1&query=Chamonix+Accro+Park+France", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150&auto=format&fit=crop&q=60" }
    ],
    safari: [
        { name: "Serengeti National Park, Tanzania", desc: "Premier wildlife reserve famous for massive prides of lions and migrating herds.", map: "https://www.google.com/maps/search/?api=1&query=Serengeti+National+Park+Tanzania", img: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=150&auto=format&fit=crop&q=60" },
        { name: "Maasai Mara Reserve, Kenya", desc: "Acacia-dotted savanna home to cheetahs, leopards, and heavy river crossings.", map: "https://www.google.com/maps/search/?api=1&query=Maasai+Mara+Reserve+Kenya", img: "https://images.unsplash.com/photo-1484406566174-9da000fda645?w=150&auto=format&fit=crop&q=60" },
        { name: "Kruger National Park, South Africa", desc: "Explore vast bushveld reserve offering close-up encounters with Africa's Big Five.", map: "https://www.google.com/maps/search/?api=1&query=Kruger+National+Park+South+Africa", img: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=150&auto=format&fit=crop&q=60" },
        { name: "Ranthambore Tiger Reserve, India", desc: "Historic forest ruins housing Bengal tigers in their natural wild environment.", map: "https://www.google.com/maps/search/?api=1&query=Ranthambore+National+Park+India", img: "https://images.unsplash.com/photo-1581888227599-779811939961?w=150&auto=format&fit=crop&q=60" },
        { name: "Galapagos Marine Safari, Ecuador", desc: "Witness tortoises, marine iguanas, and sea lions completely unafraid of humans.", map: "https://www.google.com/maps/search/?api=1&query=Galapagos+Islands+Ecuador", img: "https://images.unsplash.com/photo-1551085254-e96b210db58a?w=150&auto=format&fit=crop&q=60" }
    ]
};

// Open the Adventure Locations Modal and populate it
window.showAdventureLocations = function(type) {
    const modal = document.getElementById("adventureLocationsModal");
    const titleEl = document.getElementById("adventureModalTitle");
    const listEl = document.getElementById("adventureLocationsList");
    if (!modal || !titleEl || !listEl) return;

    const titles = {
        trekking: "Top Trekking & Climbing Spots",
        ballooning: "Top Hot Air Ballooning Spots",
        canopy: "Top Canopy Swings & Tours",
        safari: "Top Wildlife Safaris"
    };

    titleEl.textContent = titles[type] || "Top Adventure Spots";
    
    const items = adventureDestinationsData[type] || [];
    listEl.innerHTML = items.map(item => `
        <div class="adventure-loc-row">
            <div class="loc-image-box">
                <img src="${item.img || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=150&auto=format&fit=crop&q=60'}" class="loc-image" alt="${item.name}">
            </div>
            <div class="loc-details">
                <h5>${item.name}</h5>
                <p>${item.desc}</p>
            </div>
            <div class="loc-actions">
                <a href="${item.map}" target="_blank" class="btn btn-secondary btn-sm"><i class="fa-solid fa-map-location-dot"></i> Map</a>
                <button onclick="planFromAdventureLoc('${item.name}')" class="btn btn-primary btn-sm btn-orange"><i class="fa-solid fa-wand-magic-sparkles"></i> Plan</button>
            </div>
        </div>
    `).join('');

    // Bind close listeners dynamically
    const closeBtn = document.getElementById("closeAdventureModalBtn");
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = "none";
        };
    }
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    };

    modal.style.display = "flex";
};


// Prefill and redirect to wizard from selected adventure spot
window.planFromAdventureLoc = function(name) {
    // Close modal
    const modal = document.getElementById("adventureLocationsModal");
    if (modal) modal.style.display = "none";

    const cleanedName = name.split(',')[0].trim();
    
    if (state.token) {
        localStorage.setItem("pendingTripPrefill", JSON.stringify({
            destination: cleanedName,
            days: 5,
            budget: 100000,
            vibes: ["Adventure", "Nature"]
        }));
        location.href = "dashboard.html";
    } else {
        state.pendingTripPlan = {
            destination: cleanedName,
            days: 5,
            budget: 100000,
            vibes: ["Adventure", "Nature"]
        };
        showAuthModal("login");
        if (elements.loginError) {
            elements.loginError.textContent = "Please log in first to plan your trip to " + cleanedName + "!";
            elements.loginError.style.color = "#f97316";
        }
    }
};

// ==========================================
// Translation Dictionary & Language Support
// ==========================================
const translationDict = {
    "en": {
        "nav_home": "HOME",
        "nav_about": "ABOUT",
        "nav_trips": "TRIPS",
        "nav_dashboard": "DASHBOARD",
        "btn_login": "LOG IN",
        "btn_signup": "SIGN UP",
        "hero_title": "EXPLORE THE WORLD WITH US.",
        "hero_subtitle": "Leverage collaborative AI agents to build weather-optimized, budget-friendly itineraries in seconds.",
        "btn_explore": "EXPLORE NOW",
        "scroll_down": "SCROLL DOWN",
        "feel_freedom_title": "FEEL FREEDOM",
        "feel_freedom_desc": "Let our multi-agent planning swarm curate stays and optimize budget limits automatically.",
        "capture_moment_title": "CAPTURE THE MOMENT",
        "capture_moment_desc": "Skip the planning fatigue and focus entirely on creating unforgettable travel memories.",
        "slide0_title": "EXPLORE THE WORLD WITH US.",
        "slide0_subtitle": "Leverage collaborative AI agents to build weather-optimized, budget-friendly itineraries in seconds.",
        "slide1_title": "EXPERIENCE MODERN TOKYO.",
        "slide1_subtitle": "Dive into neon-lit streets, historic temples, and exquisite culinary adventures customized for your style.",
        "slide2_title": "ROMANCE IN PARIS.",
        "slide2_subtitle": "Stroll along the Seine, explore world-class museums, and enjoy cozy sidewalk cafes curated by AI.",
        "dash_title": "Voyage Swarm Dashboard",
        "dash_subtitle": "Collaborative agent network managing your active itineraries.",
        "btn_new_trip": "Plan New Trip",
        "stat_total_trips": "Total Trips",
        "stat_spent_budget": "Total Spent",
        "empty_state_title": "No Trips Found",
        "empty_state_desc": "You haven't generated any AI travel plans yet. Ready to coordinate your first swarm?",
        "empty_state_btn": "Launch Swarm Wizard",
        "wiz_title": "Agent Swarm Coordinator",
        "wiz_subtitle": "Configure travel constraints. Sub-agents will automatically source data.",
        "wiz_step_1": "Route & Schedule",
        "wiz_step_2": "Budget & Style",
        "wiz_step_3": "Preferences",
        "label_source": "Source City",
        "label_destination": "Destination City",
        "label_date": "Travel Date",
        "label_days": "Duration (Days)",
        "label_budget": "Total Budget (INR)",
        "label_requirements": "Special Requirements (Optional)",
        "placeholder_source": "e.g. Hyderabad",
        "placeholder_destination": "e.g. Goa",
        "placeholder_requirements": "e.g. Beach view hotel, vegetarian food options...",
        "btn_prev": "Back",
        "btn_next": "Next Step",
        "btn_submit": "Deploy Swarm",
        "tab_itinerary": "Itinerary",
        "tab_stays_transport": "Stays & Transport",
        "tab_weather": "Weather Forecast",
        "tab_budget": "Budget Summary & AI Tips",
        "title_stays": "Curated Stays",
        "desc_stays": "Hotel options sorted by rating and budget constraints.",
        "title_transit": "Swarm Transit Choice",
        "title_alt_flights": "Alternative Staged Flights",
        "title_weather": "Real-time Forecast Details",
        "desc_weather": "Weather predictions pulled for your specific travel window.",
        "title_weather_suggestions": "Weather Agent Swarm Action",
        "title_budget": "Budget Analysis",
        "label_total_limit": "Total Limit",
        "label_spent": "Spent",
        "label_remaining": "Remaining",
        "title_ai_recs": "AI Agent Swarm Recommendations",
        "tab_places": "Places to Visit",
        "title_places": "Recommended Sights & Attractions",
        "desc_places": "Handpicked sight attractions matching your travel style, linked directly to navigation maps.",
        "btn_view_map": "View on Google Maps",
        "btn_book_now": "Book Now",
        "per_night": "/ night",
        "recent_trips": "Recent Trips",
        "days": "Days",
        "label_budget_limit": "Budget Limit",
        "choose_journey_subtitle": "CHOOSE YOUR JOURNEY",
        "adventure_awaits_title": "Worldwide Adventure Awaits",
        "adventure_desc": "Select an adventure style below to discover the top-rated destinations worldwide for that category, complete with Google Maps location links.",
        "tag_trek": "🧗‍♂️ Trek & Climb",
        "title_trek": "Trekking Adventures",
        "desc_trek": "Scale alpine peaks, travel ancient mountain passes, and experience majestic trails beneath high glaciers.",
        "btn_explore_locations": "Explore Locations",
        "tag_balloon": "🎈 Hot Air Balloon",
        "title_balloon": "Hot Air Ballooning",
        "desc_balloon": "Drift silently over volcanic valleys, rolling wine country, and historic fortresses at early sunrise.",
        "tag_canopy": "🌲 Canopy Swings",
        "title_canopy": "Canopy & Zipline",
        "desc_canopy": "Soar high above deep jungle canyons, active volcanoes, and emerald valleys on speed-glide canopy tracks.",
        "tag_safari": "🦁 Wildlife Safari",
        "title_safari": "Wildlife Safaris",
        "desc_safari": "Witness majestic wildlife in their natural savannas, riverbeds, and untamed national reserves.",
        "adv_modal_title": "Top Adventure Locations",
        "adv_modal_intro": "Explore top-rated spots around the world where you can experience this adventure, with maps and details.",
        "about_subtitle": "OUR COGNITIVE TECHNOLOGY",
        "about_title": "Meet the Agent Swarm",
        "about_desc": "Discover how VoyageAI utilizes five specialized AI agents collaborating in real-time to plan your perfect vacation, running continuous audits to deliver a custom weather-safe and budget-locked itinerary.",
        "swarm_arch_title": "The Swarm Architecture",
        "swarm_arch_desc": "Traditional travel planners rely on static rules or single-prompt LLM generation. VoyageAI uses a collaborative multi-agent architecture where agents critique and refine each other's parameters to fit your requirements.",
        "node_coordinator": "Coordinator Core",
        "node_weather": "Weather Agent",
        "node_hotel": "Hotel Agent",
        "node_transit": "Transit Agent",
        "node_budget": "Budget Agent",
        "role_orchestrator": "Orchestrator",
        "role_forecaster": "Forecaster",
        "role_curator": "Curator",
        "role_routing": "Routing",
        "role_auditor": "Auditor",
        "card_title_coordinator": "Coordinator Swarm Core",
        "card_desc_coordinator": "Orchestrates the lifecycle of the planning task. It collects input fields, spawns agent worker threads, handles data collation, and compiles the final boarding pass layout.",
        "card_title_weather": "Weather Agent",
        "card_desc_weather": "Connects directly to global weather forecast feeds. If heavy rain or extreme temperatures are predicted for a travel day, it coordinates with the itinerary agent to substitute outdoor highlights with indoor activities.",
        "card_title_hotel": "Hotel Deal Curator",
        "card_desc_hotel": "Queries database endpoints for hotels matching destination criteria. It filters candidates based on average rating, amenities, and costs, ensuring you stay in quality accommodations without overspending.",
        "card_title_transit": "Transit Optimizer",
        "card_desc_transit": "Evaluates transport options (flights, trains, cabs) connecting your source and destination. It performs duration-versus-cost evaluations to suggest the most time-efficient routes.",
        "card_title_budget": "Budget Auditor",
        "card_desc_budget": "Performs strict audits of stays, transit, and daily activity estimates. It locks down a safety buffer of at least 10% of your total budget, warning you immediately if estimated expenses exceed limits.",
        "popular_adventures_subtitle": "POPULAR ADVENTURES",
        "popular_adventures_title": "Explore Featured Swarm Runs",
        "popular_adventures_desc": "Select a pre-designed destination profile below to spawn a custom planning swarm immediately, or search and filter styles.",
        "search_placeholder": "Search destinations (e.g. Tokyo, Swiss)...",
        "filter_all": "All",
        "filter_beaches": "🏖️ Beaches",
        "filter_culture": "🏯 Culture",
        "filter_adventure": "🧗‍♂️ Adventure",
        "spot_goa_badge": "🏖️ Beaches & Nightlife",
        "spot_goa_desc": "Relax on scenic golden beaches, explore colonial Portuguese churches, and enjoy vibrant coastal nightlife.",
        "spot_tokyo_badge": "🏯 Tech & Heritage",
        "spot_tokyo_desc": "Explore towering neon skyscrapers, historical Shinto shrines, busy street food markets, and bullet trains.",
        "spot_paris_badge": "💖 Arts & romance",
        "spot_paris_desc": "Savor gourmet French cuisine, stroll down the Seine, visit the Louvre, and admire the Eiffel Tower lights.",
        "spot_maldives_badge": "💎 Luxury Retreat",
        "spot_maldives_desc": "Stay in breathtaking overwater villas, snorkel inside clear lagoons, and enjoy isolated spa cruises.",
        "spot_swiss_badge": "🧗‍♂️ Alpine Hiking",
        "spot_swiss_desc": "Scale snowy slopes, travel along scenic cog railways, and visit quiet valleys tucked beneath the Matterhorn.",
        "spot_rome_badge": "🏛️ Empire Ruins",
        "spot_rome_desc": "Walk the floors of the historic Colosseum, toss coins into the Trevi Fountain, and explore the Vatican galleries.",
        "spot_bali_badge": "🌴 Island Nature",
        "spot_bali_desc": "Hike beautiful volcanic hillsides, visit majestic temple cliffs, and enjoy fresh surf on pristine sands.",
        "spot_sydney_badge": "🐨 Harbor Vibe",
        "spot_sydney_desc": "Tour the world-famous Sydney Opera House, surf Bondi beach reefs, and cruise across the historic harbor.",
        "plan_this_trip": "Plan This Trip",
        "map_link": "Map",
        "how_works_title": "How Swarm Planning Works",
        "how_works_desc": "Our system doesn't generate raw text template itineraries. It coordinates API integrations to fetch actual stays and transit costs, and uses five distinct cognitive layers to compile details.",
        "step1_title": "Submit Route Details",
        "step1_desc": "Provide source, destination, date, and budget limit. Set vibe matches like culture, dining, or beaches.",
        "step2_title": "Swarm Deployment",
        "step2_desc": "The Coordinator deploys sub-agent workers to source hotels, compare flights, check weather trends, and calculate costs.",
        "step3_title": "Get Boarding Pass Summary",
        "step3_desc": "Once audits finish, your final boarding pass workspace renders with day timeline accordions and circular budget stats gauges."
    },
    "hi": {
        "nav_home": "होम",
        "nav_about": "हमारे बारे में",
        "nav_trips": "यात्राएं",
        "nav_dashboard": "डैशबोर्ड",
        "btn_login": "लॉग इन",
        "btn_signup": "साइन अप",
        "hero_title": "हमारे साथ दुनिया की खोज करें।",
        "hero_subtitle": "मौसम-अनुकूलित, बजट-अनुकूल यात्रा कार्यक्रम सेकंडों में बनाने के लिए सहयोगी एआई एजेंटों का लाभ उठाएं।",
        "btn_explore": "अभी अन्वेषण करें",
        "scroll_down": "नीचे स्क्रॉल करें",
        "feel_freedom_title": "स्वतंत्रता महसूस करें",
        "feel_freedom_desc": "हमारे मल्टी-एजेंट प्लानिंग नेटवर्क को होटल चुनने और बजट सीमाओं को स्वचालित रूप से अनुकूलित करने दें।",
        "capture_moment_title": "पल को कैद करें",
        "capture_moment_desc": "योजना बनाने की थकान को छोड़ें और पूरी तरह से अविस्मरणीय यात्रा यादें बनाने पर ध्यान केंद्रित करें।",
        "slide1_title": "आधुनिक टोक्यो का अनुभव करें।",
        "slide1_subtitle": "अपनी शैली के अनुकूल नियॉन-रोशनी वाली सड़कों, ऐतिहासिक मंदिरों और बेहतरीन भोजन रोमांचों का आनंद लें।",
        "slide2_title": "पेरिस में रोमांस।",
        "slide2_subtitle": "सीन नदी के किनारे टहलिए, विश्व स्तरीय संग्रहालयों का पता लगाएं, और एआई द्वारा क्यूरेट किए गए कैफे का आनंद लें।",
        "dash_title": "यात्रा स्वार्म डैशबोर्ड",
        "dash_subtitle": "आपके सक्रिय यात्रा कार्यक्रमों का प्रबंधन करने वाला सहयोगी एजेंट नेटवर्क।",
        "btn_new_trip": "नई यात्रा की योजना बनाएं",
        "stat_total_trips": "कुल यात्राएं",
        "stat_spent_budget": "कुल खर्च",
        "empty_state_title": "कोई यात्रा नहीं मिली",
        "empty_state_desc": "आपने अभी तक कोई एआई यात्रा योजना नहीं बनाई है। अपनी पहली योजना शुरू करने के लिए तैयार हैं?",
        "empty_state_btn": "प्लानर विजार्ड शुरू करें",
        "wiz_title": "एजेंट स्वार्म समन्वयक",
        "wiz_subtitle": "यात्रा की सीमाएं कॉन्फ़िगर करें। उप-एजेंट स्वचालित रूप से डेटा प्राप्त करेंगे।",
        "wiz_step_1": "मार्ग और अनुसूची",
        "wiz_step_2": "बजट और शैली",
        "wiz_step_3": "प्राथमिकताएं",
        "label_source": "प्रस्थान शहर",
        "label_destination": "गंतव्य शहर",
        "label_date": "यात्रा की तारीख",
        "label_days": "अवधि (दिन)",
        "label_budget": "कुल बजट (INR)",
        "label_requirements": "विशेष आवश्यकताएं (वैकल्पिक)",
        "placeholder_source": "जैसे - हैदराबाद",
        "placeholder_destination": "जैसे - गोवा",
        "placeholder_requirements": "जैसे - समुद्र तट के पास का होटल, शाकाहारी भोजन...",
        "btn_prev": "पीछे",
        "btn_next": "अगला चरण",
        "btn_submit": "योजना तैनात करें",
        "tab_itinerary": "यात्रा कार्यक्रम",
        "tab_stays_transport": "होटल और परिवहन",
        "tab_weather": "मौसम का पूर्वानुमान",
        "tab_budget": "बजट और सुझाव",
        "title_stays": "चयनित होटल",
        "desc_stays": "रेटिंग और बजट सीमाओं के अनुसार छांटे गए होटल विकल्प।",
        "title_transit": "परिवहन का चयन",
        "title_alt_flights": "वैकल्पिक उड़ानें",
        "title_weather": "वास्तविक समय का मौसम",
        "desc_weather": "आपकी विशिष्ट यात्रा अवधि के लिए मौसम का पूर्वानुमान।",
        "title_weather_suggestions": "मौसम एजेंट स्वार्म सुझाव",
        "title_budget": "बजट विश्लेषण",
        "label_total_limit": "कुल सीमा",
        "label_spent": "खर्च किया",
        "title_ai_recs": "एआई एजेंट स्वार्म की सिफारिशें",
        "tab_places": "घूमने की जगहें",
        "title_places": "अनुशंसित स्थल और आकर्षण",
        "desc_places": "आपकी यात्रा शैली से मेल खाने वाले चुनिंदा आकर्षण, सीधे नेविगेशन मानचित्रों से जुड़े हुए हैं।",
        "btn_view_map": "गूगल मैप्स पर देखें",
        "btn_book_now": "अभी बुक करें",
        "per_night": "/ रात",
        "recent_trips": "हाल की यात्राएं",
        "days": "दिन",
        "label_budget_limit": "बजट सीमा",
        "choose_journey_subtitle": "अपनी यात्रा चुनें",
        "adventure_awaits_title": "विश्वभर में एडवेंचर का इंतजार है",
        "adventure_desc": "नीचे एक एडवेंचर शैली चुनें और उस श्रेणी के लिए विश्वभर में शीर्ष रेटेड गंतव्यों का पता लगाएं, जिसमें गूगल मैप्स लोकेशन लिंक शामिल हैं।",
        "tag_trek": "🧗‍♂️ ट्रेक और चढ़ाई",
        "title_trek": "ट्रेकिंग एडवेंचर",
        "desc_trek": "अल्पाइन चोटियों को मापें, प्राचीन पहाड़ी दर्रों की यात्रा करें, और उच्च ग्लेशियरों के नीचे शानदार ट्रेल्स का अनुभव करें।",
        "btn_explore_locations": "स्थानों का अन्वेषण करें",
        "tag_balloon": "🎈 हॉट एयर बैलून",
        "title_balloon": "हॉट एयर बैलूनिंग",
        "desc_balloon": "ज्वालामुखी घाटियों, रोलिंग वाइन देश, और ऐतिहासिक किलों के ऊपर सूर्योदय के समय शांति से तैरें।",
        "tag_canopy": "🌲 कैनोपी स्विंग",
        "title_canopy": "कैनोपी और ज़िपलाइन",
        "desc_canopy": "गहरे जंगल के कैन्यons, सक्रिय ज्वालामुखी, और हरित घाटियों के ऊपर गति-ग्लाइड कैनोपी ट्रैक पर उच्च उड़ान भरें।",
        "tag_safari": "🦁 वाइल्डलाइफ सफारी",
        "title_safari": "वाइल्डलाइफ सफारी",
        "desc_safari": "प्राकृतिक सवाना, नदी के किनारे, और अव्यवस्थित राष्ट्रीय आरक्षित क्षेत्रों में शानदार वन्यजीवों को देखें।",
        "adv_modal_title": "शीर्ष एडवेंचर स्थान",
        "adv_modal_intro": "विश्वभर में शीर्ष रेटेड स्थानों का अन्वेषण करें जहां आप इस एडवेंचर का अनुभव कर सकते हैं, मानचित्र और विवरण के साथ।",
        "about_subtitle": "हमारी संज्ञानात्मक प्रौद्योगिकी",
        "about_title": "एजेंट स्वार्म से मिलें",
        "about_desc": "खोजें कि कैसे वॉयेजएआई पांच विशेषज्ञ एआई एजेंटों का उपयोग करता है जो वास्तविक समय में सहयोग करते हैं ताकि आपकी आदर्श छुट्टी की योजना बनाई जा सके, और निरंतर ऑडिट चलाकर मौसम-सुरक्षित और बजट-लॉक्ड यात्रा कार्यक्रम प्रदान किया जा सके।",
        "swarm_arch_title": "स्वार्म आर्किटेक्चर",
        "swarm_arch_desc": "पारंपरिक यात्रा योजनाकार स्थिर नियमों या एकल-प्रॉम्प्ट एलएलएम पीढ़ी पर निर्भर करते हैं। वॉयेजएआई एक सहयोगी बहु-एजेंट आर्किटेक्चर का उपयोग करता है जहां एजेंट एक दूसरे के पैरामीटर की समीक्षा और परिष्करण करते हैं ताकि आपकी आवश्यकताओं को पूरा किया जा सके।",
        "node_coordinator": "समन्वयक कोर",
        "node_weather": "मौसम एजेंट",
        "node_hotel": "होटल एजेंट",
        "node_transit": "परिवहन एजेंट",
        "node_budget": "बजट एजेंट",
        "role_orchestrator": "समन्वयक",
        "role_forecaster": "पूर्वानुमानकर्ता",
        "role_curator": "संरक्षक",
        "role_routing": "मार्गदर्शन",
        "role_auditor": "लेखा परीक्षक",
        "card_title_coordinator": "समन्वयक स्वार्म कोर",
        "card_desc_coordinator": "योजना कार्य के जीवन चक्र का समन्वय करता है। यह इनपुट फ़ील्ड एकत्र करता है, एजेंट वर्कर थ्रेड्स को उत्पन्न करता है, डेटा संग्रहण को संभालता है, और अंतिम बोर्डिंग पास लेआउट को संकलित करता है।",
        "card_title_weather": "मौसम एजेंट",
        "card_desc_weather": "वैश्विक मौसम पूर्वानुमान फीड से सीधे जुड़ता है। यदि यात्रा दिवस के लिए भारी वर्षा या चरम तापमान की भविष्यवाणी की जाती है, तो यह यात्रा कार्यक्रम एजेंट के साथ समन्वय करता है ताकि आउटडोर आकर्षणों को इनडोर गतिविधियों से बदला जा सके।",
        "card_title_hotel": "होटल सौदा संरक्षक",
        "card_desc_hotel": "गंतव्य मानदंडों के अनुसार होटलों के लिए डेटाबेस एंडपॉइंट्स को क्वेरी करता है। यह उम्मीदवारों को औसत रेटिंग, सुविधाओं, और लागत के आधार पर फ़िल्टर करता है, यह सुनिश्चित करता है कि आप गुणवत्तापूर्ण आवास में रहते हैं बिना अधिक खर्च किए।",
        "card_title_transit": "परिवहन अनुकूलक",
        "card_desc_transit": "स्रोत और गंतव्य को जोड़ने वाले परिवहन विकल्पों (उड़ानें, ट्रेनें, टैक्सी) का मूल्यांकन करता है। यह अवधि-विरुद्ध-लागत मूल्यांकन करता है ताकि सबसे समय-कुशल मार्ग सुझाया जा सके।",
        "card_title_budget": "बजट लेखा परीक्षक",
        "card_desc_budget": "रुकने, परिवहन, और दैनिक गतिविधि अनुमानों की सख्त ऑडिट करता है। यह आपके कुल बजट का कम से कम 10% का सुरक्षा बफर तैयार करता है, और तुरंत चेतावनी देता है यदि अनुमानित व्यय सीमा से अधिक हो जाते हैं।",
        "popular_adventures_subtitle": "लोकप्रिय एडवेंचर",
        "popular_adventures_title": "फीचर्ड स्वार्म रन्स का अन्वेषण करें",
        "popular_adventures_desc": "नीचे एक पूर्व-डिज़ाइन किए गए गंतव्य प्रोफ़ाइल का चयन करें ताकि तुरंत एक कस्टम योजना स्वार्म उत्पन्न किया जा सके, या शैलियों को खोजें और फ़िल्टर करें।",
        "search_placeholder": "गंतव्यों को खोजें (उदाहरण के लिए टोक्यो, स्विस)...",
        "filter_all": "सभी",
        "filter_beaches": "🏖️ समुद्र तट",
        "filter_culture": "🏯 संस्कृति",
        "filter_adventure": "🧗‍♂️ एडवेंचर",
        "spot_goa_badge": "🏖️ समुद्र तट और रात्रि जीवन",
        "spot_goa_desc": "सुंदर सुनहरे समुद्र तटों पर आराम करें, पुर्तगाली चर्चों का अन्वेषण करें, और तटीय रात्रि जीवन का आनंद लें।",
        "spot_tokyo_badge": "🏯 तकनीक और विरासत",
        "spot_tokyo_desc": "उच्च नيون آسمانस्क्रेपर्स, ऐतिहासिक शिंटो मंदिरों, व्यस्त स्ट्रीट फूड बाजारों, और बुलेट ट्रेनों का अन्वेषण करें।",
        "spot_paris_badge": "💖 कला और रोमांस",
        "spot_paris_desc": "फ्रेंच व्यंजनों का स्वाद लें, सीन नदी के किनारे घूमें, लौवर का दौरा करें, और एफिल टावर की रोशनी का आनंद लें।",
        "spot_maldives_badge": "💎 लक्जरी रिट्रीट",
        "spot_maldives_desc": "अद्भुत जलविलास विलास में रहें, स्पष्ट लैगून में स्नॉर्कलिंग करें, और अलग स्पा क्रूज़ का आनंद लें।",
        "spot_swiss_badge": "🧗‍♂️ अल्पाइन हाइकिंग",
        "spot_swiss_desc": "बर्फीले ढलानों को मापें, सीनिक कोग रेलवे के साथ यात्रा करें, और मैटरहॉर्न के नीचे स्थित शांत घाटियों का दौरा करें।",
        "spot_rome_badge": "🏛️ साम्राज्य के अवशेष",
        "spot_rome_desc": "ऐतिहासिक कोलोसियम के तल पर चलें, ट्रेवी फाउंटेन में सिक्के डालें, और वैटिकन गैलरी का अन्वेषण करें।",
        "spot_bali_badge": "🌴 द्वीप प्रकृति",
        "spot_bali_desc": "सुंदर ज्वालामुखी पहाड़ियों की चोटी पर चढ़ाई करें, मंदिर की चट्टानों का दौरा करें, और शुद्ध रेत पर ताज़ा सर्फ का आनंद लें।",
        "spot_sydney_badge": "🐨 बंदरगाह का माहौल",
        "spot_sydney_desc": "विश्व प्रसिद्ध सिडनी ओपेरा हाउस का दौरा करें, बोंडी बीच रीफ़ पर सर्फ करें, और ऐतिहासिक बंदरगाह पर क्रूज़ करें।",
        "plan_this_trip": "इस यात्रा की योजना बनाएं",
        "map_link": "मानचित्र",
        "how_works_title": "स्वार्म योजना कैसे काम करती है",
        "how_works_desc": "हमारी प्रणाली कच्चे पाठ टेम्पलेट यात्रा कार्यक्रम नहीं बनाती है। यह एपीआई एकीकरण को समन्वयित करती है ताकि वास्तविक रहने और परिवहन लागत प्राप्त की जा सके, और विवरण को संकलित करने के लिए पांच विशिष्ट संज्ञानात्मक परतों का उपयोग करती है।",
        "step1_title": "मार्ग विवरण जमा करें",
        "step1_desc": "स्रोत, गंतव्य, तिथि, और बजट सीमा प्रदान करें। संस्कृति, भोजन, या समुद्र तट जैसे वाइब मैच सेट करें।",
        "step2_title": "स्वार्म तैनाती",
        "step2_desc": "समन्वयक उप-एजेंट वर्कर्स को होटलों को स्रोत, उड़ानों की तुलना करने, मौसम के रुझानों की जांच करने, और लागत की गणना करने के लिए तैनात करता है।",
        "step3_title": "बोर्डिंग पास सारांश प्राप्त करें",
        "step3_desc": "एक बार ऑडिट पूरा हो जाने के बाद, आपका अंतिम बोर्डिंग पास कार्यस्थान दिन के समयलाइन एकॉर्डियन और वृत्तीय बजट आंकड़े गेज के साथ प्रस्तुत किया जाता है।"
    },
    "te": {
        "nav_home": "హోమ్",
        "nav_about": "గురించి",
        "nav_trips": "ట్రిప్స్",
        "nav_dashboard": "డ్యాష్‌బోర్డ్",
        "btn_login": "లాగిన్",
        "btn_signup": "సైన్ అప్",
        "hero_title": "మాతో కలిసి ప్రపంచాన్ని అన్వేషించండి.",
        "hero_subtitle": "వాతావరణం మరియు బడ్జెట్‌కు అనుకూలమైన ప్రయాణ ప్రణాళికలను రూపొందించడానికి AI ఏజెంట్లను ఉపయోగించండి.",
        "btn_explore": "ఇప్పుడే అన్వేషించండి",
        "scroll_down": "క్రిందికి స్క్రోల్ చేయండి",
        "feel_freedom_title": "స్వేచ్ఛను అనుభవించండి",
        "feel_freedom_desc": "హోటళ్లను క్యూరేట్ చేయడానికి మరియు బడ్జెట్ పరిమితులను స్వయంచాలకంగా సర్దుబాటు చేయడానికి మా AI నెట్‌వర్క్‌ను అనుమతించండి.",
        "capture_moment_title": "ప్రతి క్షణాన్ని ఆస్వాదించండి",
        "capture_moment_desc": "ప్లానింగ్ అలసటను పక్కన పెట్టి, మరపురాని ప్రయాణ జ్ఞాపకాలను సృష్టించుకోవడంపై దృష్టి పెట్టండి.",
        "slide1_title": "ఆధునిక టోక్యోను అనుభవించండి.",
        "slide1_subtitle": "మీ శైలికి అనుకూలమైన నియాన్-లైట్ల వీధులు, చారిత్రక దేవాలయాలు మరియు అద్భుతమైన ఆహార అనుభవాలను ఆస్వాదించండి.",
        "slide2_title": "పారిస్‌లో శృంగారం.",
        "slide2_subtitle": "సీన్ నది వెంబడి నడవండి, ప్రపంచ స్థాయి మ్యూజియంలను అన్వేషించండి మరియు AI చేత క్యూరేట్ చేయబడిన కేఫ్‌లను ఆస్వాదించండి.",
        "dash_title": "వాయేజ్ స్వార్మ్ డ్యాష్‌బోర్డ్",
        "dash_subtitle": "మీ యాక్టివ్ ప్రయాణ ప్రణాళికలను నిర్వహించే సహకార ఏజెంట్ నెట్‌వర్క్.",
        "btn_new_trip": "కొత్త ట్రిప్ ప్లాన్ చేయండి",
        "stat_total_trips": "మొత్తం ప్రయాణాలు",
        "stat_spent_budget": "మొత్తం ఖర్చు",
        "empty_state_title": "ట్రిప్స్ ఏవీ లేవు",
        "empty_state_desc": "మీరు ఇంకా ఎటువంటి AI ప్రయాణ ప్రణాళికలను రూపొందించలేదు. మీ మొదటి ప్లాన్ సిద్ధం చేయాలా?",
        "empty_state_btn": "ప్లానర్ విజార్డ్ ప్రారంభించండి",
        "wiz_title": "ఏజెంట్ స్వార్మ్ కోఆర్డినేటర్",
        "wiz_subtitle": "ప్రయాణ పరిమితులను కాన్ఫిగర్ చేయండి. సబ్-ఏజెంట్లు స్వయంచాలకంగా డేటాను సేకరిస్తారు.",
        "wiz_step_1": "మార్గం & షెడ్యూల్",
        "wiz_step_2": "బడ్జెట్ & శైలి",
        "wiz_step_3": "ప్రాధాన్యతలు",
        "label_source": "బయలుదేరే నగరం",
        "label_destination": "చేరుకునే నగరం",
        "label_date": "ప్రయాణ తేదీ",
        "label_days": "వ్యవధి (రోజులు)",
        "label_budget": "మొత్తం బడ్జెట్ (INR)",
        "label_requirements": "ప్రత్యేక అవసరాలు (అదనపువి)",
        "placeholder_source": "ఉదా. హైదరాబాద్",
        "placeholder_destination": "ఉదా. గోవా",
        "placeholder_requirements": "ఉదా. సముద్రతీర హోటల్, శాకాహార భోజనం...",
        "btn_prev": "వెనుకకు",
        "btn_next": "తదుపరి దశ",
        "btn_submit": "ప్లాన్ సిద్ధం చేయి",
        "tab_itinerary": "ప్రయాణ షెడ్యూల్",
        "tab_stays_transport": "వసతులు & రవాణా",
        "tab_weather": "వాతావరణ సూచన",
        "tab_budget": "బడ్జెట్ & సూచనలు",
        "title_stays": "క్యూరేటెడ్ హోటల్స్",
        "desc_stays": "రేటింగ్ మరియు బడ్జెట్ పరిమితుల ఆధారంగా క్రమబద్ధీకరించబడిన హోటల్స్.",
        "title_transit": "రవాణా ఎంపిక",
        "title_alt_flights": "ప్రత్యామ్నాయ విమానాలు",
        "title_weather": "వాతావరణ వివరాలు",
        "desc_weather": "మీ ప్రయాణ సమయం కోసం సేకరించిన వాతావరణ అంచనాలు.",
        "title_weather_suggestions": "వాతావరణ ఏజెంట్ స్వార్మ్ సూచనలు",
        "title_budget": "బడ్జెట్ విశ్లేషణ",
        "label_total_limit": "మొత్తం పరిమితి",
        "label_spent": "ఖర్చు చేసినది",
        "label_remaining": "మిగిలినది",
        "title_ai_recs": "AI ఏజెంట్ స్వార్మ్ సిఫార్సులు",
        "tab_places": "ಸಂದರ್ಶಿಸಬೇಕಾದ ಸ್ಥಳಗಳು",
        "title_places": "సిఫార్సు చేయబడిన దృశ్యాలు & ఆకర్షణలు",
        "desc_places": "మీ ప్రయాణ శైలికి సరిపోయే ఎంపಿಕ చేసిన ఆకర్షణలు, నేర నಕ್ಷెగ్లింగ్లత్తో.",
        "btn_view_map": "గూగుల్ మ్యాప్స్‌లో చూడండి",
        "btn_book_now": "ఇప్పుడే బుక్ చేయండి",
        "per_night": "/ రాత్రి",
        "recent_trips": "ఇటీవలి ప్రయాణాలు",
        "days": "రోజులు",
        "label_budget_limit": "బడ్జెట్ పరిమితి",
        "choose_journey_subtitle": "మీ ప్రయాణాన్ని ఎంచుకోండి",
        "adventure_awaits_title": "ప్రపంచవ్యాప్తంగా సాహసయాత్ర వేచిఉంది",
        "adventure_desc": "ఒక సాహస శైలిని ఎంచుకోండి, ఆ వర్గం కోసం ప్రపంచవ్యాప్తంగా ఉన్న అత్యుత్తమ గమ్యస్థానాలను గూగుల్ మ్యాప్స్ లొకేషన్ లింకులతో కలిపి కనుగొనండి.",
        "tag_trek": "🧗‍♂️ ట్రెక్ & ఎక్కడానికి",
        "title_trek": "ట్రెక్కింగ్ సాహసాలు",
        "desc_trek": "ఆల్పైన్ శిఖరాలను అధిరోహించండి, పురాతన పర్వత కాలువల గుండా ప్రయాణించండి, ఎత్తైన హిమానీనదాల క్రింద గొప్ప మార్గాలను అనుభవించండి.",
        "btn_explore_locations": "ప్రదేశాలను అన్వేషించండి",
        "tag_balloon": "వెచ్చని గాలి బెలూన్",
        "title_balloon": "వేడి గాలి బెలూనింగ్",
        "desc_balloon": "సూర్యోదయం సమయంలో అగ్నిపర్వత లోయలు, వైన్ దేశం, చారిత్రక కోటల పైన నిశ్శబ్దంగా తేలిపోండి.",
        "tag_canopy": "కెనోపీ స్వింగ్స్",
        "title_canopy": "కానోపీ & జిప్‌లైన్",
        "desc_canopy": "లోతైన అడవి లోయలు, చుక్కుతున్న అగ్నిపర్వతాలు, పచ్చని లోయలను అధిగమించి వేగవంతమైన గ్లైడ్ క్యానోపీ ట్రాక్‌లపై ఎగరండి.",
        "tag_safari": "వన్యప్రాణుల సఫారి",
        "title_safari": "వన్యప్రాణుల సఫారీలు",
        "desc_safari": "Witness majestic wildlife in their natural savannas, riverbeds, and untamed national reserves.",
        "adv_modal_title": "Top Adventure Locations",
        "adv_modal_intro": "Explore top-rated spots around the world where you can experience this adventure, with maps and details.",
        "about_subtitle": "OUR COGNITIVE TECHNOLOGY",
        "about_title": "Meet the Agent Swarm",
        "about_desc": "Discover how VoyageAI utilizes five specialized AI agents collaborating in real-time to plan your perfect vacation, running continuous audits to deliver a custom weather-safe and budget-locked itinerary.",
        "swarm_arch_title": "The Swarm Architecture",
        "swarm_arch_desc": "సాంప్రదాయ ప్రయాణ ప్లానర్లు స్థిర నియమాలు లేదా సింగిల్-ప్రాంప్ట్ LLM జనరేషన్‌పై ఆధారపడతాయి. వోయేజ్ AI అనేది కలిసి పనిచేసే బహుళ-ఏజెంట్ ఆర్కిటెక్చర్‌ను ఉపయోగిస్తుంది, ఇక్కడ ఏజెంట్లు ఒకరికొకరు వారి పారామితులను విమర్శిస్తారు మరియు మీ అవసరాలకు అనుగుణంగా మెరుగుపరుస్తారు.",
        "node_coordinator": "కోఆర్డినేటర్ కోర్",
        "node_weather": "Weather Agent",
        "node_hotel": "Hotel Agent",
        "node_transit": "Transit Agent",
        "node_budget": "బడ్జెట్ ఏజెంట్",
        "role_orchestrator": "Orchestrator",
        "role_forecaster": "Forecaster",
        "role_curator": "Curator",
        "role_routing": "Routing",
        "role_auditor": "ఆడిటర్",
        "card_title_coordinator": "Coordinator Swarm Core",
        "card_desc_coordinator": "Orchestrates the lifecycle of the planning task. It collects input fields, spawns agent worker threads, handles data collation, and compiles the final boarding pass layout.",
        "card_title_weather": "Weather Agent",
        "card_desc_weather": "Connects directly to global weather forecast feeds. If heavy rain or extreme temperatures are predicted for a travel day, it coordinates with the itinerary agent to substitute outdoor highlights with indoor activities.",
        "card_title_hotel": "హోటల్ డీల్ క్యూరేటర్",
        "card_desc_hotel": "Queries database endpoints for hotels matching destination criteria. It filters candidates based on average rating, amenities, and costs, ensuring you stay in quality accommodations without overspending.",
        "card_title_transit": "ట్రాన్సిట్ ఆప్టిమైజర్",
        "card_desc_transit": "Evaluates transport options (flights, trains, cabs) connecting your source and destination. It performs duration-versus-cost evaluations to suggest the most time-efficient routes.",
        "card_title_budget": "Budget Auditor",
        "card_desc_budget": "బస, ట్రాన్సిట్, రోజువారీ కార్యకలాపాల అంచనాలపై కఠినమైన లెక్కలు చేస్తుంది. మీ మొత్తం బడ్జెట్‌లో కనీసం 10% భద్రతా బఫర్‌ను లాక్ చేస్తుంది, అంచనా వ్యయాలు పరిమితులను మించినట్లయితే వెంటనే మీకు హెచ్చరిస్తుంది.",
        "popular_adventures_subtitle": "ప్రసిద్ధ సాహసాలు",
        "popular_adventures_title": "Explore Featured Swarm Runs",
        "popular_adventures_desc": "Select a pre-designed destination profile below to spawn a custom planning swarm immediately, or search and filter styles.",
        "search_placeholder": "Search destinations (e.g. Tokyo, Swiss)...",
        "filter_all": "All",
        "filter_beaches": "బీచ్‌లు",
        "filter_culture": "🏯 Culture",
        "filter_adventure": "🧗‍♂️ Adventure",
        "spot_goa_badge": "🏖️ Beaches & Nightlife",
        "spot_goa_desc": "Relax on scenic golden beaches, explore colonial Portuguese churches, and enjoy vibrant coastal nightlife.",
        "spot_tokyo_badge": "🏯 Tech & Heritage",
        "spot_tokyo_desc": "Explore towering neon skyscrapers, historical Shinto shrines, busy street food markets, and bullet trains.",
        "spot_paris_badge": "కళలు & ప్రేమ",
        "spot_paris_desc": "Savor gourmet French cuisine, stroll down the Seine, visit the Louvre, and admire the Eiffel Tower lights.",
        "spot_maldives_badge": "💎 Luxury Retreat",
        "spot_maldives_desc": "Stay in breathtaking overwater villas, snorkel inside clear lagoons, and enjoy isolated spa cruises.",
        "spot_swiss_badge": "🧗‍♂️ Alpine Hiking",
        "spot_swiss_desc": "Scale snowy slopes, travel along scenic cog railways, and visit quiet valleys tucked beneath the Matterhorn.",
        "spot_rome_badge": "🏛️ Empire Ruins",
        "spot_rome_desc": "Walk the floors of the historic Colosseum, toss coins into the Trevi Fountain, and explore the Vatican galleries.",
        "spot_bali_badge": "ద్వీపం ప్రకృతి",
        "spot_bali_desc": "Hike beautiful volcanic hillsides, visit majestic temple cliffs, and enjoy fresh surf on pristine sands.",
        "spot_sydney_badge": "🐨 Harbor Vibe",
        "spot_sydney_desc": "Tour the world-famous Sydney Opera House, surf Bondi beach reefs, and cruise across the historic harbor.",
        "plan_this_trip": "Plan This Trip",
        "map_link": "Map",
        "how_works_title": "How Swarm Planning Works",
        "how_works_desc": "Our system doesn't generate raw text template itineraries. It coordinates API integrations to fetch actual stays and transit costs, and uses five distinct cognitive layers to compile details.",
        "step1_title": "మార్గ వివరాలను సమర్పించండి",
        "step1_desc": "Provide source, destination, date, and budget limit. Set vibe matches like culture, dining, or beaches.",
        "step2_title": "Swarm Deployment",
        "step2_desc": "The Coordinator deploys sub-agent workers to source hotels, compare flights, check weather trends, and calculate costs.",
        "step3_title": "Get Boarding Pass Summary",
        "step3_desc": "Once audits finish, your final boarding pass workspace renders with day timeline accordions and circular budget stats gauges."
    },
    "es": {
        "nav_home": "INICIO",
        "nav_about": "ACERCA DE",
        "nav_trips": "VIAJES",
        "nav_dashboard": "PANEL",
        "btn_login": "INICIAR SESIÓN",
        "btn_signup": "REGISTRARSE",
        "hero_title": "EXPLORA EL MUNDO CON NOSOTROS.",
        "hero_subtitle": "Aproveche los agentes de IA colaborativos para crear itinerarios optimizados para el clima y asequibles en segundos.",
        "btn_explore": "EXPLORAR AHORA",
        "scroll_down": "DESPLAZARSE HACIA ABAJO",
        "feel_freedom_title": "SIENTE LA LIBERTAD",
        "feel_freedom_desc": "Deje que nuestra red de planificación multiagente organice estancias y optimice presupuestos automáticamente.",
        "capture_moment_title": "CAPTURA EL MOMENTO",
        "capture_moment_desc": "Evite la fatiga de la planificación y concéntrese en crear recuerdos de viaje inolvidables.",
        "slide0_title": "EXPLORA EL MUNDO CON NOSOTROS.",
        "slide0_subtitle": "Aproveche los agentes de IA colaborativos para crear itinerarios optimizados para el clima y asequibles en segundos.",
        "slide1_title": "EXPERIMENTA TOKIO MODERNO.",
        "slide1_subtitle": "Sumérgete en calles iluminadas por luces de neón, templos históricos y exquisitas aventuras culinarias.",
        "slide2_title": "ROMANCE EN PARÍS.",
        "slide2_subtitle": "Pasee por el Sena, explore museos de clase mundial y disfrute de acogedores cafés curados por IA.",
        "dash_title": "Panel de Viajes Voyage Swarm",
        "dash_subtitle": "Red de agentes colaborativos que gestiona sus itinerarios activos.",
        "btn_new_trip": "Planificar Nuevo Viaje",
        "stat_total_trips": "Total de Viajes",
        "stat_spent_budget": "Total Gastado",
        "empty_state_title": "No se encontraron viajes",
        "empty_state_desc": "Aún no ha generado ningún plan de viaje con IA. ¿Listo para coordinar su primer grupo?",
        "empty_state_btn": "Lanzar Asistente de Swarm",
        "wiz_title": "Coordinador de Enjambre de Agentes",
        "wiz_subtitle": "Configure las restricciones de viaje. Los subagentes obtendrán datos automáticamente.",
        "wiz_step_1": "Ruta y Horario",
        "wiz_step_2": "Presupuesto y Estilo",
        "wiz_step_3": "Preferencias",
        "label_source": "Ciudad de Origen",
        "label_destination": "Ciudad de Destino",
        "label_date": "Fecha de Viaje",
        "label_days": "Duración (Días)",
        "label_budget": "Presupuesto Total (INR)",
        "label_requirements": "Requisitos Especiales (Opcional)",
        "placeholder_source": "ej. Hyderabad",
        "placeholder_destination": "ej. Goa",
        "placeholder_requirements": "ej. Hotel con vista al mar, comida vegetariana...",
        "btn_prev": "Atrás",
        "btn_next": "Siguiente Paso",
        "btn_submit": "Desplegar Enjambre",
        "tab_itinerary": "Itinerario",
        "tab_stays_transport": "Estancias y Transporte",
        "tab_weather": "Pronóstico del Clima",
        "tab_budget": "Resumen de Presupuesto y Consejos de IA",
        "title_stays": "Estancias Curadas",
        "desc_stays": "Opciones de hoteles ordenadas por calificación y presupuesto.",
        "title_transit": "Opción de Tránsito de Enjambre",
        "title_alt_flights": "Vuelos Alternativos",
        "title_weather": "Detalles del Pronóstico en Tiempo Real",
        "desc_weather": "Predicciones climáticas extraídas para su ventana de viaje.",
        "title_weather_suggestions": "Acción del Enjambre de Clima",
        "title_budget": "Análisis de Presupuesto",
        "label_total_limit": "Límite Total",
        "label_spent": "Gastado",
        "label_remaining": "Restante",
        "title_ai_recs": "Recomendaciones del Enjambre de Agentes de IA",
        "choose_journey_subtitle": "ELIGE TU VIAJE",
        "adventure_awaits_title": "Aventura en todo el mundo",
        "adventure_desc": "Seleccione un estilo de aventura a continuación para descubrir los destinos mejor valorados en todo el mundo para esa categoría, con enlaces de ubicación de Google Maps.",
        "tag_trek": "🧗‍♂️ Trek y Escalada",
        "title_trek": "Aventuras de senderismo",
        "desc_trek": "Escalada de picos alpinos, viaje por antiguos pasos de montaña y experimente senderos majestuosos debajo de glaciares altos.",
        "btn_explore_locations": "Explorar ubicaciones",
        "tag_balloon": "🎈 Globo aerostático",
        "title_balloon": "Vuelo en globo aerostático",
        "desc_balloon": "Flote silenciosamente sobre valles volcánicos, campos de vino ondulados y fortalezas históricas al amanecer.",
        "tag_canopy": "🌲 Columpios de dosel",
        "title_canopy": "Dosel y tirolesa",
        "desc_canopy": "Vuela alto sobre cañones de jungla profunda, volcanes activos y valles de esmeralda en pistas de dosel de velocidad.",
        "tag_safari": "🦁 Safari de vida silvestre",
        "title_safari": "Safaris de vida silvestre",
        "desc_safari": "Presencie la vida silvestre majestuosa en sus sabanas, ríos y reservas nacionales sin domesticar.",
        "adv_modal_title": "Mejores ubicaciones de aventura",
        "adv_modal_intro": "Explorar los mejores lugares valorados en todo el mundo donde puede experimentar esta aventura, con mapas y detalles.",
        "about_subtitle": "NUESTRA TECNOLOGÍA COGNITIVA",
        "about_title": "Conoce la Colmena de Agentes",
        "about_desc": "Descubra cómo VoyageAI utiliza cinco agentes de IA especializados que colaboran en tiempo real para planificar sus vacaciones perfectas, realizando auditorías continuas para entregar un itinerario personalizado seguro para el clima y bloqueado de presupuesto.",
        "swarm_arch_title": "La Arquitectura de la Colmena",
        "swarm_arch_desc": "Los planificadores de viajes tradicionales confían en reglas estáticas o generación de LLM de un solo prompt. VoyageAI utiliza una arquitectura de agente múltiple colaborativa donde los agentes critican y refinan los parámetros entre sí para adaptarse a sus necesidades.",
        "node_coordinator": "Núcleo de coordinador",
        "node_weather": "Agente del clima",
        "node_hotel": "Agente de hotel",
        "node_transit": "Agente de tránsito",
        "node_budget": "Agente de presupuesto",
        "role_orchestrator": "Orquestador",
        "role_forecaster": "Pronosticador",
        "role_curator": "Curador",
        "role_routing": "Enrutamiento",
        "role_auditor": "Auditor",
        "card_title_coordinator": "Núcleo de la Colmena de Coordinadores",
        "card_desc_coordinator": "Orquesta el ciclo de vida de la tarea de planificación. Recopila campos de entrada, genera subprocesos de agente, maneja la recopilación de datos y compila el diseño final del pase de abordar.",
        "card_title_weather": "Agente del clima",
        "card_desc_weather": "Se conecta directamente a fuentes de pronóstico del clima global. Si se predice lluvia intensa o temperaturas extremas para un día de viaje, coordina con el agente de itinerario para sustituir actividades al aire libre con actividades en interiores.",
        "card_title_hotel": "Curador de ofertas de hotel",
        "card_desc_hotel": "Consulta puntos finales de base de datos para hoteles que coinciden con los criterios de destino. Filtra candidatos según la calificación promedio, comodidades y costos, asegurando que se aloje en alojamientos de calidad sin gastar de más.",
        "card_title_transit": "Optimizador de tránsito",
        "card_desc_transit": "Evalúa opciones de transporte (vuelos, trenes, taxis) que conectan su origen y destino. Realiza evaluaciones de duración versus costo para sugerir las rutas más eficientes en términos de tiempo.",
        "card_title_budget": "Auditor de presupuesto",
        "card_desc_budget": "Realiza auditorías estrictas de estimaciones de estancia, tránsito y actividades diarias. Bloquea un margen de seguridad de al menos el 10% de su presupuesto total, advirtiéndolo inmediatamente si los gastos estimados superan los límites.",
        "popular_adventures_subtitle": "AVENTURAS POPULARES",
        "popular_adventures_title": "Explorar corridas de colmena presentadas",
        "popular_adventures_desc": "Seleccione un perfil de destino pre-diseñado a continuación para generar una colmena de planificación personalizada de inmediato, o busque y filtre estilos.",
        "search_placeholder": "Buscar destinos (por ejemplo, Tokio, Suiza)...",
        "filter_all": "Todos",
        "filter_beaches": "🏖️ Playas",
        "filter_culture": "🏯 Cultura",
        "filter_adventure": "🧗‍♂️ Aventura",
        "spot_goa_badge": "🏖️ Playas y vida nocturna",
        "spot_goa_desc": "Relájese en playas doradas escénicas, explore iglesias portuguesas coloniales y disfrute de la vida nocturna costera vibrante.",
        "spot_tokyo_badge": "🏯 Tecnología y patrimonio",
        "spot_tokyo_desc": "Explore rascacielos de neón, santuarios sintoístas históricos, mercados de comida callejera ocupados y trenes bala.",
        "spot_paris_badge": "💖 Artes y romance",
        "spot_paris_desc": "Disfrute de la cocina gourmet francesa, pasee por el Sena, visite el Louvre y admire las luces de la Torre Eiffel.",
        "spot_maldives_badge": "💎 Retiro de lujo",
        "spot_maldives_desc": "Quédese en villas sobre el agua impresionantes, bucee en lagunas claras y disfrute de cruceros de spa aislados.",
        "spot_swiss_badge": "🧗‍♂️ Senderismo alpino",
        "spot_swiss_desc": "Escalada de laderas nevadas, viaje a lo largo de ferrocarriles de cremallera escénicos y visite valles tranquilos escondidos debajo del Matterhorn.",
        "spot_rome_badge": "🏛️ Ruinas del imperio",
        "spot_rome_desc": "Camine por los pisos del histórico Coliseo, tire monedas en la Fuente de Trevi y explore las galerías del Vaticano.",
        "spot_bali_badge": "🌴 Naturaleza insular",
        "spot_bali_desc": "Camine por colinas volcánicas hermosas, visite acantilados de templos majestuosos y disfrute del surf fresco en arenas prístinas.",
        "spot_sydney_badge": "🐨 Ambiente del puerto",
        "spot_sydney_desc": "Visite la famosa Ópera de Sydney, surfee las récords de Bondi, y crucece el histórico puerto.",
        "plan_this_trip": "Planificar este viaje",
        "map_link": "Mapa",
        "how_works_title": "Cómo funciona la planificación de la colmena",
        "how_works_desc": "Nuestro sistema no genera plantillas de itinerario de texto bruto. Coordina integraciones de API para obtener costos reales de estancia y tránsito, y utiliza cinco capas cognitivas distintas para compilar detalles.",
        "step1_title": "Enviar detalles de ruta",
        "step1_desc": "Proporcionar origen, destino, fecha y límite de presupuesto. Establecer coincidencias de vibración como cultura, comida o playas.",
        "step2_title": "Despliegue de la colmena",
        "step2_desc": "El Coordinador despliega subprocesos de agente para buscar hoteles, comparar vuelos, verificar tendencias climáticas y calcular costos.",
        "step3_title": "Resumen del pase de abordar",
        "step3_desc": "Una vez que terminen las auditorías, su espacio de trabajo de pase de abordar final se representa con acordeones de línea de tiempo diario y medidores de estadísticas de presupuesto circulares."
    },
    "fr": {
        "nav_home": "ACCUEIL",
        "nav_about": "À PROPOS",
        "nav_trips": "VOYAGES",
        "nav_dashboard": "TABLEAU DE BORD",
        "btn_login": "CONNEXION",
        "btn_signup": "S'INSCRIRE",
        "hero_title": "EXPLOREZ LE MONDE AVEC NOUS.",
        "hero_subtitle": "Exploitez des agents IA collaboratifs pour concevoir des itinéraires optimisés en fonction du climat et du budget en quelques secondes.",
        "btn_explore": "EXPLORER MAINTENANT",
        "scroll_down": "DÉFILER VERS LE BAS",
        "feel_freedom_title": "RESSENTEZ LA LIBERTÉ",
        "feel_freedom_desc": "Laissez notre réseau de planification multi-agents organiser des séjours et optimiser automatiquement les budgets.",
        "capture_moment_title": "CAPTUREZ LE MOMENT",
        "capture_moment_desc": "Évitez la fatigue de la planification et concentrez-vous entièrement sur la création de souvenirs inoubliables.",
        "slide0_title": "EXPLOREZ LE MONDE AVEC NOUS.",
        "slide0_subtitle": "Exploitez des agents IA collaboratifs pour concevoir des itinéraires optimisés en fonction du climat et du budget en quelques secondes.",
        "slide1_title": "DÉCOUVREZ LE TOKYO MODERNE.",
        "slide1_subtitle": "Plongez dans les rues illuminées par les néons, les temples historiques et les aventures culinaires exquises.",
        "slide2_title": "ROMANCE À PARIS.",
        "slide2_subtitle": "Flânez le long de la Seine, explorez des musées de renommée mondiale et profitez de cafés chaleureux sélectionnés par l'IA.",
        "dash_title": "Tableau de Bord Voyage Swarm",
        "dash_subtitle": "Réseau d'agents collaboratifs gérant vos itinéraires actifs.",
        "btn_new_trip": "Planifier Nouveau Voyage",
        "stat_total_trips": "Total des Voyages",
        "stat_spent_budget": "Total Dépensé",
        "empty_state_title": "Aucun voyage trouvé",
        "empty_state_desc": "Vous n'avez pas encore généré de plan de voyage IA. Prêt à coordonner votre premier groupe ?",
        "empty_state_btn": "Lancer l'Assistant d'Essaim",
        "wiz_title": "Coordinateur d'Essaim d'Agents",
        "wiz_subtitle": "Configurez les contraintes de voyage. Les sous-agents collecteront les données automatiquement.",
        "wiz_step_1": "Itinéraire et Horaire",
        "wiz_step_2": "Budget et Style",
        "wiz_step_3": "Préférences",
        "label_source": "Ville de Départ",
        "label_destination": "Ville de Destination",
        "label_date": "Date de Voyage",
        "label_days": "Durée (Jours)",
        "label_budget": "Budget Total (INR)",
        "label_requirements": "Besoins Spéciaux (Optionnel)",
        "placeholder_source": "ex. Hyderabad",
        "placeholder_destination": "ex. Goa",
        "placeholder_requirements": "ex. Hôtel vue sur mer, options végétariennes...",
        "btn_prev": "Retour",
        "btn_next": "Étape Suivante",
        "btn_submit": "Déployer l'Essaim",
        "tab_itinerary": "Itinéraire",
        "tab_stays_transport": "Hébergement et Transport",
        "tab_weather": "Prévisions Météo",
        "tab_budget": "Résumé du Budget et Conseils IA",
        "title_stays": "Séjours Sélectionnés",
        "desc_stays": "Options d'hôtels triées par note et contraintes budgétaires.",
        "title_transit": "Choix de Transit de l'Essaim",
        "title_alt_flights": "Vols Alternatifs",
        "title_weather": "Détails des Prévisions en Temps Réel",
        "desc_weather": "Prévisions météo extraites pour votre période de voyage.",
        "title_weather_suggestions": "Action de l'Essaim Météo",
        "title_budget": "Analyse du Budget",
        "label_total_limit": "Limite Totale",
        "label_spent": "Dépensé",
        "label_remaining": "Restant",
        "title_ai_recs": "Recommandations de l'Essaim d'Agents IA",
        "choose_journey_subtitle": "CHOISISSEZ VOTRE VOYAGE",
        "adventure_awaits_title": "Aventure Mondiale en Attente",
        "adventure_desc": "Sélectionnez un style d'aventure ci-dessous pour découvrir les destinations les mieux notées dans le monde pour cette catégorie, avec des liens de localisation Google Maps.",
        "tag_trek": "🧗‍♂️ Trek & Escalade",
        "title_trek": "Aventures de Randonnée",
        "desc_trek": "Escaladez les sommets alpins, traversez les cols de montagne anciens et découvrez les sentiers majestueux sous les glaciers élevés.",
        "btn_explore_locations": "Explorer les Lieux",
        "tag_balloon": "🎈 Ballon à Air Chaud",
        "title_balloon": "Ballon à Air Chaud",
        "desc_balloon": "Dérivez silencieusement au-dessus des vallées volcaniques, des vignobles ondoyants et des forteresses historiques au petit matin.",
        "tag_canopy": "🌲 Balançoires de Canopée",
        "title_canopy": "Canopée & Tyrolienne",
        "desc_canopy": "Planez haut au-dessus des canyons de jungle profonds, des volcans actifs et des vallées émeraude sur des pistes de canopée à grande vitesse.",
        "tag_safari": "🦁 Safari de Faune",
        "title_safari": "Safaris de Faune",
        "desc_safari": "Assistez à la faune majestueuse dans leurs savanes naturelles, leurs lits de rivière et leurs réserves nationales non domestiquées.",
        "adv_modal_title": "Meilleures Destinations d'Aventure",
        "adv_modal_intro": "Explorez les meilleures destinations du monde où vous pouvez vivre cette aventure, avec des cartes et des détails.",
        "about_subtitle": "NOTRE TECHNOLOGIE COGNITIVE",
        "about_title": "Rencontrez le Nuage d'Agents",
        "about_desc": "Découvrez comment VoyageAI utilise cinq agents spécialisés en intelligence artificielle collaborant en temps réel pour planifier vos vacances parfaites, en effectuant des audits continus pour fournir un itinéraire personnalisé, sécurisé et verrouillé en fonction du budget.",
        "swarm_arch_title": "L'Architecture du Nuage",
        "swarm_arch_desc": "Les planificateurs de voyages traditionnels s'appuient sur des règles statiques ou une génération LLM à prompt unique. VoyageAI utilise une architecture multi-agents collaborative où les agents critiquent et affinent les paramètres les uns des autres pour répondre à vos besoins.",
        "node_coordinator": "Nœud Coordinateur",
        "node_weather": "Agent Météo",
        "node_hotel": "Agent Hôtel",
        "node_transit": "Agent Transit",
        "node_budget": "Agent Budget",
        "role_orchestrator": "Orchestrateur",
        "role_forecaster": "Prévisionniste",
        "role_curator": "Curateur",
        "role_routing": "Itinéraire",
        "role_auditor": "Auditeur",
        "card_title_coordinator": "Nœud Central du Nuage",
        "card_desc_coordinator": "Orchestre le cycle de vie de la tâche de planification. Il collecte les champs de saisie, déploie les threads de travail d'agent, gère la collecte de données et compile la disposition finale du passeport de bord.",
        "card_title_weather": "Agent Météo",
        "card_desc_weather": "Se connecte directement aux flux de prévisions météorologiques mondiales. Si de fortes pluies ou des températures extrêmes sont prévues pour un jour de voyage, il coordonne avec l'agent itinéraire pour substituer les activités de plein air par des activités intérieures.",
        "card_title_hotel": "Curateur d'Offres Hôtelières",
        "card_desc_hotel": "Interroge les points de terminaison de base de données pour les hôtels correspondant aux critères de destination. Il filtre les candidats en fonction de la note moyenne, des équipements et des coûts, en vous assurant de séjourner dans des hébergements de qualité sans dépasser les dépenses.",
        "card_title_transit": "Optimiseur de Transit",
        "card_desc_transit": "Évalue les options de transport (vols, trains, taxis) reliant votre source et votre destination. Il effectue des évaluations de durée par rapport au coût pour suggérer les itinéraires les plus efficaces en temps.",
        "card_title_budget": "Auditeur de Budget",
        "card_desc_budget": "Effectue des audits stricts des estimations de séjour, de transit et d'activités quotidiennes. Il verrouille un tampon de sécurité d'au moins 10% de votre budget total, vous avertissant immédiatement si les dépenses estimées dépassent les limites.",
        "popular_adventures_subtitle": "AVENTURES POPULAIRES",
        "popular_adventures_title": "Explorer les Exécutions de Nuage en Vedette",
        "popular_adventures_desc": "Sélectionnez un profil de destination prédéfini ci-dessous pour lancer immédiatement un nuage de planification personnalisé, ou recherchez et filtrez les styles.",
        "search_placeholder": "Rechercher des destinations (par exemple Tokyo, Suisse)...",
        "filter_all": "Tout",
        "filter_beaches": "🏖️ Plages",
        "filter_culture": "🏯 Culture",
        "filter_adventure": "🧗‍♂️ Aventure",
        "spot_goa_badge": "🏖️ Plages et Vie Nocturne",
        "spot_goa_desc": "Détendez-vous sur les plages dorées pittoresques, explorez les églises portugaises coloniales et profitez de la vie nocturne côtière animée.",
        "spot_tokyo_badge": "🏯 Technologie et Patrimoine",
        "spot_tokyo_desc": "Explorez les gratte-ciel néon géants, les sanctuaires shinto historiques, les marchés de nourriture de rue animés et les trains à grande vitesse.",
        "spot_paris_badge": "💖 Arts et Romance",
        "spot_paris_desc": "Savourez la cuisine française gastronomique, promenez-vous le long de la Seine, visitez le Louvre et admirez les lumières de la Tour Eiffel.",
        "spot_maldives_badge": "💎 Retraite de Luxe",
        "spot_maldives_desc": "Séjournez dans des villas sur pilotis à couper le souffle, faites de la plongée en apnée dans les lagons clairs et profitez de croisières de spa isolées.",
        "spot_swiss_badge": "🧗‍♂️ Randonnée Alpine",
        "spot_swiss_desc": "Escaladez les pentes enneigées, voyagez le long des chemins de fer à crémaillère pittoresques et visitez les vallées calmes nichées sous le Matterhorn.",
        "spot_rome_badge": "🏛️ Ruines de l'Empire",
        "spot_rome_desc": "Marchez sur les sols historiques du Colisée, jetez des pièces dans la fontaine de Trevi et explorez les galeries du Vatican.",
        "spot_bali_badge": "🌴 Nature Insulaire",
        "spot_bali_desc": "Randonnez sur les collines volcaniques pittoresques, visitez les falaises de temple majestueuses et profitez du surf frais sur les sables pristins.",
        "spot_sydney_badge": "🐨 Ambiance du Port",
        "spot_sydney_desc": "Visitez la célèbre maison d'opéra de Sydney, surfez les récifs de Bondi Beach et faites une croisière à travers le port historique.",
        "plan_this_trip": "Planifier ce Voyage",
        "map_link": "Carte",
        "how_works_title": "Comment Fonctionne la Planification de Nuage",
        "how_works_desc": "Notre système ne génère pas de modèles de texte brut d'itinéraire. Il coordonne les intégrations d'API pour récupérer les coûts réels de séjour et de transit, et utilise cinq couches cognitives distinctes pour compiler les détails.",
        "step1_title": "Soumettre les Détails de l'Itinéraire",
        "step1_desc": "Fournissez la source, la destination, la date et la limite de budget. Définissez les correspondances de vibe comme la culture, la gastronomie ou les plages.",
        "step2_title": "Déploiement du Nuage",
        "step2_desc": "Le Coordinateur déploie les agents de travail pour récupérer les hôtels, comparer les vols, vérifier les tendances météorologiques et calculer les coûts.",
        "step3_title": "Résumer le Passeport de Bord",
        "step3_desc": "Une fois les audits terminés, votre espace de travail de passeport de bord final se rend avec des accords de calendrier journalier et des jauges de statistiques de budget circulaires."
    },
    "de": {
        "nav_home": "STARTSEITE",
        "nav_about": "ÜBER UNS",
        "nav_trips": "REISEN",
        "nav_dashboard": "DASHBOARD",
        "btn_login": "EINLOGGEN",
        "btn_signup": "REGISTRIEREN",
        "hero_title": "ENTDECKE DIE WELT MIT UNS.",
        "hero_subtitle": "Nutzen Sie kollaborative KI-Agenten, um in Sekundenschnelle wetteroptimierte und budgetfreundliche Reisepläne zu erstellen.",
        "btn_explore": "JETZT ENTDECKEN",
        "scroll_down": "NACH UNTEN SCROLLEN",
        "feel_freedom_title": "FREIHEIT SPÜREN",
        "feel_freedom_desc": "Lassen Sie unser Multi-Agenten-Planungsnetzwerk Aufenthalte organisieren und Budgetgrenzen automatisch optimieren.",
        "capture_moment_title": "DEN MOMENT FESTHALTEN",
        "capture_moment_desc": "Sparen Sie sich den Planungsstress und konzentrieren Sie sich ganz auf unvergessliche Reisemomente.",
        "slide0_title": "ENTDECKE DIE WELT MIT UNS.",
        "slide0_subtitle": "Nutzen Sie kollaborative KI-Agenten, um in Sekundenschnelle wetteroptimierte und budgetfreundliche Reisepläne zu erstellen.",
        "slide1_title": "ERLEBEN SIE DAS MODERNE TOKIO.",
        "slide1_subtitle": "Tauchen Sie ein in neonbeleuchtete Straßen, historische Tempel und exquisite kulinarische Abenteuer.",
        "slide2_title": "ROMANTIK IN PARIS.",
        "slide2_subtitle": "Schlendern Sie an der Seine entlang, erkunden Sie erstklassige Museen und genießen Sie gemütliche, von KI kuratierte Cafés.",
        "dash_title": "Voyage Swarm Dashboard",
        "dash_subtitle": "Kollaboratives Agentennetzwerk zur Verwaltung Ihrer aktiven Reiserouten.",
        "btn_new_trip": "Neue Reise planen",
        "stat_total_trips": "Reisen insgesamt",
        "stat_spent_budget": "Ausgaben insgesamt",
        "empty_state_title": "Keine Reisen gefunden",
        "empty_state_desc": "Sie haben noch keine KI-Reisepläne erstellt. Bereit, Ihren ersten Schwarm zu koordinieren?",
        "empty_state_btn": "Schwarm-Assistenten starten",
        "wiz_title": "Agenten-Schwarm-Koordinator",
        "wiz_subtitle": "Konfigurieren Sie Reisebedingungen. Unteragenten beschaffen die Daten automatisch.",
        "wiz_step_1": "Route & Zeitplan",
        "wiz_step_2": "Budget & Stil",
        "wiz_step_3": "Präferenzen",
        "label_source": "Abflugort",
        "label_destination": "Zielort",
        "label_date": "Reisedatum",
        "label_days": "Dauer (Tage)",
        "label_budget": "Gesamtbudget (INR)",
        "label_requirements": "Besondere Anforderungen (Optional)",
        "placeholder_source": "z.B. Hyderabad",
        "placeholder_destination": "z.B. Goa",
        "placeholder_requirements": "z.B. Hotel mit Meerblick, vegetarisches Essen...",
        "btn_prev": "Zurück",
        "btn_next": "Nächster Schritt",
        "btn_submit": "Schwarm aktivieren",
        "tab_itinerary": "Reiseplan",
        "tab_stays_transport": "Unterkünfte & Transport",
        "tab_weather": "Wettervorhersage",
        "tab_budget": "Budgetübersicht & KI-Tipps",
        "title_stays": "Kuratierte Aufenthalte",
        "desc_stays": "Hoteloptionen sortiert nach Bewertung und Budgetbeschränkungen.",
        "title_transit": "Schwarm-Transport-Auswahl",
        "title_alt_flights": "Alternative Flüge",
        "title_weather": "Echtzeit-Vorhersagedetails",
        "desc_weather": "Wetterdaten abgerufen für Ihr spezifisches Reisefenster.",
        "title_weather_suggestions": "Wetterschwarm-Aktion",
        "title_budget": "Budgetanalyse",
        "label_total_limit": "Gesamtlimit",
        "label_spent": "Ausgegeben",
        "label_remaining": "Verbleibend",
        "title_ai_recs": "Empfehlungen des KI-Agentenschwarms",
        "choose_journey_subtitle": "WAHLEN SIE IHRE REISE",
        "adventure_awaits_title": "Weltweites Abenteuer wartet",
        "adventure_desc": "Wählen Sie einen Abenteuerstil aus, um die top-bewerteten Ziele weltweit für diese Kategorie zu entdecken, inklusive Google Maps-Ortslinks.",
        "tag_trek": "🧗‍♂️ Trek & Klettern",
        "title_trek": "Wanderabenteuer",
        "desc_trek": "Erklimmen Sie alpine Gipfel, reisen Sie auf alten Bergpässen und erleben Sie majestätische Wege unter hohen Gletschern.",
        "btn_explore_locations": "Orte erkunden",
        "tag_balloon": "🎈 Heißluftballon",
        "title_balloon": "Heißluftballonfahrt",
        "desc_balloon": "Driften Sie still über vulkanische Täler, rollende Weinberge und historische Festungen bei Sonnenaufgang.",
        "tag_canopy": "🌲 Dachschwünge",
        "title_canopy": "Dach- und Ziplining",
        "desc_canopy": "Schweben Sie hoch über tiefen Dschungel-Schluchten, aktiven Vulkanen und smaragdgrünen Tälern auf Geschwindigkeits-Dachschienen.",
        "tag_safari": "🦁 Wildtier-Safari",
        "title_safari": "Wildtier-Safaris",
        "desc_safari": "Beobachten Sie majestätische Wildtiere in ihren natürlichen Savannen, Flussbetten und unberührten Nationalreserven.",
        "adv_modal_title": "Top-Abenteuer-Orte",
        "adv_modal_intro": "Entdecken Sie top-bewertete Orte auf der ganzen Welt, an denen Sie dieses Abenteuer erleben können, mit Karten und Details.",
        "about_subtitle": "UNSERE KOGNITIVE TECHNOLOGIE",
        "about_title": "Treten Sie dem Agenten-Schwarm bei",
        "about_desc": "Entdecken Sie, wie VoyageAI fünf spezialisierte KI-Agenten nutzt, die in Echtzeit zusammenarbeiten, um Ihre perfekte Reise zu planen, und kontinuierliche Audits durchführen, um einen maßgeschneiderten wetter-sicheren und budget-gesicherten Reiseplan zu liefern.",
        "swarm_arch_title": "Die Schwarm-Architektur",
        "swarm_arch_desc": "Traditionelle Reiseplaner verlassen sich auf statische Regeln oder Single-Prompt-LLM-Generierung. VoyageAI nutzt eine kollaborative Multi-Agenten-Architektur, bei der Agenten die Parameter des anderen überprüfen und verfeinern, um Ihren Anforderungen gerecht zu werden.",
        "node_coordinator": "Koordinator-Kern",
        "node_weather": "Wetter-Agent",
        "node_hotel": "Hotel-Agent",
        "node_transit": "Transit-Agent",
        "node_budget": "Budget-Agent",
        "role_orchestrator": "Orchestrator",
        "role_forecaster": "Prognostiker",
        "role_curator": "Kurator",
        "role_routing": "Routing",
        "role_auditor": "Prüfer",
        "card_title_coordinator": "Koordinator-Schwarm-Kern",
        "card_desc_coordinator": "Orchestrates den Lebenszyklus der Planungsaufgabe. Es sammelt Eingabefelder, spawnnt Agenten-Worker-Threads, handhabt Datenzusammenführung und kompiliert das endgültige Boarding-Pass-Layout.",
        "card_title_weather": "Wetter-Agent",
        "card_desc_weather": "Verbindet sich direkt mit globalen Wettervorhersage-Feeds. Wenn starker Regen oder extreme Temperaturen für einen Reisetag vorhergesagt werden, koordiniert es mit dem Reiseplan-Agenten, um Outdoor-Highlights durch Indoor-Aktivitäten zu ersetzen.",
        "card_title_hotel": "Hotel-Deal-Kurator",
        "card_desc_hotel": "Abfragen von Datenbank-Endpunkten für Hotels, die den Zielkriterien entsprechen. Es filtert Kandidaten basierend auf Durchschnittsbewertung, Ausstattung und Kosten, um sicherzustellen, dass Sie in qualitativ hochwertigen Unterkünften ohne Überschreitung des Budgets bleiben.",
        "card_title_transit": "Transit-Optimierer",
        "card_desc_transit": "Bewertet Transportoptionen (Flüge, Züge, Taxis) zwischen Ihrer Quelle und Ihrem Ziel. Es führt Dauer- versus Kosten-Bewertungen durch, um die effizientesten Routen vorzuschlagen.",
        "card_title_budget": "Budget-Prüfer",
        "card_desc_budget": "Führt strenge Audits von Aufenthalten, Transit und täglichen Aktivitäts-Schätzungen durch. Es sichert einen Sicherheitspuffer von mindestens 10% Ihres Gesamtbudgets und warnt Sie sofort, wenn die geschätzten Ausgaben die Grenzen überschreiten.",
        "popular_adventures_subtitle": "POPULÄRE ABENTEUER",
        "popular_adventures_title": "Entdecken Sie die vorgestellten Schwarm-Läufe",
        "popular_adventures_desc": "Wählen Sie ein vordefiniertes Ziel-Profil aus, um sofort einen maßgeschneiderten Planungsschwarm zu starten, oder suchen und filtern Sie Stile.",
        "search_placeholder": "Suchen Sie nach Zielen (z.B. Tokyo, Schweiz)...",
        "filter_all": "Alle",
        "filter_beaches": "🏖️ Strände",
        "filter_culture": "🏯 Kultur",
        "filter_adventure": "🧗‍♂️ Abenteuer",
        "spot_goa_badge": "🏖️ Strände und Nachtleben",
        "spot_goa_desc": "Entspannen Sie sich auf malerischen goldenen Stränden, erkunden Sie koloniale portugiesische Kirchen und genießen Sie das lebendige Küsten-Nachtleben.",
        "spot_tokyo_badge": "🏯 Technik und Erbe",
        "spot_tokyo_desc": "Erkunden Sie turmhohe Neon-Wolkenkratzer, historische Shinto-Schreine, belebte Straßen-Food-Märkte und Bullet-Züge.",
        "spot_paris_badge": "💖 Kunst und Romantik",
        "spot_paris_desc": "Genießen Sie gourmetsche französische Küche, schlendern Sie entlang der Seine, besuchen Sie das Louvre und bewundern Sie die Eiffel-Turm-Lichter.",
        "spot_maldives_badge": "💎 Luxus-Rückzug",
        "spot_maldives_desc": "Bleiben Sie in atemberaubenden Wasser-Villen, schnorcheln Sie in klaren Lagunen und genießen Sie isolierte Spa-Kreuzfahrten.",
        "spot_swiss_badge": "🧗‍♂️ Alpines Wandern",
        "spot_swiss_desc": "Erklimmen Sie schneebedeckte Hänge, reisen Sie entlang malerischer Zahnradbahnen und besuchen Sie ruhige Täler, die unter dem Matterhorn verborgen liegen.",
        "spot_rome_badge": "🏛️ Ruinen des Imperiums",
        "spot_rome_desc": "Gehen Sie über die Böden des historischen Kolosseums, werfen Sie Münzen in den Trevi-Brunnen und erkunden Sie die Vatikan-Galerien.",
        "spot_bali_badge": "🌴 Insel-Natur",
        "spot_bali_desc": "Wandern Sie durch wunderschöne vulkanische Hügel, besuchen Sie majestätische Tempel-Klippen und genießen Sie frischen Wellen auf unberührten Stränden.",
        "spot_sydney_badge": "🐨 Hafen-Atmosphäre",
        "spot_sydney_desc": "Besuchen Sie das weltberühmte Sydney-Opernhaus, surfen Sie auf den Bondi-Strand-Riffen und kreuzen Sie über den historischen Hafen.",
        "plan_this_trip": "Planen Sie diese Reise",
        "map_link": "Karte",
        "how_works_title": "Wie funktioniert die Schwarm-Planung",
        "how_works_desc": "Unser System generiert keine rohen Text-Vorlagen für Reisepläne. Es koordiniert API-Integrationen, um tatsächliche Aufenthalts- und Transitkosten abzurufen, und nutzt fünf verschiedene kognitive Schichten, um Details zu kompilieren.",
        "step1_title": "Reise-Details einreichen",
        "step1_desc": "Geben Sie Quelle, Ziel, Datum und Budget-Grenze an. Setzen Sie Vibe-Matches wie Kultur, Essen oder Strände.",
        "step2_title": "Schwarm-Entwicklung",
        "step2_desc": "Der Koordinator setzt Sub-Agenten-Worker ein, um Hotels zu suchen, Flüge zu vergleichen, Wetter-Trends zu überprüfen und Kosten zu berechnen.",
        "step3_title": "Boarding-Pass-Zusammenfassung erhalten",
        "step3_desc": "Sobald die Audits abgeschlossen sind, wird Ihr endgültiger Boarding-Pass-Arbeitsbereich mit Tages-Zeitplan-Akkorden und kreisförmigen Budget-Statistik-Zählern gerendert."
    },
    "ta": {
        "nav_home": "முகப்பு",
        "nav_about": "எங்களை பற்றி",
        "nav_trips": "பயணங்கள்",
        "nav_dashboard": "டாஷ்போர்டு",
        "btn_login": "உள்நுழை",
        "btn_signup": "பதிவுசெய்",
        "hero_title": "எங்களுடன் உலகை ஆராயுங்கள்.",
        "hero_subtitle": "வானிலை மற்றும் பட்ஜெட்டுக்கு உகந்த பயண திட்டங்களை சில நொடிகளில் உருவாக்க AI முகவர்களை பயன்படுத்தவும்.",
        "btn_explore": "ஆராயுங்கள்",
        "scroll_down": "கீழே உருட்டவும்",
        "feel_freedom_title": "சுதந்திரத்தை உணருங்கள்",
        "feel_freedom_desc": "ஹோட்டல்களை க்யூரேட் செய்யவும் மற்றும் பட்ஜெட் வரம்புகளை தானாக சரிசெய்யவும் எங்கள் AI நெட்வொர்க்கை அனுமதிக்கவும்.",
        "capture_moment_title": "ஒவ்வொரு கணத்தையும் ரசியுங்கள்",
        "capture_moment_desc": "திட்டமிடும் சோர்வை விடுத்து, மறக்க முடியாத பயண நினைவுகளை உருவாக்குவதில் கவனம் செலுத்துங்கள்.",
        "slide0_title": "எங்களுடன் உலகை ஆராயுங்கள்.",
        "slide0_subtitle": "வானிலை மற்றும் பட்ஜெட்டுக்கு உகந்த பயண திட்டங்களை சில நொடிகளில் உருவாக்க AI முகவர்களை பயன்படுத்தவும்.",
        "slide1_title": "நவீன டோக்கியோவை அனுபவியுங்கள்.",
        "slide1_subtitle": "உங்கள் பாணிக்கு ஏற்ற நியான் விளக்கு வீதிகள், வரலாற்று கோயில்கள் மற்றும் சிறந்த உணவு சாகசங்களை அனுபவியுங்கள்.",
        "slide2_title": "பாரீஸில் காதல்.",
        "slide2_subtitle": "சீன் நதிக்கரையில் நடக்கவும், உலகத்தரம் வாய்ந்த அருங்காட்சியகங்களை ஆராயவும், AI க்யூரேட் செய்த கஃபேக்களை அனுபவிக்கவும்.",
        "dash_title": "வாயேஜ் ஸ்வார்ம் டாஷ்போர்டு",
        "dash_subtitle": "உங்கள் செயலில் உள்ள பயண திட்டங்களை நிர்வகிக்கும் கூட்டு முகவர் நெட்வொர்க்.",
        "btn_new_trip": "புதிய பயணம் திட்டமிடுங்கள்",
        "stat_total_trips": "மொத்த பயணங்கள்",
        "stat_spent_budget": "மொத்த செலவு",
        "empty_state_title": "பயணங்கள் எதுவும் இல்லை",
        "empty_state_desc": "நீங்கள் இன்னும் எந்த AI பயணத் திட்டங்களையும் உருவாக்கவில்லை. உங்கள் முதல் திட்டத்திற்கு தயாரா?",
        "empty_state_btn": "பிளானர் விஸார்டை தொடங்குங்கள்",
        "wiz_title": "முகவர் கூட்டு ஒருங்கிணைப்பாளர்",
        "wiz_subtitle": "பயண வரம்புகளை உள்ளமைக்கவும். துணை முகவர்கள் தரவை தானாகவே சேகரிப்பார்கள்.",
        "wiz_step_1": "வழித்தடம் & அட்டவணை",
        "wiz_step_2": "படஜெட் & பாணி",
        "wiz_step_3": "விருப்பத்தேர்வுகள்",
        "label_source": "புறப்படும் நகரம்",
        "label_destination": "சேரும் நகரம்",
        "label_date": "பயண தேதி",
        "label_days": "கால அளவு (நாட்கள்)",
        "label_budget": "மொத்த பட்ஜெட் (INR)",
        "label_requirements": "சிறப்பு தேவைகள் (விருப்பத்தேர்வு)",
        "placeholder_source": "உதாரணமாக. ஹைதராபாத்",
        "placeholder_destination": "உதாரணமாக. கோவா",
        "placeholder_requirements": "உதாரணமாக. கடற்கரை காட்சி ஹோட்டல், சைவ உணவு...",
        "btn_prev": "பின்னால்",
        "btn_next": "அடுத்த படி",
        "btn_submit": "கூட்டை பயன்படுத்துங்கள்",
        "tab_itinerary": "பயணத்திட்டம்",
        "tab_stays_transport": "தங்குமிடங்கள் & போக்குவரத்து",
        "tab_weather": "வானிலை முன்னறிவிப்பு",
        "tab_budget": "படஜெட் சுருக்கம் & AI குறிப்புகள்",
        "title_stays": "தேர்ந்தெடுக்கப்பட்ட ஹோட்டல்கள்",
        "desc_stays": "மதிப்பீடு மற்றும் பட்ஜெட் வரம்புகளின் அடிப்படையில் வரிசைப்படுத்தப்பட்ட ஹோட்டல்கள்.",
        "title_transit": "போக்குவரத்து தேர்வு",
        "title_alt_flights": "மாற்று விமானங்கள்",
        "title_weather": "நிகழ்நேர வானிலை விவரங்கள்",
        "desc_weather": "உங்கள் பயண நேரத்திற்கான வானிலை முன்னறிவிப்புகள்.",
        "title_weather_suggestions": "வானிலை கூட்டு முகவர் ஆலோசனைகள்",
        "title_budget": "படஜெட் பகுப்பாய்வு",
        "label_total_limit": "மொத்த வரம்பு",
        "label_spent": "செலவிடப்பட்டது",
        "label_remaining": "மீதமுள்ளது",
        "title_ai_recs": "AI கூட்டு முகவர் பரிந்துரைகள்",
        "choose_journey_subtitle": "உங்கள் பயணத்தைத் தேர்ந்தெடுங்கள்",
        "adventure_awaits_title": "உலகளாவிய சாகசம் காத்திருக்கிறது",
        "adventure_desc": "ஒரு சாகச பாணியைத் தேர்ந்தெடுங்கள், அந்த வகையின் உலகளாவிய மிகவும் பரிந்துரைக்கப்படும் இடங்களை கூகுள் மேப்ஸ் இடங்கள் இணைப்புகளுடன் கண்டுபிடிக்கவும்.",
        "tag_trek": "🧗‍♂️ பயணம் & ஏறுதல்",
        "title_trek": "மலையேற்ற சாகசங்கள்",
        "desc_trek": "ஆல்ப்ஸ் மலைகளின் உச்சிகளை அடையுங்கள், பழங்கால மலைப்பாதைகள் வழியாக பயணம் செய்யுங்கள், மேலும் உயர்ந்த பனிப்பாறைகளுக்கு கீழே உள்ள அரசிய பாதைகளை அனுபவிக்கவும்.",
        "btn_explore_locations": "இடங்களை ஆராயுங்கள்",
        "tag_balloon": "🎈 Hot Air Balloon",
        "title_balloon": "Hot Air Ballooning",
        "desc_balloon": "Drift silently over volcanic valleys, rolling wine country, and historic fortresses at early sunrise.",
        "tag_canopy": "🌲 Canopy Swings",
        "title_canopy": "Canopy & Zipline",
        "desc_canopy": "Soar high above deep jungle canyons, active volcanoes, and emerald valleys on speed-glide canopy tracks.",
        "tag_safari": "🦁 Wildlife Safari",
        "title_safari": "Wildlife Safaris",
        "desc_safari": "அவற்றின் இயற்கையான சவானாக்கள், ஆற்றுப் படுகைகள், மற்றும் கட்டுப்படுத்தப்படாத தேசிய பாதுகாப்பு இடங்களில் அரசியல் வனவிலங்குகளைக் காண்போம்.",
        "adv_modal_title": "Top Adventure Locations",
        "adv_modal_intro": "Explore top-rated spots around the world where you can experience this adventure, with maps and details.",
        "about_subtitle": "OUR COGNITIVE TECHNOLOGY",
        "about_title": "Meet the Agent Swarm",
        "about_desc": "Discover how VoyageAI utilizes five specialized AI agents collaborating in real-time to plan your perfect vacation, running continuous audits to deliver a custom weather-safe and budget-locked itinerary.",
        "swarm_arch_title": "திரள் கட்டமைப்பு",
        "swarm_arch_desc": "Traditional travel planners rely on static rules or single-prompt LLM generation. VoyageAI uses a collaborative multi-agent architecture where agents critique and refine each other's parameters to fit your requirements.",
        "node_coordinator": "Coordinator Core",
        "node_weather": "Weather Agent",
        "node_hotel": "Hotel Agent",
        "node_transit": "Transit Agent",
        "node_budget": "Budget Agent",
        "role_orchestrator": "Orchestrator",
        "role_forecaster": "முன்கணிப்பாளர்",
        "role_curator": "Curator",
        "role_routing": "Routing",
        "role_auditor": "Auditor",
        "card_title_coordinator": "Coordinator Swarm Core",
        "card_desc_coordinator": "Orchestrates the lifecycle of the planning task. It collects input fields, spawns agent worker threads, handles data collation, and compiles the final boarding pass layout.",
        "card_title_weather": "Weather Agent",
        "card_desc_weather": "Connects directly to global weather forecast feeds. If heavy rain or extreme temperatures are predicted for a travel day, it coordinates with the itinerary agent to substitute outdoor highlights with indoor activities.",
        "card_title_hotel": "ஹோட்டல் டீல் கியூரேட்டர்",
        "card_desc_hotel": "Queries database endpoints for hotels matching destination criteria. It filters candidates based on average rating, amenities, and costs, ensuring you stay in quality accommodations without overspending.",
        "card_title_transit": "Transit Optimizer",
        "card_desc_transit": "Evaluates transport options (flights, trains, cabs) connecting your source and destination. It performs duration-versus-cost evaluations to suggest the most time-efficient routes.",
        "card_title_budget": "Budget Auditor",
        "card_desc_budget": "Performs strict audits of stays, transit, and daily activity estimates. It locks down a safety buffer of at least 10% of your total budget, warning you immediately if estimated expenses exceed limits.",
        "popular_adventures_subtitle": "POPULAR ADVENTURES",
        "popular_adventures_title": "அணி ஓட்டங்களை ஆராய்வது",
        "popular_adventures_desc": "Select a pre-designed destination profile below to spawn a custom planning swarm immediately, or search and filter styles.",
        "search_placeholder": "Search destinations (e.g. Tokyo, Swiss)...",
        "filter_all": "All",
        "filter_beaches": "🏖️ Beaches",
        "filter_culture": "🏯 Culture",
        "filter_adventure": "🧗‍♂️ Adventure",
        "spot_goa_badge": "🏖️ Beaches & Nightlife",
        "spot_goa_desc": "Relax on scenic golden beaches, explore colonial Portuguese churches, and enjoy vibrant coastal nightlife.",
        "spot_tokyo_badge": "🏯 தொழில்நுட்பம் & பாரம்பரியம்",
        "spot_tokyo_desc": "Explore towering neon skyscrapers, historical Shinto shrines, busy street food markets, and bullet trains.",
        "spot_paris_badge": "💖 Arts & romance",
        "spot_paris_desc": "Savor gourmet French cuisine, stroll down the Seine, visit the Louvre, and admire the Eiffel Tower lights.",
        "spot_maldives_badge": "லட்சம் ஓய்வு",
        "spot_maldives_desc": "Stay in breathtaking overwater villas, snorkel inside clear lagoons, and enjoy isolated spa cruises.",
        "spot_swiss_badge": "🧗‍♂️ Alpine Hiking",
        "spot_swiss_desc": "Scale snowy slopes, travel along scenic cog railways, and visit quiet valleys tucked beneath the Matterhorn.",
        "spot_rome_badge": "🏛️ Empire Ruins",
        "spot_rome_desc": "வரலாற்று சிறப்புமிக்க கொலோசியத்தின் தளங்களில் நடக்கவும், ட்ரெவி நீரூற்றில் நாணயங்களை எறியவும், வத்திக்கான் காட்சியகங்களை ஆராய்ந்து பாருங்கள்.",
        "spot_bali_badge": "தீவு இயற்கை",
        "spot_bali_desc": "Hike beautiful volcanic hillsides, visit majestic temple cliffs, and enjoy fresh surf on pristine sands.",
        "spot_sydney_badge": "🐨 Harbor Vibe",
        "spot_sydney_desc": "Tour the world-famous Sydney Opera House, surf Bondi beach reefs, and cruise across the historic harbor.",
        "plan_this_trip": "Plan This Trip",
        "map_link": "வரைபடம்",
        "how_works_title": "How Swarm Planning Works",
        "how_works_desc": "Our system doesn't generate raw text template itineraries. It coordinates API integrations to fetch actual stays and transit costs, and uses five distinct cognitive layers to compile details.",
        "step1_title": "Submit Route Details",
        "step1_desc": "Provide source, destination, date, and budget limit. Set vibe matches like culture, dining, or beaches.",
        "step2_title": "Swarm Deployment",
        "step2_desc": "The Coordinator deploys sub-agent workers to source hotels, compare flights, check weather trends, and calculate costs.",
        "step3_title": "Get Boarding Pass Summary",
        "step3_desc": "தணிக்கைகள் முடிந்ததும், உங்கள் இறுதி விமான வாசல் பணியிடம் நாள் நேரக்கோடு அக்கோர்டியன்களுடனும், வட்ட நிதி புள்ளிகள் கேஜ்களுடனும் வரையறுக்கப்படுகிறது."
    },
    "kn": {
        "nav_home": "ಮುಖಪುಟ",
        "nav_about": "ನಮ್ಮ ಬಗ್ಗೆ",
        "nav_trips": "ಪ್ರವಾಸಗಳು",
        "nav_dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        "btn_login": "ಲಾಗಿನ್",
        "btn_signup": "ಸೈನ್ ಅಪ್",
        "hero_title": "ನಮ್ಮೊಂದಿಗೆ ಜಗತ್ತನ್ನು ಅನ್ವೇಷಿಸಿ.",
        "hero_subtitle": "ಹವಾಮಾನ ಮತ್ತು ಬಡ್ಜೆಟ್‌ಗೆ ಸೂಕ್ತವಾದ ಪ್ರವಾಸ ಯೋಜನೆಗಳನ್ನು ಕ್ಷಣಗಳಲ್ಲಿ ರಚಿಸಲು AI ಏಜೆಂಟ್‌ಗಳನ್ನು ಬಳಸಿ.",
        "btn_explore": "ಈಗಲೇ ಅನ್ವೇಷಿಸಿ",
        "scroll_down": "ಕೆಳಗೆ ಸ್ಕ್ರಾಲ್ ಮಾಡಿ",
        "feel_freedom_title": "ಸ್ವತಂತ್ರತೆಯನ್ನು ಅನುಭವಿಸಿ",
        "feel_freedom_desc": "ಹೋಟೆಲ್‌ಗಳನ್ನು ಕ್ಯೂರೇಟ್ ಮಾಡಲು ಮತ್ತು ಬಡ್ಜೆಟ್ ಮಿತಿಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಹೊಂದಿಸಲು ನಮ್ಮ AI ನೆಟ್‌ವರ್ಕ್‌ಗೆ ಅನುಮತಿಸಿ.",
        "capture_moment_title": "ಪ್ರತಿ ಕ್ಷಣವನ್ನು ಆನಂದಿಸಿ",
        "capture_moment_desc": "ಪ್ಲಾನಿಂಗ್ ದಣಿವನ್ನು ಪಕ್ಕಕ್ಕಿಟ್ಟು, ಮರೆಯಲಾಗದ ಪ್ರವಾಸದ ನೆನಪುಗಳನ್ನು ಸೃಷ್ಟಿಸುವತ್ತ ಗಮನ ಹರಿಸಿ.",
        "slide0_title": "ನಮ್ಮೊಂದಿಗೆ ಜಗತ್ತನ್ನು ಅನ್ವೇಷಿಸಿ.",
        "slide0_subtitle": "ಹವಾಮಾನ ಮತ್ತು ಬಡ್ಜೆಟ್‌ಗೆ ಸೂಕ್ತವಾದ ಪ್ರವಾಸ ಯೋಜನೆಗಳನ್ನು ಕ್ಷಣಗಳಲ್ಲಿ ರಚಿಸಲು AI ಏಜೆಂಟ್‌ಗಳನ್ನು ಬಳಸಿ.",
        "slide1_title": "ಆಧುನಿಕ ಟೋಕಿಯೊವನ್ನು ಅನುಭವಿಸಿ.",
        "slide1_subtitle": "ನಿಮ್ಮ ಶೈಲಿಗೆ ಸೂಕ್ತವಾದ ನಿಯಾನ್-ದೀಪಗಳ ಬೀದಿಗಳು, ಐತಿಹಾಸಿಕ ದೇವಾಲಯಗಳು ಮತ್ತು ಅತ್ಯುತ್ತಮ ಆಹಾರ ಸಾಹಸಗಳನ್ನು ಆನಂದಿಸಿ.",
        "slide2_title": "ಪ್ಯಾರಿಸ್‌ನಲ್ಲಿ ರೋಮಾನ್ಸ್.",
        "slide2_subtitle": "ಸೀನ್ ನದಿಯ ದಡದಲ್ಲಿ ನಡೆಯಿರಿ, ವಿಶ್ವದರ್ಜೆಯ ವಸ್ತುಸಂಗ್ರಹಾಲಯಗಳನ್ನು ಅನ್ವೇಷಿಸಿ ಮತ್ತು AI ಕ್ಯೂರೇಟ್ ಮಾಡಿದ ಕೆಫೆಗಳನ್ನು ಆನಂದಿಸಿ.",
        "dash_title": "ಪ್ರವಾಸ ಸ್ವಾರ್ಮ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        "dash_subtitle": "ನಿಮ್ಮ ಸಕ್ರಿಯ ಪ್ರವಾಸ ಯೋಜನೆಗಳನ್ನು ನಿರ್ವಹಿಸುವ ಸಹಕಾರಿ ಏಜೆಂಟ್ ನೆಟ್‌ವರ್ಕ್.",
        "btn_new_trip": "ಹೊಸ ಪ್ರವಾಸ ಯೋಜಿಸಿ",
        "stat_total_trips": "ಒಟ್ಟು ಪ್ರವಾಸಗಳು",
        "stat_spent_budget": "ಒಟ್ಟು ಖರ್ಚು",
        "empty_state_title": "ಯಾವುದೇ ಪ್ರವಾಸಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
        "empty_state_desc": "ನೀವು ಇನ್ನೂ ಯಾವುದೇ AI ಪ್ರವಾಸ ಯೋಜನೆಗಳನ್ನು ರಚಿಸಿಲ್ಲ. ನಿಮ್ಮ ಮೊದಲ ಯೋಜನೆಗೆ ಸಿದ್ಧರಿದ್ದೀರಾ?",
        "empty_state_btn": "ಪ್ಲಾನರ್ ವಿಝಾರ್ಡ್ ಪ್ರಾರಂಭಿಸಿ",
        "wiz_title": "ಏಜೆಂಟ್ ಸ್ವಾರ್ಮ್ ಸಂಯೋಜಕ",
        "wiz_subtitle": "ಪ್ರವಾಸದ ಮಿತಿಗಳನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡಿ. ಉಪ-ಏಜೆಂಟರು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಡೇಟಾವನ್ನು ಸಂಗ್ರಹಿಸುತ್ತಾರೆ.",
        "wiz_step_1": "ಮಾರ್ಗ ಮತ್ತು ವೇಳಾಪಟ್ಟಿ",
        "wiz_step_2": "ಬಡ್ಜೆಟ್ ಮತ್ತು ಶೈಲಿ",
        "wiz_step_3": "ಆದ್ಯತೆಗಳು",
        "label_source": "ನಿರ್ಗಮನ ನಗರ",
        "label_destination": "ತಲುಪುವ ನಗರ",
        "label_date": "ಪ್ರಯಾಣದ ದಿನಾಂಕ",
        "label_days": "ಅವಧಿ (ದಿನಗಳು)",
        "label_budget": "ಒಟ್ಟು ಬಡ್ಜೆಟ್ (INR)",
        "label_requirements": "ವಿಶೇಷ ಅವಶ್ಯಕತೆಗಳು (ಐಚ್ಛಿಕ)",
        "placeholder_source": "ಉದಾ. ಹೈದರಾಬಾದ್",
        "placeholder_destination": "ಉದಾ. ಗೋವಾ",
        "placeholder_requirements": "ಉದಾ. ಸಮುದ್ರತೀರದ ಹೋಟೆಲ್, ಸಸ್ಯಾಹಾರಿ ಆಹಾರ...",
        "btn_prev": "ಹಿಂದಕ್ಕೆ",
        "btn_next": "ಮುಂದಿನ ಹಂತ",
        "btn_submit": "ಯೋಜನೆಯನ್ನು ನಿಯೋಜಿಸಿ",
        "tab_itinerary": "ಪ್ರಯಾಣ ವೇಳಾಪಟ್ಟಿ",
        "tab_stays_transport": "ವಸತಿ ಮತ್ತು ಸಾರಿಗೆ",
        "tab_weather": "ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ",
        "tab_budget": "ಬಡ್ಜೆಟ್ ಸಾರಾಂಶ ಮತ್ತು AI ಸಲಹೆಗಳು",
        "title_stays": "ಆಯ್ದ ಹೋಟೆಲ್‌ಗಳು",
        "desc_stays": "ರೇಟಿಂಗ್ ಮತ್ತು ಬಡ್ಜೆಟ್ ಮಿತಿಗಳ ಆಧಾರದ ಮೇಲೆ ವಿಂಗಡಿಸಲಾದ ಹೋಟೆಲ್‌ಗಳು.",
        "title_transit": "ಸಾರಿಗೆ ಆಯ್ಕೆ",
        "title_alt_flights": "ಪರ್ಯಾಯ ವಿಮಾನಗಳು",
        "title_weather": "ನೈಜ-ಸಮಯದ ಹವಾಮಾನ",
        "desc_weather": "ನಿಮ್ಮ ಪ್ರವಾಸದ ಸಮಯಕ್ಕಾಗಿ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆಗಳು.",
        "title_weather_suggestions": "ಹವಾಮಾನ ಏಜೆಂಟ್ ಸ್ವಾರ್ಮ್ ಸಲಹೆಗಳು",
        "title_budget": "ಬಡ್ಜೆಟ್ ವಿಶ್ಲೇಷಣೆ",
        "label_total_limit": "ಒಟ್ಟು ಮಿತಿ",
        "label_spent": "ಖರ್ಚು ಮಾಡಿದ್ದು",
        "label_remaining": "ಉಳಿದಿರುವುದು",
        "title_ai_recs": "AI ಏಜೆಂಟ್ ಸ್ವಾರ್ಮ್ ಶಿಫಾರಸುಗಳು",
        "tab_places": "ಭೇಟಿ ನೀಡಬೇಕಾದ ಸ್ಥಳಗಳು",
        "title_places": "ಶಿಫಾರಸು ಮಾಡಲಾದ ಸ್ಥಳಗಳು ಮತ್ತು ಆಕರ್ಷಣೆಗಳು",
        "desc_places": "ನಿಮ್ಮ ಪ್ರಯಾಣದ ಶೈಲಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಆಯ್ದ ಪ್ರವಾಸಿ ಸ್ಥಳಗಳು, ನೇರ ನಕ್ಷೆಗಳ ಲಿಂಕ್‌ಗಳೊಂದಿಗೆ.",
        "btn_view_map": "ಗೂಗಲ್ ನಕ್ಷೆಯಲ್ಲಿ ವೀಕ್ಷಿಸಿ",
        "btn_book_now": "ಈಗಲೇ ಬುಕ್ ಮಾಡಿ",
        "per_night": "/ ರಾತ್ರಿ",
        "recent_trips": "ಇತ್ತೀಚಿನ ಪ್ರವಾಸಗಳು",
        "days": "ದಿನಗಳು",
        "label_budget_limit": "ಬಡ್ಜೆಟ್ ಮಿತಿ",
        "choose_journey_subtitle": "ನಿಮ್ಮ ಪ್ರಯಾಣವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
        "adventure_awaits_title": "ಜಗತ್ತಿನಾದ್ಯಂತ ಸಾಹಸ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ",
        "adventure_desc": "ಕೆಳಗಿನ ಪ್ರಕಾರದ ಸಾಹಸವನ್ನು ಆಯ್ಕೆಮಾಡಿ, ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ಸ್ಥಳ ಕೊಂಡಿಗಳೊಂದಿಗೆ ಆ ವರ್ಗದ ಪ್ರಮುಖ ಸ್ಥಳಗಳನ್ನು ಪರಿಶೋಧಿಸಿ.",
        "tag_trek": "ಟ್ರೆಕ್ ಮತ್ತು ಏರುವುದು",
        "title_trek": "ಟ್ರೆಕ್ಕಿಂಗ್ ಸಾಹಸಗಳು",
        "desc_trek": "Scale alpine peaks, travel ancient mountain passes, and experience majestic trails beneath high glaciers.",
        "btn_explore_locations": "Explore Locations",
        "tag_balloon": "🎈 Hot Air Balloon",
        "title_balloon": "Hot Air Ballooning",
        "desc_balloon": "Drift silently over volcanic valleys, rolling wine country, and historic fortresses at early sunrise.",
        "tag_canopy": "🌲 Canopy Swings",
        "title_canopy": "Canopy & Zipline",
        "desc_canopy": "Soar high above deep jungle canyons, active volcanoes, and emerald valleys on speed-glide canopy tracks.",
        "tag_safari": "🦁 Wildlife Safari",
        "title_safari": "Wildlife Safaris",
        "desc_safari": "ಸಹಜ ಸವನ್ನಾಗಳಲ್ಲಿ, ನದಿಯ ಮೈದಾನಗಳಲ್ಲಿ ಮತ್ತು ಅಮೂಲ್ಯ ರಾಷ್ಟ್ರೀಯ ಅರಣ್ಯಗಳಲ್ಲಿ ಮಹಾನ್ ವನ್ಯಜೀವಿಗಳನ್ನು ನೋಡಿ.",
        "adv_modal_title": "Top Adventure Locations",
        "adv_modal_intro": "Explore top-rated spots around the world where you can experience this adventure, with maps and details.",
        "about_subtitle": "OUR COGNITIVE TECHNOLOGY",
        "about_title": "Meet the Agent Swarm",
        "about_desc": "Discover how VoyageAI utilizes five specialized AI agents collaborating in real-time to plan your perfect vacation, running continuous audits to deliver a custom weather-safe and budget-locked itinerary.",
        "swarm_arch_title": "ಸ್ವಾರ್ಮ್ ವಾಸ್ತುಶಿಲ್ಪ",
        "swarm_arch_desc": "Traditional travel planners rely on static rules or single-prompt LLM generation. VoyageAI uses a collaborative multi-agent architecture where agents critique and refine each other's parameters to fit your requirements.",
        "node_coordinator": "Coordinator Core",
        "node_weather": "Weather Agent",
        "node_hotel": "Hotel Agent",
        "node_transit": "Transit Agent",
        "node_budget": "Budget Agent",
        "role_orchestrator": "Orchestrator",
        "role_forecaster": "Forecaster",
        "role_curator": "Curator",
        "role_routing": "Routing",
        "role_auditor": "ಲೆಕ್ಕಪರಿಶೋಧಕ",
        "card_title_coordinator": "Coordinator Swarm Core",
        "card_desc_coordinator": "Orchestrates the lifecycle of the planning task. It collects input fields, spawns agent worker threads, handles data collation, and compiles the final boarding pass layout.",
        "card_title_weather": "Weather Agent",
        "card_desc_weather": "Connects directly to global weather forecast feeds. If heavy rain or extreme temperatures are predicted for a travel day, it coordinates with the itinerary agent to substitute outdoor highlights with indoor activities.",
        "card_title_hotel": "Hotel Deal Curator",
        "card_desc_hotel": "Queries database endpoints for hotels matching destination criteria. It filters candidates based on average rating, amenities, and costs, ensuring you stay in quality accommodations without overspending.",
        "card_title_transit": "ಸಾರಿಗೆ ಆಪ್ಟಿಮೈಸರ್",
        "card_desc_transit": "Evaluates transport options (flights, trains, cabs) connecting your source and destination. It performs duration-versus-cost evaluations to suggest the most time-efficient routes.",
        "card_title_budget": "Budget Auditor",
        "card_desc_budget": "Performs strict audits of stays, transit, and daily activity estimates. It locks down a safety buffer of at least 10% of your total budget, warning you immediately if estimated expenses exceed limits.",
        "popular_adventures_subtitle": "ಜನಪ್ರಿಯ ಸಾಹಸಗಳು",
        "popular_adventures_title": "Explore Featured Swarm Runs",
        "popular_adventures_desc": "Select a pre-designed destination profile below to spawn a custom planning swarm immediately, or search and filter styles.",
        "search_placeholder": "Search destinations (e.g. Tokyo, Swiss)...",
        "filter_all": "All",
        "filter_beaches": "🏖️ Beaches",
        "filter_culture": "🏯 Culture",
        "filter_adventure": "ಸಾಹಸ",
        "spot_goa_badge": "🏖️ Beaches & Nightlife",
        "spot_goa_desc": "Relax on scenic golden beaches, explore colonial Portuguese churches, and enjoy vibrant coastal nightlife.",
        "spot_tokyo_badge": "🏯 Tech & Heritage",
        "spot_tokyo_desc": "ಎತ್ತರದ ನಿಯಾನ್ ಗಗನಚುಂಬಿ ಕಟ್ಟಡಗಳು, ಐತಿಹಾಸಿಕ ಶಿಂಟೊ ದೇವಾಲಯಗಳು, ನಿಬಿಡ ರಸ್ತೆ ಆಹಾರ ಮಾರುಕಟ್ಟೆಗಳು ಮತ್ತು ಬುಲೆಟ್ ರೈಲುಗಳನ್ನು ಪರಿಶೋಧಿಸಿ.",
        "spot_paris_badge": "💖 Arts & romance",
        "spot_paris_desc": "Savor gourmet French cuisine, stroll down the Seine, visit the Louvre, and admire the Eiffel Tower lights.",
        "spot_maldives_badge": "💎 Luxury Retreat",
        "spot_maldives_desc": "ಅಳತೆಗೆಟ್ಟ ನೀರಿನ ಮೇಲಿನ ಗುಡಾರಗಳಲ್ಲಿ ಉಳಿಯಿರಿ, ಸ್ಪಷ್ಟವಾದ ಲಗೂನ್‌ಗಳ ಒಳಗೆ ಸ್ನಾರ್ಕೆಲ್ ಮಾಡಿ ಮತ್ತು ಒಂಟಿಯಾಗಿರುವ ಸ್ಪಾ ಕ್ರೂಸ್‌ಗಳನ್ನು ಆನಂದಿಸಿ.",
        "spot_swiss_badge": "ಪರ್ವತಾರೋಹಣ ಚಾರಣ",
        "spot_swiss_desc": "Scale snowy slopes, travel along scenic cog railways, and visit quiet valleys tucked beneath the Matterhorn.",
        "spot_rome_badge": "🏛️ Empire Ruins",
        "spot_rome_desc": "Walk the floors of the historic Colosseum, toss coins into the Trevi Fountain, and explore the Vatican galleries.",
        "spot_bali_badge": "🌴 Island Nature",
        "spot_bali_desc": "Hike beautiful volcanic hillsides, visit majestic temple cliffs, and enjoy fresh surf on pristine sands.",
        "spot_sydney_badge": "🐨 Harbor Vibe",
        "spot_sydney_desc": "Tour the world-famous Sydney Opera House, surf Bondi beach reefs, and cruise across the historic harbor.",
        "plan_this_trip": "Plan This Trip",
        "map_link": "Map",
        "how_works_title": "How Swarm Planning Works",
        "how_works_desc": "ನಮ್ಮ ವ್ಯವಸ್ಥೆಯು ಕಚ್ಚಾ ಟೆಕ್ಸ್ಟ್ ಟೆಂಪ್ಲೇಟ್ ಪ್ರಯಾಣ ಕಾರ್ಯಸೂಚಿಗಳನ್ನು ರಚಿಸುವುದಿಲ್ಲ. ಇದು API ಏಕೀಕರಣಗಳನ್ನು ಸಂಘಟಿಸುತ್ತದೆ ನಿಜವಾದ ವಸತಿ ಮತ್ತು ಸಾರಿಗೆ ವೆಚ್ಚಗಳನ್ನು ಪಡೆಯಲು ಮತ್ತು ವಿವರಗಳನ್ನು ಸಂಕಲಿಸಲು ಐದು ವಿಭಿನ್ನ ಜ್ಞಾನಾತ್ಮಕ ಪದರಗಳನ್ನು ಬಳಸುತ್ತದೆ.",
        "step1_title": "ಮಾರ್ಗ ವಿವರಗಳನ್ನು ಸಲ್ಲಿಸಿ",
        "step1_desc": "Provide source, destination, date, and budget limit. Set vibe matches like culture, dining, or beaches.",
        "step2_title": "Swarm Deployment",
        "step2_desc": "The Coordinator deploys sub-agent workers to source hotels, compare flights, check weather trends, and calculate costs.",
        "step3_title": "Get Boarding Pass Summary",
        "step3_desc": "Once audits finish, your final boarding pass workspace renders with day timeline accordions and circular budget stats gauges."
    }
};

function injectLanguageSelector() {
    const headerActions = document.querySelector(".header-actions");
    if (headerActions && !document.getElementById("languageSelect")) {
        const langDiv = document.createElement("div");
        langDiv.className = "language-selector";
        langDiv.style.marginRight = "15px";
        langDiv.innerHTML = `
            <select id="languageSelect" class="lang-select">
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
                <option value="de">Deutsch (German)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
            </select>
        `;
        // Prepend it before the user profile or login actions
        headerActions.insertBefore(langDiv, headerActions.firstChild);

        // Add event listener
        const select = langDiv.querySelector("#languageSelect");
        const savedLang = localStorage.getItem("app_lang") || "en";
        select.value = savedLang;
        
        select.addEventListener("change", (e) => {
            const newLang = e.target.value;
            localStorage.setItem("app_lang", newLang);
            applyLanguage(newLang);
            if (state.activeTrip) {
                renderTripPlan(state.activeTrip);
            }
        });
    }
}

function applyLanguage(lang) {
    const t = translationDict[lang] || translationDict['en'];
    
    const setVal = (selector, attr, text) => {
        const el = document.querySelector(selector);
        if (el) el.setAttribute(attr, text);
    };

    // Nav bar
    const navLinks = document.querySelectorAll(".nav-links .nav-link");
    navLinks.forEach(link => {
        const text = link.getAttribute("href");
        if (text === "index.html") link.textContent = t.nav_home;
        else if (text === "about.html") link.textContent = t.nav_about;
        else if (text === "trips.html") link.textContent = t.nav_trips;
        else if (text === "dashboard.html" || link.id === "navDashLink") link.textContent = t.nav_dashboard;
    });

    if (document.getElementById("navLoginBtn")) document.getElementById("navLoginBtn").textContent = t.btn_login;
    if (document.getElementById("navSignupBtn")) document.getElementById("navSignupBtn").textContent = t.btn_signup;

    // Landing Page
    const titleEl = document.getElementById("heroTitle");
    const subtitleEl = document.getElementById("heroSubtitle");
    const activeDot = document.querySelector(".indicator-dot.active");
    if (activeDot && titleEl && subtitleEl) {
        const index = parseInt(activeDot.dataset.index || "0", 10);
        titleEl.textContent = t[`slide${index}_title`] || t.hero_title;
        subtitleEl.textContent = t[`slide${index}_subtitle`] || t.hero_subtitle;
    } else {
        if (titleEl) titleEl.textContent = t.hero_title;
        if (subtitleEl) subtitleEl.textContent = t.hero_subtitle;
    }

    if (document.getElementById("heroExploreBtn")) document.getElementById("heroExploreBtn").textContent = t.btn_explore;
    const scrollDownLbl = document.querySelector(".scroll-down-lbl");
    if (scrollDownLbl) {
        scrollDownLbl.innerHTML = `${t.scroll_down} <div class="scroll-line"></div>`;
    }
    const overlayCols = document.querySelectorAll(".hero-bottom-overlay .overlay-col");
    if (overlayCols.length === 2) {
        overlayCols[0].querySelector("h4").textContent = t.feel_freedom_title;
        overlayCols[0].querySelector("p").textContent = t.feel_freedom_desc;
        overlayCols[1].querySelector("h4").textContent = t.capture_moment_title;
        overlayCols[1].querySelector("p").textContent = t.capture_moment_desc;
    }

    // Dashboard Overview
    const dashTitleSec = document.querySelector(".dashboard-header");
    if (dashTitleSec) {
        const h2 = dashTitleSec.querySelector("h2");
        if (h2) h2.textContent = t.dash_title;
        const p = dashTitleSec.querySelector("p");
        if (p) p.textContent = t.dash_subtitle;
    }
    if (document.getElementById("newTripBtn")) {
        document.getElementById("newTripBtn").innerHTML = `<i class="fa-plus fa-solid"></i> ${t.btn_new_trip}`;
    }
    
    // Stats
    const statBoxes = document.querySelectorAll(".stat-box");
    statBoxes.forEach(box => {
        const lbl = box.querySelector(".stat-label");
        if (lbl) {
            if (lbl.textContent.toLowerCase().includes("total trips") || lbl.id === "statTotalTripsLabel") {
                lbl.id = "statTotalTripsLabel";
                lbl.textContent = t.stat_total_trips;
            } else if (lbl.textContent.toLowerCase().includes("total spent") || lbl.id === "statSpentBudgetLabel") {
                lbl.id = "statSpentBudgetLabel";
                lbl.textContent = t.stat_spent_budget;
            }
        }
    });

    // Empty State
    const emptyState = document.getElementById("emptyState");
    if (emptyState) {
        const h4 = emptyState.querySelector("h4");
        if (h4) h4.textContent = t.empty_state_title;
        const p = emptyState.querySelector("p");
        if (p) p.textContent = t.empty_state_desc;
        const btn = emptyState.querySelector(".btn");
        if (btn) btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${t.empty_state_btn}`;
    }

    // Wizard
    const wizHeader = document.querySelector(".wizard-header");
    if (wizHeader) {
        const h2 = wizHeader.querySelector("h2");
        if (h2) h2.textContent = t.wiz_title;
        const p = wizHeader.querySelector("p");
        if (p) p.textContent = t.wiz_subtitle;
    }
    
    // Wizard step labels
    const stepLabels = document.querySelectorAll(".wizard-step-label");
    if (stepLabels.length === 3) {
        stepLabels[0].textContent = t.wiz_step_1;
        stepLabels[1].textContent = t.wiz_step_2;
        stepLabels[2].textContent = t.wiz_step_3;
    }

    // Form labels and placeholders
    const formGroups = document.querySelectorAll("#tripForm .form-group");
    formGroups.forEach(group => {
        const label = group.querySelector("label");
        if (label) {
            const forAttr = label.getAttribute("for");
            if (forAttr === "tripSource") {
                label.textContent = t.label_source;
                setVal("#tripSource", "placeholder", t.placeholder_source);
            } else if (forAttr === "tripDestination") {
                label.textContent = t.label_destination;
                setVal("#tripDestination", "placeholder", t.placeholder_destination);
            } else if (forAttr === "tripDate") {
                label.textContent = t.label_date;
            } else if (forAttr === "tripDays") {
                label.textContent = t.label_days;
            } else if (forAttr === "tripBudget") {
                label.textContent = t.label_budget;
            } else if (forAttr === "tripRequirements") {
                label.textContent = t.label_requirements;
                setVal("#tripRequirements", "placeholder", t.placeholder_requirements);
            }
        }
    });

    if (document.getElementById("prevStepBtn")) {
        document.getElementById("prevStepBtn").innerHTML = `<i class="fa-solid fa-arrow-left"></i> ${t.btn_prev}`;
    }
    if (document.getElementById("nextStepBtn")) {
        document.getElementById("nextStepBtn").innerHTML = `${t.btn_next} <i class="fa-solid fa-arrow-right"></i>`;
    }
    if (document.getElementById("submitTripBtn")) {
        document.getElementById("submitTripBtn").innerHTML = `<i class="fa-solid fa-rocket"></i> ${t.btn_submit}`;
    }

    // Details View Tabs
    const detailsTabs = document.querySelectorAll(".details-tab");
    detailsTabs.forEach(tab => {
        const contentId = tab.getAttribute("data-content");
        if (contentId === "placesTab") {
            tab.innerHTML = `<i class="fa-solid fa-map-location-dot"></i> ${t.tab_places || 'Places to Visit'}`;
        } else if (contentId === "itineraryTab") {
            tab.innerHTML = `<i class="fa-solid fa-calendar-day"></i> ${t.tab_itinerary}`;
        } else if (contentId === "staysTransportTab") {
            tab.innerHTML = `<i class="fa-solid fa-hotel"></i> ${t.tab_stays_transport}`;
        } else if (contentId === "weatherTab") {
            tab.innerHTML = `<i class="fa-solid fa-cloud-sun"></i> ${t.tab_weather}`;
        } else if (contentId === "budgetTab") {
            tab.innerHTML = `<i class="fa-solid fa-chart-pie"></i> ${t.tab_budget}`;
        }
    });

    // Places Tab Heading
    const placesTab = document.getElementById("placesTab");
    if (placesTab) {
        const h3 = placesTab.querySelector(".content-card h3");
        if (h3) h3.innerHTML = `<i class="fa-solid fa-map-location-dot"></i> ${t.title_places || 'Recommended Sights & Attractions'}`;
        const desc = placesTab.querySelector(".content-card .section-desc");
        if (desc) desc.textContent = t.desc_places || 'Handpicked sight attractions matching your travel style, linked directly to navigation maps.';
    }

    // Dashboard Recent Trips Title
    const recentTripsTitle = document.getElementById("recentTripsTitle");
    if (recentTripsTitle) {
        recentTripsTitle.textContent = t.recent_trips || 'Recent Trips';
    }

    // Details Headings
    const staysTransportTab = document.getElementById("staysTransportTab");
    if (staysTransportTab) {
        const cardHeaders = staysTransportTab.querySelectorAll(".content-card h3");
        if (cardHeaders.length >= 1) {
            cardHeaders[0].innerHTML = `<i class="fa-solid fa-hotel"></i> ${t.title_stays}`;
        }
        if (cardHeaders.length >= 2) {
            cardHeaders[1].innerHTML = `<i class="fa-solid fa-thumbs-up"></i> ${t.title_transit}`;
        }
        if (cardHeaders.length >= 3) {
            cardHeaders[2].innerHTML = `<i class="fa-solid fa-plane-departure"></i> ${t.title_alt_flights}`;
        }
        const cardDescs = staysTransportTab.querySelectorAll(".content-card .section-desc");
        if (cardDescs.length >= 1) {
            cardDescs[0].textContent = t.desc_stays;
        }
    }

    const weatherTab = document.getElementById("weatherTab");
    if (weatherTab) {
        const h3 = weatherTab.querySelector(".content-card h3");
        if (h3) h3.innerHTML = `<i class="fa-solid fa-cloud-sun"></i> ${t.title_weather}`;
        const desc = weatherTab.querySelector(".content-card .section-desc");
        if (desc) desc.textContent = t.desc_weather;
        const suggestionsH4 = weatherTab.querySelector(".weather-suggestions h4");
        if (suggestionsH4) suggestionsH4.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${t.title_weather_suggestions}`;
    }

    const budgetTab = document.getElementById("budgetTab");
    if (budgetTab) {
        const h3 = budgetTab.querySelector(".content-card h3");
        if (h3) h3.innerHTML = `<i class="fa-solid fa-receipt"></i> ${t.title_budget}`;
        
        // Budget labels
        const statLabels = budgetTab.querySelectorAll(".budget-stat-box .stat-label");
        statLabels.forEach(lbl => {
            if (lbl.textContent.toLowerCase().includes("limit") || lbl.id === "lblLimit") {
                lbl.id = "lblLimit";
                lbl.textContent = t.label_total_limit;
            } else if (lbl.textContent.toLowerCase().includes("spent") || lbl.id === "lblSpent") {
                lbl.id = "lblSpent";
                lbl.textContent = t.label_spent;
            } else if (lbl.textContent.toLowerCase().includes("remaining") || lbl.id === "lblRemaining") {
                lbl.id = "lblRemaining";
                lbl.textContent = t.label_remaining;
            }
        });

        // AI Recs Header
        const recsCard = budgetTab.querySelector(".split-layout > div:nth-child(2) h3");
        if (recsCard) {
            recsCard.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${t.title_ai_recs}`;
        }
    }

    const setHtml = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = text;
    };
    
    const setTxt = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    // Adventures Section on index.html
    if (t.choose_journey_subtitle) setTxt("chooseJourneySubtitle", t.choose_journey_subtitle);
    if (t.adventure_awaits_title) setTxt("adventureAwaitsTitle", t.adventure_awaits_title);
    if (t.adventure_desc) setTxt("adventureDesc", t.adventure_desc);

    // Cards
    if (t.tag_trek) setTxt("tagTrek", t.tag_trek);
    if (t.title_trek) setTxt("titleTrek", t.title_trek);
    if (t.desc_trek) setTxt("descTrek", t.desc_trek);
    if (t.btn_explore_locations) setTxt("btnTrek", t.btn_explore_locations);

    if (t.tag_balloon) setTxt("tagBalloon", t.tag_balloon);
    if (t.title_balloon) setTxt("titleBalloon", t.title_balloon);
    if (t.desc_balloon) setTxt("descBalloon", t.desc_balloon);
    if (t.btn_explore_locations) setTxt("btnBalloon", t.btn_explore_locations);

    if (t.tag_canopy) setTxt("tagCanopy", t.tag_canopy);
    if (t.title_canopy) setTxt("titleCanopy", t.title_canopy);
    if (t.desc_canopy) setTxt("descCanopy", t.desc_canopy);
    if (t.btn_explore_locations) setTxt("btnCanopy", t.btn_explore_locations);

    if (t.tag_safari) setTxt("tagSafari", t.tag_safari);
    if (t.title_safari) setTxt("titleSafari", t.title_safari);
    if (t.desc_safari) setTxt("descSafari", t.desc_safari);
    if (t.btn_explore_locations) setTxt("btnSafari", t.btn_explore_locations);

    // Adventure Locations Modal
    if (t.adv_modal_title) setTxt("adventureModalTitle", t.adv_modal_title);
    const modalIntro = document.querySelector(".adventure-modal-intro");
    if (modalIntro && t.adv_modal_intro) modalIntro.textContent = t.adv_modal_intro;

    // About Page cover & intro
    if (t.about_subtitle) setTxt("aboutSubtitle", t.about_subtitle);
    if (t.about_title) setTxt("aboutTitle", t.about_title);
    if (t.about_desc) setTxt("aboutDesc", t.about_desc);
    if (t.swarm_arch_title) setTxt("swarmArchTitle", t.swarm_arch_title);
    if (t.swarm_arch_desc) setTxt("swarmArchDesc", t.swarm_arch_desc);

    // SVG node labels
    if (t.node_coordinator) setTxt("nodeCoordinator", t.node_coordinator);
    if (t.node_weather) setTxt("nodeWeather", t.node_weather);
    if (t.node_hotel) setTxt("nodeHotel", t.node_hotel);
    if (t.node_transit) setTxt("nodeTransit", t.node_transit);
    if (t.node_budget) setTxt("nodeBudget", t.node_budget);

    // About Detailed worker cards
    if (t.card_title_coordinator) setTxt("cardTitleCoordinator", t.card_title_coordinator);
    if (t.role_orchestrator) setTxt("roleOrchestrator", t.role_orchestrator);
    if (t.card_desc_coordinator) setTxt("cardDescCoordinator", t.card_desc_coordinator);

    if (t.card_title_weather) setTxt("cardTitleWeather", t.card_title_weather);
    if (t.role_forecaster) setTxt("roleForecaster", t.role_forecaster);
    if (t.card_desc_weather) setTxt("cardDescWeather", t.card_desc_weather);

    if (t.card_title_hotel) setTxt("cardTitleHotel", t.card_title_hotel);
    if (t.role_curator) setTxt("roleCurator", t.role_curator);
    if (t.card_desc_hotel) setTxt("cardDescHotel", t.card_desc_hotel);

    if (t.card_title_transit) setTxt("cardTitleTransit", t.card_title_transit);
    if (t.role_routing) setTxt("roleRouting", t.role_routing);
    if (t.card_desc_transit) setTxt("cardDescTransit", t.card_desc_transit);

    if (t.card_title_budget) setTxt("cardTitleBudget", t.card_title_budget);
    if (t.role_auditor) setTxt("roleAuditor", t.role_auditor);
    if (t.card_desc_budget) setTxt("cardDescBudget", t.card_desc_budget);

    // Trips Page
    if (t.popular_adventures_subtitle) setTxt("popularAdventuresSubtitle", t.popular_adventures_subtitle);
    if (t.popular_adventures_title) setTxt("popularAdventuresTitle", t.popular_adventures_title);
    if (t.popular_adventures_desc) setTxt("popularAdventuresDesc", t.popular_adventures_desc);
    
    // Search input placeholder
    const searchFilter = document.getElementById("tripSearchFilter");
    if (searchFilter && t.search_placeholder) {
        searchFilter.setAttribute("placeholder", t.search_placeholder);
    }

    // Filter Chips
    if (t.filter_all) setTxt("filterAll", t.filter_all);
    if (t.filter_beaches) setTxt("filterBeaches", t.filter_beaches);
    if (t.filter_culture) setTxt("filterCulture", t.filter_culture);
    if (t.filter_adventure) setTxt("filterAdventure", t.filter_adventure);

    // Trip spots showcased in trips.html
    if (t.spot_goa_badge) setTxt("spotGoaBadge", t.spot_goa_badge);
    if (t.spot_goa_desc) setTxt("spotGoaDesc", t.spot_goa_desc);

    if (t.spot_tokyo_badge) setTxt("spotTokyoBadge", t.spot_tokyo_badge);
    if (t.spot_tokyo_desc) setTxt("spotTokyoDesc", t.spot_tokyo_desc);

    if (t.spot_paris_badge) setTxt("spotParisBadge", t.spot_paris_badge);
    if (t.spot_paris_desc) setTxt("spotParisDesc", t.spot_paris_desc);

    if (t.spot_maldives_badge) setTxt("spotMaldivesBadge", t.spot_maldives_badge);
    if (t.spot_maldives_desc) setTxt("spotMaldivesDesc", t.spot_maldives_desc);

    if (t.spot_swiss_badge) setTxt("spotSwissBadge", t.spot_swiss_badge);
    if (t.spot_swiss_desc) setTxt("spotSwissDesc", t.spot_swiss_desc);

    if (t.spot_rome_badge) setTxt("spotRomeBadge", t.spot_rome_badge);
    if (t.spot_rome_desc) setTxt("spotRomeDesc", t.spot_rome_desc);

    if (t.spot_bali_badge) setTxt("spotBaliBadge", t.spot_bali_badge);
    if (t.spot_bali_desc) setTxt("spotBaliDesc", t.spot_bali_desc);

    if (t.spot_sydney_badge) setTxt("spotSydneyBadge", t.spot_sydney_badge);
    if (t.spot_sydney_desc) setTxt("spotSydneyDesc", t.spot_sydney_desc);

    // Map links and Plan buttons in grid
    document.querySelectorAll(".card-map-link").forEach(link => {
        link.innerHTML = `<i class="fa-solid fa-map-location-dot"></i> ${t.map_link || 'Map'}`;
    });
    
    document.querySelectorAll(".famous-plan-btn").forEach(btn => {
        btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${t.plan_this_trip || 'Plan This Trip'}`;
    });

    // How Swarm Planning Works (trips.html bottom)
    if (t.how_works_title) setTxt("howWorksTitle", t.how_works_title);
    if (t.how_works_desc) setTxt("howWorksDesc", t.how_works_desc);
    if (t.step1_title) setTxt("step1Title", t.step1_title);
    if (t.step1_desc) setTxt("step1Desc", t.step1_desc);
    if (t.step2_title) setTxt("step2Title", t.step2_title);
    if (t.step2_desc) setTxt("step2Desc", t.step2_desc);
    if (t.step3_title) setTxt("step3Title", t.step3_title);
    if (t.step3_desc) setTxt("step3Desc", t.step3_desc);

    // Format all price-val elements in trips grid
    const priceFormatter = (price, days) => {
        const num = Number(price).toLocaleString('en-IN');
        if (lang === 'hi') return `₹${num} / ${days} दिन से`;
        if (lang === 'te') return `₹${num} నుండి / ${days} రోజులు`;
        if (lang === 'es') return `Desde ₹${num} / ${days} Días`;
        if (lang === 'fr') return `À partir de ₹${num} / ${days} Jours`;
        if (lang === 'de') return `Ab ₹${num} / ${days} Tage`;
        if (lang === 'ta') return `₹${num} முதல் / ${days} நாட்கள்`;
        if (lang === 'kn') return `₹${num} ಇಂದ / ${days} ದಿನಗಳು`;
        return `From ₹${num} / ${days} Days`;
    };
    
    document.querySelectorAll(".price-val").forEach(el => {
        const price = el.getAttribute("data-price");
        const days = el.getAttribute("data-days");
        if (price && days) {
            el.textContent = priceFormatter(price, days);
        }
    });

    // Footers
    const footerTextEl = document.getElementById("footerText");
    if (footerTextEl && t.footer_text) {
        footerTextEl.innerHTML = t.footer_text;
    }
}

function initTranslatorWidget() {
    // 1. Inject HTML widget into body
    const widgetHtml = `
        <button class="translator-widget-btn" id="translatorWidgetBtn" title="Translator Agent">
            <i class="fa-solid fa-microphone"></i>
        </button>
        <div class="translator-widget-drawer" id="translatorWidgetDrawer">
            <div class="translator-drawer-header">
                <h3><i class="fa-solid fa-wand-magic-sparkles"></i> Translator Agent</h3>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="translator-status"><i class="fa-solid fa-circle" style="font-size: 0.5rem; color: #10b981;"></i> Online</span>
                    <button class="translator-close-btn" id="translatorCloseBtn"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
            <div class="translator-drawer-body">
                <div class="translator-input-area">
                    <textarea class="translator-textarea" id="translatorInputText" placeholder="Type message or tap Mic to speak..."></textarea>
                    <button class="translator-mic-btn" id="translatorMicBtn" title="Speak to Translate"><i class="fa-solid fa-microphone"></i></button>
                </div>
                <div class="translator-controls">
                    <select class="translator-select" id="translatorTargetLang">
                        <option value="English">English</option>
                        <option value="Hindi">Hindi (हिन्दी)</option>
                        <option value="Telugu">Telugu (తెలుగు)</option>
                        <option value="Spanish">Spanish (Español)</option>
                        <option value="French">French (Français)</option>
                        <option value="German">German (Deutsch)</option>
                        <option value="Tamil">Tamil (தமிழ்)</option>
                        <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                    </select>
                    <button class="translator-action-btn" id="translatorSubmitBtn">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Translate
                    </button>
                </div>
                <div class="translator-output-area">
                    <div class="translator-output-text" id="translatorOutputText">Translation will appear here...</div>
                    <button class="translator-speak-btn" id="translatorSpeakBtn" title="Read Aloud"><i class="fa-solid fa-volume-high"></i></button>
                </div>
            </div>
        </div>
    `;
    
    const wrapper = document.createElement("div");
    wrapper.innerHTML = widgetHtml;
    document.body.appendChild(wrapper);
    
    // 2. DOM elements
    const widgetBtn = document.getElementById("translatorWidgetBtn");
    const drawer = document.getElementById("translatorWidgetDrawer");
    const closeBtn = document.getElementById("translatorCloseBtn");
    const micBtn = document.getElementById("translatorMicBtn");
    const inputText = document.getElementById("translatorInputText");
    const outputText = document.getElementById("translatorOutputText");
    const targetLangSelect = document.getElementById("translatorTargetLang");
    const submitBtn = document.getElementById("translatorSubmitBtn");
    const speakBtn = document.getElementById("translatorSpeakBtn");
    
    // 3. Toggle Drawer
    widgetBtn.addEventListener("click", () => {
        drawer.classList.toggle("open");
    });
    
    closeBtn.addEventListener("click", () => {
        drawer.classList.remove("open");
    });
    
    // 4. Speech to Text (Voice Input)
    let recognition = null;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
            micBtn.classList.add("recording");
            inputText.placeholder = "Listening...";
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            inputText.value = transcript;
        };
        
        recognition.onerror = (e) => {
            console.error("Speech recognition error", e);
            micBtn.classList.remove("recording");
        };
        
        recognition.onend = () => {
            micBtn.classList.remove("recording");
            inputText.placeholder = "Type message or tap Mic to speak...";
        };
    } else {
        micBtn.style.display = "none";
    }
    
    micBtn.addEventListener("click", () => {
        if (!recognition) return;
        if (micBtn.classList.contains("recording")) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });
    
    // 5. Translate API Trigger
    submitBtn.addEventListener("click", async () => {
        const text = inputText.value.trim();
        const targetLang = targetLangSelect.value;
        if (!text) {
            outputText.textContent = "Please enter some text or voice input first!";
            return;
        }
        
        outputText.textContent = "Translating...";
        speakBtn.style.display = "none";
        
        try {
            const response = await fetch(`${API_BASE}/translator/translate`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${state.token}`
                },
                body: JSON.stringify({
                    text: text,
                    target_lang: targetLang
                })
            });
            
            if (!response.ok) throw new Error("Translation failed");
            
            const data = await response.json();
            outputText.textContent = data.translated_text;
            speakBtn.style.display = "block";
        } catch (err) {
            console.error(err);
            outputText.textContent = "Translation failed. Check backend connectivity.";
        }
    });
    
    // 6. Text to Speech (Audio Output)
    speakBtn.addEventListener("click", () => {
        const text = outputText.textContent;
        if (!text || text.startsWith("Translation will appear")) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        const targetLang = targetLangSelect.value.toLowerCase();
        let langCode = 'en-US';
        if (targetLang.includes('hindi')) langCode = 'hi-IN';
        else if (targetLang.includes('telugu')) langCode = 'te-IN';
        else if (targetLang.includes('spanish')) langCode = 'es-ES';
        else if (targetLang.includes('french')) langCode = 'fr-FR';
        else if (targetLang.includes('german')) langCode = 'de-DE';
        else if (targetLang.includes('tamil')) langCode = 'ta-IN';
        else if (targetLang.includes('kannada')) langCode = 'kn-IN';
        
        utterance.lang = langCode;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    });
}
