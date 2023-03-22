function SkCard(props) {
    // CSS in React: https://www.w3schools.com/react/react_css.asp
    return (
        <div>
        <a href={'/details/' + props.id}>
            <img className="card-image" src={props.image_url}/>
            <div className="card-text">
                <div className="card-title" dangerouslySetInnerHTML={{__html: props.title}}></div>
                <div className="card-description" dangerouslySetInnerHTML={{__html: props.description}}></div>
            </div>
        </a>
        <div className="cardTagPanel">
        {
            props.tags.map((tagElement) => (
                <div className="proposedTag" onClick={() => props.tagClick(tagElement.slug)}>
                    <div dangerouslySetInnerHTML={{__html: tagElement.title}}></div>
                </div>
            ))
        }</div></div>
    );
}

export function renderCardCollection(initiatives, tagClick, tagSorting) {
    return <div class="cards">
            {initiatives.map(
              (initiativeElement) => {
                let title = initiativeElement
                    .initiative_title_texts[0]['text'];
                let description = initiativeElement
                    .initiative_description_texts[0]['text'];
                function sortTagsByEntropy(tag_a, tag_b) {
                    return tagSorting[tag_b.id] - tagSorting[tag_a.id]
                }
                let top_tags = initiativeElement.tags
                if (!(typeof tagSorting == "undefined")) {
                    top_tags.sort(sortTagsByEntropy);
                }
                console.log(top_tags);
                return (
                    <div className="card" key={initiativeElement.id}>
                        <SkCard
                            title={title}
                            url={initiativeElement.url}
                            id={initiativeElement.id}
                            description={description}
                            image_url={initiativeElement.main_image_url}
                            tags={top_tags}
                            tagClick={tagClick}
                        />
                    </div>
                );
              }
             )
    }</div>;
}