/**
 * Set application routes. The baseHref points to the application home. Route
 * projectHref points to the web page for individual projects.
 */
let href = '';
if (process.env.NODE_ENV === 'production') {
    href = href + 'vizier-db';
}
export const baseHref = '/' + href;
export const projectHref = baseHref + 'projects/:project_id';


/**
 * Key codes
 */

export const KEY = {
    DOWN: 40,
    ENTER: 13,
    ESC: 27,
    LEFT: 37,
    RIGHT: 39,
    UP: 38,
    TAB: 9
};

/**
 * Directions
 */

export const MOVE = {
    DOWN: 0,
    LEFT: 1,
    RIGHT: 2,
    UP: 3
}


/*
 * Name validity function that returns true if a given value is not equal to
 * a string that is empty or only contains whitespaces.
 */
export const isNotEmptyString = (name) => (name.trim() !== '');


/*
 * Position validity function that returns true if a given value is a
 * non-negative integer.
 */
export const isNonNegativeInt = (value) => {
    return (value && !/[^\d]/.test(value));
};


/**
 * Generate url to show a particular workflow version in the app.
 */
export const pageUrl = (projectId, branch, version, module) => {
    let link = baseHref + 'projects/' + projectId;
    if (branch != null) {
        link += '?branch=' + branch;
        if (version != null) {
            link += '&version=' + version;
            if (module) {
                link += '&module=' + module;
            }
        }
    } else if (version != null) {
        link += '?version=' + version;
    }
    return link;
}


/**
 * Return given value or default value if value is null or undefined.
 */
export const valueOrDefault = (val, defaultValue) => ((val != null) ? val : defaultValue);