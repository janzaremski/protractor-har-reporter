import { browser } from 'protractor';
import { harFromMessages } from 'chrome-har';
import * as fse from 'fs-extra';
import * as path from 'path';

interface Configuration {
    resultsDir: string
}

export class HARReporter {

    private resultsDir: string;
    private asyncFlow: Promise<any>;

    constructor(configuration: Configuration) {
        this.resultsDir = configuration.resultsDir;
    }

    jasmineStarted() {
        /* Wait for async tasks triggered by `suiteDone`. */
        afterAll(async () => {
            await this.asyncFlow;
            this.asyncFlow = null;
        });
    }

    suiteDone(result) {
        this.asyncFlow = this.asyncSuiteDone(result);
    }

    private async asyncSuiteDone(result) {
        const browserName = (await browser.getCapabilities()).get('browserName');
        if (browserName == 'chrome') {
            const browserLogs = await browser.manage().logs().get('performance');
            if (browserLogs.length > 0) {
                const specName = result.fullName.trim().replace(/\s+/g, '-').toLowerCase();
                const harDir = path.resolve(this.resultsDir, 'harfiles');
                await fse.ensureDir(harDir)
                const harPath = path.resolve(harDir, `${specName}.har`);
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
                fse.writeFileSync(harPath, JSON.stringify(harObject));
                console.log(`Saving HAR file to ${harPath}`);
            }
        } else {
            console.log(`${browserName} is not supported, chrome is the only supported browser`);
        }

    }
}