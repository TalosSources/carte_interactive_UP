import React, { PropsWithoutRef } from 'react';

type PropTypes = { 
    children: string; 
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; 
}


const OutlineButton = ({ children, onClick }: PropTypes) => {
    return (<button className="btn btn-outline-light ml-2" onClick={onClick} >{children}</button>)
}

export default OutlineButton