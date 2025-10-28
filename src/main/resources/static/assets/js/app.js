document.addEventListener('DOMContentLoaded', function () {
    // --- Sidebar/Top Bar Elements ---
    const sidebarToggle = document.getElementById('sidebarToggle'); // Desktop toggle
    const mobileNavToggle = document.getElementById('mobileNavToggle'); // Mobile toggle
    const sidebar = document.querySelector('.sidebar');
    const dashboardContainer = document.querySelector('.dashboard-container');
    const body = document.body;

    // --- Function to apply correct state based on window size ---
    const applySidebarState = () => {
        const isMobile = window.innerWidth <= 992;

        if (isMobile) {
            // Mobile View: Remove desktop collapse class, ensure transform is ready for toggle
            dashboardContainer.classList.remove('sidebar-collapsed');
            // If sidebar isn't explicitly open via mobile toggle, ensure it's hidden
            if (!sidebar.classList.contains('mobile-nav-open')) {
                sidebar.style.transform = 'translateX(-100%)'; // Ensure hidden if not open
            }
             body.classList.toggle('mobile-nav-active', sidebar.classList.contains('mobile-nav-open'));
        } else {
            // Desktop View: Remove mobile open class and overlay class, apply desktop collapse state
            sidebar.classList.remove('mobile-nav-open');
            body.classList.remove('mobile-nav-active');
            sidebar.style.transform = 'translateX(0)'; // Ensure visible in desktop flow

            // Apply desktop collapse state from localStorage
            if (localStorage.getItem('sidebarCollapsed') === 'true') {
                dashboardContainer.classList.add('sidebar-collapsed');
            } else {
                dashboardContainer.classList.remove('sidebar-collapsed');
            }
        }
    };

    // Apply state on initial load
    applySidebarState();

    // --- Desktop Sidebar Collapse Toggle ---
    if (sidebarToggle && dashboardContainer) {
        sidebarToggle.addEventListener('click', () => {
            // Only toggle if in desktop view
            if (window.innerWidth > 992) {
                dashboardContainer.classList.toggle('sidebar-collapsed');
                const isCollapsed = dashboardContainer.classList.contains('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
                // Trigger resize event slightly after transition starts for layout adjustments (e.g., map)
                setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
            }
        });
    }

    // --- Mobile Navigation Toggle ---
    if (mobileNavToggle && sidebar) {
        mobileNavToggle.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from immediately closing menu via document listener
            sidebar.classList.toggle('mobile-nav-open');
            body.classList.toggle('mobile-nav-active'); // Toggle body class for overlay

            // Set transform based on state
             if (sidebar.classList.contains('mobile-nav-open')) {
                 sidebar.style.transform = 'translateX(0)';
             } else {
                 sidebar.style.transform = 'translateX(-100%)';
             }
        });
    }

     // --- Close Mobile Nav on Outside Click/Overlay Click ---
    document.addEventListener('click', (event) => {
        // Check if the click target is the overlay itself (::after pseudo-element is not directly targetable, so we check the body with the class)
        const isOverlayClick = body.classList.contains('mobile-nav-active') && event.target === body;
        const isClickInsideSidebar = sidebar && sidebar.contains(event.target);
        const isMobileToggleClick = mobileNavToggle && mobileNavToggle.contains(event.target);

        // Close only if the menu is open, and the click was outside the sidebar AND not on the toggle button
        if (sidebar && sidebar.classList.contains('mobile-nav-open') && !isClickInsideSidebar && !isMobileToggleClick) {
             sidebar.classList.remove('mobile-nav-open');
             body.classList.remove('mobile-nav-active');
             sidebar.style.transform = 'translateX(-100%)'; // Ensure it slides out
        }
    });


    // --- Logout Confirmation Modal ---
    const logoutModal = document.getElementById('logout-modal');
    const logoutConfirmBtn = document.getElementById('logout-confirm-btn');
    const logoutCancelBtn = document.getElementById('logout-cancel-btn');
    const logoutCancelClose = document.getElementById('logout-cancel-close');
    const logoutForm = document.getElementById('logout-form');
    const logoutButton = document.getElementById('logout-button'); // Single logout button

    const closeMobileNav = () => {
         if (sidebar && sidebar.classList.contains('mobile-nav-open')) {
            sidebar.classList.remove('mobile-nav-open');
            body.classList.remove('mobile-nav-active');
            sidebar.style.transform = 'translateX(-100%)';
        }
    };

    if (logoutButton && logoutModal && logoutForm) {
        const showLogoutModal = (event) => {
            event.stopPropagation();
             closeMobileNav(); // Close mobile nav when opening logout modal
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

        // Close modal if clicking outside the modal content
        window.addEventListener('click', (event) => {
            if (event.target === logoutModal) {
                hideLogoutModal();
            }
        });
    }

     // Re-apply state on resize to switch between modes
    window.addEventListener('resize', applySidebarState);

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
        // Add other modals triggered by URL params if needed
        // e.g., setupModalFromUrl('verificationSent', 'verification-modal', 'close-verification-btn');
        // e.g., setupModalFromUrl('passwordResetSuccess', 'password-reset-modal', 'close-reset-btn');
        // e.g., setupModalFromUrl('logoutSuccess', 'logout-success-modal', 'close-logout-btn');

    }

    // Run modal checks immediately
    checkUrlParamsForModals();
});
