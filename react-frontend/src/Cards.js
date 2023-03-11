function SkCard(props) {
    // CSS in React: https://www.w3schools.com/react/react_css.asp
    return (
        <a href={'/details/' + props.id}>
            <img class="card-image" src={props.image_url}/>
            <div class="card-text">
                <div class="card-title" dangerouslySetInnerHTML={{__html: props.title}}></div>
                <div class="card-description" dangerouslySetInnerHTML={{__html: props.description}}></div>
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
    return <div class="cards">
            {initiatives.slice(0, 10).map(
              (initiativeElement) => {
                let title = initiativeElement
                    .initiative_title_texts[0]['text'];
                let description = initiativeElement
                    .initiative_description_texts[0]['text'];
                const image_url = initiativeElement.main_image_url;
                console.log(image_url)
                const thumbnail = makeThumbnailUrl(image_url)
                console.log("thumbnail", thumbnail)
                
                return (
                    <div class="card" key={initiativeElement.id}>
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