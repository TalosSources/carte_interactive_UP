import React from 'react'
import { type Initiative } from '../lib/KesApi'
import { getShortDescription, getTitle } from '../lib/i18n'

import Carousel from 'react-bootstrap/Carousel'

export function InitiativeCarousel ({ promotedInitiatives }: { promotedInitiatives: Initiative[] }): React.JSX.Element {
  return <Carousel className="promotedInitiatives">
            {[...promotedInitiatives.entries()].map(indexedInitiative => {
              const initiative = indexedInitiative[1]
              return <Carousel.Item key={'carouselInitiative' + initiative.slug}>
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
