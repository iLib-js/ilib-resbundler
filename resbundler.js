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
var Locale = require("ilib-locale");

function usage() {
    console.log("Usage: resbundler.js [-h] [-a assembly] [-c compiled] [-r resDir] [-o outDir] [-l locales]\n" +
      "Convert json resource data to js file\n" +
      "-h or --help\n" +
      "  this help\n" +
      "-a or --assembly\n" +
      "  How you make the output. Valid values are 'assembled' and  'dynamic'. Default: 'assembled'.\n" +
      "-c or --compiled\n" +
      "  Whether you want the output to be compiled with uglify-js. Valid values are 'compiled', and 'uncompiled'. Default: 'compiled'.\n" +
      "-r or --resDir\n" +
      "  directory to read and file json files. Default: 'resources'\n" +
      "-o or --outDir\n" +
      "  directory to place output files. Default: current dir '.'\n" +
      "-f or --filename\n" +
      "  specify output file name when assembly mode is assembled. Default: 'ilib-translation.js'\n" +
      "-l or --locales\n" +
      "  Locales you want your make js files when assembely mode is `dynamic`. Value is a comma-separated list of BCP-47 style locale tags.");
    process.exit();
}

var argv = process.argv;
var options = {
    assembly: "assembled",
    compiled: "compiled",
    resDir: "resources",
    outDir: ".",
    filename: "ilib-translation.js",
    locales: []
}
var result = "";

for (var i = 0; i < argv.length; i++){
    var val = argv[i];
    if (val === "-h" || val == "--help"){
        usage();
    } else if (val === "-a" || val === "--assembly"){
        options.assembly = argv[++i];
    } else if(val === "-c" || val === "--compiled"){
        options.compiled = argv[++i];
    } else if (val === "-r" || val === "--resDir"){
        options.resDir = argv[++i];
    } else if (val === "-o" || val === "--outDir"){
        options.outDir = argv[++i];
        if (!fs.existsSync(options.outDir)){
            fs.mkdirSync(options.outDir);
        }
    } else if (val === "-f" || val === "--filename"){
        options.filename = argv[++i];
    } else if (val === "-l" || val === "--locales"){
        if (i < argv.length && argv[i+1]) {
            options.locales = argv[++i].split(",");
        }
    }
}

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

function parseLocale(lo){
    if(!lo) return;
    var list=[];
    var locale =new Locale(lo);
    if (locale.getLanguage()){
        list.push(locale.getLanguage());
    }
    if (locale.getScript()){
        list.push(locale.getScript());
    }
    if (locale.getRegion()){
        list.push(locale.getRegion());
    }
    return list;
}

function dynamicFiles(){
    if ((options.assembly != "assembled" || options.assembly == "dynamic")){
        if (options.locales.length > 0) {
            options.locales.forEach(function(lo){
                result = "";
                var loList = parseLocale(lo);
                loList.map(function(current, index, arr){
                    var file = arr.slice(0, index+1).join("/") + "/strings.json"
                    var respath = path.join(options.resDir, file);
                    if (fs.existsSync(respath)){
                        var data = fs.readFileSync(respath, "utf-8");
                        var dataKey = manipulateKey(respath);
                        if (data){
                            var temp = dataKey +  " =  " + data + ";\n";
                            result +=temp;
                        }
                    }
                });
                var filename = lo + ".js";
                writeFiles(result, filename);
            });
        } else {
            console.log("ERROR: Locale list are missing.");
            process.exit(1);
        }
    }
}

function writeFiles(writeData, filename){
    var writeName = filename || options.filename
    if (options.compiled == "compiled") {
        var minifyResult = uglifyjs.minify(writeData);
        fs.writeFileSync(path.join(options.outDir, writeName), minifyResult.code, 'utf-8');
    } else {
        fs.writeFileSync(path.join(options.outDir, writeName), writeData, 'utf-8');
    }
    console.log("Generated [" + options.compiled + "] " + path.join(options.outDir, writeName) + " file.");
}

if(options.assembly == "assembled"){
    var result = assembleFiles(options.resDir);
    writeFiles(result);
} else {
    dynamicFiles();
}
console.log("DONE!!");