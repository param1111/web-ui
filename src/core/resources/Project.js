import { BranchDescriptor } from './Branch';
import { getProperty } from '../util/Api';
import { HATEOASReferences } from '../util/HATEOAS';
import { sortByName } from '../util/Sort';


/**
 * Set of commands that are supported by the workflow engine which is associated
 * with a curation project. Each command represents a module specification that
 * can be used to define modules in a workflow (-> cells in a notebook). We
 * sometimes refer to a command specification as module.
 *
 * Each command specification belongs to a package and has an indentifier that
 * is unique in the package. In the registry we use the combination of package
 * identifier and command identifier as module (spec.) identifier.
 *
 * The module registry has the following main components:
 *
 * .module: Associative array that provides access to modules by their id.
 * .package: Associative array that provides access to module packages. Each
 *   package in turn is an list of modules in that package.
 * .types: List pf package identifier
 */
class ModuleRegistry {
    constructor(commands) {
        this.module = []
        this.package = []
        this.types = new Set()
        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i]
            this.module[moduleId(cmd)] = cmd
            if (this.types.has(cmd.type)) {
                this.package[cmd.type].push(cmd)
            } else {
                this.package[cmd.type] = [cmd]
                this.types.add(cmd.type)
            }
        }
    }
}


/**
 * Metadata for a vizier data curation project (i.e., a VizTrail). Contains the
 * project id, name, links and list of descriptors for project branches.
 *
 * The project currently also contains the registry of available modules for
 * workflows and the listing of files on the file server (for display in module
* forms, e.g., LOAD DATASET). At least e latter is supposed to change in the
* future.
 */
export class ProjectHandle {
    constructor(id, name, links, environment, branches) {
        this.id = id;
        this.name = name;
        this.links = links;
        this.environment = environment;
        this.branches = branches;
    }
    /**
     * Initialize the object properties from a Json object that is returned by
     * Web API calls that return a ProjectHandle.
     */
    fromJson(json) {
        this.id = json.id;
        this.name = getProperty(json, 'name');
        this.links = new HATEOASReferences(json.links);
        // The environment object contains a registry of modules that are
        // available for workflows (i.e., in notebook cells) and a list of
        // file handles ((id,name)-pairs) on the file server.
        this.environment = {
            modules: new ModuleRegistry(json.environment.modules),
            files: sortByName(json.environment.files)
        };
        // List of project branchs (sorted by name)
        this.branches = [];
        for (let i = 0; i < json.branches.length; i++) {
            this.branches.push(new BranchDescriptor().fromJson(json.branches[i]));
        }
        sortByName(this.branches);
        return this;
    }
    /**
     * Create a copy of the project handle where the branch listing is modified
     * so that it contains the given branch instead of an outdated one.
     */
    updateBranch(branch) {
        const { id, name, links, environment, branches } = this;
        // Create a modified branch listing
        const modBranches = [];
        for (let i = 0; i < branches.length; i++) {
            const br = branches[i];
            if (br.id === branch.id) {
                modBranches.push(branch);
            } else {
                modBranches.push(br);
            }
        }
        return new ProjectHandle(id, name, links, environment, modBranches);
    }
    /**
     * Create a copy of the project handle with a modified name.
     */
    updateName(name) {
        const { id, links, environment, branches } = this;
        return new ProjectHandle(id, name, links, environment, branches);
    }
}


// -----------------------------------------------------------------------------
// Project page resource
// -----------------------------------------------------------------------------

// Resource content types
const CONTENT_CHART = 'CONTENT_CHART';
const CONTENT_DATASET = 'CONTENT_DATASET';
const CONTENT_ERROR = 'CONTENT_ERROR';
const CONTENT_HISTORY = 'CONTENT_HISTORY';
const CONTENT_NOTEBOOK = 'CONTENT_NOTEBOOK';


/**
 * Wrapper for the project resource. The resource captures one of the following
 * content types: Notebook, Branch History, Spreadsheet, Chart view, or Error.
 * The .type property contains the type information while the .content contains
 * the type specific content.
 */
export class ProjectResource {
    /**
     * Constructor expects the content type information and a type-specific
     * content object.
     */
    constructor(contentType, content) {
        this.contentType = contentType;
        this.content = content;
    }
    /**
     * Various flags to check the type of the content.
     */
    isChart = () => (this.contentType === CONTENT_CHART);
    isDataset = () => (this.contentType === CONTENT_DATASET);
    isError = () => (this.contentType === CONTENT_ERROR);
    isHistory = () => (this.contentType === CONTENT_HISTORY);
    isNotebook = () => (this.contentType === CONTENT_NOTEBOOK);
}


// Shortcuts for different content types
export const BranchHistoryResource = (history) => (new ProjectResource(CONTENT_HISTORY, history));
export const ChartResource = (name, dataset) => (new ProjectResource(CONTENT_CHART, {name, dataset}));
export const ErrorResource = (title, module) => (new ProjectResource(CONTENT_ERROR, {title, module}));
export const NotebookResource = (notebook) => (new ProjectResource(CONTENT_NOTEBOOK, notebook));
export const SpreadsheetResource = (dataset) => (new ProjectResource(CONTENT_DATASET, dataset));


// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

/**
 * Use the combination of module type and type-dependent module identifier as
 * a unique module identifier. Module is a command specification returned by
 * the Web API.
 */
export const moduleId = (module) => (module.type + ':' + module.id)