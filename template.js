import { prompt, createNewPrompt } from './inputs.js'
import { paramCase } from 'change-case'
import * as changeCase from "change-case"
import chalk from 'chalk'
import { basename, dirname } from 'path'
import copy from 'recursive-copy'
import through from 'through2'
import gracefulFs from 'graceful-fs'
import { renderFileContent } from './tools.js'
const { existsSync, mkdirSync, renameSync, writeFileSync, readFileSync } = gracefulFs
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
import Pref from 'execution-time'
const pref = Pref()

// Get scope and src folder
const [scope, ...sources] = process.argv.splice(2)
if (!sources || sources.length === 0) {
    throw new Error('You must select a source folder/files.')
}

const templatesRoot = `${process.cwd()}/.vscode/templates/${scope}`


const template = async (params = {}, options = {}) => {

    // Create new prompt group for generate
    createNewPrompt()

    // Core options
    const {
        templatesRoot
    } = options

    // Template Params
    const {
        sources
    } = params

    const { name } = await prompt({
        type: 'input',
        name: 'name',
        message: `Name of the template ?`,
        required: true,
    })

    const dist = `${templatesRoot}/${paramCase(name)}`

    if (existsSync(dist)) {
        chalk.redBright.bold('[Template]: Template name already exists.')
        return
    }

    // Make the destination dir
    mkdirSync(dist)

    const { variable } = await prompt({
        type: 'input',
        name: 'variable',
        initial: basename(sources[0]).split('.')[0],
        message: `Variable name ?`,
        required: true,
    })

    pref.start()

    const replace = ['camelCase',
        'capitalCase',
        'constantCase',
        'dotCase',
        'headerCase',
        'noCase',
        'paramCase',
        'pascalCase',
        'pathCase',
        'sentenceCase',
        'snakeCase'].map((c) => {
            return { variable: changeCase[c](variable), substitute: `<%= ${c}(name) %>` }
        })

    for (const src of sources) {

        const srcDest = dist + '/' + basename(src).replace(paramCase(variable), '__name__')

        const result = await copy(src, srcDest, {
            overwrite: false,
            expand: true,
            dot: true,
            junk: true,
            rename: (filePath) => filePath.replace(paramCase(variable), '__name__'),
            transform: (src, dest, stats) => {
                return through((chunk, enc, done) => {
                    let content = chunk.toString()
                    for (const sub of replace) {
                        content = content.replaceAll(sub.variable, sub.substitute)
                    }
                    done(null, content)
                })
            }

        })

        result.forEach(f => {
            if (f.stats.isFile()) {
                renameSync(f.dest, f.dest + '.ejs')
            }
        })

    }

    const { variants } = await prompt({
        type: 'list',
        name: 'variants',
        message: 'Type comma-separated variants'
    })

    writeFileSync(`${dist}/${paramCase(name)}.js`, renderFileContent(readFileSync(`${__dirname}/template_metadata.js.ejs`).toString(), { variants }))

    console.log(chalk.green.bold(`Template copied to ${dist} in ${pref.stop().preciseWords}.`))
}


await template({ sources }, { templatesRoot })
