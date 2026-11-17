// Kompilerer alle EJS-templates, så syntaksfejl fanges i CI
// i stedet for først når en bruger åbner siden.
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const viewsDir = path.join(__dirname, '..', 'src', 'views');

function findTemplates(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return findTemplates(full);
        return entry.name.endsWith('.ejs') ? [full] : [];
    });
}

const templates = findTemplates(viewsDir);
const failures = [];

for (const file of templates) {
    try {
        ejs.compile(fs.readFileSync(file, 'utf8'), { filename: file });
    } catch (err) {
        failures.push({ file: path.relative(process.cwd(), file), message: err.message });
    }
}

for (const { file, message } of failures) {
    console.error(`FEJL i ${file}\n${message}\n`);
}

console.log(`${templates.length - failures.length}/${templates.length} templates kompilerer`);
process.exit(failures.length ? 1 : 0);
