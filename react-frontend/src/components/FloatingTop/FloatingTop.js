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


const FloatingTop = ({ children }) => {
    return (
    <FloatContainer>
        {children}
    </FloatContainer>
    )
}


export default FloatingTop;
