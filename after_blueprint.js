import { insert } from "./code_slot.js";
import { pascalCase } from "change-case";
import dotenv from "dotenv";
import { dirname, resolve } from "path";
import shell from "shelljs";
import stringifyObject from "stringify-object";
import { Project } from "ts-morph";

const toolsDir = dirname(process.argv[1]);
const [templateName, path, b64Input] = process.argv.slice(2);
const userInput = JSON.parse(Buffer.from(b64Input, "base64").toString("ascii"));

const unquote = (...props) => {
  return (object, property, originalResult) =>
    props.includes(property) ? originalResult.slice(1, -1) : originalResult;
};

const transformUnquote = (...props) => {
  return { transform: unquote(...props) };
};

// const projectFolder = path.split("src")[0];
// const project = new Project({
//   tsConfigFilePath: projectFolder + "tsconfig.json",
//   // skipAddingFilesFromTsConfig: true,
// });

// const sourceFile = project.getSourceFileOrThrow(
//   "src/app/modules/tracking/tracking.component.ts"
// );

// const componentClass = sourceFile.getClassOrThrow("TrackingComponent");

// const constructor = componentClass.getConstructors()[0];

// constructor.insertParameter(0, {
//   name: "param1",
//   type: "string",
//   scope: "private",
// });

// project.saveSync();

// process.exit(); // https://github.com/dsherret/ts-morph/issues/61

switch (templateName) {
  /**
   * Module with Drawer -----------------------------------------
   */
  case "module-with-drawer":
    {
      const pc = pascalCase(userInput.inputName);
      const modulePath = `src/app/modules/${userInput.inputName}/${userInput.inputName}.module`;

      const routes = stringifyObject(
        {
          path: userInput.inputName,
          loadChildren: `(): Promise<any> => import("${modulePath}").then(m => m.${pc}Module)`,
        },
        transformUnquote("loadChildren")
      );

      insert(path + `/../app-routing.module.ts`, [
        {
          slotName: "routes",
          code: `${routes} \n`,
        },
      ]);
    }
    break;
  /**
   * Page ----------------------------------------
   */
  case "page":
    {
      dotenv.config({
        path,
      });

      const pc = pascalCase(userInput.inputName);
      const directory = dirname(path);
      const moduleName = process.env.moduleName;
      const routePathName = userInput.inputName.split("-").pop();
      const barrelsbyBin = resolve(toolsDir, "./node_modules/.bin/barrelsby");

      shell.exec(`${barrelsbyBin} --directory ${directory} --delete`, {
        silent: false,
        async: false,
      }).output;

      const routes = stringifyObject(
        {
          data: {
            breadcrumb: {
              alias: userInput.inputName,
            },
          },
          path: routePathName,
          component: `${pc}Component`,
        },
        {
          transform: (object, property, originalResult) => {
            if (property === "component") {
              return originalResult.slice(1, -1);
            }
            return originalResult;
          },
        }
      );
      insert(directory + `/../${moduleName}-routing.module.ts`, [
        {
          slotName: "import",
          // code: `import { ${pc}Component } from './pages/${userInput.inputName}/${userInput.inputName}.component'; \n`,
          code: `import { ${pc}Component } from './pages'; \n`,
        },
        {
          slotName: "routes",
          code: `${routes} \n`,
        },
      ]);

      insert(directory + `/../${moduleName}.module.ts`, [
        {
          slotName: "import",
          // code: `import { ${pc}Module } from './pages/${userInput.inputName}/${userInput.inputName}.module'; \n`,
          code: `import { ${pc}Module } from './pages'; \n`,
        },
        {
          slotName: "module",
          code: `${pc}Module, \n`,
        },
      ]);

      process.exit();
    }
    break;
  /**
   * Component ----------------------------------------
   */
  case "component":
    {

      process.exit();
    }
    break;
  /**
   * Component ----------------------------------------
   */
  case "page-component":
    {

      // const moduleFileName = basename(path, '.module.ts')
      const pc = pascalCase(userInput.inputName) + 'Component'
      const pageImport = `./${userInput.inputName}/${userInput.inputName}.component`

      const projectFolder = path.split("apps")[0];
      console.dir(projectFolder);
      const project = new Project({
        tsConfigFilePath: projectFolder + "tsconfig.json",
        skipAddingFilesFromTsConfig: true,
      });

      project.addSourceFileAtPath(path);

      const sourceFile = project.getSourceFileOrThrow(path);
      sourceFile.addImportDeclaration({
        namedImports: [pc],
        moduleSpecifier: pageImport,
      });

      const moduleClass = sourceFile.getClasses()[0];
      const ngModule = moduleClass.getDecorators()[0];

      const dec = ngModule.getArguments()[0].getPropertyOrThrow("declarations").getInitializer();

      dec.addElement(pc)

      dec.formatText({
        indentSize: 2,
      });

/*       sourceFile.formatText({
      }); */
      project.saveSync();
      process.exit();
    }
    break;
}
