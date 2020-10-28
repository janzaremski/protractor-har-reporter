# protractor-har-reporter

Protractor HAR reporter is capturing [HAR files](https://en.wikipedia.org/wiki/HAR_(file_format)) from browser network traffic and saves them to simplify debugging of failed tests.

## Credits

Inspiration and some pieces of code come from https://github.com/Everettss/puppeteer-har

## Install

```
npm i --save protractor-har-reporter
```

## Usage

In your Protractor configuration file:

```js
import { Config } from 'protractor';
import { HARReporter } from 'protractor-har-reporter'

export let config: Config = {

    capabilities: {
        browserName: 'chrome',
        loggingPrefs: {
            performance: 'ALL'
        }
    },
    onPrepare: () => {

        const harReporter = new HARReporter({
            resultsDir: './results'
        });

        jasmine.getEnv().addReporter(harReporter);
    }
}
```

## Additional info

* HAR files will be saved in the `harfiles` subdir of `resultsDir`
* HAR files collection works only on chrome browser with enabled performance logging
* One HAR file is generated for one spec file, file name corresponds to spec name (describe statement)

