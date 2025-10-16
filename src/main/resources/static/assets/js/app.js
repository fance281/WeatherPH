document.addEventListener('DOMContentLoaded', function () {
    // --- Sidebar Toggle Functionality ---
    const sidebarToggle = document.getElementById('sidebarToggle');
    const dashboardContainer = document.querySelector('.dashboard-container');

    if (sidebarToggle && dashboardContainer) {
        // Function to apply the saved state
        const applySidebarState = () => {
            if (localStorage.getItem('sidebarCollapsed') === 'true') {
                dashboardContainer.classList.add('sidebar-collapsed');
            } else {
                dashboardContainer.classList.remove('sidebar-collapsed');
            }
        };

        // Apply state on page load
        applySidebarState();

        // Add click event listener
        sidebarToggle.addEventListener('click', () => {
            dashboardContainer.classList.toggle('sidebar-collapsed');
            const isCollapsed = dashboardContainer.classList.contains('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
            
            // Dispatch a resize event to make components like the map aware of the size change
            // A short delay can help ensure the CSS transition has started
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 150);
        });
    }

    // --- Logout Confirmation Modal ---
    const logoutButton = document.getElementById('logout-button');
    const logoutModal = document.getElementById('logout-modal');
    const logoutConfirmBtn = document.getElementById('logout-confirm-btn');
    const logoutCancelBtn = document.getElementById('logout-cancel-btn');
    const logoutCancelClose = document.getElementById('logout-cancel-close');
    const logoutForm = document.getElementById('logout-form');

    if (logoutButton && logoutModal && logoutForm) {
        const showLogoutModal = () => {
            if(logoutModal) logoutModal.style.display = 'flex';
        };

        const hideLogoutModal = () => {
            if(logoutModal) logoutModal.style.display = 'none';
        };

        logoutButton.addEventListener('click', showLogoutModal);
        
        if(logoutCancelBtn) logoutCancelBtn.addEventListener('click', hideLogoutModal);
        if(logoutCancelClose) logoutCancelClose.addEventListener('click', hideLogoutModal);

        if(logoutConfirmBtn) {
            logoutConfirmBtn.addEventListener('click', () => {
                logoutForm.submit();
            });
        }
        
        window.addEventListener('click', (event) => {
            if (event.target === logoutModal) {
                hideLogoutModal();
            }
        });
    }
    
    // --- New Modal Logic for Login Success (FIXED CLOSE HANDLER) ---
    function checkUrlParamsForModals() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Handle Login Success Modal
        if (urlParams.has('loginSuccess')) {
            const modal = document.getElementById('login-success-modal');
            const closeBtn = document.getElementById('close-login-success-btn');
            
            if (modal) {
                // Show modal
                modal.style.display = 'flex';
                
                const closeModal = () => {
                    modal.style.display = 'none';
                    // Clean URL to prevent modal from reappearing on refresh
                    urlParams.delete('loginSuccess');
                    window.history.replaceState({}, document.title, window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : ''));
                };

                // CRITICAL FIX: Attach the event listener to the "Start Planning" button
                if (closeBtn) closeBtn.addEventListener('click', closeModal); 
                
                // Also close if clicking outside the modal
                window.addEventListener('click', (event) => {
                    if (event.target === modal) closeModal();
                });
            }
        }
    }
    
    // Run modal checks immediately
    checkUrlParamsForModals();
});
