import React from 'react';
import { Outlet, Link } from "react-router-dom";

export function Layout() {
    return (
        <div>
            <nav>
                <ul>
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <Link to="/sitemap">Sitemap</Link>
                    </li>
                </ul>
            </nav>

            <Outlet />
        </div>
    );
};

