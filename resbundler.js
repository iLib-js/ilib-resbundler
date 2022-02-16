#!/usr/bin/env node
/*
 * resbundler.js - convert JSON type of resources to JS files
 *
 * Copyright © 2022 JEDLSoft
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var fs = require("fs");
var path = require("path");
var uglifyjs = require('uglify-js');
var OptionsParser = require("options-parser");
var util =require("ilib-common").Utils;

var defaultOptions = {
    assembly: "assembled",
    compiled: "compiled",
    resDir: "resources",
    outDir: ".",
    filename: "ilib-translation.js",
    locales: []
}
var result = "";

var optionConfig = {
    help: {
        short: "h",
        showHelp: {
            banner: 'Usage: ilib-resbundler [-h] [options] '
        }
    },
    assembly: {
        short: "a",
        "default": "assembled",
        help: "How you make the output. Valid values are 'assembled' and  'dynamic'. Default: 'assembled'."
    },
    compilation: {
        short: "c",
        "default": "compiled",
        help: "Whether you want the output to be compiled with uglify-js. Valid values are 'compiled', and 'uncompiled'. Default: 'compiled'."
    },
    resDir: {
        short: "r",
        "default": "resources",
        help: "directory to read and file json files. Default: 'resources'"
    },
    outDir: {
        short: "o",
        "default": ".",
        help: "directory to place output files. Default: current dir '.'"
    },
    outFileName: {
        short: "r",
        "default": "ilib-translation.js",
        help: "specify output file name when assembly mode is assembled. Default: 'ilib-translation.js'"
    },
    locales: {
        short: "l",
        "default": "",
        help: "Locales you want your make js files when assembely mode is `dynamic`. Value is a comma-separated list of BCP-47 style locale tags."
    }
}

var options = OptionsParser.parse(optionConfig);

var assembly = options.opt.assembly || defaultOptions.assembly;
var compilation = options.opt.compilation || defaultOptions.compilation;
var resDir = options.opt.resDir || defaultOptions.resDir;
var outDir = options.opt.outDir || defaultOptions.outDir;
if (outDir && !fs.existsSync(outDir)){
    fs.mkdirSync(outDir);
};
var outFileName = options.opt.outFileName || defaultOptions.filename;

var locales = typeof(options.opt.locales) === "string" ? options.opt.locales.split(",") : defaultOptions.locales;


function manipulateKey(fullPath){
    if (!fullPath) return;
    var prefix = "ilib.data.strings";

    var splitPath = fullPath.split("/");
    var key = splitPath.slice(1, splitPath.length -1).join("_");
    key = prefix + (key != "" ? "_" + key : key);
    return key;
}

function assembleFiles(dir){
    var list = fs.readdirSync(dir);
    list.forEach(function(file){
        var fullPath = path.join(dir, file);
        var stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()){
            assembleFiles(fullPath);
        } else {
            if (file === "strings.json"){
                var data = fs.readFileSync(fullPath, "utf-8");
                var dataKey = manipulateKey(fullPath);
                if (data) {
                    var temp = dataKey +  " = " + data + ";\n";
                    result += temp;
                }
            }
        }
    });
    return result;
}

function dynamicFiles(){
    if ((assembly != "assembled" || assembly == "dynamic")){
        if (locales.length > 0) {
            locales.forEach(function(lo){
                result = "";
                var loList = util.getLocFiles(lo, "strings.json").filter(function(item){
                    return (item.indexOf("und") == -1)
                });
                loList.map(function(current, index, arr){
                    var respath = path.join(resDir, arr[index]);
                    if (fs.existsSync(respath)){
                        var data = fs.readFileSync(respath, "utf-8");
                        var dataKey = manipulateKey(respath);
                        if (data){
                            var temp = dataKey +  " =  " + data + ";\n";
                            result +=temp;
                        }
                    }
                });
                var file = lo + ".js";
                writeFiles(result, file);
            });
        } else {
            console.log("ERROR: Locale list are missing.");
            process.exit(1);
        }
    }
}

function writeFiles(writeData, file){
    var writeName = file || outFileName;
    if (compilation == "compiled") {
        var minifyResult = uglifyjs.minify(writeData);
        fs.writeFileSync(path.join(outDir, writeName), minifyResult.code, 'utf-8');
    } else {
        fs.writeFileSync(path.join(outDir, writeName), writeData, 'utf-8');
    }
    console.log("Generated [" + compilation + "] " + path.join(outDir, writeName) + " file.");
}

if(assembly == "assembled"){
    var result = assembleFiles(resDir);
    writeFiles(result);
} else {
    dynamicFiles();
}
console.log("DONE!!");