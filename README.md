# protractor-har-reporter

![npm](https://img.shields.io/npm/v/protractor-har-reporter?color=blue)

Protractor HAR reporter is capturing [HAR files](https://en.wikipedia.org/wiki/HAR_(file_format)) from browser network traffic and saves them to simplify debugging of failed tests.

## Credits

Inspiration and some pieces of code come from https://github.com/Everettss/puppeteer-har

## Install

```
npm i --save protractor-har-reporter
```

## Usage

In your Protractor configuration file:

```ts
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

### HARReporter([config])
- `config` <[Object]>
  - `resultsDir` <[string]> path to save HAR file
  - `printLogs?` <[boolean]> when set to `true`, full path of saved HAR file will be printed after each spec, defaults to `false`

## Additional info

* HAR files will be saved in the `harfiles` subdir of `resultsDir`
* HAR files collection works only on Chrome browser with enabled performance logging
* One HAR file is generated for one `it` block in spec file, file name corresponds to `describe` name followed by `it` name

