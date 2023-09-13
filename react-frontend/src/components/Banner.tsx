import React from "react";
import CookieConsent from "react-cookie-consent";

export function Banner() {
    return <CookieConsent
                expires={2}
                overlay
                overlayStyle={{ zIndex:1001 }}
                buttonText="Sure. Take me to the map!"
                style={{ background: "#FFFFFF", color: "#000000" }}
            >
                <AboutBeta/>
            </CookieConsent>
}

export function AboutBeta() {
    return <div>
        <h2>Welcome to the future of sharing economy!</h2>
                <div>
                    We're building the platform for human economy.
                    This is a beta preview for the next version 4.0 of Smartakartan and we're tracking all kind of behavior and browser information for understanding your experience.
                </div><div>
                    Feel free to play around and test this new version.
                    For testing purposes the initiatives from the current version 3 have been imported.
                    Initiatives can be edited in the <a href="/admin">curation panel</a>(<a href="/help/moderationPanel">credentials</a>).
                    Please note that changes made in this panel here will be overwritten at some point.
                </div>
                Noteworthy changes:
                <ul>
                    <li>Reworked curation panel</li>
                    <li>Real-time search</li>
                </ul>


                <div>
                We're happy about any feedback. Please reach out to us via our <a href="https://nextcloud.entrop.mywire.org/apps/forms/s/g4sMkHPLKnZcKSRByX884Erc">feedback form</a>.
                </div>
        </div>
}
