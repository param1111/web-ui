/**
 * Copyright (C) 2018 New York University
 *                    University at Buffalo,
 *                    Illinois Institute of Technology.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Grid, List } from 'semantic-ui-react';
import {Controlled as CodeMirror} from 'react-codemirror2'
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/clike/clike';
import '../../../../../css/App.css';
import '../../../../../css/ModuleForm.css';


/**
* A Scala command cell contains a text field for the command content and a
* submit button.
*/


const WITH_DATASET = 'WITH_DATASET';
const OUTPUT_ANNOTATIONS = 'OUTPUT_ANNOTATIONS';
const OUTPUT_COLUMN_NAMES = 'OUTPUT_COLUMN_NAMES';
const OUTPUT_CELL_VALUES = 'OUTPUT_CELL_VALUES';


class ScalaCodeSnippetsSelector extends React.Component {
    static propTypes = {
        onSelect: PropTypes.func.isRequired
    }
    /**
     * Depending on the selected list item pass code snippet to controlling
     * elements. Assumes the the .onSelect() method expects a list of code
     * lines.
     */
    handleSelect = (e, { value }) => {
        const { onSelect } = this.props;
        let lines = [];
        if (value === WITH_DATASET) {
            lines.push('// do something with a dataset with given name.');
            lines.push('vizierdb.withDataset("unique-ds-name", ds => { //do things with ds here })');
        } else if (value === OUTPUT_ANNOTATIONS) {
            lines.push('vizierdb.outputAnnotations("unique-ds-name")');
        } else if (value === OUTPUT_COLUMN_NAMES) {
            lines.push('//Iterate over list of dataset columns and print column name');
            lines.push('ds.schema.map(se => se._1).mkString("<br>")');
        } else if (value === OUTPUT_CELL_VALUES) {
            lines.push('//Iterate over list of dataset rows and print cell value.')
            lines.push('ds.toList.map(row => row.tuple.mkString(",")).mkString("<br>")');
        } 
        onSelect(lines);
    }
    render() {
        return (
            <div className='snippet-selector'>
                <Grid columns={4} divided>
                    <Grid.Row>
                        <Grid.Column width={4} key='output'>
                            <List link>
                                <List.Item>
                                    <List.Header><Icon name='desktop' /> Access & Output</List.Header>
                                </List.Item>
                                <List.Item value={WITH_DATASET} onClick={this.handleSelect}>
                                    <List.Content as='a'>Get Dataset</List.Content>
                                </List.Item>
                                <List.Item value={OUTPUT_COLUMN_NAMES} onClick={this.handleSelect}>
                                    <List.Content as='a'>Print Column Names</List.Content>
                                </List.Item>
                                <List.Item value={OUTPUT_CELL_VALUES} onClick={this.handleSelect}>
                                    <List.Content as='a'>Print Cell Values</List.Content>
                                </List.Item>
                                <List.Item value={OUTPUT_ANNOTATIONS} onClick={this.handleSelect}>
                                    <List.Content as='a'>Print Cell Annotations</List.Content>
                                </List.Item>  
                            </List>
                        </Grid.Column>
                        <Grid.Column width={4} key='new'>
                            <List link>
                                <List.Item>
                                    <List.Header><Icon name='plus' /> New</List.Header>
                                </List.Item>
                            </List>
                        </Grid.Column>
                        <Grid.Column width={4} key='update'>
                            <List link>
                                <List.Item>
                                    <List.Header><Icon name='edit' /> Update</List.Header>
                                </List.Item>
                            </List>
                        </Grid.Column>
                        <Grid.Column width={4} key='delete'>
                            <List link>
                                <List.Item>
                                    <List.Header><Icon name='trash' /> Delete</List.Header>
                                </List.Item>
                            </List>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        )
    }
}

class ScalaCell extends React.Component {
    static propTypes = {
        id: PropTypes.string.isRequired,
        value: PropTypes.string,
        onChange: PropTypes.func.isRequired
    }
    constructor(props) {
        super(props);
        const { value } = props;
        this.state = {editorValue: value, snippetSelectorVisible: false};
    }
    /**
     * Append a code snippet to the current editor value. The code snippet is
     * expected to be a list of strings (code lines).
     *
     * Tries to determine the current indent from the last line tin the current
     * editor value.
     */
    appendCode = (lines) => {
        const { id, onChange } = this.props;
        const  { editorValue } = this.state;
        // Get the current indent from the last line of the editor value
        let indent = '';
        let script = editorValue.split('\n');
        if (script.length > 0) {
            const lastLine = script[script.length - 1];
            let i = 0;
            while (i < lastLine.length) {
                const c = lastLine.charAt(i);
                if ((c === ' ') || (c === '\t')) {
                    i++;
                } else {
                    break;
                }
            }
            indent = lastLine.substring(0, i);
        }
        // Append the given lines to the current value of the editor (indentent
        // based on the indent of the current last line).
        let value = editorValue;
        // Insert an empty line for readability if the current script is not
        // empty.
        if (value !== '') {
            value += '\n';
        }
        for (let i = 0; i < lines.length; i++) {
            // If the current editor value is empty do not append a new line at
            // the start.
            if ((i !== 0) || (value !== '')) {
                value += '\n';
            }
            value += indent + lines[i];
        }
        // Update the local state and propagate the change to the conrolling
        // notebook cell
        this.setState({editorValue: value});
        onChange(id, value);
        // Hide the snippet selector
        this.toggleSnippetSelector();
    }
    /**
     * Handle changes in the code mirror editor. Keep track of the editor value
     * locally and propagate the state change to the conrolling notebook cell
     * input form..
     */
    handleChange = (value) => {
        const { id, onChange } = this.props;
        this.setState({editorValue: value});
        onChange(id, value);
    }
    /**
     * Show the code editor and optionally the code snippet selector.
     */
    render() {
        const  { editorValue, snippetSelectorVisible } = this.state;
        let headerCss = '';
        let selectorPanel = null;
        if (snippetSelectorVisible) {
            headerCss = ' expanded';
            selectorPanel = <ScalaCodeSnippetsSelector onSelect={this.appendCode}/>
        }
        return (
            <div>
                <div className='scala-examples'>
                    <div className={'snippet-header' + headerCss}>
                        <Icon name='help circle' color='blue' onClick={this.toggleSnippetSelector} />
                        <span className='left-padding-sm' onClick={this.toggleSnippetSelector}>
                            Code examples for dataset manipulation
                        </span>
                    </div>
                    { selectorPanel }
                </div>
                <div className='editor-container'>
                    <CodeMirror
                        value={editorValue}
                        options={{
                            lineNumbers: true,
                            mode: 'text/x-scala',
                            indentUnit: 4
                        }}
                        onBeforeChange={(editor, data, value) => {
                            this.handleChange(value);
                        }}
                        onChange={(editor, data, value) => {
                        }}
                    />
                </div>
            </div>
        );
    }
    toggleSnippetSelector = () => {
        const  { snippetSelectorVisible } = this.state;
        this.setState({snippetSelectorVisible: !snippetSelectorVisible});
    }
}

export default ScalaCell