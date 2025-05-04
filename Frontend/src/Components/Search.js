import React, { useMemo } from 'react';
import debounce from 'lodash.debounce';

const Search = ({ getData, disabled }) => {

    const searchFieldForm = (value) => {
        if (value.length > 2) {
            sessionStorage.setItem('search', value);
            getData(true);
        } else if (value.length == 0) {
            sessionStorage.removeItem('search');
            getData(true);
        }
    }

    const handleChange = (e) => {
        searchFieldForm(e.target.value.trim());
    };

    const debouncedResults = useMemo(() => {
        return debounce(handleChange, 200);
    }, []);

    return (
        <>
            <input type="text" autocomplete="off" className="form-control search-input" disabled={disabled}
                onChange={debouncedResults} id="mySearchBoxone" placeholder="Search here..." />
        </>
    )
}

export default Search;