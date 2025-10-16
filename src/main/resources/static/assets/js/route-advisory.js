document.addEventListener('DOMContentLoaded', function() {
    if (typeof MAPBOX_TOKEN === 'undefined') {
        console.error('Mapbox token is not defined. Please ensure it is passed from the server.');
        return;
    }
    mapboxgl.accessToken = MAPBOX_TOKEN;

    function createGeocoder(containerId, inputId, placeholder) {
        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            placeholder: placeholder,
            countries: 'ph',
            types: 'country,region,place,postcode,locality,neighborhood,address,poi',
        });
        
        const container = document.getElementById(containerId);
        if (container) {
            container.appendChild(geocoder.onAdd());

            const geocoderInput = container.querySelector('.mapboxgl-ctrl-geocoder--input');
            const hiddenInput = document.getElementById(inputId);
            const initialValue = hiddenInput ? hiddenInput.value : '';

            if (geocoderInput && initialValue && initialValue.trim() !== '') {
                geocoderInput.value = initialValue;
            }

            geocoder.on('result', function(e) {
                const latInput = document.getElementById(inputId + '_lat');
                const lonInput = document.getElementById(inputId + '_lon');
                
                if (hiddenInput) {
                    hiddenInput.value = e.result.place_name;
                }
                if (latInput && lonInput && e.result.center) {
                    latInput.value = e.result.center[1];
                    lonInput.value = e.result.center[0];
                }
            });

            geocoder.on('clear', function() {
                const latInput = document.getElementById(inputId + '_lat');
                const lonInput = document.getElementById(inputId + '_lon');

                if (hiddenInput) hiddenInput.value = '';
                if (latInput) latInput.value = '';
                if (lonInput) lonInput.value = '';
            });
        }
    }
    
    createGeocoder('origin-geocoder', 'origin', 'e.g., Quezon City');
    createGeocoder('destination-geocoder', 'destination', 'e.g., Baguio City');
    
    const routeForm = document.querySelector('.route-form');
    if(routeForm) {
        routeForm.addEventListener('submit', function(e) {
            const originInput = document.getElementById('origin').value;
            const destInput = document.getElementById('destination').value;

            if (!originInput || !destInput) {
                e.preventDefault();
                
                const errorModal = document.getElementById('error-modal');
                const errorModalText = errorModal.querySelector('p');
                if (errorModal && errorModalText) {
                    errorModalText.textContent = 'Please select a valid origin and destination from the search suggestions before getting an advisory.';
                    errorModal.style.display = 'flex';
                }
            }
        });
    }

    const errorModal = document.getElementById('error-modal');
    if (errorModal) {
        const closeErrorBtn = document.getElementById('close-error-btn');
        const closeErrorModal = () => {
            errorModal.style.display = 'none';
        };
        if (closeErrorBtn) {
            closeErrorBtn.addEventListener('click', closeErrorModal);
        }
        window.addEventListener('click', (event) => {
            if (event.target === errorModal) {
                closeErrorModal();
            }
        });
    }

    const advisoryModal = document.getElementById('advisory-modal');
    const viewAdvisoryBtns = document.querySelectorAll('.view-advisory-btn');
    const closeAdvisoryBtn = document.getElementById('close-advisory-btn');
    const advisoryLocationNameEl = document.getElementById('advisory-location-name');
    const advisoryWeatherHazardEl = document.getElementById('advisory-weather-hazard');
    const advisoryTravelHazardEl = document.getElementById('advisory-travel-hazard');

    const openAdvisoryModal = (event) => {
        const button = event.currentTarget;
        const locationName = button.dataset.locationName;
        const weatherHazard = button.dataset.hazardWeather;
        const travelHazard = button.dataset.hazardTravel;

        if(advisoryLocationNameEl) advisoryLocationNameEl.textContent = `Advisory for ${locationName}`;
        
        if (advisoryWeatherHazardEl) {
            advisoryWeatherHazardEl.textContent = weatherHazard;
            let weatherClass = 'alert-info';
            if (weatherHazard.includes('Warning') || weatherHazard.includes('Storm')) {
                weatherClass = 'alert-danger';
            } else if (weatherHazard.includes('Advisory')) {
                weatherClass = 'alert-warning';
            }
            advisoryWeatherHazardEl.className = `alert ${weatherClass}`;
        }

        if (advisoryTravelHazardEl) {
            if (travelHazard && travelHazard.trim() !== '') {
                advisoryTravelHazardEl.textContent = travelHazard;
                let tempClass = 'alert-info';
                if (travelHazard.includes('Danger')) {
                    tempClass = 'alert-danger';
                } else if (travelHazard.includes('Caution') || travelHazard.includes('Cool')) {
                    tempClass = 'alert-warning';
                }
                advisoryTravelHazardEl.className = `alert ${tempClass}`;
            } else {
                advisoryTravelHazardEl.textContent = '✅ Temperatures are comfortable for travel. No specific advisories.';
                advisoryTravelHazardEl.className = 'alert alert-info';
            }
        }

        if (advisoryModal) advisoryModal.style.display = 'flex';
    };

    const closeAdvisoryModal = () => {
        if (advisoryModal) advisoryModal.style.display = 'none';
    };

    viewAdvisoryBtns.forEach(btn => {
        btn.addEventListener('click', openAdvisoryModal);
    });

    if (closeAdvisoryBtn) {
        closeAdvisoryBtn.addEventListener('click', closeAdvisoryModal);
    }
    
    window.addEventListener('click', (event) => {
        if (event.target === advisoryModal) {
            closeAdvisoryModal();
        }
    });
});

