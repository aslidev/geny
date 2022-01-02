import prettier from "prettier";
import { readFileSync, writeFileSync } from "fs";

const options =
  prettier.resolveConfig.sync(process.cwd() + "/.editorconfig", {
    editorconfig: true,
  }) || {};
options.parser = (text, { typescript }) => {
  return typescript(text);
};

export const insert = (filePath, codeSnaps) => {
  const { ast, text } = prettier.__debug.parse(
    readFileSync(filePath, "utf8"),
    options
  );
  const sourceCode = text;

  const codeArray = [];
  let currentIndex = 0;

  if (ast.comments && ast.comments.length > 0) {
    ast.comments.forEach((comment) => {
      const matchResult = comment.value.match(
        /.*?code-insert.*?( slot=[\"\'](.*?)[\"\'])/
      );

      if (matchResult && matchResult.length > 0) {
        const slotName = matchResult[2];
        codeSnaps.forEach((codeSnap) => {
          if (codeSnap.slotName === slotName) {
            codeArray.push(
              sourceCode.substring(currentIndex, comment.range[0])
            );
            codeArray.push(`${codeSnap.code}`);
            codeArray.push(`/*${comment.value}*/`);
            currentIndex = comment.range[1];
          }
        });
      }
    });
  }
  codeArray.push(sourceCode.substr(currentIndex));

  writeFileSync(filePath, prettier.format(codeArray.join(""), options), {
    encoding: "utf8",
  });
};
