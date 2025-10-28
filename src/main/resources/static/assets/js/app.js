document.addEventListener('DOMContentLoaded', function () {
    // --- Sidebar Toggle Functionality ---
    const sidebarToggle = document.getElementById('sidebarToggle'); // Desktop toggle
    const mobileNavToggle = document.getElementById('mobileNavToggle'); // Mobile toggle
    const sidebar = document.querySelector('.sidebar');
    const dashboardContainer = document.querySelector('.dashboard-container');

    // --- Desktop Sidebar Collapse ---
    if (sidebarToggle && dashboardContainer && sidebar) {
        const applySidebarState = () => {
            // Only apply collapse on wider screens where the desktop toggle is visible
            if (window.innerWidth > 992) {
                if (localStorage.getItem('sidebarCollapsed') === 'true') {
                    dashboardContainer.classList.add('sidebar-collapsed');
                } else {
                    dashboardContainer.classList.remove('sidebar-collapsed');
                }
            } else {
                // Ensure desktop collapse class is removed on smaller screens
                dashboardContainer.classList.remove('sidebar-collapsed');
            }
        };

        applySidebarState(); // Apply state on load

        sidebarToggle.addEventListener('click', () => {
            if (window.innerWidth > 992) { // Only toggle if desktop toggle is active
                dashboardContainer.classList.toggle('sidebar-collapsed');
                const isCollapsed = dashboardContainer.classList.contains('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
                setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
            }
        });

        // Re-apply state on resize if switching between mobile/desktop view
        window.addEventListener('resize', applySidebarState);
    }

    // --- Mobile Navigation Toggle ---
    if (mobileNavToggle && sidebar) {
        mobileNavToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-nav-open');
        });

        // Close mobile nav if user clicks outside of it (optional)
        document.addEventListener('click', (event) => {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnToggle = mobileNavToggle.contains(event.target);

            if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains('mobile-nav-open')) {
                 sidebar.classList.remove('mobile-nav-open');
            }
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
            // Also close the mobile nav if open
            if (sidebar && sidebar.classList.contains('mobile-nav-open')) {
                sidebar.classList.remove('mobile-nav-open');
            }
        };

        // Note: Logout button might be inside the collapsible menu now
        // We might need event delegation if the button isn't always present
        // For simplicity, assuming it's always rendered for now.
        // If issues arise, querySelector inside the sidebar content wrapper.
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
