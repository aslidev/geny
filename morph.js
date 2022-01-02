import { tsquery } from '@phenomnomnominal/tsquery';
import { Project } from "ts-morph";
import { endsWith } from 'lodash-es';

export function project() {
    return new Project()
}

export function query(node, query) {
    return tsquery(node.compilerNode, query)
        .map(n => node._getNodeFromCompilerNode(n))
}

export function isModule(file) {
    return endsWith(file, '.module.ts')
}

export function addDeclarationsToModule(sourceFile, { componentClass, componentFile }) {

    if (!isModule(sourceFile.getFilePath())) {
        console.error('Select file is not a module')
        return
    }

    sourceFile.addImportDeclaration({
        namedImports: [componentClass],
        moduleSpecifier: componentFile,
    })

    const [declarations] = query(sourceFile, 'PropertyAssignment:has(Identifier[name="declarations"]) > ArrayLiteralExpression')
    declarations.addElement(componentClass)
    declarations.formatText({
        indentSize: 2,
    })
}


/* const path = '/home/user/fms-angular/projects/apps/client/src/app/modules/tracking-vehicles/tracking-vehicles.module.ts';


const [declarations] = query(sourceFile, 'PropertyAssignment:has(Identifier[name="declarations"]) > ArrayLiteralExpression');

declarations.addElement("pc")

declarations.formatText({
    indentSize: 2,
});

project.saveSync()

console.dir(nodes); */