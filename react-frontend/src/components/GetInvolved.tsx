import React from "react";
import styled from "styled-components";

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

export default GetInvolved;