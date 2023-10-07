import React from "react";
import { Initiative } from "../KesApi";
import { getShortDescription, getTitle } from "../i18n";

import Carousel from 'react-bootstrap/Carousel';

export function InitiativeCarousel({promotedInitiatives} : {promotedInitiatives : Initiative[]}) {
    return <Carousel className="promotedInitiatives">
            {[...promotedInitiatives.entries()].map(indexed_initiative => {
                const initiative = indexed_initiative[1]
                return <Carousel.Item>
                    <img
                    className="d-block w-100"
                    src={initiative.main_image_url}
                    alt={getTitle(initiative)}
                    />

                    <Carousel.Caption>
                    <h3>{getTitle(initiative)}</h3>
                    <p>
                        {getShortDescription(initiative)}
                    </p>
                    </Carousel.Caption>
                </Carousel.Item>

            })}
            </Carousel>
}