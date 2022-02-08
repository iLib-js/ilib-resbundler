# ilib-resbundler
resbundler is a command-line utility that generates js files from json type of resources

Installation
------------
Use `npm install ilib-scanner` or `yarn add ilib-scanner` to install the scanner.

Then, make sure that node_modules/.bin is in your path.

If your app is packaged with npm or yarn and has a package.json, put the following in your
   "devDependencies" property:

 ```
    "ilib-resbundler": "^1.0.0",
 ````

Usage
------------

1. Include all data in one `js` file.   
Following command, Output fiile name would be `ilib-translation.js`
```
resbundler.js --assembly assembled --compiled compiled --resDir resources --outDir result
```

2. Generate `js` files per locale.   
Following command, Output file would be `ko-KR.js, es-ES.js`
```
resbundler.js --assembly dynamic --compiled compiled --resDir resources --outDir result --locales "ko-KR,es-ES"
```

Release Notes
-------------
### 1.0.0
Intial release