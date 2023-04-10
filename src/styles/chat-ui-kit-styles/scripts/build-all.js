// Build all themes

const fs = require("fs");
const path = require("path");
var sass = require('sass');

function writeOutput(error, result, outputFile ) {
    
    if ( !error ) {
        
        // No errors during the compilation, write this result on the disk
        fs.writeFile(outputFile, result.css, function(err){
            if ( !err ) {
                console.log("\x1b[32m%s\x1b[36m%s\x1b[0m",  "build-all: sass compiled file: ", outputFile)
            } else {
                console.error("\x1b[31m%s\x1b[0m", "build-all: sass error writing output file");
                throw (err);
            }
        });
        
        if ( result.map ) {
            
            const mapFile = outputFile + ".map";
            fs.writeFile( mapFile, result.map, function(err){
                if ( !err ) {
                    console.log("\x1b[32m%s\x1b[36m%s\x1b[0m",  "build-all: sass compiled map file: ", mapFile);
                } else {
                    console.error("\x1b[31m%s\x1b[0m", "build-all: sass error writing output map file");
                    throw (err);
                }
            });
            
        }
        
    } else {
        console.error("\x1b[31m%s\x1b[0m", "build-all: sass compile error");
        throw (error);
    }
}

const getAllDirs = (dirPath) =>  fs.readdirSync(dirPath).map( dir => ({ name: dir, path: path.join(dirPath, dir)}));

const dirs = getAllDirs("./themes");

const sassOptions = {
    indentType:  "space",
    indentWidth: 2,
    sourceMap: true,
    sourceMapContents: true,
};

const sassCompressedOptions = {
    outputStyle: "compressed",
    ...sassOptions
};

dirs.forEach( dir => {
    
    const distDirectory = `./dist/${dir.name}`;
    const outputFile = path.join( distDirectory, "styles" );
    const outputFileName = outputFile + ".css";
    const outputMinFileName = outputFile + ".min.css";
    
    if (!fs.existsSync(distDirectory)){
        fs.mkdirSync(distDirectory, { recursive: true});
    }
    
    // Non compressed output
    sass.render({
        file: path.join( dir.path, "main.scss" ),
        outFile: outputFileName, // Required for sourceMap 
        ...sassOptions
    } , (error, result ) => writeOutput(error, result, outputFileName ) );

    // Compressed output
    sass.render({
        file: path.join( dir.path, "main.scss" ),
        outFile: outputMinFileName, // Required for sourceMap
        ...sassCompressedOptions
    } , ( error, result ) => writeOutput(error, result, outputMinFileName ) );
    
});
