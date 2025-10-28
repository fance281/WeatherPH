document.addEventListener('DOMContentLoaded', function () {
    // --- Sidebar/Top Bar Elements ---
    const sidebarToggle = document.getElementById('sidebarToggle'); // Desktop toggle
    const mobileNavToggle = document.getElementById('mobileNavToggle'); // Mobile toggle
    const sidebar = document.querySelector('.sidebar');
    const dashboardContainer = document.querySelector('.dashboard-container');
    const body = document.body; // Get the body element

    // --- Desktop Sidebar Collapse ---
    if (sidebarToggle && dashboardContainer && sidebar && body) { // Added body check
        const applySidebarState = () => {
            // Only apply collapse on wider screens (breakpoint is 992px)
            if (window.innerWidth > 992) {
                // Apply desktop collapse state
                if (localStorage.getItem('sidebarCollapsed') === 'true') {
                    dashboardContainer.classList.add('sidebar-collapsed');
                } else {
                    dashboardContainer.classList.remove('sidebar-collapsed');
                }
                // *** Ensure mobile specific classes are removed on desktop ***
                sidebar.classList.remove('mobile-nav-open');
                body.classList.remove('mobile-nav-active'); // Remove body overlay class
            } else {
                // Ensure desktop collapse class is removed on smaller screens
                dashboardContainer.classList.remove('sidebar-collapsed');
                 // Ensure sidebar is closed initially on mobile unless explicitly opened
                 // sidebar.classList.remove('mobile-nav-open'); // Keep state if resizing back
                 // body.classList.remove('mobile-nav-active'); // Keep state if resizing back
            }
        };

        applySidebarState(); // Apply state on load

        sidebarToggle.addEventListener('click', () => {
            // Only toggle if desktop view is active
            if (window.innerWidth > 992) {
                dashboardContainer.classList.toggle('sidebar-collapsed');
                const isCollapsed = dashboardContainer.classList.contains('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
                // Dispatch resize for map etc. after transition
                setTimeout(() => window.dispatchEvent(new Event('resize')), 300); // Wait for CSS transition
            }
        });

        // Re-apply state on resize
        window.addEventListener('resize', applySidebarState);
    }

    // --- Mobile Navigation Toggle ---
    if (mobileNavToggle && sidebar && body) { // Added body check
        mobileNavToggle.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from immediately closing menu via document listener
            sidebar.classList.toggle('mobile-nav-open');
            body.classList.toggle('mobile-nav-active'); // Toggle body class for overlay
        });

        // Close mobile nav if user clicks outside of it (on the overlay)
        body.addEventListener('click', (event) => {
            // Check if the click target is the overlay itself (::after pseudo-element)
            // Or more simply, if the click is directly on the body AND the nav is open
            if (event.target === body && sidebar.classList.contains('mobile-nav-open')) {
                closeMobileNav();
            }
        });

        // Function to close mobile nav
        const closeMobileNav = () => {
             sidebar.classList.remove('mobile-nav-open');
             body.classList.remove('mobile-nav-active');
        }

        // Prevent clicks inside the sidebar content from closing the menu, but allow links/buttons
        const contentWrapper = sidebar.querySelector('.sidebar-content-wrapper');
        if (contentWrapper) {
            contentWrapper.addEventListener('click', (event) => {
                // Allow clicks on links/buttons inside to function and close the nav
                if (event.target.tagName === 'A' || event.target.tagName === 'BUTTON' || event.target.closest('button')) {
                    // Don't close immediately if it's the logout button (modal handles it)
                     if (event.target.id !== 'logout-button' && event.target.closest('button')?.id !== 'logout-button') {
                         closeMobileNav(); // Close nav on item click
                     } else {
                         // If logout button, modal logic will handle closing
                         event.stopPropagation(); // Prevent body click closing
                     }
                } else {
                     event.stopPropagation(); // Prevent closing if clicking on padding/etc.
                }
            });
        }
    }


    // --- Logout Confirmation Modal ---
    const logoutModal = document.getElementById('logout-modal');
    const logoutConfirmBtn = document.getElementById('logout-confirm-btn');
    const logoutCancelBtn = document.getElementById('logout-cancel-btn');
    const logoutCancelClose = document.getElementById('logout-cancel-close');
    const logoutForm = document.getElementById('logout-form');
    // Select the standard logout button
    const logoutButton = document.getElementById('logout-button');


    if (logoutButton && logoutModal && logoutForm) {
        const showLogoutModal = (event) => {
            event.stopPropagation(); // Prevent triggering document click listener
            if(logoutModal) logoutModal.style.display = 'flex';
            // Keep mobile nav open when modal shows
            if (sidebar && sidebar.classList.contains('mobile-nav-open')) {
                event.stopPropagation(); // Prevent body click closing nav
            }
        };

        const hideLogoutModal = () => {
            if(logoutModal) logoutModal.style.display = 'none';
            // Do NOT automatically close mobile nav here, user might just cancel logout
        };

        logoutButton.addEventListener('click', showLogoutModal);

        if(logoutCancelBtn) logoutCancelBtn.addEventListener('click', hideLogoutModal);
        if(logoutCancelClose) logoutCancelClose.addEventListener('click', hideLogoutModal);

        if(logoutConfirmBtn) {
            logoutConfirmBtn.addEventListener('click', () => {
                // Ensure CSRF token is included if submitting via JS (though direct form submit is simpler)
                 if (logoutForm) {
                    logoutForm.submit();
                 }
            });
        }

        // Close modal if clicking outside modal content
        window.addEventListener('click', (event) => {
            if (event.target === logoutModal) {
                hideLogoutModal();
            }
        });
    }

    // --- URL Param Modal Logic (Login Success, etc.) ---
    function checkUrlParamsForModals() {
        const urlParams = new URLSearchParams(window.location.search);

        // Function to handle showing/closing modals based on URL params
        const setupModalFromUrl = (paramName, modalId, closeBtnId) => {
             if (urlParams.has(paramName)) {
                const modal = document.getElementById(modalId);
                const closeBtn = document.getElementById(closeBtnId);

                if (modal) {
                    modal.style.display = 'flex'; // Show modal

                    const closeModal = () => {
                        modal.style.display = 'none';
                        // Clean URL
                        urlParams.delete(paramName);
                        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
                        window.history.replaceState({}, document.title, newUrl);
                    };

                    if (closeBtn) closeBtn.addEventListener('click', closeModal);
                    window.addEventListener('click', (event) => {
                         if (event.target === modal) closeModal();
                    });
                    // Auto-close success modals after a delay
                    if (modalId.includes('-success-') || modalId.includes('-sent-')) {
                        setTimeout(closeModal, 4000); // Close after 4 seconds
                    }
                }
            }
        };

        // Setup modals based on URL parameters (using existing IDs from your login.html)
        setupModalFromUrl('loginSuccess', 'login-success-modal', 'close-login-success-btn');
        setupModalFromUrl('verification_sent', 'verification-modal', 'close-verification-btn');
        setupModalFromUrl('password_reset_success', 'password-reset-modal', 'close-reset-btn');
        setupModalFromUrl('logoutSuccess', 'logout-success-modal', 'close-logout-btn');
    }

    // Run modal checks immediately
    checkUrlParamsForModals();
});
