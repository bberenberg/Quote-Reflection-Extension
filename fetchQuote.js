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
    console.log(`DEBUG: Date moved forward. Current date: ${getTodayString()}`);
};

window.moveDateBackward = function(days = 1) {
    const debugDate = getDebugDate();
    debugDate.setDate(debugDate.getDate() - days);
    setDebugDate(debugDate);
    console.log(`DEBUG: Date moved backward. Current date: ${getTodayString()}`);
};

function getTodayString() {
    if (DEBUG) {
        return `${getDebugDate().getFullYear()}-${String(getDebugDate().getMonth() + 1).padStart(2, '0')}-${String(getDebugDate().getDate()).padStart(2, '0')}`;
    }
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// ==========================
// User Response Utilities
// ==========================
function getReplyKey() {
    return `userReply_${getTodayString()}`;
}

function storeUserReply(reply) {
    localStorage.setItem(getReplyKey(), reply);
}

function getStoredReply() {
    return localStorage.getItem(getReplyKey());
}

function getSkippedCountKey() {
    return `skippedCount_${getTodayString()}`;
}

function getSkippedCount() {
    return parseInt(localStorage.getItem(getSkippedCountKey()) || '0', 10);
}

function incrementSkippedCount() {
    const count = getSkippedCount();
    localStorage.setItem(getSkippedCountKey(), (count + 1).toString());
}

function getStoredDates() {
    return Object.keys(localStorage).filter(key => key.startsWith('userReply_')).map(key => key.split('userReply_')[1]);
}

function getCurrentStreak() {
    const responseDates = getStoredDates();
    let streak = 0;
    let currentDate = new Date(getTodayString());

    while (responseDates.includes(formatDate(currentDate))) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1); // move one day back
    }

    return streak;
}

function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}


// ==========================
// Event Listeners and Main Flow
// ==========================
document.addEventListener("DOMContentLoaded", function() {
    // Fetch and display the quote
    fetch("https://boris-quoteResponder.web.val.run")
        .then(response => response.json())
        .then(data => {
            const quoteContainer = document.getElementById("quoteContainer");
            if (quoteContainer) {
                quoteContainer.innerHTML = `
                    <p class="quote-text">"${data.quote}"</p>
                    <p class="quote-author">– ${data.author}</p>
                `;
            } else {
                console.error("Element with id 'quoteContainer' not found!");
            }
        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });

    const userResponse = document.getElementById('userResponse');
    const wordCountEl = document.getElementById('wordCount');
    const storedReply = getStoredReply();

    if (userResponse) {
        // Restore user's reply for today if it exists
        const storedReply = getStoredReply();
        if (storedReply) {
            userResponse.value = storedReply;
            const wordCount = storedReply.split(/\s+/).filter(Boolean).length;
            wordCountEl.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
        }

    userResponse.addEventListener('input', function() {
        const wordCount = this.value.split(/\s+/).filter(Boolean).length;
        wordCountEl.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
        storeUserReply(this.value);

        // Hide the skip reminder when the user starts typing
        const skipReminder = document.getElementById('skipReminder');
        if (skipReminder) {
            skipReminder.style.display = 'none';
        }
    });

        userResponse.focus();
    }

    // Display the reminder to the user
    const count = getSkippedCount();
    if (count > 0 && !storedReply) {  // Only show the reminder if there's a skip count and no stored reply
        const reminderElement = document.createElement('p');
        reminderElement.id = 'skipReminder';  // Assigning an ID for easy reference
        reminderElement.textContent = `You have skipped responding to the quote ${count} times today.`;
        reminderElement.style.color = "#ff0000";
        reminderElement.style.marginTop = "10px";

        const responseContainer = document.getElementById('responseContainer');
        if (responseContainer) {
            responseContainer.appendChild(reminderElement);
        }
    }

    const streak = getCurrentStreak();
    if (streak > 0) {
        const streakElement = document.createElement('p');
        streakElement.textContent = `Current streak: ${streak} day${streak !== 1 ? 's' : ''}`;
        streakElement.style.color = "#00aa00"; // Green color for positive reinforcement
        streakElement.style.marginTop = "10px";

        const responseContainer = document.getElementById('responseContainer');
        if (responseContainer) {
            responseContainer.appendChild(streakElement);
        }
    }

    // When page is hidden (tab is closed or navigated away)
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden' && userResponse.value.trim() === "") {
            incrementSkippedCount();
        }
    });
});
