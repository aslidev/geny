import gracefulFs from 'graceful-fs';
const { existsSync, renameSync, rmdirSync } = gracefulFs
import { mergeWith, reduce, isArray, mapValues, noop, partialRight, merge, trim } from 'lodash-es'
import copy from 'recursive-copy'
import through from 'through2'
import chalk from 'chalk'
import picomatch from 'picomatch'
import { getExtendsTree, formatFile, renderFileName, parseHeaderOptions, expand, renderFileContent } from './tools.js'
import { selectTemplate, selectTemplateVariant, prompt, createNewPrompt } from './inputs.js'
import { basename, dirname } from 'path'
import Pref from 'execution-time'
const pref = Pref()

const cwd = process.cwd()

// Get scope and dist folder
const [scope, dist = cwd] = process.argv.splice(2)
if (!dist) {
    throw new Error('You must select a destination folder.')
}

const templatesRoot = `${process.cwd()}/.vscode/templates/${scope}`


// console.dir(selectedFiles)
// pref.start()
// const isMatch = picomatch(['{,!(node_modules)/**/}*app.module.ts']);
// console.dir(await readdir(process.cwd(), { absolute: true, recursive: true, isMatch: file => isMatch(file.relative) }))
// const time2 = pref.stop()

// console.log(chalk.green.bold(`in ${time2.preciseWords}.`));
// process.exit(0)


const generate = async (params = {}, options = {}, parent = {}) => {

    // Create new prompt group for generate
    createNewPrompt()

    // Core options
    const {
        templatesRoot,
        showPerf = true
    } = options

    // Template Params
    const {
        templateName = await selectTemplate(templatesRoot),
        templateVariantName,
        dist
    } = params

    // Template folder
    const templateFolder = `${templatesRoot}/${templateName}`

    // Get mete data
    const metaFile = `${templateFolder}/${templateName}.js`

    let templates = {}
    let templateVariant = {}
    if (existsSync(metaFile)) {

        // Import metadata
        //
        templates = mapValues((await import(metaFile))['default']({ dist, parent }) || {}, (value, name) => ({ ...value, name }))

        // Select Variant
        //
        templateVariant = templates && Object.keys(templates).length > 0 ? templates[
            templateVariantName && templates.hasOwnProperty(templateVariantName) ? templateVariantName : await selectTemplateVariant(templates)
        ] : {}
    }


    const template = mergeWith(

        // Default options
        {
            options: {
                pathCase: 'paramCase',
                pathSep: '__',
                compile: true,
                format: true,
                overwrite: true,
            },
            exclude: [
                `${templateName}.js`
            ],
            inputs: {
                'name': {
                    message: `Name for ${chalk.yellowBright.underline(templateName)} ?`,
                    required: true,
                }
            },
            suggests: [],
            onComplete: noop,
        },

        // Extended variants
        ...getExtendsTree(templates, templateVariant).reverse(),

        // Selected Variant
        templateVariant,

        // Extend customize
        (objValue, srcValue, key) => {
            if (isArray(objValue)) {
                return objValue.concat(srcValue);
            }
            if (key === 'onComplete' && srcValue) {
                return partialRight(srcValue, objValue)
            }
        }
    )

    // Calculate Inputs
    //
    const templateInputs = reduce(template.inputs, (result, obj, name) => {
        result.push({ name, type: obj.type || 'input', message: obj.message || name + ' ?', ...obj })
        return result
    }, []);

    // File inputs
    const inputsData = await prompt(templateInputs)
    inputsData.template = templateName // In case of pre-selected template name
    inputsData.variant = templateVariant.name// In case of pre-selected template variant
    inputsData.dist = dist

    console.table(mapValues(inputsData, (value) => !isArray(value) ? value : JSON.stringify(value)))

    // File name renderer
    const fileNameRenderer = expand(template.options)

    // File matcher
    const isMatch = picomatch(template.exclude)

    showPerf && pref.start()

    // Choose directories
    const chooseDirectories = []

    const result = await copy(templateFolder, dist, {
        overwrite: template.options.overwrite,
        expand: true,
        dot: true,
        junk: true,
        filter: (filePath) => !isMatch(filePath),
        rename: (filePath) => renderFileName(fileNameRenderer, filePath, inputsData),
        transform: (src, dest, stats) => {

            return through((chunk, enc, done) => {
                let { content, fileOptions } = parseHeaderOptions(chunk.toString())
                const options = merge({}, template.options, fileOptions.options || {})

                if (!fileOptions.hasOwnProperty('ignore')) {
                    try {
                        content = renderFileContent(content, { ...inputsData, parent }, fileOptions)
                    } catch (e) {
                        console.log(chalk.hex('#FFA500').bold('[Renderer]: ' + e.message + ' - ' + src))
                    }
                }


                if (basename(src) === '.choose.ejs') {
                    options.format = false
                    chooseDirectories.push({
                        dir: dirname(dest),
                        chooseFile: basename(trim(content), '.ejs'),
                        chooseName: basename(dirname(dest)),
                        chooseDist: dirname(dirname(dest))
                    })
                }

                if (options.format) {
                    try {
                        content = formatFile(dest, content)
                    } catch (e) {
                        console.log(chalk.hex('#FFA500').bold('[Formatter]: ' + e.message))
                    }
                }
                done(null, content)
            })
        }
    })

    // Handle Choose directories
    for (const { dir, chooseFile, chooseName, chooseDist } of chooseDirectories) {
        const tmpDir = dir + '__rm'
        const chooseFilePath = dir + '/' + chooseFile

        if (existsSync(chooseFilePath)) {
            // First rename the dir
            renameSync(dir, tmpDir)

            // Copy the file
            renameSync(tmpDir + '/' + chooseFile, chooseDist + '/' + chooseName)

            // Remove tmp folder
            rmdirSync(tmpDir, { recursive: true })
        } else {
            // Remove tmp folder
            rmdirSync(dir, { recursive: true })
        }

    }

    // Call on complete
    await template.onComplete(inputsData, result)

    // Call suggestions
    const suggestions = template.suggests.map(s => s.name)
    if (suggestions.length > 0) {
        const { selectedSuggestions } = await prompt({
            name: 'selectedSuggestions',
            message: 'Add: ',
            type: 'MultiSelect',
            choices: suggestions
        })

        for (const name of selectedSuggestions) {
            const suggest = template.suggests.find(f => f.name === name)
            const params = { ...(suggest.options || noop)({ inputsData, result, prompt }) || {}, templateName: name }
            await generate(params, { ...options, showPerf: false }, inputsData)
        }

    }

    showPerf && console.log(chalk.green.bold(`Template copied to ${dist} in ${pref.stop().preciseWords}.`));
}


generate({ dist }, { templatesRoot }) 