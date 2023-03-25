import React from 'react';
import { Outlet, Link } from "react-router-dom";

export function Layout() {
    return (
        <div>
            <nav>
            </nav>

            <Outlet />

            <div id="footer">
                        <Link to="/sitemap">Sitemap</Link>
            </div>
        </div>
    );
}

