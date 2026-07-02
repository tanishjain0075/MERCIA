/**
 * auth.js — Shared authentication guard for all protected dashboard pages.
 * Include this script in every protected page.
 * It will:
 *   1. Check for a valid token in localStorage
 *   2. Redirect to login if missing
 *   3. Inject user info into the navbar
 *   4. Provide a logout function
 *   5. Expose merciaApi() helper for authenticated fetch calls
 */

(function () {
    const token = localStorage.getItem('mercia_token');
    const userStr = localStorage.getItem('mercia_user');

    // ── Guard: redirect to login if no token ──
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    let currentUser = null;
    try {
        currentUser = JSON.parse(userStr);
    } catch (e) {
        localStorage.clear();
        window.location.href = '/pages/login.html';
        return;
    }

    // ── Inject user info + logout button into navbar after DOM loads ──
    document.addEventListener('DOMContentLoaded', () => {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        const userBadge = document.createElement('div');
        userBadge.style.cssText = 'display:flex;align-items:center;gap:12px;color:#d3d8e0;font-size:14px;';
        userBadge.innerHTML = `
            <span>👤 <strong>${currentUser.username || currentUser.email}</strong>
                <span style="background:#E39774;color:white;padding:2px 8px;border-radius:99px;font-size:11px;margin-left:6px;text-transform:uppercase;">
                    ${currentUser.role}
                </span>
            </span>
            <button id="logout-btn" style="
                background:transparent;border:1px solid rgba(255,255,255,0.3);
                color:#d3d8e0;padding:6px 14px;border-radius:6px;cursor:pointer;
                font-size:13px;transition:all 0.2s;
            " onmouseover="this.style.background='rgba(227,151,116,0.2)'"
               onmouseout="this.style.background='transparent'">
                Logout
            </button>
        `;
        navbar.appendChild(userBadge);

        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('mercia_token');
            localStorage.removeItem('mercia_user');
            window.location.href = '/pages/login.html';
        });
    });

    /**
     * Authenticated fetch helper.
     * Usage: const data = await merciaApi('/api/inventory', { method: 'POST', body: {...} });
     */
    window.merciaApi = async function (endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {}),
        };

        const res = await fetch(endpoint, { ...options, headers });

        // If 401, token expired — force re-login
        if (res.status === 401) {
            localStorage.removeItem('mercia_token');
            localStorage.removeItem('mercia_user');
            window.location.href = '/pages/login.html';
            return;
        }

        return res.json();
    };

    // Expose current user globally for page scripts
    window.merciaUser = currentUser;
})();
