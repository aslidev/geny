import Enquirer from 'enquirer'
import { walkDirSync } from './tools.js'
import micromatch from 'micromatch'
import { readdirSync } from 'fs'

let enquirer = new Enquirer()

export const createNewPrompt = () => {
    enquirer = new Enquirer()
}

/**
 * 
 * @param {Array|Object} inputs 
 */
export function prompt(inputs) {
    return enquirer.prompt(inputs)
}

export async function selectTemplate(rootDir) {

    // Get all templates directories
    const folders = readdirSync(rootDir, { withFileTypes: true })
        .filter((item) => item.isDirectory())
        .map((item) => item.name)

    // Get user selection
    const { template } = await prompt([{
        type: 'AutoComplete',
        name: 'template',
        required: true,
        message: 'Pick template ?',
        choices: folders.sort()
    }])

    return template
}

export async function selectTemplateVariant(templates) {

    // Get all names
    const templateVariantsNames = Object.keys(templates).filter(n => !templates[n].abstract)

    const { variant } = templateVariantsNames.length === 1 ? templates[templateVariantsNames[0]] : (await prompt({
        type: 'select',
        name: 'variant',
        message: 'Select template variant ?',
        choices: templateVariantsNames
    }))

    return variant
}

export async function getDistDir(selectedDir, filter) {
    // Get all sub directories
    const allSubDirs = micromatch(walkDirSync(selectedDir), filter)

    // Get user selection
    const { dist } = allSubDirs.length === 1 ? dir : (await prompt({
        type: 'select',
        name: 'dist',
        message: 'Destination Directory ?',
        choices: allSubDirs
    }))

    return dist
}