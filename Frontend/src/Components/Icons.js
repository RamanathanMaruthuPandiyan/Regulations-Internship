import React from 'react';
import SpriteSVG from '../Assets/images/sprites.svg';

const Icons = ({ iconName, className }) => {
    return (
        <svg className={"icons " + className}>
            <use xlinkHref={SpriteSVG + "#" + iconName}></use>
        </svg>
    )
}

export default Icons