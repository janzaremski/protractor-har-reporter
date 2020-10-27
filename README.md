# protractor-har-reporter

Protractor reporter that is capturing [HAR files](https://en.wikipedia.org/wiki/HAR_(file_format)) from browser network traffic and saves them for later inspection.

## Install

```
npm i --save protractor-har-reporter
```

## Usage

In your Protractor configuration file:

```js
import {HARReporter} from 'protractor-har-reporter'

...

onPrepare: () => {

    const harReporter = new HARReporter({
        resultsDir: './results'
    });

    jasmine.getEnv().addReporter(harReporter);
}
```

HAR files will be saved in the `harfiles` subdir of `resultsDir`