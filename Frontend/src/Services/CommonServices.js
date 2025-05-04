import { useState, useCallback, useEffect } from 'react';
import debounce from 'lodash.debounce';

/**
   * Custom hook to manage Pagination
   * @param data
*/

export const usePagination = (data, dataLimit) => {
    const [selectedDataList, setSelectedDataList] = useState(dataLimit.limit);
    const [pagination, setPagination] = useState({ limit: dataLimit.limit, skip: dataLimit.skip, currentPage: 1, totalRecords: data.totalRecords });
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationFunction, setPaginationFunction] = useState(1);

    const totalPages = Math.ceil(data.totalRecords / (selectedDataList < 1 ? 1 : selectedDataList));

    /* Handle page increment */
    const handleNextPage = useCallback(() => {
        if (currentPage < totalPages) {
            const newSkip = pagination.skip + selectedDataList;
            setPagination({ ...pagination, skip: newSkip, currentPage: currentPage + 1 });
            setCurrentPage(currentPage + 1);
            setPaginationFunction(paginationFunction + 1);
        }
    }, [currentPage, totalPages, pagination, selectedDataList, paginationFunction]);

    /* Handle page decrement */
    const handlePreviousPage = useCallback(() => {
        if (currentPage > 1) {
            const newSkip = pagination.skip - selectedDataList;
            setPagination({ ...pagination, skip: newSkip, currentPage: currentPage - 1 });
            setCurrentPage(currentPage - 1);
            setPaginationFunction(paginationFunction + 1);
        }
    }, [currentPage, pagination, selectedDataList, paginationFunction]);

    /* Function to handle input change */
    const handleChange = useCallback((e) => {
        let page = parseInt(e.target.value, 10) || 1;
        if (page < 1) page = 1;
        setSelectedDataList(page);
        setPagination({ limit: page, skip: 0, currentPage: 1, totalRecords: data.totalRecords });
        setCurrentPage(1);
        setPaginationFunction(paginationFunction + 1);
    }, [data.totalRecords, paginationFunction]);

    const debouncedHandleChange = useCallback(debounce(handleChange, 200), [handleChange]);

    useEffect(() => {
        return () => {
            debouncedHandleChange.cancel();
        };
    }, [debouncedHandleChange]);

    const handleInputChange = (e) => {
        debouncedHandleChange(e);
    };

    return { paginationFunction, handleNextPage, handlePreviousPage, handleInputChange, totalPages, pagination, setPagination, selectedDataList, setSelectedDataList, currentPage, setCurrentPage }

}

/**
   * Custom hook to manage Checkbox
   * @param records && @param setRecords
*/
export const useCheckbox = (setRecords) => {

    const [bulkOpContext, setBulkOpContext] = useState({
        selectAll: false,
        uncheckedSelectedItems: [],
        selectedItems: []
    });

    const [selectedItemsCount, setSelectedItemsCount] = useState(0);

    const checkboxAllFunction = (type) => {
        setRecords((records) => records.map(item => ({ ...item, isChecked: type })));
    };

    const checkboxSingleFunction = (type, id) => {
        setRecords((records) => records.map(item => (item._id === id) ? ({ ...item, isChecked: type }) : item));
    };

    const handleSelectAllChange = useCallback((e) => {
        const checked = e.target.checked;

        setBulkOpContext({
            selectAll: checked,
            uncheckedSelectedItems: [],
            selectedItems: []
        });

        checkboxAllFunction(checked);
    }, []);

    const handleCheckboxChange = useCallback((e, id) => {
        const checked = e.target.checked;
        setBulkOpContext((bulk) => {
            const newBulk = { ...bulk };

            if (newBulk.selectAll) {
                if (!checked) {
                    newBulk.uncheckedSelectedItems.push(id);
                } else {
                    newBulk.uncheckedSelectedItems = newBulk.uncheckedSelectedItems.filter(itemId => itemId !== id);
                }
            } else {
                if (checked) {
                    newBulk.selectedItems.push(id);
                } else {
                    newBulk.selectedItems = newBulk.selectedItems.filter(itemId => itemId !== id);
                }
            }

            setSelectedItemsCount(newBulk.selectedItems.length);
            return newBulk;
        });

        checkboxSingleFunction(checked, id);
    }, []);

    const checkboxFunction = useCallback(() => {
        if (!bulkOpContext.selectAll) {
            checkboxAllFunction(false);

            if (bulkOpContext.selectedItems.length) {
                setRecords((records) => records.map((item) => {
                    if (bulkOpContext.selectedItems.includes(item._id)) {
                        item.isChecked = true;
                    }
                    return item;
                }));
            }
        } else {
            checkboxAllFunction(true);

            if (bulkOpContext.uncheckedSelectedItems.length) {
                setRecords((records) => records.map((item) => {
                    if (bulkOpContext.uncheckedSelectedItems.includes(item._id)) {
                        item.isChecked = false;
                    }
                    return item;
                }));
            }
        }
    }, [bulkOpContext]);

    return { checkboxFunction, handleCheckboxChange, handleSelectAllChange, bulkOpContext, selectedItemsCount }
}

/**
   * Custom hook to manage Filter
   * @param data
*/
export const useFilter = () => {
    const [filter, setFilter] = useState({});

    const loadFilterOption = useCallback((event, value, scope) => {
        const { checked } = event.target;
        setFilter(prevFilters => {
            const updatedFilters = { ...prevFilters };

            if (!updatedFilters[scope]) {
                updatedFilters[scope] = [];
            }

            if (checked) {
                updatedFilters[scope].push(value);
            } else {
                updatedFilters[scope] = updatedFilters[scope].filter(item => item !== value);
                if (updatedFilters[scope].length === 0) {
                    delete updatedFilters[scope];
                }
            }
            return updatedFilters;
        });
    }, []);

    const loadDateFilter = useCallback((selectedDate, scope) => {
        setFilter(prevFilters => {
            const updatedFilters = { ...prevFilters };
            updatedFilters[scope] = selectedDate;

            return updatedFilters;
        });
    }, []);

    const clearSelectedFilter = useCallback((scope) => {
        setFilter(prevFilters => {
            const updatedFilters = { ...prevFilters };
            delete updatedFilters[scope];
            return updatedFilters;
        });
    }, []);

    const clearAllFilter = useCallback(() => {
        const checkboxes = document.querySelectorAll('.filter-container input[type="checkbox"], .filter-container input[type="radio"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        setFilter({});
    }, []);

    return { loadFilterOption, clearSelectedFilter, clearAllFilter, loadDateFilter, filter, setFilter };
};

// Custom hook to manage Sorting
export const useSorting = () => {
    const [sortingData, setSortingData] = useState({});

    const tableSorting = useCallback((e, modelName) => {
        const thElements = document.querySelectorAll('th.sorting');
        const thisEvent = e.target;
        const currentSort = thisEvent.dataset.sort;

        thElements.forEach(th => {
            th.classList.remove('ascending', 'descending');
            th.removeAttribute('data-sort');
        });

        const newSort = currentSort === '1' ? '-1' : '1';
        thisEvent.dataset.sort = newSort;
        thisEvent.classList.add(newSort === '1' ? 'ascending' : 'descending');

        setSortingData({ [modelName]: parseInt(newSort) });
    }, []);

    return { tableSorting, sortingData };

}
