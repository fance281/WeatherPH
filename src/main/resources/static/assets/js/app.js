document.addEventListener('DOMContentLoaded', function () {
    // --- Elements ---
    const sidebarToggle = document.getElementById('sidebarToggle'); // Desktop sidebar toggle (< >)
    const mobileHeaderToggle = document.querySelector('.mobile-header .mobile-toggle'); // Hamburger in mobile header
    const sidebarCloseToggle = document.querySelector('.sidebar .mobile-toggle'); // 'X' button inside the sidebar
    const sidebar = document.querySelector('.sidebar');
    const dashboardContainer = document.querySelector('.dashboard-container');
    const body = document.body;
    const mainContentHeader = document.querySelector('.main-content-header'); // Desktop fixed header

    // --- Function to apply correct state based on window size ---
    const applySidebarState = () => {
        const isMobile = window.innerWidth <= 992;

        if (isMobile) {
            // Mobile View Setup
            dashboardContainer.classList.remove('sidebar-collapsed'); // Remove desktop collapse
            // Ensure sidebar starts hidden unless explicitly opened
            if (!sidebar.classList.contains('mobile-nav-open')) {
                sidebar.style.transform = 'translateX(-100%)';
            } else {
                 sidebar.style.transform = 'translateX(0)'; // Ensure visible if class is present
            }
             body.classList.toggle('mobile-nav-active', sidebar.classList.contains('mobile-nav-open'));
             // Ensure fixed header has correct left position (0 for mobile)
             if(mainContentHeader) mainContentHeader.style.left = '0px';

        } else {
            // Desktop View Setup
            sidebar.classList.remove('mobile-nav-open'); // Remove mobile class
            body.classList.remove('mobile-nav-active'); // Remove overlay class
            sidebar.style.transform = 'translateX(0)'; // Ensure sidebar is visible in flow

            // Apply desktop collapse state
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            dashboardContainer.classList.toggle('sidebar-collapsed', isCollapsed);

             // Adjust fixed header position based on desktop sidebar state
            if(mainContentHeader) {
                mainContentHeader.style.left = isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)';
            }
        }
    };

    // Apply state on initial load
    applySidebarState();

    // --- Desktop Sidebar Collapse Toggle ---
    if (sidebarToggle && dashboardContainer && mainContentHeader) {
        sidebarToggle.addEventListener('click', () => {
            if (window.innerWidth > 992) { // Only for desktop
                dashboardContainer.classList.toggle('sidebar-collapsed');
                const isCollapsed = dashboardContainer.classList.contains('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
                // Update header position immediately
                mainContentHeader.style.left = isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)';
                // Trigger resize for potential map adjustments after transition
                setTimeout(() => window.dispatchEvent(new Event('resize')), 310); // Match transition duration
            }
        });
    }

    // --- Mobile Navigation Open Toggle (Hamburger) ---
    if (mobileHeaderToggle && sidebar) {
        mobileHeaderToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            sidebar.classList.add('mobile-nav-open');
            body.classList.add('mobile-nav-active');
            sidebar.style.transform = 'translateX(0)'; // Slide in
        });
    }

    // --- Mobile Navigation Close Toggle ('X' inside sidebar) ---
     if (sidebarCloseToggle && sidebar) {
        sidebarCloseToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            sidebar.classList.remove('mobile-nav-open');
            body.classList.remove('mobile-nav-active');
            sidebar.style.transform = 'translateX(-100%)'; // Slide out
        });
    }


     // --- Close Mobile Nav on Outside Click/Overlay Click ---
    document.addEventListener('click', (event) => {
        const isOverlayClick = body.classList.contains('mobile-nav-active') && event.target === body;
        const isClickInsideSidebar = sidebar && sidebar.contains(event.target);

        // Close if the menu is open AND (click is on overlay OR click is outside sidebar)
        if (sidebar && sidebar.classList.contains('mobile-nav-open') && (isOverlayClick || !isClickInsideSidebar)) {
            // Don't close if the click was on the header toggle that opens it
             if (!(mobileHeaderToggle && mobileHeaderToggle.contains(event.target))) {
                sidebar.classList.remove('mobile-nav-open');
                body.classList.remove('mobile-nav-active');
                sidebar.style.transform = 'translateX(-100%)'; // Ensure it slides out
            }
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
        const setupModalFromUrl = (paramName, modalId, closeBtnId) => {
             if (urlParams.has(paramName)) {
                const modal = document.getElementById(modalId);
                const closeBtn = document.getElementById(closeBtnId);
                if (modal) {
                    modal.style.display = 'flex';
                    const closeModal = () => {
                        modal.style.display = 'none';
                        urlParams.delete(paramName);
                        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
                        window.history.replaceState({}, document.title, newUrl);
                    };
                    if (closeBtn) closeBtn.addEventListener('click', closeModal);
                    window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
                }
            }
        };
        setupModalFromUrl('loginSuccess', 'login-success-modal', 'close-login-success-btn');
        // Add other modals if needed
    }
    checkUrlParamsForModals();
});

