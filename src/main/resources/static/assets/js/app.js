// --- MAIN APP LOGIC ---

// Handles the "Use Current Location" button
const handleUseLocation = () => {
    const useLocationBtn = document.getElementById('use-location-btn');
    if (!useLocationBtn) return;

    useLocationBtn.onclick = function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var lat = position.coords.latitude.toFixed(6);
                var lon = position.coords.longitude.toFixed(6);
                // Use Nominatim to get a readable address from coordinates
                fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
                    .then(response => response.json())
                    .then(data => {
                        let addressStr = formatShortAddress(data.address || {});
                        if (addressStr) {
                            document.getElementById('origin').value = addressStr;
                        } else if (data.display_name) {
                            document.getElementById('origin').value = data.display_name;
                        } else {
                            document.getElementById('origin').value = lat + ',' + lon;
                        }
                    })
                    .catch(() => {
                        // Fallback to coordinates if address lookup fails
                        document.getElementById('origin').value = lat + ',' + lon;
                    });
            }, function(err) {
                console.error('Could not determine your position: ' + err.message);
            });
        } else {
            console.error('Geolocation not available');
        }
    };
};

// Handles Advisory Persistence in Session Storage (for index.html only)
const handleAdvisoryPersistence = () => {
    const routeForm = document.getElementById('routeForm');
    // **FIX:** Only run this logic on the index page where the form exists.
    if (!routeForm) {
        return;
    }

    const resultsSection = document.getElementById('resultsSection');
    
    // Save new advisory results to sessionStorage
    if (resultsSection) {
        sessionStorage.setItem('weatherph_lastResult', resultsSection.innerHTML);
    }
    
    // Restore advisory from sessionStorage if no results are currently displayed
    if (!resultsSection && sessionStorage.getItem('weatherph_lastResult')) {
        const mainContainer = document.querySelector('main.container');
        if (mainContainer) {
            let restoredSection = document.createElement('section');
            restoredSection.className = 'results';
            restoredSection.id = 'resultsSection';
            restoredSection.innerHTML = sessionStorage.getItem('weatherph_lastResult');
            // Find the welcome section and insert the results after it
            const welcomeSection = document.querySelector('.results'); // Assumes welcome is the first .results
            if(welcomeSection && welcomeSection.nextSibling) {
                mainContainer.insertBefore(restoredSection, welcomeSection.nextSibling);
            } else {
                mainContainer.appendChild(restoredSection);
            }
        }
    }

    // Clear sessionStorage on a new search to prevent showing old results
    routeForm.addEventListener('submit', function() {
        sessionStorage.removeItem('weatherph_lastResult');
    });
};


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    fetchLocalWeather(); // From geoweather.js
    handleUseLocation();
    handleAdvisoryPersistence();
});

