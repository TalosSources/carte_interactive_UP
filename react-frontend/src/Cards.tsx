import React from "react";
import { Initiative } from "./pages/Home";

function SkCard(props: { id: number; image_url: string; title: string; description: string; }) {
    // CSS in React: https://www.w3schools.com/react/react_css.asp
    return (
        <a href={'/details/' + props.id}>
            <img className="card-image" src={props.image_url}/>
            <div className="card-text">
                <div className="card-title" dangerouslySetInnerHTML={{__html: props.title}}></div>
                <div className="card-description" dangerouslySetInnerHTML={{__html: props.description}}></div>
            </div>
        </a>
    );
}

export function renderCardCollection(initiatives: Initiative[]) {
    return <div className="cards">
            {initiatives.map(
              (initiativeElement) => {
                let title = initiativeElement
                    .initiative_title_texts[0]['text'];
                let description = initiativeElement
                    .initiative_description_texts[0]['text'];
                return (
                    <div className="card" key={initiativeElement.id}>
                        <SkCard
                            title={title}
                            id={initiativeElement.id}
                            description={description}
                            image_url={initiativeElement.main_image_url}
                        />
                    </div>
                );
              }
             )
    }</div>;
}