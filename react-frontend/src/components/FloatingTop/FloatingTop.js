import React from "react";
import styled from "styled-components";

const FloatContainer = styled.div`
    width: 100%;
    height: 15rem;
    display: flex;
    flex-direction: row;
    justify-content: center;
    padding-left: 5vw;
    padding-right: 5vw;
    position: relative;
    top: 40px;
`;

const StyledExample = styled.div`
    flex: 2; 
    display: flex;
    flex-direction: row;
    height: 100%; 
    margin-right: 10px;
    background-color: #fefefe;
    border-radius: 0.5rem;
    border: 2px solid lightgray;
    max-width: 800px;

    h3 {
        font-weight: bold;
    }
    
    .TextPart {
        flex: 2;
        .top-line {
            background-color: #f6f6f6;
            border-bottom: 1px solid lightgray;
            width: 100%
            display: flex: 
            flex-direction: row;
            padding-right: 1rem;
            padding-left: 1rem;
            justify-content: space-between;
            align-items: center;
            height: 3rem;
            text-align: center;
            
            .p {
                
            }
            .icon {
                margin-right: 0.5rem;
            }
            div {
                height: 100%;
            }
        }
        .content {
            padding-left: 1rem;
            padding-top: 0.3rem;
        }
    }

    .imageContainer {
        flex: 1;
        display: flex;
        img {
            object-fit: cover;
            overflow: none;
            flex: 1;
        }
    }
`;

const StyledInvolved = styled.div`
    flex: 1;
    height: 100%;
    max-width: 400px;
    background-color: green;
    border-radius: 0.5rem;
    border: 2px solid lightgray;
    color: white;
    padding: 1rem;

    h3 {
        font-weight: bold;
    }
    
    .ingress {
        font-weight: bold;
    }
`;

const ExampleThing = () => {
    return <StyledExample>
        <div className="TextPart">
            <div className="width-100 border-2 d-flex flex-row flex-between align-items-center top-line" >
                <div className="d-flex h-100 flex-row align-items-center left">
                    <p className="icon">(i)</p>
                    <p>Våxnäs, Karlstad</p>
                </div>
                <div className="buttons">
                    <button className="btn btn-light">{"<<"}</button>
                    <button className="btn btn-light">{">>"}</button>
                </div>
            </div>
            <div className="content">

                <h3>Myrorna</h3>
                <p className="bold">Second hand-butik med allt från smått till stort</p>
                <p>Myrorna är en butikskedja som säljer second hand me dbutiker över hela landet. Det finns även en Webbsohop | Myrorna. De tillhandahpller mycket kläder och husgeråd. Uppdraget är att spara på miljön...</p>
            </div>
        </div>
        <div className="imageContainer">
            <img src="https://picsum.photos/id/26/200/200"></img>
        </div>

    </StyledExample>
}

const GetInvolved = () => {
    return <StyledInvolved>
        <h3>Supporta kartan!</h3>
        <p>
            <span className="ingress">Bli månadsgivare idag! </span> 
            Vi är en ideell förening som utvecklar Smarta Kartan över hela Sverige, och vi behöver din hjälp!
        </p>
        <button type="button" className="btn btn-success bg-lightgreen text-white">Hjälp oss att växa</button>
    </StyledInvolved>
}

const FloatingTop = ({ children }) => {
    return (
    <FloatContainer>
        <ExampleThing>ExampleThing</ExampleThing>
        <GetInvolved>GetInvolved</GetInvolved>
    </FloatContainer>
    )
}


export default FloatingTop;
