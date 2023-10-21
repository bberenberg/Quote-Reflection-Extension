// ==========================
// User Response Utilities
// ==========================
function getReplyKeyForDate(date) {
    return `userReply_${date}`;
}

function storeUserReplyForDate(reply, date) {
    localStorage.setItem(getReplyKeyForDate(date), reply);
}

function getStoredReplyForDate(date) {
    return localStorage.getItem(getReplyKeyForDate(date));
}

function getSkippedCountKeyForDate(date) {
    return `skippedCount_${date}`;
}

function getSkippedCountForDate(date) {
    return parseInt(localStorage.getItem(getSkippedCountKeyForDate(date)) || '0', 10);
}

function incrementSkippedCountForDate(date) {
    const count = getSkippedCountForDate(date);
    localStorage.setItem(getSkippedCountKeyForDate(date), (count + 1).toString());
}

function getCurrentStreak() {
    const responseDates = Object.keys(localStorage).filter(key => key.startsWith('userReply_')).map(key => key.split('userReply_')[1]);
    let streak = 0;
    let currentDate = new Date();

    while (responseDates.includes(formatDate(currentDate))) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
}

function getQuoteCacheKeyForDate(date) {
    return `quoteCache_${date}`;
}

function cacheQuoteForDate(quoteData, date) {
    localStorage.setItem(getQuoteCacheKeyForDate(date), JSON.stringify(quoteData));
}

function getCachedQuoteForDate(date) {
    const cachedData = localStorage.getItem(getQuoteCacheKeyForDate(date));
    return cachedData ? JSON.parse(cachedData) : null;
}

function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function getDateWithOffset(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return formatDate(date);
}

function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ==========================
// UI Update Functions
// ==========================
function updateWordCount() {
    const userResponse = document.getElementById('userResponse');
    const wordCountEl = document.getElementById('wordCount');
    const wordCount = userResponse.value.split(/\s+/).filter(Boolean).length;
    wordCountEl.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
}

function checkFocusMode() {
    if (document.getElementById('userResponse').value.trim() !== "") {
        document.body.classList.add('focusMode');
    } else {
        document.body.classList.remove('focusMode');
    }
}

function updateDateLabel(date) {
    const currentDateLabel = document.getElementById('currentDate');
    currentDateLabel.textContent = date;
}

function updateSkipReminder(date) {
    const storedReply = getStoredReplyForDate(date);
    const count = getSkippedCountForDate(date);
    const skipReminder = document.getElementById('skipReminder');
    if (count > 0 && !storedReply && skipReminder) {
        skipReminder.textContent = `You have skipped responding to the quote ${count} times today.`;
    } else if (skipReminder) {
        skipReminder.textContent = '';
    }
}

function updateStreakCounter() {
    const streak = getCurrentStreak();
    const streakElement = document.getElementById('streakCounter');
    if (streak > 0 && streakElement) {
        streakElement.textContent = `Current streak: ${streak} day${streak !== 1 ? 's' : ''}`;
    }
}

function updateForwardArrowVisibility(date) {
    const forwardArrow = document.getElementById('forwardArrow');
    if (isToday(new Date(date))) {
        forwardArrow.setAttribute('hidden', true);
    } else {
        forwardArrow.removeAttribute('hidden');
    }
}

function updateUIWithQuoteData(data, date) {
    const quoteContainer = document.getElementById("quoteContainer");
    quoteContainer.innerHTML = `
        <p class="quote-text">"${data.quote}"</p>
        <p class="quote-author">– ${data.author}</p>
    `;

    const userResponse = document.getElementById('userResponse');
    const storedReply = getStoredReplyForDate(date);
    userResponse.value = storedReply || '';

    updateWordCount();
    checkFocusMode();
    updateDateLabel(date);
    updateSkipReminder(date);
    updateStreakCounter();
    updateForwardArrowVisibility(date);
}

function postLoadUIUpdates(date) {
    // Show or hide the forward arrow based on the current date
    if (isToday(new Date(date))) {
        forwardArrow.setAttribute('hidden', true);
    } else {
        forwardArrow.removeAttribute('hidden');
    }

    updateDateLabel(date);
}

let currentDisplayedDate = new Date();

function getDateWithOffset(offset) {
    const date = new Date(currentDisplayedDate);
    date.setDate(date.getDate() + offset);
    return formatDate(date);
}

function loadContentForDate(date) {
    const cachedQuote = getCachedQuoteForDate(date);

    if (cachedQuote) {
        updateUIWithQuoteData(cachedQuote, date);
    } else {
        fetch(`https://boris-quoteResponder.web.val.run?date=${date}`)
            .then(response => response.json())
            .then(data => {
                cacheQuoteForDate(data, date);
                updateUIWithQuoteData(data, date);
            })
            .catch(error => {
                console.error("Error fetching data:", error);
            });
    }
}

// ==========================
// Event Listeners and Main Flow
// ==========================
document.addEventListener("DOMContentLoaded", function() {

    const backArrow = document.getElementById('backArrow');
    const forwardArrow = document.getElementById('forwardArrow');

    // Initialize with the current date
    updateDateLabel(formatDate(currentDisplayedDate));
    forwardArrow.setAttribute('hidden', true);

    loadContentForDate(formatDate(currentDisplayedDate));

    const userResponse = document.getElementById('userResponse');
    userResponse.addEventListener('input', function() {
        updateWordCount();
        storeUserReplyForDate(this.value, formatDate(currentDisplayedDate));

        const skipReminder = document.getElementById('skipReminder');
        if (skipReminder) {
            skipReminder.style.display = 'none';
        }
        this.style.height = 'auto';              // Reset height to auto so it shrinks if needed
        this.style.height = this.scrollHeight + 'px';  // Set to scrollHeight
    });

    // Initial adjust if there's content when the page loads
    window.addEventListener('load', function() {
        userResponse.style.height = userResponse.scrollHeight + 'px';
    });

    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden' && userResponse.value.trim() === "") {
            incrementSkippedCountForDate(formatDate(currentDisplayedDate));
        }
    });

    userResponse.addEventListener('input', checkFocusMode);

    backArrow.addEventListener('click', () => {
        const previousDate = getDateWithOffset(-1);
        currentDisplayedDate = new Date(previousDate);
        loadContentForDate(previousDate);
    });

    forwardArrow.addEventListener('click', () => {
        const nextDate = getDateWithOffset(1);
        currentDisplayedDate = new Date(nextDate);
        loadContentForDate(nextDate);
    });
});

// Array of prompts
const prompts = [
    "What's on your mind today?",
    "Reflect on the quote above...",
    "Your thoughts matter. Share them here.",
    "Ponder and share your insights.",
    "How does this quote resonate with you?",
    "Take a moment to reflect...",
    "Your reflection space...",
    "Dive deeper into your thoughts...",
    "Share your perspective...",
    "What did you take away from this?"
];

// Function to get a random prompt
function getRandomPrompt() {
    const randomIndex = Math.floor(Math.random() * prompts.length);
    return prompts[randomIndex];
}

// Set the random prompt on page load or when the quote changes
document.getElementById("prompt").textContent = getRandomPrompt();