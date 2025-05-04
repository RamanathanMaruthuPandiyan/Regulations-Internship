import React, { useState, useEffect } from "react";
import Select, { components } from "react-select";

const MultiValueToolTip = (props) => {
  const { options } = props.selectProps;

  const outerOption = options.find(option =>
    option.options.some(opt => opt.value === props.data.value)
  );

  const selectedLabel = outerOption ? outerOption.label : '';

  return (
    <components.MultiValue {...props}>
      <span title={selectedLabel} style={{ pointerEvents: 'auto' }}>
        {props.children}
      </span>
    </components.MultiValue>
  );
};

const Selector = (props) => {
  const [searchValue, setSearchValue] = useState('');

  const [value, setValue] = useState([]);

  useEffect(() => {
    if (props.fixedValues) {
      const fixedOptions = props.fixedValues.map(opt => ({ ...opt, isFixed: true }));
      setValue(fixedOptions);
    }
  }, [props.fixedValues]);

  const selectStyles = {
    valueContainer: (base) => ({
      ...base,
      padding: '1px 6px 3px'
    }),

    control: (base) => ({
      ...base,
      fontSize: '14px',
      padding: '0px 5px',
      margin: 0,
      minHeight: '36px',
      border: '1px solid #D0D5DD !important',
      boxShadow: '0px 1px 2px 0px #1018280D',
      '&:focus': {
        border: '1px solid #217EFD !important',
        boxShadow: '0px 1px 2px 0px #10182826, 0px 0px 0px 1px #10182833',
      },
      ':hover': {
        border: '1px solid #217EFD !important',
        boxShadow: '0px 1px 2px 0px #10182826, 0px 0px 0px 1px #10182833',
      },
    }),

    option: (base) => ({
      ...base,
      fontSize: '14px',
      zIndex: 99999,
      backgroundColor: '#FFFFFF',
      color: '#101828',
      cursor: false ? 'not-allowed' : 'pointer',
      ':hover': {
        color: '#101828',
        backgroundColor: '#f1f1f1',
      },
    }),

    multiValue: (base) => ({
      ...base,
      backgroundColor: '#FCFCFC',
      padding: '0.2rem 0.3rem',
      border: '1px solid #006afb !important',
      marginRight: '5px',
      borderRadius: '6px',
      color: '#006afb !important',
      '': {
        padding: '2px 3px !important'
      },
      div: {
        color: '#196BDB !important',
        paddingRight: '14px'
      },
      ':hover': {
        color: 'white',
      },
    }),

    groupHeading: (base) => ({
      ...base,
      fontSize: '12.7px',
      marginBottom: "5px",
      marginTop: "-10px",
      padding: '5px 10px',
      backgroundColor: '#FCFCFC',
    }),

    multiValueLabel: (base) => ({
      ...base,
      padding: '0px 3px',
    }),

    multiValueRemove: (base, { selectProps, data }) => ({
      ...base,
      display: (selectProps.isDisabled || data.isFixed) ? 'none' : 'flex',
      color: "#D0D5DD",
      marginLeft: '5px',
      minHeight: 'auto !important',
      padding: '0 2px 0 2px !important',
      marginRight: '-4px',
      opacity: '0.75',
      borderLeft: '1px solid #D0D5DD !important',
      svg: {
        fill: "#B0B4B9",
      },
      ':hover': {
        color: '#D0D5DD',
        backgroundColor: '#e4e4e4',
        opacity: '1',
        borderRadius: '3px',
      },
    }),
  }

  const handleChange = (newValue, actionMeta) => {
    switch (actionMeta.action) {
      case 'remove-value':
      case 'pop-value':
        if (actionMeta.removedValue?.isFixed) {
          return;
        }
        break;
      case 'clear':
        newValue = value.filter(v => v.isFixed);
        break;
      default:
        break;
    }
    setValue(newValue);
    props.onChange && props.onChange(newValue, actionMeta);
  };

  const showClearButton = Array.isArray(value) ? value.some(v => !v.isFixed) : "";

  return (
    <Select
      isMulti={props.isMulti}
      placeholder={props.placeholder}
      isLoading={props.isLoading}
      isClearable={props.isClearable ? props.isClearable : showClearButton}
      isSearchable={props.isSearchable}
      value={props.value}
      name={props.name}
      options={props.options}
      className={props.className}
      closeMenuOnSelect={props.closeMenuOnSelect}
      classNamePrefix={props.prefixClassName}
      styles={selectStyles}
      id={props.id}
      onChange={handleChange}
      onBlur={props.onBlur}
      isDisabled={props.disabled}
      components={props.components ? { MultiValue: MultiValueToolTip } : ""}
      inputValue={props.manageSearchValue ? searchValue : undefined}
      onInputChange={(value, actionMeta) => {
        if (props.manageSearchValue && actionMeta.action !== 'menu-close' && actionMeta.action !== 'set-value') {
          setSearchValue(value);
        }
      }}
    />
  )
}

export default Selector;