import React, {useState, useEffect} from "react"
import {Tab, Button, Label} from "semantic-ui-react";
import ModuleFormControl from "./form/ModuleFormControl";
import {DT_CODE, DT_FILE_ID} from "../../../resources/Engine";
import PropTypes from 'prop-types';

LoadDatasetForm.propTypes = {
    selectedCommand: PropTypes.object.isRequired,
    datasets: PropTypes.array.isRequired,
    selectedDataset:PropTypes.object,
    serviceProperties: PropTypes.object.isRequired,
    values: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
};

/**
 * Creates a Load Dataset Form with internal state management per tab/source type
 */
export default function LoadDatasetForm(props) {
    const {selectedCommand, datasets, selectedDataset, serviceProperties, values, onChange} = props;

    const initialState = {
        "name":null,
        "file":{"fileid":null,"filename":null,"url":null},
        "loadFormat":"csv",
        "schema":[],
        "loadInferTypes":false,
        "loadDetectHeaders":false,
        "loadDataSourceErrors":false,
        "loadOptions":[]
    };

    const [localSourceState, setLocalSourceState] = useState(initialState);
    const [remoteSourceState, setRemoteSourceState] = useState(initialState);
    const [activeIndexValue,setActiveIndex] = useState(null);

    const state = [localSourceState, remoteSourceState];
    const setState = [setLocalSourceState, setRemoteSourceState];

    /**
     * Load cell state values into the form when rendering an existing cell
     */
    useEffect(()=> {
        if(values["file"]["url"]===null){
            setState[0](values);
            setActiveIndex(0);
        }else{
            setState[1](values);
            setActiveIndex(1);
        }
    },[]);

    /**
     * Update local tab state and cell state on form update
     */
    const handleValueChange = (id, value) => {
        setState[activeIndexValue]({
            ...state[activeIndexValue],
            [id]:value,
        });
        onChange(id, value)
    };

    /**
     * Overwrite cell state with new tab state when tab switched
     */
    useEffect(()=>{
        onChange("bulk", state[activeIndexValue])
    },[activeIndexValue]);

    const panes = [
        { menuItem:<Label size="large" content="From Local Machine" icon='computer' />, render: ()=> <Tab.Pane>{
                <LoadFormPane
                    datasets = {datasets}
                    selectedDataset={selectedDataset}
                    serviceProperties={serviceProperties}
                    selectedCommand={selectedCommand}
                    tabState={localSourceState}
                    isUrlPane={false}
                    onChange={handleValueChange}
                />}</Tab.Pane>},
        { menuItem: <Label size="large" content='From the Internet' icon='world' />, render: ()=> <Tab.Pane>{
                <LoadFormPane
                    datasets = {datasets}
                    selectedDataset={selectedDataset}
                    serviceProperties={serviceProperties}
                    selectedCommand={selectedCommand}
                    tabState={remoteSourceState}
                    isUrlPane={true}
                    onChange={handleValueChange}
                />}</Tab.Pane>}
    ];

    return <Tab
        activeIndex={activeIndexValue}
        onTabChange={(e, {activeIndex}) => setActiveIndex(activeIndex)}
        panes={panes} />
}

/**
 * Internal component to create panes for Local and Remote Sources
 */
const LoadFormPane = (props) => {
    const {datasets,
        selectedDataset,
        serviceProperties,
        selectedCommand,
        tabState,
        isUrlPane,
        onChange} = props;

    let cssTable = 'form-table wide';
    let components = [];

    const [showingAdvancedOptions, setShowingAdvancedOptions] = useState(false);

    const toggleAdvanced = () => setShowingAdvancedOptions(prevState => !prevState);

    const toggleAdvancedOptionsButton = () => <Button
        onClick={toggleAdvanced}
        basic
        content={`${showingAdvancedOptions?'Hide':'Show'} Advanced Options`}
    />;

    for (let i = 0; i < selectedCommand.parameters.length; i++) {
        let para = selectedCommand.parameters[i];

        // create a url selector instead of a file selector when required
        if (isUrlPane === true && para.datatype === DT_FILE_ID){
            para = { "datatype": "url", "hidden": false, "id": "file", "index": 1, "name": "URL","required": true }
        }

        let cssAdvancedOption = 'form-options';
        if(!(['name','file','loadFormat'].includes(para.id))){
            !showingAdvancedOptions ? cssAdvancedOption += '-advanced-hidden':cssAdvancedOption += '-advanced'
        }

        if ((para.parent == null) && (para.hidden !== true) && (para.datatype !== DT_CODE)) {
            components.push(
                <tr key={para.id} className={cssAdvancedOption}>
                    <td className='form-label'>{para.name}</td>
                    <td className='form-control'>
                        <ModuleFormControl
                            key={para.id}
                            controlSpec={para}
                            datasets={datasets}
                            selectedDataset={selectedDataset}
                            serviceProperties={serviceProperties}
                            value={tabState[para.id]}
                            onChange={onChange}
                        />
                    </td>
                </tr>
            );
        }
    }

    return <React.Fragment><table className={cssTable}>
        <tbody>{components}</tbody>
    </table>
        <div className="form-add-button">{toggleAdvancedOptionsButton()}</div>
    </React.Fragment>
};