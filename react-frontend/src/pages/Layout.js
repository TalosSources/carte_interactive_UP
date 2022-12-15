import React from 'react';
import { Outlet, Link } from "react-router-dom";

const Layout = () => {
    return (
        <div>
            <nav>
                <ul>
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <Link to="/details/12">Details</Link> {/* Navigate to a basic details page to test navigation */}

                    </li>
                </ul>
            </nav>

            <Outlet />
        </div>
    );
};

export default Layout;
