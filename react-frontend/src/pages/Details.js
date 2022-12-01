import React from 'react';
import {useParams} from "react-router-dom";

const Details = () => {
    const {initiativeId} = useParams();
    return <h2>Details page, initiative ID: {initiativeId}</h2>;
};
export default Details;
