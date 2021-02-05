import { browser } from 'protractor';
import { harFromMessages } from 'chrome-har';
import { ensureDir, writeFile } from 'fs-extra';
import { resolve } from 'path';

interface Configuration {
    resultsDir: string,
    printLogs?: boolean,
    saveOnlyForFailedSpecs?: boolean
}

export class HARReporter {

    private resultsDir: string;
    private printLogs: boolean;
    private saveOnlyForFailedSpecs: boolean;
    private asyncFlow: Promise<void>;

    constructor(config: Configuration) {
        this.resultsDir = config.resultsDir;
        this.printLogs = config.printLogs || false
        this.saveOnlyForFailedSpecs = config.saveOnlyForFailedSpecs || false
    }

    jasmineStarted() {
        beforeEach(async () => {
            await this.asyncFlow;
            this.asyncFlow = null;
        });
    }

    specDone(result) {
        this.asyncFlow = this.asyncSpecDone(result);
    }

    private async asyncSpecDone(result) {
        const browserName = (await browser.getCapabilities()).get('browserName');
        if (browserName == 'chrome') {
            const browserLogs = await browser.manage().logs().get('performance');
            if (browserLogs.length > 0) {
                const specName = result.fullName.trim().replace(/\s+/g, '-').toLowerCase();
                const harDir = resolve(this.resultsDir, 'harfiles');
                await ensureDir(harDir)
                const harPath = resolve(harDir, `${specName}.har`);
                const events = [];
                const addResponseBodyPromises = [];
                browserLogs.forEach(browserLog => {
                    const message = JSON.parse(browserLog.message);
                    const harEvent = {
                        method: message.message.method,
                        params: message.message.params
                    };
                    events.push(harEvent);
                    if (harEvent.method === 'Network.responseReceived') {
                        const response = harEvent.params.response;
                        const requestId = harEvent.params.requestId;
                        // Response body is unavailable for redirects, no-content, image, audio and video responses
                        if (response.status !== 204 &&
                            response.headers.location == null &&
                            !response.mimeType.includes('image') &&
                            !response.mimeType.includes('audio') &&
                            !response.mimeType.includes('video')
                        ) {
                            const addResponseBodyPromise = browser.driver.sendChromiumCommandAndGetResult('Network.getResponseBody', { requestId }).then(responseBody => {
                                // Set the response so chrome-har can add it to the HAR file
                                harEvent.params.response = {
                                    ...response,
                                    //@ts-ignore
                                    body: Buffer.from(responseBody.body, responseBody.base64Encoded ? 'base64' : undefined).toString()
                                };
                            }, (reason) => { });
                            addResponseBodyPromises.push(addResponseBodyPromise);
                        }
                    }
                });
                await Promise.all(addResponseBodyPromises);
                const harObject = harFromMessages(events, { includeTextFromResponseBody: true });

                if ((this.saveOnlyForFailedSpecs && result.status == 'failed') || !this.saveOnlyForFailedSpecs) {

                    if (this.printLogs) {
                        console.log(`Saving HAR file to ${harPath}`);
                    }

                    await writeFile(harPath, JSON.stringify(harObject));
                }
            }
        } else {
            console.log(`${browserName} is not supported by protractor-har-reporter, Chrome is the only supported browser`);
        }
    }
}