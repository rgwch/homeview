var fs = require('fs');

function replace(path) {
  var REGEX = /<replace src="(.+)" \/>/g;
  // load the html file
  var fileContent = fs.readFileSync(path, 'utf8');

  // replacePath is your match[1]
  fileContent = fileContent.replace(REGEX, function replacer(match, replacePath) {
    // load and return the replacement file
    return fs.readFileSync(replacePath, 'utf8');
  });

  // this will overwrite the original html file, change the path for test
  fs.writeFileSync(path, fileContent);
}

replace('./main.html');
