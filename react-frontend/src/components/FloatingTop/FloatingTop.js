import React from "react";
import styled from "styled-components";

const FloatContainer = styled.div`
    width: 100%;
    height: 20rem;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    padding-left: 5vw;
    padding-right: 5vw;
    position: relative;
    top: 40px;
`;

const ExampleThing = styled.div`
    flex: 2; 
    height: 20rem; 
    margin-right: 10px;
    background-color: gray;
`;

const GetInvolved = styled.div`
    flex: 1;
    height: 20rem;
    background-color: green;
`;

const FloatingTop = () => {
    return (
    <FloatContainer>
        <ExampleThing>ExampleThing</ExampleThing>
        <GetInvolved>GetInvolved</GetInvolved>
    </FloatContainer>
    )
}


export default FloatingTop;
