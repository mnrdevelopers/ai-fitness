// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD71QYDbPEETn-24nT45h4AdD_W6_inyWU",
  authDomain: "fitness-healthylifestyle.firebaseapp.com",
  projectId: "fitness-healthylifestyle",
  storageBucket: "fitness-healthylifestyle.appspot.com",
  messagingSenderId: "762783082047",
  appId: "1:762783082047:web:04f79dfe0ee4b7ae6c7a8a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const messaging = firebase.messaging();

Notification.requestPermission().then((permission) => {
  if (permission === "granted") {
    messaging.getToken({
      vapidKey: "BFSLJsuJmdg3JZmS9ZoGtTL6YMfQZislIXyiQRESQ7307pmYvN3wjxJyG1NgQFGgcbYNlKjWNWvNW-lSsOQFI2c"
    }).then((currentToken) => {
      if (currentToken) {
        console.log("FCM Token:", currentToken);
        // TODO: Send token to your server and store it
      } else {
        console.warn("No registration token available. Request permission to generate one.");
      }
    }).catch((err) => {
      console.error("An error occurred while retrieving token.", err);
    });
  } else {
    console.warn("Notification permission denied.");
  }
});

// DOM Elements
const loader = document.querySelector('.loader');
const header = document.querySelector('.header');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const installBtn = document.getElementById('installBtn');
let deferredPrompt;

// Popup message function
function showPopup(message, type = 'info') {
    const popup = document.createElement('div');
    popup.className = `user-popup ${type}`;
    popup.innerHTML = `
        <i class="fas ${getIconForType(type)}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.classList.add('fade-out');
        setTimeout(() => popup.remove(), 300);
    }, 3000);
}

function getIconForType(type) {
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}

// Initialize auth listeners
function initAuthListeners() {
    const signInButton = document.getElementById('signInButton');
    const signOutButton = document.getElementById('signOutButton');
    
    // Sign in button
    signInButton?.addEventListener('click', (e) => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .catch(error => showPopup(`Sign in failed: ${error.message}`, 'error'));
    });
    
    // Sign out button
    signOutButton?.addEventListener('click', (e) => {
        auth.signOut()
            .then(() => showPopup('Signed out successfully', 'info'))
            .catch(error => showPopup(`Sign out failed: ${error.message}`, 'error'));
    });
}

// Auth state listener
function initAuthStateListener() {
    const signInButton = document.getElementById('signInButton');
    const signOutButton = document.getElementById('signOutButton');
    const userInfo = document.getElementById('userInfo');
    const userAvatar = document.querySelector('.user-avatar');

    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            showPopup(`Welcome back, ${user.displayName || 'Fitness Enthusiast'}!`, 'success');
            signInButton.style.display = 'none';
            userInfo.style.display = 'flex';
            userAvatar.src = user.photoURL;
        } else {
            // User is signed out
            signInButton.style.display = 'flex';
            userInfo.style.display = 'none';
        }
    });
}

// AI Chat functionality
let chatHistory = [];
let currentTab = 'workout';

function initAIChat() {
    const chatModal = document.getElementById('aiChatModal');
    const chatButton = document.getElementById('aiChatButton');
    const closeButton = document.getElementById('closeChat');
    const sendButton = document.getElementById('sendChatMessage');
    const chatInput = document.getElementById('aiChatInput');
    const chatMessages = document.getElementById('aiChatMessages');
    const quickQuestions = document.querySelectorAll('.quick-question');
    const tabs = document.querySelectorAll('.ai-tab');

   // Toggle chat modal - update this part
    chatButton.addEventListener('click', () => {
        const user = auth.currentUser;
        if (!user) {
            showPopup('Please sign in to access the AI Trainer', 'warning');
            return;
        }

            chatModal.classList.toggle('active');
        if (chatModal.classList.contains('active')) {
            // Personalized greeting
            const userName = user.displayName || 'Fitness Enthusiast';
            const welcomeMessage = `Welcome back, ${userName}! I'm FitBot, your AI fitness assistant. How can I help you today?`;
            
            // Clear previous messages
            chatMessages.innerHTML = '';
            
            // Add welcome message with animation
            setTimeout(() => {
                const welcomeElement = document.createElement('div');
                welcomeElement.className = 'ai-message ai-bot-message';
                welcomeElement.innerHTML = `
                    <div class="message-content">${welcomeMessage}</div>
                `;
                chatMessages.appendChild(welcomeElement);
                
                // Bounce animation
                welcomeElement.style.animation = 'bounceIn 0.6s ease';
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 300);
            
            chatInput.focus();
        }
    });

    // Close chat
    closeButton.addEventListener('click', () => {
        chatModal.classList.remove('active');
    });

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            
            // Update placeholder based on tab
            chatInput.placeholder = currentTab === 'workout' 
                ? 'Ask me anything about workouts...' 
                : 'Ask me anything about nutrition...';
        });
    });

    // Send message on button click
    sendButton.addEventListener('click', sendMessage);

    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Quick question buttons
    quickQuestions.forEach(button => {
        button.addEventListener('click', () => {
            const question = button.dataset.question;
            addUserMessage(question);
            processUserMessage(question);
        });
    });

    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            addUserMessage(message);
            processUserMessage(message);
            chatInput.value = '';
        }
    }

  function isCreatorQuestion(message) {
    const creatorKeywords = [
        'who created you', 'who made you', 'who developed you',
        'who invented you', 'who built you', 'who designed you',
        'your creator', 'your developer', 'your inventor'
    ];
    
    const lowerMessage = message.toLowerCase();
    return creatorKeywords.some(keyword => lowerMessage.includes(keyword));
}

    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'ai-message ai-user-message';
        messageElement.innerHTML = `
            <div class="message-content">${message}</div>
        `;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addBotMessage(message, isTyping = false) {
        const messageElement = document.createElement('div');
        messageElement.className = 'ai-message ai-bot-message';
        
        if (isTyping) {
            messageElement.innerHTML = `
                <div class="message-content">
                    <span>${message}</span>
                    <div class="ai-typing">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            `;
        } else {
            messageElement.innerHTML = `
                <div class="message-content">${message}</div>
            `;
        }
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageElement;
    }

   async function processUserMessage(message) {
    // Check if this is a "who created you" question
    if (isCreatorQuestion(message)) {
        const creatorResponse = `
            I was developed by <strong>MNR Developers</strong> (Maniteja), who created this fitness platform and AI trainer. 
            The fitness programs and training content are provided by <strong>Rajashekar</strong>, our professional fitness trainer.
            
            <div class="contact-info">
                <div><i class="fas fa-user-tie"></i> <strong>Technical Support:</strong> MNR Developers</div>
                <div><i class="fas fa-dumbbell"></i> <strong>Fitness Trainer:</strong> Rajashekar</div>
                <div><i class="fas fa-envelope"></i> itsrajashekar12@gmail.com</div>
                <div><i class="fab fa-whatsapp"></i> +91 81216 81711</div>
            </div>
        `;

        // Add the creator response using the standard bot message function
        addBotMessage(creatorResponse);
        chatHistory.push({ role: 'assistant', content: creatorResponse });
        return;
    }

    // Show typing indicator
    const botMessageElement = addBotMessage(currentTab === 'workout' 
        ? 'Creating your workout plan...' 
        : 'Creating your diet plan...', true);

    try {
        // Get response from Gemini AI
        const response = await generateAIResponse(message, currentTab);

        // Remove typing indicator and show actual response
        botMessageElement.innerHTML = `
            <div class="message-content">${formatAIResponse(response, currentTab)}</div>
        `;

        // Add to chat history
        chatHistory.push({ role: 'assistant', content: response });

    } catch (error) {
        console.error('AI Error:', error);
        botMessageElement.innerHTML = `
            <div class="message-content">
                Sorry, I'm having trouble connecting to the AI service. Please try again later.
            </div>
        `;
    }
}


    function formatAIResponse(response, type) {
        // Format workout plans
        if (type === 'workout' && (response.includes('Day') || response.includes('Exercise'))) {
            return formatWorkoutPlan(response);
        }
        
        // Format diet plans
        if (type === 'diet' && (response.includes('Meal') || response.includes('Breakfast'))) {
            return formatDietPlan(response);
        }
        
        // Default formatting
        return response.replace(/\n/g, '<br>');
    }

    function formatWorkoutPlan(planText) {
        // Basic formatting for workout plans
        const formattedPlan = planText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/Day (\d+):/g, '<div class="plan-day"><div class="plan-day-title">Day $1</div>')
            .replace(/- (.*?)(<br>|$)/g, '<li>$1</li>');
        
        return `
            <div class="plan-container workout-plan">
                ${formattedPlan}
            </div>
            <div class="plan-actions">
                <button class="btn btn-primary save-plan">
                    <i class="far fa-calendar-plus"></i> Save Workout
                </button>
                <button class="btn btn-outline share-plan">
                    <i class="fas fa-share-alt"></i> Share
                </button>
            </div>
        `;
    }

    function formatDietPlan(planText) {
        // Basic formatting for diet plans
        const formattedPlan = planText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/(Breakfast|Lunch|Dinner|Snack):/g, '<div class="meal-item"><div class="meal-time">$1</div><div class="meal-content">')
            .replace(/(Calories|Protein|Carbs|Fat): (\d+g?)/g, '<span class="nutrition-fact"><strong>$1:</strong> $2</span>');
        
        return `
            <div class="plan-container meal-plan">
                ${formattedPlan}
            </div>
            <div class="plan-actions">
                <button class="btn btn-primary save-plan">
                    <i class="far fa-calendar-plus"></i> Save Meal Plan
                </button>
                <button class="btn btn-outline share-plan">
                    <i class="fas fa-share-alt"></i> Share
                </button>
            </div>
        `;
    }

    // Handle save and share buttons dynamically
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('save-plan') || e.target.closest('.save-plan')) {
            const planText = e.target.closest('.message-content').textContent;
            addToCalendar({
                title: currentTab === 'workout' ? 'AI Workout Plan' : 'AI Diet Plan',
                description: planText.replace(/<[^>]*>/g, ''),
                start: new Date(),
                end: new Date(Date.now() + 3600000)
            });
            showPopup('Plan saved to your calendar!', 'success');
        }
        
        if (e.target.classList.contains('share-plan') || e.target.closest('.share-plan')) {
            const planText = e.target.closest('.message-content').textContent;
            sharePlan(planText.replace(/<[^>]*>/g, ''));
        }
    });

    function addToCalendar(event) {
        // This is a basic implementation - you might want to use a proper calendar API
        console.log('Adding to calendar:', event);
        // In a real app, you would integrate with Google Calendar or similar
    }

    function sharePlan(planText) {
        if (navigator.share) {
            navigator.share({
                title: 'My Fitness Plan',
                text: planText,
                url: window.location.href
            }).catch(err => {
                console.log('Error sharing:', err);
                showPopup('Sharing failed. Please try again.', 'error');
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            const textArea = document.createElement('textarea');
            textArea.value = planText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showPopup('Plan copied to clipboard!', 'success');
        }
    }
}

// AI response generation using Gemini
async function generateAIResponse(prompt, type) {
    try {
        const API_KEY = "AIzaSyCGYLk04ZAIWfM7xgxbIArK6n2aRvl7Gyk"; // Replace with your actual API key
        
        // Create different prompts based on the type (workout or diet)
        let systemPrompt;
        if (type === 'workout') {
            systemPrompt = `You are an expert fitness trainer. The user asked: "${prompt}". 
            Provide a detailed, professional workout plan with exercises, sets, reps, and rest periods.
            Structure it clearly with days if it's a multi-day plan.
            Include warm-up and cool-down recommendations when appropriate.
            Use simple language and be encouraging.`;
        } else {
            systemPrompt = `You are an expert nutritionist. The user asked: "${prompt}". 
            Provide a detailed, professional meal plan with breakfast, lunch, dinner, and snacks.
            Include portion sizes and nutritional information (calories, protein, carbs, fat).
            Consider dietary restrictions if mentioned.
            Use simple language and be encouraging.`;
        }
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: systemPrompt
                    }]
                }]
            })
        });
        
        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
        } else {
            console.error("Unexpected Gemini API response:", data);
            return "I couldn't generate a response right now. Please try asking again or rephrase your question.";
        }
    } catch (error) {
        console.error("AI Error:", error);
        return "I'm having trouble connecting to the AI service. Please try again later.";
    }
}

// Testimonials Slider
function initTestimonialsSlider() {
    const testimonials = document.querySelectorAll('.testimonial-card');
    const dotsContainer = document.querySelector('.testimonial-dots');
    let currentTestimonial = 0;

    if (!testimonials.length || !dotsContainer) return;

    // Create dots
    testimonials.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('testimonial-dot');
        if (index === currentTestimonial) dot.classList.add('active');
        dot.addEventListener('click', () => {
            currentTestimonial = index;
            showTestimonial(currentTestimonial);
        });
        dotsContainer.appendChild(dot);
    });

    function showTestimonial(index) {
        testimonials.forEach(testimonial => testimonial.classList.remove('active'));
        testimonials[index].classList.add('active');
        
        const dots = document.querySelectorAll('.testimonial-dot');
        dots.forEach(dot => dot.classList.remove('active'));
        dots[index].classList.add('active');
    }

    document.querySelector('.testimonial-next')?.addEventListener('click', () => {
        currentTestimonial = (currentTestimonial + 1) % testimonials.length;
        showTestimonial(currentTestimonial);
    });

    document.querySelector('.testimonial-prev')?.addEventListener('click', () => {
        currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
        showTestimonial(currentTestimonial);
    });

    setInterval(() => {
        currentTestimonial = (currentTestimonial + 1) % testimonials.length;
        showTestimonial(currentTestimonial);
    }, 5000);
}

// Enhanced handleContactForm function
function handleContactForm() {
    const form = document.getElementById('contactForm');
    const authMessage = document.getElementById('authRequiredMessage');
    const formFields = document.getElementById('formFields');
    
    if (!form) return;

    // Check auth state when loading form
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in - show form and populate fields
            authMessage.style.display = 'none';
            formFields.style.display = 'block';
            
            // Populate user data
            document.getElementById('name').value = user.displayName || '';
            document.getElementById('email').value = user.email || '';
            
            // You can also fetch additional user data if needed
            if (user.phoneNumber) {
                document.getElementById('phone').value = user.phoneNumber;
            }
        } else {
            // User is not signed in - show auth message
            authMessage.style.display = 'block';
            formFields.style.display = 'none';
        }
    });

    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const user = auth.currentUser;
        if (!user) {
            showPopup('Please sign in to submit the form.', 'warning');
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        
        try {
            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            // Create form data with user info
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value || 'Not provided',
                service: document.getElementById('service').value,
                message: document.getElementById('message').value,
                userId: user.uid, // Include user ID for reference
                userPhoto: user.photoURL || '' // Include profile photo if available
            };

            // Send to Formspree
            const response = await fetch('https://formspree.io/f/mzzenkyw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                showPopup('Thank you! Your message has been sent.', 'success');
                form.reset();
                // Keep user's name and email populated
                document.getElementById('name').value = user.displayName || '';
                document.getElementById('email').value = user.email || '';
            } else {
                const errorData = await response.json();
                showPopup(errorData.error || 'Oops! Something went wrong. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showPopup('Network error. Please try again later.', 'error');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });

    // Add sign-in button handler for the form-specific button
    document.getElementById('signInButtonForm')?.addEventListener('click', (e) => {
        e.preventDefault();
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .catch(error => showPopup(`Sign in failed: ${error.message}`, 'error'));
    });
}

// Initialize all components
function initApp() {
    // Loader
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader?.classList.add('loaded');
        }, 1000);
    });

    // Header scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header?.classList.add('scrolled');
        } else {
            header?.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    hamburger?.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu?.classList.toggle('active');
    });

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger?.classList.remove('active');
            navMenu?.classList.remove('active');
        });
    });

    // PWA Installation
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'flex';
    });

    installBtn?.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);
        deferredPrompt = null;
        installBtn.style.display = 'none';
    });

    window.addEventListener('appinstalled', () => {
        installBtn.style.display = 'none';
        deferredPrompt = null;
    });

    // Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .catch(err => console.log('ServiceWorker registration failed: ', err));
        });
    }

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Initialize components
    initAuthStateListener();
    initAuthListeners();
    initTestimonialsSlider();
    handleContactForm();
    initWhatsAppBooking();
    initAIChat();
    
    // Add floating labels functionality
    const formInputs = document.querySelectorAll('.form-control');
    formInputs.forEach(input => {
        if (input.placeholder === '') {
            input.placeholder = ' ';
        }
    });
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// WhatsApp Booking with Loading & Alerts
function initWhatsAppBooking() {
    const bookButtons = document.querySelectorAll('.book-btn');
    
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'booking-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h3 class="modal-title">Confirm Booking</h3>
            <p class="modal-message"></p>
            <div class="modal-actions">
                <button id="confirmBooking" class="btn btn-primary">
                    <span class="btn-text">Continue to WhatsApp</span>
                    <span class="btn-spinner" style="display: none;">
                        <i class="fas fa-spinner fa-spin"></i>
                    </span>
                </button>
                <button class="btn btn-outline cancel-booking">Cancel</button>
            </div>
            <div id="signinPrompt" class="signin-prompt" style="display: none;">
                <p>Please sign in to book this service</p>
                <button id="signInButtonModal" class="btn btn-primary">
                    <span class="btn-text"><i class="fab fa-google"></i> Sign In</span>
                    <span class="btn-spinner" style="display: none;">
                        <i class="fas fa-spinner fa-spin"></i>
                    </span>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Check for price drops and offers
    function checkForOffers() {
        // In a real app, you would fetch this from your backend
        const offers = {
            "Personal Training": {
                priceDrop: true,
                newPrice: "₹699/month",
                message: "Limited time offer! Now ₹699/month (was ₹999)"
            },
            "Diet Planning": {
                specialOffer: true,
                message: "Combo discount available! Save 15% when booked with training"
            }
        };
        
        document.querySelectorAll('.service-card').forEach(card => {
            const serviceTitle = card.querySelector('h3').textContent;
            const offer = offers[serviceTitle];
            const alertEl = card.querySelector('.service-alert');
            
            if (offer) {
                alertEl.style.display = 'flex';
                alertEl.querySelector('.alert-text').textContent = offer.message;
                
                if (offer.priceDrop) {
                    alertEl.classList.add('price-drop');
                    // Add price drop badge
                    const priceBadge = document.createElement('div');
                    priceBadge.className = 'price-drop-badge';
                    priceBadge.textContent = 'SALE';
                    card.appendChild(priceBadge);
                    
                    // Update displayed price
                    if (offer.newPrice) {
                        card.querySelector('.price').textContent = offer.newPrice.split('/')[0];
                    }
                }
            }
        });
    }
    
    // Handle book button clicks
    bookButtons.forEach(button => {
        button.addEventListener('click', function() {
            const user = auth.currentUser;
            const service = this.dataset.service;
            const price = this.dataset.price;
            const whatsappNumber = this.dataset.whatsapp;
            const card = this.closest('.service-card');
            
            // Show loading spinner on card
            const spinner = card.querySelector('.loading-spinner');
            spinner.style.display = 'flex';
            
            setTimeout(() => {
                spinner.style.display = 'none';
                
                if (!user) {
                    // Show sign-in prompt
                    document.getElementById('signinPrompt').style.display = 'block';
                    document.querySelector('.modal-actions').style.display = 'none';
                    document.querySelector('.modal-message').textContent = 'You need to be signed in to book services.';
                    modal.classList.add('active');
                    return;
                }
                
                // User is signed in - prepare WhatsApp message
                const message = `Hi, I'd like to book your ${service} (${price}).\n\nMy details:\nName: ${user.displayName}\nEmail: ${user.email}`;
                const encodedMessage = encodeURIComponent(message);
                const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
                
                // Show confirmation modal
                document.getElementById('signinPrompt').style.display = 'none';
                document.querySelector('.modal-actions').style.display = 'flex';
                document.querySelector('.modal-message').textContent = `You're about to contact our trainer on WhatsApp to book ${service}.`;
                
                // Store WhatsApp URL in modal for confirmation
                modal.dataset.whatsappUrl = whatsappUrl;
                modal.classList.add('active');
            }, 800); // Simulate network delay
        });
    });
    
    // Modal close handlers
    document.querySelector('.modal-close')?.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    document.querySelector('.cancel-booking')?.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Confirm booking handler
    document.getElementById('confirmBooking')?.addEventListener('click', function() {
        const btnText = this.querySelector('.btn-text');
        const spinner = this.querySelector('.btn-spinner');
        
        // Show loading state
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        
        // Simulate processing delay
        setTimeout(() => {
            window.open(modal.dataset.whatsappUrl, '_blank');
            modal.classList.remove('active');
            
            // Reset button
            btnText.style.display = 'inline-block';
            spinner.style.display = 'none';
            
            // Show success notification
            showPopup('WhatsApp opened successfully! Please complete your booking with the trainer.', 'success');
        }, 1000);
    });
    
    // Sign in from modal handler
    document.getElementById('signInButtonModal')?.addEventListener('click', function(e) {
        e.preventDefault();
        const btnText = this.querySelector('.btn-text');
        const spinner = this.querySelector('.btn-spinner');
        
        // Show loading state
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then(() => {
                modal.classList.remove('active');
                showPopup('Signed in successfully! You can now book services.', 'success');
            })
            .catch(error => {
                showPopup(`Sign in failed: ${error.message}`, 'error');
            })
            .finally(() => {
                // Reset button
                btnText.style.display = 'inline-block';
                spinner.style.display = 'none';
            });
    });
    
    // Check for offers when page loads
    checkForOffers();
    
    // Simulate periodic offer checks (in real app, use WebSockets or polling)
    setInterval(() => {
        // Rotate offers for demo purposes
        const alerts = document.querySelectorAll('.service-alert');
        alerts.forEach(alert => {
            alert.style.display = alert.style.display === 'none' ? 'flex' : 'none';
        });
    }, 15000); // Check every 15 seconds
}
