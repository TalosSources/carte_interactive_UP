import React from 'react';
import { Outlet, Link } from "react-router-dom";

const Layout = () => {
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
};

export default Layout;
