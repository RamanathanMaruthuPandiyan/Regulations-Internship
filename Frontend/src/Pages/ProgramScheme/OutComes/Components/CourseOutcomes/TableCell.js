import React from 'react';

const TableCell = ({ level, onClick, className }) => {

    return (
        <td onClick={onClick} style={{ pointerEvents: level ? 'auto' : 'none' }}>
            <a className={className}>
                {level && <span>{level}</span>}
            </a>
        </td>
    );
};

export default TableCell;