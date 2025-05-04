import React, { useState } from 'react';

function Footer() {
    const date = new Date();
    let year = date.getFullYear();
    const [currentYear] = useState(year);

    return (
        <div className="footer text-center" id="footer">
            &#169; {currentYear} - All Rights Reserved.
        </div>
    );
}

export default Footer;