// ==========================
// Debug Utilities
// ==========================
const DEBUG = true;
const DEBUG_DATE_KEY = 'debugDate';

function getDebugDate() {
    const storedDate = localStorage.getItem(DEBUG_DATE_KEY);
    return storedDate ? new Date(storedDate) : new Date();
}

function setDebugDate(date) {
    localStorage.setItem(DEBUG_DATE_KEY, date.toISOString());
}

window.moveDateForward = function(days = 1) {
    const debugDate = getDebugDate();
    debugDate.setDate(debugDate.getDate() + days);
    setDebugDate(debugDate);
    loadContentForDate(getTodayString()); // Reload the content for the new date
};

window.moveDateBackward = function(days = 1) {
    const debugDate = getDebugDate();
    debugDate.setDate(debugDate.getDate() - days);
    setDebugDate(debugDate);
    loadContentForDate(getTodayString()); // Reload the content for the new date
};

function getTodayString() {
    if (DEBUG) {
        return formatDate(getDebugDate());
    }
    return formatDate(new Date());
}

function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

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
    let currentDate = new Date(getTodayString());

    while (responseDates.includes(formatDate(currentDate))) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1); // move one day back
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

// Function to check and apply focusMode if necessary
function checkFocusMode() {
    if (userResponse.value.trim() !== "") {
        document.body.classList.add('focusMode');
    } else {
        document.body.classList.remove('focusMode');
    }
}

// ==========================
// Main Content Loading Logic
// ==========================
function loadContentForDate(date) {
    const cachedQuote = getCachedQuoteForDate(date);

    if (cachedQuote) {
        displayQuoteContent(cachedQuote);
    } else {
        fetch(`https://boris-quoteResponder.web.val.run?date=${date}`)
            .then(response => response.json())
            .then(data => {
                cacheQuoteForDate(data, date);
                displayQuoteContent(data);
            })
            .catch(error => {
                console.error("Error fetching data:", error);
            });
    }
    
    // Load user's reply for the given date
    const userResponse = document.getElementById('userResponse');
    const wordCountEl = document.getElementById('wordCount');
    const storedReply = getStoredReplyForDate(date);
    if (storedReply) {
        userResponse.value = storedReply;
        const wordCount = storedReply.split(/\s+/).filter(Boolean).length;
        wordCountEl.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
    }

    checkFocusMode();

    // Display the reminder to the user
    const count = getSkippedCountForDate(date);
    const skipReminder = document.getElementById('skipReminder');
    if (count > 0 && !storedReply && skipReminder) {
        skipReminder.textContent = `You have skipped responding to the quote ${count} times today.`;
    } else if (skipReminder) {
        skipReminder.textContent = '';
    }

    const streak = getCurrentStreak();
    const streakElement = document.getElementById('streakCounter');
    if (streak > 0 && streakElement) {
        streakElement.textContent = `Current streak: ${streak} day${streak !== 1 ? 's' : ''}`;
    }
}

function displayQuoteContent(data) {
    const quoteContainer = document.getElementById("quoteContainer");
    if (quoteContainer) {
        quoteContainer.innerHTML = `
            <p class="quote-text">"${data.quote}"</p>
            <p class="quote-author">– ${data.author}</p>
        `;
    } else {
        console.error("Element with id 'quoteContainer' not found!");
    }
}


// ==========================
// Event Listeners and Main Flow
// ==========================
document.addEventListener("DOMContentLoaded", function() {
    loadContentForDate(getTodayString()); // Load content for the current date on initial load

    const userResponse = document.getElementById('userResponse');
    userResponse.addEventListener('input', function() {
        const wordCount = this.value.split(/\s+/).filter(Boolean).length;
        document.getElementById('wordCount').textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
        storeUserReplyForDate(this.value, getTodayString());

        // Hide the skip reminder when the user starts typing
        const skipReminder = document.getElementById('skipReminder');
        if (skipReminder) {
            skipReminder.style.display = 'none';
        }
    });

    // When page is hidden (tab is closed or navigated away)
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden' && userResponse.value.trim() === "") {
            incrementSkippedCountForDate(getTodayString());
        }
    });

    // Check on user input
    userResponse.addEventListener('input', checkFocusMode);

});
