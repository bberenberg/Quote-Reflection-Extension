document.addEventListener("DOMContentLoaded", function() {
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

    // Debug flag
    const DEBUG = true;

    // Key for storing debug date in localStorage
    const DEBUG_DATE_KEY = 'debugDate';

    function getDebugDate() {
        const storedDate = localStorage.getItem(DEBUG_DATE_KEY);
        if (storedDate) {
            return new Date(storedDate);
        }
        return new Date();
    }

    function setDebugDate(date) {
        localStorage.setItem(DEBUG_DATE_KEY, date.toISOString());
    }

    function getTodayString() {
        if (DEBUG) {
            const debugDate = getDebugDate();
            return `${debugDate.getFullYear()}-${String(debugDate.getMonth() + 1).padStart(2, '0')}-${String(debugDate.getDate()).padStart(2, '0')}`;
        } else {
            const today = new Date();
            return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        }
    }

    // Debug functions to move the date
    function moveDateForward(days = 1) {
        const debugDate = getDebugDate();
        debugDate.setDate(debugDate.getDate() + days);
        setDebugDate(debugDate);
        console.log(`DEBUG: Date moved forward. Current date: ${getTodayString()}`);
    }

    function moveDateBackward(days = 1) {
        const debugDate = getDebugDate();
        debugDate.setDate(debugDate.getDate() - days);
        setDebugDate(debugDate);
        console.log(`DEBUG: Date moved backward. Current date: ${getTodayString()}`);
    }

    function getReplyKey() {
        return `userReply_${getTodayString()}`;
    }

    function storeUserReply(reply) {
        localStorage.setItem(getReplyKey(), reply);
    }

    function getStoredReply() {
        return localStorage.getItem(getReplyKey());
    }

    if (userResponse) {
        // Restore user's reply for today if it exists
        const storedReply = getStoredReply();
        if (storedReply) {
            userResponse.value = storedReply;
    
            // Update word count based on restored reply
            const wordCount = storedReply.split(/\s+/).filter(Boolean).length;
            wordCountEl.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
        }
    
        // Store user's reply in local storage when they type
        userResponse.addEventListener('input', function() {
            const wordCount = this.value.split(/\s+/).filter(Boolean).length;
            wordCountEl.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;

            // Store the reply
            storeUserReply(this.value);
        });
    
        userResponse.focus();
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

    if (userResponse) {
        userResponse.addEventListener('input', function() {
            const wordCount = this.value.split(/\s+/).filter(Boolean).length;
            wordCountEl.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;

            const userResponses = JSON.parse(localStorage.getItem('userResponses') || '[]');
            if (!userResponses.includes(todayString)) {
                userResponses.push(todayString);
            }
            localStorage.setItem('userResponses', JSON.stringify(userResponses));
        });

        userResponse.focus();
    }

    // Display the reminder to the user
    const count = getSkippedCount();
    if (count > 0) {
        const reminderElement = document.createElement('p');
        reminderElement.textContent = `You have skipped responding to the quote ${count} times today.`;
        reminderElement.style.color = "#ff0000";
        reminderElement.style.marginTop = "10px";
    
        const responseContainer = document.getElementById('responseContainer');
        if (responseContainer) {
            responseContainer.appendChild(reminderElement);
        }
    }

    // When page is hidden (tab is closed or navigated away)
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden' && userResponse.value.trim() === "") {
            incrementSkippedCount();
        }
    });
});
