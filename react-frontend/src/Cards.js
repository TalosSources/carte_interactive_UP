function SkCard(props) {
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

const makeThumbnailUrl = (main_url) => {

    // Are all thumbnails the same size?
    // add -340x140
    const ending = main_url.slice(-4)
    const baseString = main_url.slice(0, -4)

    return `${baseString}-350x140${ending}`;

}

export function renderCardCollection(initiatives) {
    return <div className="cards">
            {initiatives.map(
              (initiativeElement) => {
                let title = initiativeElement
                    .initiative_title_texts[0]['text'];
                let description = initiativeElement
                    .initiative_description_texts[0]['text'];
                const image_url = initiativeElement.main_image_url;
                
                return (
                    <div className="card" key={initiativeElement.id}>
                        <SkCard
                            title={title}
                            url={initiativeElement.url}
                            id={initiativeElement.id}
                            description={description}
                            image_url={image_url}
                        />
                    </div>
                );
              }
             )
    }</div>;
}