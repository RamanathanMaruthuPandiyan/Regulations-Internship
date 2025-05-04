import React from 'react'

const CardTagComponent = ({parentClass, title, count}) => {
    return (
        <div className={"card-tag " + parentClass}>
            <span className='card-tag-title'>{title}</span>
            <span className='card-tag-count'>{count}</span>
        </div>
    )
}

export default CardTagComponent;