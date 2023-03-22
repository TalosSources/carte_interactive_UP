import React from 'react';

const TopTagButton = ({ tagElement }) => {
    return (
        <button 
        type="button" 
        className="btn btn-light mr-2 mt-2" 
        style={{minWidth: "150px"}}
        onClick={() => navigate(`/tag/${tagElement.id}`)}>
        <span></span>{tagElement.title}
    </button>
    )
}

export default TopTagButton;