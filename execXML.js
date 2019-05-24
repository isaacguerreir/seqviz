const PACKAGE = require("./package.json");
const VERSION = PACKAGE.version;
const PKGNAME = PACKAGE.name;
const PKGAUTHOR = PACKAGE.author;
const PKGDESCR = PACKAGE.description;

const fs = require("fs");
const path = require("path");
const xmlComment = require("xml-comment-api");
const { execSync } = require("child_process");

/**
 * Searches for xml comments in the file and parses
 * the comment for executable bash, writes out the
 * bash results into the return string
 */
const execXML = (file, cwd) => {
  return xmlComment(file)
    .replace("version", () => VERSION)
    .replace("pkg-name", () => PKGNAME)
    .replace("pkg-author", () => PKGAUTHOR.replace(/(.*) \((.*)\)/, "[$1]($2)"))
    .replace("pkg-description", () => PKGDESCR)
    .replace("pkg-file", () => `\`${PKGNAME}.${VERSION}.min.js\``)
    .replace("exec-bash", comment => {
      const { cmd, match } = comment.attributes;
      // Execute command and capture output.
      if (!cmd) {
        throw new Error("No command defined!");
      }
      const output = execSync(cmd, {
        cwd
      }).toString();
      const trimmedOutput = output.trim();
      // Execute optional regexp matcher.
      if (match) {
        return new RegExp(match).exec(trimmedOutput)[0];
      }
      return trimmedOutput;
    })
    .contents();
};

/**
 * Reads the file, passes the string to be proccessed
 * then rewrites the file with bash executed
 */
const rewrite = input => {
  try {
    const file = fs.readFileSync(input, "utf-8");
    const cwd = path.dirname(input);
    rewritten = execXML(file, cwd);
    fs.writeFile(input, rewritten, "utf8", err => {
      if (err) throw err;
      console.log(`${input} file has been saved!`);
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`${input} file does not exist`);
    } else {
      throw error;
    }
  }
};

// grab the file name input from node
const input = process.argv.slice(2)[0];
if (!input) {
  throw new Error("No file input found.");
}
try {
  rewrite(input);
} catch (error) {
  console.error(error);
  process.exit(1);
}
