import React from 'react';

const OutlineButton = ({ children, onClick }) => {
    return (<button className="btn btn-outline-light ml-2" onClick={onClick} >{children}</button>)
}

export default OutlineButton