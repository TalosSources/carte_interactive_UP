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

export function renderCardCollection(initiatives) {
    return <div class="cards">
            {initiatives.map(
              (initiativeElement) => {
                let title = initiativeElement
                    .initiative_title_texts[0]['text'];
                let description = initiativeElement
                    .initiative_description_texts[0]['text'];
                return (
                    <div class="card" key={initiativeElement.id}>
                        <SkCard
                            title={title}
                            url={initiativeElement.url}
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