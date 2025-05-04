import React from 'react'
import Icons from '../../../../../Components/Icons'
import CardTagComponent from '../../../../../Components/CardTagComponent'
import { enumColors } from '../../../../../Services/AllServices'
import { useState } from 'react'

const CoDescription = ({ mappingEnums, setShowOutCome, setShowCoDescription, existingDescList, actionItemData, actionItem, getExistingDescriptionList, status, reason }) => {
    const [isVisible, setIsVisible] = useState(true);
    const handleToggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    const sumOfTaxonomy = Object.keys(mappingEnums?.taxonomy?.values).reduce((acc, num) => parseInt(acc) + parseInt(num), 0);

    const totalTaxonomy = Object.keys(existingDescList).length;

    const taxonomies = Object.values(existingDescList).flatMap((courseOutcome) => courseOutcome.taxonomy).reduce((acc, item) => {
        acc[item.label.toUpperCase()] = (acc[item.label.toUpperCase()] || 0) + 1;
        return acc;
    }, {});

    let taxonomyWeightage = {}
    Object.entries(mappingEnums?.taxonomy?.descriptions).map(([value, label]) => {
        taxonomyWeightage[label] = taxonomies[label.toUpperCase()] ? taxonomies[label.toUpperCase()] * parseInt(value) : 0;
    })

    let bloomsTaxonomy = Object.values(taxonomyWeightage).reduce((sum, num) => parseInt(sum) + parseInt(num), 0);

    let bloomsTaxonomyIndex = bloomsTaxonomy / (sumOfTaxonomy * totalTaxonomy);


    return (
        <div className='col-md-12 col-lg-9 mx-auto'>
            <div className='d-flex justify-content-between align-items-center mb-3'>
                <div>CO List <span className={'ms-2 status-badge' + " " + enumColors[status]}>
                    {status === mappingEnums?.status?.REQUESTED_CHANGES && (
                        <span className="cursor-pointer" onClick={handleToggleVisibility}><Icons iconName="request-changes-one" className="icon-reason me-1" /></span>
                    )}
                    {mappingEnums?.status?.descriptions[status]}</span>
                </div>
                <div className='d-flex align-items-center'>
                    <div className='d-flex custom-card-tag'>
                        <div className="card-tag white purple mb-0">
                            <span className='card-tag-title'>Bloom's Taxonomy Index<span data-toggle="tooltip" title='BTI = ∑(RFᵢ × Wᵢ) / ∑Wᵢ'><Icons iconName="info" className="ms-2 icon-secondary icon-20 cursor-pointer"></Icons></span></span>
                            <span className='card-tag-count'>{bloomsTaxonomyIndex.toFixed(2)}</span>
                        </div>

                        <div className="card-tag w350 white purple mb-0">
                            <span className='card-tag-title'>Level of the Course<span data-toggle="tooltip" title='BTI < 0.5 - Lower Order Thinking , BTI ≥ 0.5 - Higher order Thinking' data-html={true}><Icons iconName="info" className="ms-2 icon-secondary icon-20 cursor-pointer"></Icons></span></span>
                            <span className='card-tag-count'>{bloomsTaxonomyIndex.toFixed(2) < 0.5 ? "Lower order Thinking" : "Higher Order Thinking"}</span>
                        </div>
                    </div>

                    {actionItem?.includes(actionItemData?.action?.EDIT) && <span>
                        <button className='btn font-s14 btn-info-outline px-3 ms-3' onClick={() => { setShowOutCome(true); setShowCoDescription(false); getExistingDescriptionList() }}>
                            <Icons iconName="edit" className="icon-16 icon-info me-1" />
                            Update</button>
                    </span>}
                </div>
            </div>
            <div>
                {isVisible && status === mappingEnums?.status?.REQUESTED_CHANGES && (
                    <div className='col-md-12 col-lg-12 mx-auto reason-content mb-3'>
                        {reason}
                    </div>
                )}
            </div>
            <div className='card spacing-card'>
                <div className='card-body p-4'>
                    <table className="table spacing-table outcomes">
                        <thead className='pb-2'>
                            <tr className='co-header'>
                                <th className='text-center' width="10%">CO</th>
                                <th className='text-center' width="40%">Description</th>
                                <th className='text-center' width="30%">Taxonomy</th>
                                <th className='text-center' width="20%">Weightage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(existingDescList).map(([key, value]) => (
                                <tr>
                                    <td><span className='tag-info font-s14'>{key}</span></td>
                                    <td className='text-justify'>{value.description}</td>
                                    <td className='text-center'> {value.taxonomy.map((x) => x.label).join(", ")}</td>
                                    <td className='text-center'>{value.weightage}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >

    )
}

export default CoDescription