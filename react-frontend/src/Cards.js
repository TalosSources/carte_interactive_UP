import styled from "styled-components";
import sanitizeHtml from "sanitize-html";

const CardContainer = styled.div`
    display: flex;
    flex-direction: row;
    max-width: 100%;
    max-height: 100%;
    flex-wrap: wrap;
    overflow: scroll; 

`;

const Card = styled.div`
    position: relative;
    display: flex;
    flex-direction: column
    height: fit-content;
    width: 30%;
    min-width: 200px;
    max-width: 300px;
    max-height: 30rem;
    background-color: beige;
    margin: 0.5em;
    padding: 0.1em;
    border-radius: 0.3em;
    overflow: hidden;
    // -webkit-mask-image: linear-gradient(180deg, #000 70%, transparent);
    // -webkit-mask-repeat: no-repeat;
`;

const CardImage = styled.img`
    width: 100%;
`;

const CardTextContainer = styled.div`
    padding: 0.5em;
    // -webkit-mask-image: linear-gradient(180deg, #000 70%, transparent);
    // -webkit-mask-repeat: no-repeat;
    
    p {
        padding: 0pt;
        margin: 0pt;
    }
`;

const CardTitle = styled.h3`
    font-weight: bold;
    color: black;
    padding: 0.2em;
    font-size: medium;

`;

const CardDescription = styled.p`
    font-size: 0.8em;
    color: black;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;


const CardTagPanel = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    overflow-x: scroll;
    white-space: nowrap;
    height: 2.5em;
    font-size: small;
`;



function SkCard({ id, image_url, title, description, tags, tagClick }) {
    // CSS in React: https://www.w3schools.com/react/react_css.asp
    const cleanDescription = sanitizeHtml(description, { allowedTags: []})
    return (
        <Card>
            <a href={'/details/' + id} 
            style={{paddingBottom: tags?.length ? "2rem" : "0"}}
            >
                <CardImage className="card-image" src={image_url}/>
                <CardTextContainer className="card-text">
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className="card-description">{cleanDescription}</CardDescription>
                </CardTextContainer>
            </a>
            <CardTagPanel className="cardTagPanel">
            {
                tags.map((tagElement) => (
                    <div 
                        key={tagElement.slug}
                        className="proposedTag" 
                        onClick={() => tagClick(tagElement.slug)
                        }>
                        
                        <div>{tagElement.title}</div>
                    </div>
                ))
            }</CardTagPanel>
        </Card>
    );
}

export function renderCardCollection(initiatives, tagClick, tagSorting) {
    return <CardContainer>
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
                        <SkCard
                            key={initiativeElement.id}
                            title={title}
                            url={initiativeElement.url}
                            id={initiativeElement.id}
                            description={description}
                            image_url={initiativeElement.main_image_url}
                            tags={top_tags}
                            tagClick={tagClick}
                        />
                );
              }
             )
    }</CardContainer>;
}