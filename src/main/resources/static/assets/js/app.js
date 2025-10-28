document.addEventListener('DOMContentLoaded', function () {
    // --- Sidebar/Top Bar Elements ---
    const sidebarToggle = document.getElementById('sidebarToggle'); // Desktop toggle
    const mobileNavToggle = document.getElementById('mobileNavToggle'); // Mobile toggle
    const sidebar = document.querySelector('.sidebar');
    const dashboardContainer = document.querySelector('.dashboard-container');

    // --- Desktop Sidebar Collapse ---
    if (sidebarToggle && dashboardContainer && sidebar) {
        const applySidebarState = () => {
            // Only apply collapse on wider screens (breakpoint is 992px)
            if (window.innerWidth > 992) {
                if (localStorage.getItem('sidebarCollapsed') === 'true') {
                    dashboardContainer.classList.add('sidebar-collapsed');
                } else {
                    dashboardContainer.classList.remove('sidebar-collapsed');
                }
                 // Ensure mobile open class is removed on desktop
                 sidebar.classList.remove('mobile-nav-open');
            } else {
                // Ensure desktop collapse class is removed on smaller screens
                dashboardContainer.classList.remove('sidebar-collapsed');
            }
        };

        applySidebarState(); // Apply state on load

        sidebarToggle.addEventListener('click', () => {
            // Only toggle if desktop view is active
            if (window.innerWidth > 992) {
                dashboardContainer.classList.toggle('sidebar-collapsed');
                const isCollapsed = dashboardContainer.classList.contains('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
                // Dispatch resize for map etc.
                setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
            }
        });

        // Re-apply state on resize
        window.addEventListener('resize', applySidebarState);
    }

    // --- Mobile Navigation Toggle ---
    if (mobileNavToggle && sidebar) {
        mobileNavToggle.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from immediately closing menu via document listener
            sidebar.classList.toggle('mobile-nav-open');
        });

        // Close mobile nav if user clicks outside of it
        document.addEventListener('click', (event) => {
            const isClickInsideSidebar = sidebar.contains(event.target);

            // Close only if the menu is open and the click was outside
            if (!isClickInsideSidebar && sidebar.classList.contains('mobile-nav-open')) {
                 sidebar.classList.remove('mobile-nav-open');
            }
        });

        // Prevent clicks inside the content wrapper from closing the menu
        const contentWrapper = sidebar.querySelector('.sidebar-content-wrapper');
        if(contentWrapper){
            contentWrapper.addEventListener('click', (event) => {
                 // Allow clicks on links/buttons inside to function, but don't close the menu
                 if (event.target.tagName === 'A' || event.target.tagName === 'BUTTON') {
                     // Optionally close the menu after clicking a link/button
                     // sidebar.classList.remove('mobile-nav-open');
                 } else {
                    event.stopPropagation();
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
    // Select the standard logout button (now used in both desktop/mobile dropdown)
    const logoutButton = document.getElementById('logout-button'); // This ID is now on the button inside .user-details


    if (logoutButton && logoutModal && logoutForm) {
        const showLogoutModal = (event) => {
            event.stopPropagation(); // Prevent triggering document click listener
            if(logoutModal) logoutModal.style.display = 'flex';
        };

        const hideLogoutModal = () => {
            if(logoutModal) logoutModal.style.display = 'none';
            // Also close the mobile nav if open
            if (sidebar && sidebar.classList.contains('mobile-nav-open')) {
                sidebar.classList.remove('mobile-nav-open');
            }
        };

        // Add listener to the single logout button
        // Need to ensure this listener is attached even if the button is initially hidden in the dropdown
        // Using event delegation might be safer, but this should work if the element exists in the DOM.
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
                }
            }
        };

        // Setup modals based on URL parameters
        setupModalFromUrl('loginSuccess', 'login-success-modal', 'close-login-success-btn');
        // Add similar calls for other modals triggered by URL params if needed
        // e.g., setupModalFromUrl('verificationSent', 'verification-modal', 'close-verification-btn');
        // e.g., setupModalFromUrl('passwordResetSuccess', 'password-reset-modal', 'close-reset-btn');
        // e.g., setupModalFromUrl('logoutSuccess', 'logout-success-modal', 'close-logout-btn');

    }

    // Run modal checks immediately
    checkUrlParamsForModals();
});

