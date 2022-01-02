import { endsWith } from 'lodash-es'
import * as Eta from "eta"
import prettier from "prettier"
import { readdirSync } from 'fs'
import { join } from 'path'
import * as changeCase from "change-case"
import JSON5 from 'json5'
import { merge, chain } from 'lodash-es'


const prettierOptions =
    prettier.resolveConfig.sync(process.cwd() + "/.editorconfig", {
        editorconfig: true,
    }) || {};


export function walkDirSync(dir) {
    const all = [dir];
    readdirSync(dir, { withFileTypes: true }).forEach(d => {
        d.isDirectory() && d.name !== 'node_modules' && all.push(...walkDirSync(join(dir, d.name)))
    });
    return all
}

export function getExtendsTree(templates, template) {
    if (!template.extends) {
        return []
    }
    const parent = templates[template.extends]
    return [parent].concat(getExtendsTree(templates, parent))
}

export function parseHeaderOptions(content) {
    const fileOptions = {}
    content = content.replaceAll(/^\s*\/\/\s*@([a-zA-Z0-9_-]+)(?:\s*:\s*([^\n]+))?.*\n?/gm, (match, name,  data) => {
        fileOptions[name] = !!data ? JSON5.parse(data) : null
        return ''
    })
    return { content, fileOptions }
}

export function renderFileName(renderer, filePath, data) {
    filePath = renderer(filePath, data)
    return endsWith(filePath, '.ejs') ? filePath.slice(0, -4) : filePath
}

export function renderFileContent(content, data, { renderer } = {}) {
    return Eta.render(content, { ...data, _: chain, ...changeCase}, merge({ useWith: true, autoEscape: false }, renderer))
}

export function formatFile(filepath, content) {
    return prettier.format(content, { ...prettierOptions, filepath });
}

export function expand({ pathSep, pathCase }) {

    const caseTransform = changeCase[pathCase]
    if (!caseTransform) {
        throw new Error('Casing not supported')
    }

    return function (template, values) {
        Object.keys(values).forEach(function (key) {
            var value = String(values[key]).replace(/\$/g, '$$$$')
            template = template.replace(regExp(key), caseTransform(value))
        })
        return template
    }

    function regExp(key) {
        return new RegExp(pathSep + key + pathSep, 'g')
    }
}