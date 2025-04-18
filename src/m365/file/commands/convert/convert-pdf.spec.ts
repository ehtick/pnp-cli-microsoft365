import assert from 'assert';
import fs from 'fs';
import sinon from 'sinon';
import { PassThrough } from 'stream';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import commands from '../../commands.js';
import command from './convert-pdf.js';

describe(commands.CONVERT_PDF, () => {
  let log: string[];
  let logger: Logger;
  let commandInfo: CommandInfo;
  let unlinkSyncStub: sinon.SinonStub;
  const mockPdfFile = 'pdf';
  let pdfConvertResponseStream: PassThrough;
  let pdfConvertWriteStream: PassThrough;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    auth.connection.active = true;
    unlinkSyncStub = sinon.stub(fs, 'unlinkSync').returns();
    commandInfo = cli.getCommandInfo(command);
  });

  beforeEach(() => {
    log = [];
    logger = {
      log: async (msg: string) => {
        log.push(msg);
      },
      logRaw: async (msg: string) => {
        log.push(msg);
      },
      logToStderr: async (msg: string) => {
        log.push(msg);
      }
    };
    (command as any).items = [];

    pdfConvertResponseStream = new PassThrough();
    pdfConvertResponseStream.write(mockPdfFile);
    pdfConvertResponseStream.end(); //Mark that we pushed all the data.

    pdfConvertWriteStream = new PassThrough();
    sinon.stub(fs, 'createWriteStream').returns(pdfConvertWriteStream as any);
    setTimeout(() => {
      pdfConvertWriteStream.emit('close');
    }, 5);
  });

  afterEach(() => {
    unlinkSyncStub.resetHistory();
    sinonUtil.restore([
      request.delete,
      request.get,
      request.post,
      request.put,
      fs.readFileSync,
      fs.createWriteStream,
      fs.existsSync
    ]);
    (command as any).sourceFileGraphUrl = undefined;
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.CONVERT_PDF);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  describe('app-only auth', () => {
    before(() => {
      auth.connection.accessTokens[auth.defaultResource] = {
        expiresOn: '123',
        accessToken: 'eyJ0eXAiOiJKV1QiLCJub25jZSI6IlFQaVN1ck1VX3gtT2YzdzA1YV9XZzZzNFBZRFUwU2NneHlOeDE0eVctRWciLCJhbGciOiJSUzI1NiIsIng1dCI6Ik1yNS1BVWliZkJpaTdOZDFqQmViYXhib1hXMCIsImtpZCI6Ik1yNS1BVWliZkJpaTdOZDFqQmViYXhib1hXMCJ9.eyJhdWQiOiJodHRwczovL2dyYXBoLm1pY3Jvc29mdC5jb20iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9iNjYyMzEzZi0xNGZjLTQzYTItOWE3YS1kMmUyN2Y0ZjM0NzgvIiwiaWF0IjoxNjQ0ODQ1MDc3LCJuYmYiOjE2NDQ4NDUwNzcsImV4cCI6MTY0NDg0ODk3NywiYWlvIjoiRTJaZ1lEaW1McEgwTSt5QTk5NmczbWZUUXlYN0FBPT0iLCJhcHBfZGlzcGxheW5hbWUiOiJHZXRUZWFtc0xpc3QiLCJhcHBpZCI6IjgyYTIzMzFhLTExYjItNDY3MC1iMDYxLTg3YTg2MDgxMjhhNiIsImFwcGlkYWNyIjoiMSIsImlkcCI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0L2I2NjIzMTNmLTE0ZmMtNDNhMi05YTdhLWQyZTI3ZjRmMzQ3OC8iLCJpZHR5cCI6ImFwcCIsIm9pZCI6IjM4NTRiYjA4LTNjMmMtNGI1Ny05NWZjLTI0ZTA3OGQzODY4NSIsInJoIjoiMC5BVndBUHpGaXR2d1Vva09hZXRMaWYwODBlQU1BQUFBQUFBQUF3QUFBQUFBQUFBQmNBQUEuIiwicm9sZXMiOlsiVGVhbVNldHRpbmdzLlJlYWRXcml0ZS5BbGwiLCJUZWFtTWVtYmVyLlJlYWQuQWxsIiwiR3JvdXAuUmVhZC5BbGwiLCJEaXJlY3RvcnkuUmVhZC5BbGwiLCJUZWFtLlJlYWRCYXNpYy5BbGwiLCJUZWFtU2V0dGluZ3MuUmVhZC5BbGwiLCJPcmdhbml6YXRpb24uUmVhZC5BbGwiLCJBdWRpdExvZy5SZWFkLkFsbCJdLCJzdWIiOiIzODU0YmIwOC0zYzJjLTRiNTctOTVmYy0yNGUwNzhkMzg2ODUiLCJ0ZW5hbnRfcmVnaW9uX3Njb3BlIjoiRVUiLCJ0aWQiOiJiNjYyMzEzZi0xNGZjLTQzYTItOWE3YS1kMmUyN2Y0ZjM0NzgiLCJ1dGkiOiI3RVkyWnVXV2JFYVF0T3piVVlwOUFBIiwidmVyIjoiMS4wIiwid2lkcyI6WyIwOTk3YTFkMC0wZDFkLTRhY2ItYjQwOC1kNWNhNzMxMjFlOTAiXSwieG1zX3RjZHQiOjEzMDI1NDMzMTB9.N9yvmkCedti2fzT44VfBkN7GvuCInrIgiMgNxdyZeAyxnbdZjEhxHmNdU6HLLHQ3J-GonpPdt28dKwYxgLcrSibGzSPVHddh6MDPYutSwfIxh2oRanxhgFOWVJADfbFoCxsRFDhKJNT39bsauIUiRNzGzbb6dvWuZQ8LrgWjZzjae2qxVxj9jvYgjXEypeYZgLvPOzJiBCuluAMH3TjPuS-CuglFK_edn4CS-ztCwM0hmDFD5BLNZqng5P2KqGTEgjkMKoyIJ8yTGBJpASfdqqEFqWzQwcQ9ese924qNC3hJR_5TWHp2Fl73bpdhwBHRL5UwGTPi9_ysYdndKhXwgA' // {} simulating app-only auth
      };
    });

    it('converts file from root site collection, root site, default doc lib, root folder to a local file', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T14:38:23",
                  "request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6",
                  "client-request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KAXP5NlvNnQLH92D7KrxA5",
                  "webUrl": "https://contoso.sharepoint.com/DemoDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU",
                  "webUrl": "https://contoso.sharepoint.com/Shared%20Documents"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KCswD4M9qeR6qB9K5J5Kvp",
                  "webUrl": "https://contoso.sharepoint.com/JTDesignDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LCxmZShRH-S4chwRsWoq23",
                  "webUrl": "https://contoso.sharepoint.com/MCASDemoFiles"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LxywkjzYwYSqUtcpywFv6S",
                  "webUrl": "https://contoso.sharepoint.com/RMSDemoLib"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU/root:/file.docx:/content?format=pdf':
            return {
              data: pdfConvertResponseStream
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects(new Error('Issued POST request'));
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      await command.action(logger, {
        options: {
          sourceFile: 'https://contoso.sharepoint.com/Shared Documents/file.docx',
          targetFile: 'file.pdf'
        }
      });
      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it('converts file from root site collection, root site, default doc lib, root folder to a local file (debug)', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T14:38:23",
                  "request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6",
                  "client-request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KAXP5NlvNnQLH92D7KrxA5",
                  "webUrl": "https://contoso.sharepoint.com/DemoDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU",
                  "webUrl": "https://contoso.sharepoint.com/Shared%20Documents"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KCswD4M9qeR6qB9K5J5Kvp",
                  "webUrl": "https://contoso.sharepoint.com/JTDesignDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LCxmZShRH-S4chwRsWoq23",
                  "webUrl": "https://contoso.sharepoint.com/MCASDemoFiles"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LxywkjzYwYSqUtcpywFv6S",
                  "webUrl": "https://contoso.sharepoint.com/RMSDemoLib"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU/root:/file.docx:/content?format=pdf':
            return {
              data: pdfConvertResponseStream
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects(new Error('Issued POST request'));
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      await command.action(logger, {
        options: {
          debug: true,
          sourceFile: 'https://contoso.sharepoint.com/Shared Documents/file.docx',
          targetFile: 'file.pdf'
        }
      });
      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it('converts file from root site collection, root site, default doc lib, sub folder to a local file', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T14:38:23",
                  "request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6",
                  "client-request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KAXP5NlvNnQLH92D7KrxA5",
                  "webUrl": "https://contoso.sharepoint.com/DemoDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU",
                  "webUrl": "https://contoso.sharepoint.com/Shared%20Documents"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KCswD4M9qeR6qB9K5J5Kvp",
                  "webUrl": "https://contoso.sharepoint.com/JTDesignDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LCxmZShRH-S4chwRsWoq23",
                  "webUrl": "https://contoso.sharepoint.com/MCASDemoFiles"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LxywkjzYwYSqUtcpywFv6S",
                  "webUrl": "https://contoso.sharepoint.com/RMSDemoLib"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU/root:/Demo%20Files/file.docx:/content?format=pdf':
            return {
              data: pdfConvertResponseStream
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects(new Error('Issued POST request'));
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      await command.action(logger, {
        options: {
          sourceFile: 'https://contoso.sharepoint.com/Shared%20Documents/Demo%20Files/file.docx',
          targetFile: 'file.pdf'
        }
      });
      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it('converts file from root site collection, root site, custom doc lib, root folder to a local file', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T14:38:23",
                  "request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6",
                  "client-request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KAXP5NlvNnQLH92D7KrxA5",
                  "webUrl": "https://contoso.sharepoint.com/DemoDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU",
                  "webUrl": "https://contoso.sharepoint.com/Shared%20Documents"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KCswD4M9qeR6qB9K5J5Kvp",
                  "webUrl": "https://contoso.sharepoint.com/JTDesignDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LCxmZShRH-S4chwRsWoq23",
                  "webUrl": "https://contoso.sharepoint.com/MCASDemoFiles"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LxywkjzYwYSqUtcpywFv6S",
                  "webUrl": "https://contoso.sharepoint.com/RMSDemoLib"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KAXP5NlvNnQLH92D7KrxA5/root:/file.docx:/content?format=pdf':
            return {
              data: pdfConvertResponseStream
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects(new Error('Issued POST request'));
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      await command.action(logger, {
        options: {
          sourceFile: 'https://contoso.sharepoint.com/DemoDocs/file.docx',
          targetFile: 'file.pdf'
        }
      });
      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it('converts file from root site collection, sub site, default doc lib, root folder to a local file', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/subsite?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,7c130ce6-4b35-47cc-a07c-e251175696ef"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/subsite/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T14:38:23",
                  "request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6",
                  "client-request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,7c130ce6-4b35-47cc-a07c-e251175696ef/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTcuYME3w1S8xHoHziURdWlu8D3R_yjXOpT5hMIz4t3pP4",
                  "webUrl": "https://contoso.sharepoint.com/subsite/DocLib"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTcuYME3w1S8xHoHziURdWlu-DWrqz1yBLQI7E7_4TN6fL",
                  "webUrl": "https://contoso.sharepoint.com/subsite/Shared%20Documents"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,7c130ce6-4b35-47cc-a07c-e251175696ef/drives/b!k6NJ6ubjYEehsullOeFTcuYME3w1S8xHoHziURdWlu-DWrqz1yBLQI7E7_4TN6fL/root:/file.docx:/content?format=pdf':
            return {
              data: pdfConvertResponseStream
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects(new Error('Issued POST request'));
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      await command.action(logger, {
        options: {
          sourceFile: 'https://contoso.sharepoint.com/subsite/Shared%20Documents/file.docx',
          targetFile: 'file.pdf'
        }
      });
      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it('converts file from root site collection, sub site, default doc lib, sub folder to a local file', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/subsite?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,7c130ce6-4b35-47cc-a07c-e251175696ef"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/subsite/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T14:38:23",
                  "request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6",
                  "client-request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,7c130ce6-4b35-47cc-a07c-e251175696ef/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTcuYME3w1S8xHoHziURdWlu8D3R_yjXOpT5hMIz4t3pP4",
                  "webUrl": "https://contoso.sharepoint.com/subsite/DocLib"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTcuYME3w1S8xHoHziURdWlu-DWrqz1yBLQI7E7_4TN6fL",
                  "webUrl": "https://contoso.sharepoint.com/subsite/Shared%20Documents"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,7c130ce6-4b35-47cc-a07c-e251175696ef/drives/b!k6NJ6ubjYEehsullOeFTcuYME3w1S8xHoHziURdWlu-DWrqz1yBLQI7E7_4TN6fL/root:/Folder/file.docx:/content?format=pdf':
            return {
              data: pdfConvertResponseStream
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects(new Error('Issued POST request'));
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      await command.action(logger, {
        options: {
          sourceFile: 'https://contoso.sharepoint.com/subsite/Shared%20Documents/Folder/file.docx',
          targetFile: 'file.pdf'
        }
      });
      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it('converts file from root site collection, sub site, custom doc lib, root folder to a local file', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/subsite?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,7c130ce6-4b35-47cc-a07c-e251175696ef"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/subsite/DocLib?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T14:38:23",
                  "request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6",
                  "client-request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,7c130ce6-4b35-47cc-a07c-e251175696ef/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTcuYME3w1S8xHoHziURdWlu8D3R_yjXOpT5hMIz4t3pP4",
                  "webUrl": "https://contoso.sharepoint.com/subsite/DocLib"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTcuYME3w1S8xHoHziURdWlu-DWrqz1yBLQI7E7_4TN6fL",
                  "webUrl": "https://contoso.sharepoint.com/subsite/Shared%20Documents"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,7c130ce6-4b35-47cc-a07c-e251175696ef/drives/b!k6NJ6ubjYEehsullOeFTcuYME3w1S8xHoHziURdWlu8D3R_yjXOpT5hMIz4t3pP4/root:/file.docx:/content?format=pdf':
            return {
              data: pdfConvertResponseStream
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects(new Error('Issued POST request'));
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      await command.action(logger, {
        options: {
          sourceFile: 'https://contoso.sharepoint.com/subsite/DocLib/file.docx',
          targetFile: 'file.pdf'
        }
      });
      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it('converts file from One Drive for Business, default doc lib, root folder to a local file', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso-my.sharepoint.com:/?$select=id':
            return {
              "id": "contoso-my.sharepoint.com,0c452457-5819-46d5-b676-422b0d77ef13,250cd3fe-13b2-43a8-aa6c-c706122adf88"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso-my.sharepoint.com:/personal/steve_contoso_com?$select=id':
            return {
              "id": "contoso-my.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,7c130ce6-4b35-47cc-a07c-e251175696ef"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso-my.sharepoint.com:/personal/steve_contoso_com/Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T14:38:23",
                  "request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6",
                  "client-request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso-my.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,7c130ce6-4b35-47cc-a07c-e251175696ef/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!910I76DSwUGO4gdQ5LIwxA-_eGhZ0MhHqzcnffK9MY7oZnn6NbBJT7qm_AaWHNyv",
                  "webUrl": "https://contoso-my.sharepoint.com/personal/steve_contoso_com/Documents"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso-my.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,7c130ce6-4b35-47cc-a07c-e251175696ef/drives/b!910I76DSwUGO4gdQ5LIwxA-_eGhZ0MhHqzcnffK9MY7oZnn6NbBJT7qm_AaWHNyv/root:/file.docx:/content?format=pdf':
            return {
              data: pdfConvertResponseStream
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects(new Error('Issued POST request'));
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      await command.action(logger, {
        options: {
          sourceFile: 'https://contoso-my.sharepoint.com/personal/steve_contoso_com/Documents/file.docx',
          targetFile: 'file.pdf'
        }
      });
      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it('converts file from One Drive for Business, default doc lib, sub folder to a local file', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso-my.sharepoint.com:/?$select=id':
            return {
              "id": "contoso-my.sharepoint.com,0c452457-5819-46d5-b676-422b0d77ef13,250cd3fe-13b2-43a8-aa6c-c706122adf88"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso-my.sharepoint.com:/personal/steve_contoso_com?$select=id':
            return {
              "id": "contoso-my.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,7c130ce6-4b35-47cc-a07c-e251175696ef"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso-my.sharepoint.com:/personal/steve_contoso_com/Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T14:38:23",
                  "request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6",
                  "client-request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso-my.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,7c130ce6-4b35-47cc-a07c-e251175696ef/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!910I76DSwUGO4gdQ5LIwxA-_eGhZ0MhHqzcnffK9MY7oZnn6NbBJT7qm_AaWHNyv",
                  "webUrl": "https://contoso-my.sharepoint.com/personal/steve_contoso_com/Documents"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso-my.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,7c130ce6-4b35-47cc-a07c-e251175696ef/drives/b!910I76DSwUGO4gdQ5LIwxA-_eGhZ0MhHqzcnffK9MY7oZnn6NbBJT7qm_AaWHNyv/root:/Folder/file.docx:/content?format=pdf':
            return {
              data: pdfConvertResponseStream
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects(new Error('Issued POST request'));
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      await command.action(logger, {
        options: {
          sourceFile: 'https://contoso-my.sharepoint.com/personal/steve_contoso_com/Documents/Folder/file.docx',
          targetFile: 'file.pdf'
        }
      });
      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it('converts file from non-root site collection, root site, default doc lib, root folder to a local file', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/Contoso?$select=id':
            return {
              "id": "contoso.sharepoint.com,9d1b2174-9906-43ec-8c9e-f8589de047af,bf674ab6-4b20-4368-8516-d71e6002d4b9"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/Contoso/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T18:21:34",
                  "request-id": "6b24a926-4018-4279-a66a-f5a1ab7f8181",
                  "client-request-id": "6b24a926-4018-4279-a66a-f5a1ab7f8181"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,9d1b2174-9906-43ec-8c9e-f8589de047af,bf674ab6-4b20-4368-8516-d71e6002d4b9/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!dCEbnQaZ7EOMnvhYneBHr7ZKZ78gS2hDhRbXHmAC1LnkVKXD20dsSYInKHJxx08q",
                  "webUrl": "https://contoso.sharepoint.com/sites/Contoso/Shared%20Documents"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,9d1b2174-9906-43ec-8c9e-f8589de047af,bf674ab6-4b20-4368-8516-d71e6002d4b9/drives/b!dCEbnQaZ7EOMnvhYneBHr7ZKZ78gS2hDhRbXHmAC1LnkVKXD20dsSYInKHJxx08q/root:/file.docx:/content?format=pdf':
            return {
              data: pdfConvertResponseStream
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects(new Error('Issued POST request'));
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      await command.action(logger, {
        options: {
          sourceFile: 'https://contoso.sharepoint.com/sites/Contoso/Shared%20Documents/file.docx',
          targetFile: 'file.pdf'
        }
      });
      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it('converts file from non-root site collection, root site, default doc lib, sub folder to a local file', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/Contoso?$select=id':
            return {
              "id": "contoso.sharepoint.com,9d1b2174-9906-43ec-8c9e-f8589de047af,bf674ab6-4b20-4368-8516-d71e6002d4b9"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/Contoso/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T18:21:34",
                  "request-id": "6b24a926-4018-4279-a66a-f5a1ab7f8181",
                  "client-request-id": "6b24a926-4018-4279-a66a-f5a1ab7f8181"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,9d1b2174-9906-43ec-8c9e-f8589de047af,bf674ab6-4b20-4368-8516-d71e6002d4b9/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!dCEbnQaZ7EOMnvhYneBHr7ZKZ78gS2hDhRbXHmAC1LnkVKXD20dsSYInKHJxx08q",
                  "webUrl": "https://contoso.sharepoint.com/sites/Contoso/Shared%20Documents"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,9d1b2174-9906-43ec-8c9e-f8589de047af,bf674ab6-4b20-4368-8516-d71e6002d4b9/drives/b!dCEbnQaZ7EOMnvhYneBHr7ZKZ78gS2hDhRbXHmAC1LnkVKXD20dsSYInKHJxx08q/root:/Folder/file.docx:/content?format=pdf':
            return {
              data: pdfConvertResponseStream
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects(new Error('Issued POST request'));
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      await command.action(logger, {
        options: {
          sourceFile: 'https://contoso.sharepoint.com/sites/Contoso/Shared%20Documents/Folder/file.docx',
          targetFile: 'file.pdf'
        }
      });
      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it('converts file from non-root site collection, sub site, default doc lib, root folder to a local file', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/Contoso?$select=id':
            return {
              "id": "contoso.sharepoint.com,9d1b2174-9906-43ec-8c9e-f8589de047af,bf674ab6-4b20-4368-8516-d71e6002d4b9"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/Contoso/site?$select=id':
            return {
              "id": "contoso.sharepoint.com,9d1b2174-9906-43ec-8c9e-f8589de047af,f60c833e-71ce-4a5a-b90e-2a7fdb718397"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/Contoso/site/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T18:21:34",
                  "request-id": "6b24a926-4018-4279-a66a-f5a1ab7f8181",
                  "client-request-id": "6b24a926-4018-4279-a66a-f5a1ab7f8181"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,9d1b2174-9906-43ec-8c9e-f8589de047af,f60c833e-71ce-4a5a-b90e-2a7fdb718397/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!dCEbnQaZ7EOMnvhYneBHrz6DDPbOcVpKuQ4qf9txg5fEENH3hXn6SLG0nrucIAcg",
                  "webUrl": "https://contoso.sharepoint.com/sites/Contoso/site/Shared%20Documents"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,9d1b2174-9906-43ec-8c9e-f8589de047af,f60c833e-71ce-4a5a-b90e-2a7fdb718397/drives/b!dCEbnQaZ7EOMnvhYneBHrz6DDPbOcVpKuQ4qf9txg5fEENH3hXn6SLG0nrucIAcg/root:/file.docx:/content?format=pdf':
            return {
              data: pdfConvertResponseStream
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects(new Error('Issued POST request'));
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      await command.action(logger, {
        options: {
          sourceFile: 'https://contoso.sharepoint.com/sites/Contoso/site/Shared%20Documents/file.docx',
          targetFile: 'file.pdf'
        }
      });
      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it('converts local file to a local PDF file, removes the temporarily uploaded file after conversion succeeded', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        if (url.startsWith('https://graph.microsoft.com/v1.0/drive/root:/') &&
          url.endsWith(':/content?format=pdf')) {
          return {
            data: pdfConvertResponseStream
          };
        }

        throw `Invalid GET request: ${url}`;
      });
      sinon.stub(request, 'post').callsFake(async opts => {
        const url: string = opts.url as string;
        if (url.startsWith('https://graph.microsoft.com/v1.0/drive/root:/') &&
          url.endsWith(':/createUploadSession')) {
          return {
            "expirationDateTime": "2020-12-27T13:36:41.895Z",
            "nextExpectedRanges": [
              "0-"
            ],
            "uploadUrl": "https://contoso.sharepoint.com/_api/v2.0/drive/items/01AH65SIN6Y2GOVW7725BZO354PWSELRRZ/uploadSession?guid='12da75d9-3bb5-45b3-9145-3587993b1b34'&path='~tmp66_7f17e1b7-b40c-4259-9859-c94e7f2bd1c8.docx'&overwrite=True&rename=False&dc=0&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbTM2NXgyNzE1MzQuc2hhcmVwb2ludC5jb21AZjczMjIzODAtZjIwMy00MmZmLTkzZTgtNjZlMjY2ZjZkMmU0IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYwOTA3NTMwMiIsImV4cCI6IjE2MDkxNjE3MDIiLCJlbmRwb2ludHVybCI6IjVhRjUvSWxwOTFKTkhFVHhvOWU3ekJHcmw0a1hRZ1lEbmdpR0dubDVVRlU9IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIyMzgiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6Ik56ZzRPV1k0WkdNdE5UZ3lOeTAwTm1GbUxUZzBNMlF0WmpnMk1HVXpZelJrTXpFeiIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJaV0UwT1dFek9UTXRaVE5sTmkwME56WXdMV0V4WWpJdFpUazJOVE01WlRFMU16Y3kiLCJhcHBfZGlzcGxheW5hbWUiOiJDTEkgdGVzdCIsIm5hbWVpZCI6IjgxYzZkODNhLWViYzYtNDM5Ni1hZTYwLTk1NDhiMmRlZTQ2ZEBmNzMyMjM4MC1mMjAzLTQyZmYtOTNlOC02NmUyNjZmNmQyZTQiLCJyb2xlcyI6ImFsbGZpbGVzLndyaXRlIiwidHQiOiIxIiwidXNlUGVyc2lzdGVudENvb2tpZSI6bnVsbH0.cUhHUFVOSHNZR2lFellqalpJQ2R2SUpOMjl5d3RpY0g0WHZYQXVUMmtIaz0"
          };
        }

        throw `Invalid POST request: ${url}`;
      });
      sinon.stub(request, 'put').callsFake(async opts => {
        const headers: any = opts.headers as any;

        if (opts.url === `https://contoso.sharepoint.com/_api/v2.0/drive/items/01AH65SIN6Y2GOVW7725BZO354PWSELRRZ/uploadSession?guid='12da75d9-3bb5-45b3-9145-3587993b1b34'&path='~tmp66_7f17e1b7-b40c-4259-9859-c94e7f2bd1c8.docx'&overwrite=True&rename=False&dc=0&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbTM2NXgyNzE1MzQuc2hhcmVwb2ludC5jb21AZjczMjIzODAtZjIwMy00MmZmLTkzZTgtNjZlMjY2ZjZkMmU0IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYwOTA3NTMwMiIsImV4cCI6IjE2MDkxNjE3MDIiLCJlbmRwb2ludHVybCI6IjVhRjUvSWxwOTFKTkhFVHhvOWU3ekJHcmw0a1hRZ1lEbmdpR0dubDVVRlU9IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIyMzgiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6Ik56ZzRPV1k0WkdNdE5UZ3lOeTAwTm1GbUxUZzBNMlF0WmpnMk1HVXpZelJrTXpFeiIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJaV0UwT1dFek9UTXRaVE5sTmkwME56WXdMV0V4WWpJdFpUazJOVE01WlRFMU16Y3kiLCJhcHBfZGlzcGxheW5hbWUiOiJDTEkgdGVzdCIsIm5hbWVpZCI6IjgxYzZkODNhLWViYzYtNDM5Ni1hZTYwLTk1NDhiMmRlZTQ2ZEBmNzMyMjM4MC1mMjAzLTQyZmYtOTNlOC02NmUyNjZmNmQyZTQiLCJyb2xlcyI6ImFsbGZpbGVzLndyaXRlIiwidHQiOiIxIiwidXNlUGVyc2lzdGVudENvb2tpZSI6bnVsbH0.cUhHUFVOSHNZR2lFellqalpJQ2R2SUpOMjl5d3RpY0g0WHZYQXVUMmtIaz0` &&
          headers['x-anonymous'] === true &&
          headers['Content-Length'] === 3 &&
          headers['Content-Range'] === 'bytes 0-2/3') {
          return {
            webUrl: "https://contoso.sharepoint.com/_layouts/15/Doc.aspx?sourcedoc=%7B219C4C3B-F61A-4661-B51F-7E560CA53E4E%7D&file=7f17e1b7-b40c-4259-9859-c94e7f2bd1c8.docx&action=default&mobileredirect=true"
          };
        }

        throw `Invalid PUT request: ${opts}`;
      });
      sinon.stub(request, 'delete').callsFake(async opts => {
        if (opts.url!.startsWith('https://graph.microsoft.com/v1.0/drive/root:/')) {
          return;
        }

        throw `Invalid DELETE request: ${opts.url}`;
      });

      sinon.stub(fs, 'readFileSync').returns('abc');

      await command.action(logger, {
        options: {
          debug: true,
          sourceFile: 'file.docx',
          targetFile: 'file.pdf'
        }
      });
      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it('converts local file to a PDF, uploads converted file to the root site collection, root site, default document library, root folder, removes the temporarily uploaded file and the temporary local file after conversion succeeded', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        if (url.startsWith('https://graph.microsoft.com/v1.0/drive/root:/') &&
          url.endsWith(':/content?format=pdf')) {
          return {
            data: pdfConvertResponseStream
          };
        }

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-27T18:08:36",
                  "request-id": "e44abe41-7f08-43d2-92b6-089e3335b47c",
                  "client-request-id": "e44abe41-7f08-43d2-92b6-089e3335b47c"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KAXP5NlvNnQLH92D7KrxA5",
                  "webUrl": "https://contoso.sharepoint.com/DemoDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU",
                  "webUrl": "https://contoso.sharepoint.com/Shared%20Documents"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KCswD4M9qeR6qB9K5J5Kvp",
                  "webUrl": "https://contoso.sharepoint.com/JTDesignDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LCxmZShRH-S4chwRsWoq23",
                  "webUrl": "https://contoso.sharepoint.com/MCASDemoFiles"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LxywkjzYwYSqUtcpywFv6S",
                  "webUrl": "https://contoso.sharepoint.com/RMSDemoLib"
                }
              ]
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').callsFake(async opts => {
        const url: string = opts.url as string;
        if (url.startsWith('https://graph.microsoft.com/v1.0/drive/root:/') &&
          url.endsWith(':/createUploadSession')) {
          return {
            "expirationDateTime": "2020-12-27T13:36:41.895Z",
            "nextExpectedRanges": [
              "0-"
            ],
            "uploadUrl": "https://contoso.sharepoint.com/_api/v2.0/drive/items/01AH65SIN6Y2GOVW7725BZO354PWSELRRZ/uploadSession?guid='12da75d9-3bb5-45b3-9145-3587993b1b34'&path='~tmp66_7f17e1b7-b40c-4259-9859-c94e7f2bd1c8.docx'&overwrite=True&rename=False&dc=0&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbTM2NXgyNzE1MzQuc2hhcmVwb2ludC5jb21AZjczMjIzODAtZjIwMy00MmZmLTkzZTgtNjZlMjY2ZjZkMmU0IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYwOTA3NTMwMiIsImV4cCI6IjE2MDkxNjE3MDIiLCJlbmRwb2ludHVybCI6IjVhRjUvSWxwOTFKTkhFVHhvOWU3ekJHcmw0a1hRZ1lEbmdpR0dubDVVRlU9IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIyMzgiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6Ik56ZzRPV1k0WkdNdE5UZ3lOeTAwTm1GbUxUZzBNMlF0WmpnMk1HVXpZelJrTXpFeiIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJaV0UwT1dFek9UTXRaVE5sTmkwME56WXdMV0V4WWpJdFpUazJOVE01WlRFMU16Y3kiLCJhcHBfZGlzcGxheW5hbWUiOiJDTEkgdGVzdCIsIm5hbWVpZCI6IjgxYzZkODNhLWViYzYtNDM5Ni1hZTYwLTk1NDhiMmRlZTQ2ZEBmNzMyMjM4MC1mMjAzLTQyZmYtOTNlOC02NmUyNjZmNmQyZTQiLCJyb2xlcyI6ImFsbGZpbGVzLndyaXRlIiwidHQiOiIxIiwidXNlUGVyc2lzdGVudENvb2tpZSI6bnVsbH0.cUhHUFVOSHNZR2lFellqalpJQ2R2SUpOMjl5d3RpY0g0WHZYQXVUMmtIaz0"
          };
        }

        if (url === 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU/root:/file.pdf:/createUploadSession') {
          return {
            "expirationDateTime": "2020-12-27T18:23:37.078Z",
            "nextExpectedRanges": [
              "0-"
            ],
            "uploadUrl": "https://contoso.sharepoint.com/_api/v2.0/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU/items/01AH65SIN6Y2GOVW7725BZO354PWSELRRZ/uploadSession?guid='19a2b995-5b72-4460-980a-a564ff63108c'&path='~tmpEF_file.pdf'&overwrite=True&rename=False&dc=0&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbTM2NXgyNzE1MzQuc2hhcmVwb2ludC5jb21AZjczMjIzODAtZjIwMy00MmZmLTkzZTgtNjZlMjY2ZjZkMmU0IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYwOTA5MjUxNyIsImV4cCI6IjE2MDkxNzg5MTciLCJlbmRwb2ludHVybCI6Ild5dUNlVWluMHBaQmUvTGI1WXQ1SDY2RGQzSDVzOFhZWUF6eU1KZ0VJcFE9IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIyNzMiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6Ik4ySmlObUkyWldRdE9ETXhOQzAwTnpaaExXRmlPVEF0TVRjNVpHVTFZemxoWlRFMCIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJaV0UwT1dFek9UTXRaVE5sTmkwME56WXdMV0V4WWpJdFpUazJOVE01WlRFMU16Y3kiLCJhcHBfZGlzcGxheW5hbWUiOiJDTEkgdGVzdCIsIm5hbWVpZCI6IjgxYzZkODNhLWViYzYtNDM5Ni1hZTYwLTk1NDhiMmRlZTQ2ZEBmNzMyMjM4MC1mMjAzLTQyZmYtOTNlOC02NmUyNjZmNmQyZTQiLCJyb2xlcyI6ImFsbGZpbGVzLndyaXRlIiwidHQiOiIxIiwidXNlUGVyc2lzdGVudENvb2tpZSI6bnVsbH0.N2d0Tll4WFlqVWJmNWxnMHZTMjBaaEdJVXpUWC9NaDBrM1NRNlNYTXZzWT0"
          };
        }

        throw `Invalid POST request: ${url}`;
      });
      sinon.stub(request, 'put').callsFake(async opts => {
        const headers: any = opts.headers as any;

        if (opts.url === `https://contoso.sharepoint.com/_api/v2.0/drive/items/01AH65SIN6Y2GOVW7725BZO354PWSELRRZ/uploadSession?guid='12da75d9-3bb5-45b3-9145-3587993b1b34'&path='~tmp66_7f17e1b7-b40c-4259-9859-c94e7f2bd1c8.docx'&overwrite=True&rename=False&dc=0&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbTM2NXgyNzE1MzQuc2hhcmVwb2ludC5jb21AZjczMjIzODAtZjIwMy00MmZmLTkzZTgtNjZlMjY2ZjZkMmU0IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYwOTA3NTMwMiIsImV4cCI6IjE2MDkxNjE3MDIiLCJlbmRwb2ludHVybCI6IjVhRjUvSWxwOTFKTkhFVHhvOWU3ekJHcmw0a1hRZ1lEbmdpR0dubDVVRlU9IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIyMzgiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6Ik56ZzRPV1k0WkdNdE5UZ3lOeTAwTm1GbUxUZzBNMlF0WmpnMk1HVXpZelJrTXpFeiIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJaV0UwT1dFek9UTXRaVE5sTmkwME56WXdMV0V4WWpJdFpUazJOVE01WlRFMU16Y3kiLCJhcHBfZGlzcGxheW5hbWUiOiJDTEkgdGVzdCIsIm5hbWVpZCI6IjgxYzZkODNhLWViYzYtNDM5Ni1hZTYwLTk1NDhiMmRlZTQ2ZEBmNzMyMjM4MC1mMjAzLTQyZmYtOTNlOC02NmUyNjZmNmQyZTQiLCJyb2xlcyI6ImFsbGZpbGVzLndyaXRlIiwidHQiOiIxIiwidXNlUGVyc2lzdGVudENvb2tpZSI6bnVsbH0.cUhHUFVOSHNZR2lFellqalpJQ2R2SUpOMjl5d3RpY0g0WHZYQXVUMmtIaz0` &&
          headers['x-anonymous'] === true &&
          headers['Content-Length'] === 3 &&
          headers['Content-Range'] === 'bytes 0-2/3') {
          return {
            webUrl: "https://contoso.sharepoint.com/_layouts/15/Doc.aspx?sourcedoc=%7B219C4C3B-F61A-4661-B51F-7E560CA53E4E%7D&file=7f17e1b7-b40c-4259-9859-c94e7f2bd1c8.docx&action=default&mobileredirect=true"
          };
        }

        if (opts.url === `https://contoso.sharepoint.com/_api/v2.0/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU/items/01AH65SIN6Y2GOVW7725BZO354PWSELRRZ/uploadSession?guid='19a2b995-5b72-4460-980a-a564ff63108c'&path='~tmpEF_file.pdf'&overwrite=True&rename=False&dc=0&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbTM2NXgyNzE1MzQuc2hhcmVwb2ludC5jb21AZjczMjIzODAtZjIwMy00MmZmLTkzZTgtNjZlMjY2ZjZkMmU0IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYwOTA5MjUxNyIsImV4cCI6IjE2MDkxNzg5MTciLCJlbmRwb2ludHVybCI6Ild5dUNlVWluMHBaQmUvTGI1WXQ1SDY2RGQzSDVzOFhZWUF6eU1KZ0VJcFE9IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIyNzMiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6Ik4ySmlObUkyWldRdE9ETXhOQzAwTnpaaExXRmlPVEF0TVRjNVpHVTFZemxoWlRFMCIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJaV0UwT1dFek9UTXRaVE5sTmkwME56WXdMV0V4WWpJdFpUazJOVE01WlRFMU16Y3kiLCJhcHBfZGlzcGxheW5hbWUiOiJDTEkgdGVzdCIsIm5hbWVpZCI6IjgxYzZkODNhLWViYzYtNDM5Ni1hZTYwLTk1NDhiMmRlZTQ2ZEBmNzMyMjM4MC1mMjAzLTQyZmYtOTNlOC02NmUyNjZmNmQyZTQiLCJyb2xlcyI6ImFsbGZpbGVzLndyaXRlIiwidHQiOiIxIiwidXNlUGVyc2lzdGVudENvb2tpZSI6bnVsbH0.N2d0Tll4WFlqVWJmNWxnMHZTMjBaaEdJVXpUWC9NaDBrM1NRNlNYTXZzWT0`) {
          return {
            webUrl: "https://contoso.sharepoint.com/Shared%20Documents/file.pdf"
          };
        }

        throw `Invalid PUT request: ${opts}`;
      });
      sinon.stub(request, 'delete').callsFake(async opts => {
        if (opts.url!.startsWith('https://graph.microsoft.com/v1.0/drive/root:/')) {
          return;
        }

        throw `Invalid DELETE request: ${opts.url}`;
      });

      sinon.stub(fs, 'readFileSync').returns('abc');

      await command.action(logger, {
        options: {
          debug: true,
          sourceFile: 'file.docx',
          targetFile: 'https://contoso.sharepoint.com/Shared Documents/file.pdf'
        }
      });
      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.calledOnce, 'Did not remove local file');
    });

    it(`returns error when the specified document library doesn't exist`, async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T14:38:23",
                  "request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6",
                  "client-request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KAXP5NlvNnQLH92D7KrxA5",
                  "webUrl": "https://contoso.sharepoint.com/DemoDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU",
                  "webUrl": "https://contoso.sharepoint.com/Shared%20Documents"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KCswD4M9qeR6qB9K5J5Kvp",
                  "webUrl": "https://contoso.sharepoint.com/JTDesignDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LCxmZShRH-S4chwRsWoq23",
                  "webUrl": "https://contoso.sharepoint.com/MCASDemoFiles"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LxywkjzYwYSqUtcpywFv6S",
                  "webUrl": "https://contoso.sharepoint.com/RMSDemoLib"
                }
              ]
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects(new Error('Issued POST request'));
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      await assert.rejects(command.action(logger, {
        options: {
          debug: true,
          sourceFile: 'https://contoso.sharepoint.com/Docs/file.docx',
          targetFile: 'file.pdf'
        }
      }), new CommandError('Drive not found'));
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it(`returns error when the specified remote file doesn't exist`, async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T14:38:23",
                  "request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6",
                  "client-request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KAXP5NlvNnQLH92D7KrxA5",
                  "webUrl": "https://contoso.sharepoint.com/DemoDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU",
                  "webUrl": "https://contoso.sharepoint.com/Shared%20Documents"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KCswD4M9qeR6qB9K5J5Kvp",
                  "webUrl": "https://contoso.sharepoint.com/JTDesignDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LCxmZShRH-S4chwRsWoq23",
                  "webUrl": "https://contoso.sharepoint.com/MCASDemoFiles"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LxywkjzYwYSqUtcpywFv6S",
                  "webUrl": "https://contoso.sharepoint.com/RMSDemoLib"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU/root:/file.docx:/content?format=pdf':
            throw 'Error: Request failed with status code 404';
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects(new Error('Issued POST request'));
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      await assert.rejects(command.action(logger, {
        options: {
          debug: true,
          sourceFile: 'https://contoso.sharepoint.com/Shared Documents/file.docx',
          targetFile: 'file.pdf'
        }
      }), new CommandError('Error: Request failed with status code 404'));
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it(`returns error when can't write to the specified local file`, async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T14:38:23",
                  "request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6",
                  "client-request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KAXP5NlvNnQLH92D7KrxA5",
                  "webUrl": "https://contoso.sharepoint.com/DemoDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU",
                  "webUrl": "https://contoso.sharepoint.com/Shared%20Documents"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KCswD4M9qeR6qB9K5J5Kvp",
                  "webUrl": "https://contoso.sharepoint.com/JTDesignDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LCxmZShRH-S4chwRsWoq23",
                  "webUrl": "https://contoso.sharepoint.com/MCASDemoFiles"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LxywkjzYwYSqUtcpywFv6S",
                  "webUrl": "https://contoso.sharepoint.com/RMSDemoLib"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU/root:/file.docx:/content?format=pdf':
            return {
              data: pdfConvertResponseStream
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects(new Error('Issued POST request'));
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      sinonUtil.restore(fs.createWriteStream);
      const invalidStream = new PassThrough();
      sinon.stub(fs, 'createWriteStream').returns(invalidStream as any);
      setTimeout(() => {
        invalidStream.emit('error', "Error: ENOENT: no such file or directory, open './foo/file.pdf'");
      }, 5);

      await assert.rejects(command.action(logger, {
        options: {
          debug: true,
          sourceFile: 'https://contoso.sharepoint.com/Shared Documents/file.docx',
          targetFile: './foo/file.pdf'
        }
      }), new CommandError("Error: ENOENT: no such file or directory, open './foo/file.pdf'"));
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it('returns error when resolving Graph URL for the converted file to be uploaded failed', async () => {
      let i: number = 0;
      sinon.stub(request, 'get').callsFake(async opts => {
        ++i;
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            if (i === 1) {
              return {
                "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
              };
            }
            else {
              throw {
                "error": {
                  "message": "An error has occurred"
                }
              };
            }
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T14:38:23",
                  "request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6",
                  "client-request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KAXP5NlvNnQLH92D7KrxA5",
                  "webUrl": "https://contoso.sharepoint.com/DemoDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU",
                  "webUrl": "https://contoso.sharepoint.com/Shared%20Documents"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KCswD4M9qeR6qB9K5J5Kvp",
                  "webUrl": "https://contoso.sharepoint.com/JTDesignDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LCxmZShRH-S4chwRsWoq23",
                  "webUrl": "https://contoso.sharepoint.com/MCASDemoFiles"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LxywkjzYwYSqUtcpywFv6S",
                  "webUrl": "https://contoso.sharepoint.com/RMSDemoLib"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU/root:/file.docx:/content?format=pdf':
            return {
              data: pdfConvertResponseStream
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects(new Error('Issued POST request'));
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      await assert.rejects(command.action(logger, {
        options: {
          sourceFile: 'https://contoso.sharepoint.com/Shared Documents/file.docx',
          targetFile: 'https://contoso.sharepoint.com/Shared Documents/file.pdf'
        }
      }), new CommandError('An error has occurred'));

      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.calledOnce, `Didn't remove the local file`);
    });

    it('returns error when creating Graph upload session for the converted file to be uploaded failed', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T14:38:23",
                  "request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6",
                  "client-request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KAXP5NlvNnQLH92D7KrxA5",
                  "webUrl": "https://contoso.sharepoint.com/DemoDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU",
                  "webUrl": "https://contoso.sharepoint.com/Shared%20Documents"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KCswD4M9qeR6qB9K5J5Kvp",
                  "webUrl": "https://contoso.sharepoint.com/JTDesignDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LCxmZShRH-S4chwRsWoq23",
                  "webUrl": "https://contoso.sharepoint.com/MCASDemoFiles"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LxywkjzYwYSqUtcpywFv6S",
                  "webUrl": "https://contoso.sharepoint.com/RMSDemoLib"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU/root:/file.docx:/content?format=pdf':
            return {
              data: pdfConvertResponseStream
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').rejects({
        "error": {
          "message": "An error has occurred"
        }
      });
      sinon.stub(request, 'put').rejects(new Error('Issued PUT request'));
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));

      await assert.rejects(command.action(logger, {
        options: {
          sourceFile: 'https://contoso.sharepoint.com/Shared Documents/file.docx',
          targetFile: 'https://contoso.sharepoint.com/Shared Documents/file.pdf'
        }
      }), new CommandError('An error has occurred'));

      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.calledOnce, `Didn't remove the local file`);
    });

    it('returns error when uploading the converted file failed', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-25T14:38:23",
                  "request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6",
                  "client-request-id": "3bb31418-e1d4-48a8-9abe-f74ce9d1fff6"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KAXP5NlvNnQLH92D7KrxA5",
                  "webUrl": "https://contoso.sharepoint.com/DemoDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU",
                  "webUrl": "https://contoso.sharepoint.com/Shared%20Documents"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KCswD4M9qeR6qB9K5J5Kvp",
                  "webUrl": "https://contoso.sharepoint.com/JTDesignDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LCxmZShRH-S4chwRsWoq23",
                  "webUrl": "https://contoso.sharepoint.com/MCASDemoFiles"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LxywkjzYwYSqUtcpywFv6S",
                  "webUrl": "https://contoso.sharepoint.com/RMSDemoLib"
                }
              ]
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU/root:/file.docx:/content?format=pdf':
            return {
              data: pdfConvertResponseStream
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').callsFake(async opts => {
        const url: string = opts.url as string;
        if (url.startsWith('https://graph.microsoft.com/v1.0/drive/root:/') &&
          url.endsWith(':/createUploadSession')) {
          return {
            "expirationDateTime": "2020-12-27T13:36:41.895Z",
            "nextExpectedRanges": [
              "0-"
            ],
            "uploadUrl": "https://contoso.sharepoint.com/_api/v2.0/drive/items/01AH65SIN6Y2GOVW7725BZO354PWSELRRZ/uploadSession?guid='12da75d9-3bb5-45b3-9145-3587993b1b34'&path='~tmp66_7f17e1b7-b40c-4259-9859-c94e7f2bd1c8.docx'&overwrite=True&rename=False&dc=0&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbTM2NXgyNzE1MzQuc2hhcmVwb2ludC5jb21AZjczMjIzODAtZjIwMy00MmZmLTkzZTgtNjZlMjY2ZjZkMmU0IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYwOTA3NTMwMiIsImV4cCI6IjE2MDkxNjE3MDIiLCJlbmRwb2ludHVybCI6IjVhRjUvSWxwOTFKTkhFVHhvOWU3ekJHcmw0a1hRZ1lEbmdpR0dubDVVRlU9IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIyMzgiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6Ik56ZzRPV1k0WkdNdE5UZ3lOeTAwTm1GbUxUZzBNMlF0WmpnMk1HVXpZelJrTXpFeiIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJaV0UwT1dFek9UTXRaVE5sTmkwME56WXdMV0V4WWpJdFpUazJOVE01WlRFMU16Y3kiLCJhcHBfZGlzcGxheW5hbWUiOiJDTEkgdGVzdCIsIm5hbWVpZCI6IjgxYzZkODNhLWViYzYtNDM5Ni1hZTYwLTk1NDhiMmRlZTQ2ZEBmNzMyMjM4MC1mMjAzLTQyZmYtOTNlOC02NmUyNjZmNmQyZTQiLCJyb2xlcyI6ImFsbGZpbGVzLndyaXRlIiwidHQiOiIxIiwidXNlUGVyc2lzdGVudENvb2tpZSI6bnVsbH0.cUhHUFVOSHNZR2lFellqalpJQ2R2SUpOMjl5d3RpY0g0WHZYQXVUMmtIaz0"
          };
        }

        if (url === 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU/root:/file.pdf:/createUploadSession') {
          return {
            "expirationDateTime": "2020-12-27T18:23:37.078Z",
            "nextExpectedRanges": [
              "0-"
            ],
            "uploadUrl": "https://contoso.sharepoint.com/_api/v2.0/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU/items/01AH65SIN6Y2GOVW7725BZO354PWSELRRZ/uploadSession?guid='19a2b995-5b72-4460-980a-a564ff63108c'&path='~tmpEF_file.pdf'&overwrite=True&rename=False&dc=0&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbTM2NXgyNzE1MzQuc2hhcmVwb2ludC5jb21AZjczMjIzODAtZjIwMy00MmZmLTkzZTgtNjZlMjY2ZjZkMmU0IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYwOTA5MjUxNyIsImV4cCI6IjE2MDkxNzg5MTciLCJlbmRwb2ludHVybCI6Ild5dUNlVWluMHBaQmUvTGI1WXQ1SDY2RGQzSDVzOFhZWUF6eU1KZ0VJcFE9IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIyNzMiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6Ik4ySmlObUkyWldRdE9ETXhOQzAwTnpaaExXRmlPVEF0TVRjNVpHVTFZemxoWlRFMCIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJaV0UwT1dFek9UTXRaVE5sTmkwME56WXdMV0V4WWpJdFpUazJOVE01WlRFMU16Y3kiLCJhcHBfZGlzcGxheW5hbWUiOiJDTEkgdGVzdCIsIm5hbWVpZCI6IjgxYzZkODNhLWViYzYtNDM5Ni1hZTYwLTk1NDhiMmRlZTQ2ZEBmNzMyMjM4MC1mMjAzLTQyZmYtOTNlOC02NmUyNjZmNmQyZTQiLCJyb2xlcyI6ImFsbGZpbGVzLndyaXRlIiwidHQiOiIxIiwidXNlUGVyc2lzdGVudENvb2tpZSI6bnVsbH0.N2d0Tll4WFlqVWJmNWxnMHZTMjBaaEdJVXpUWC9NaDBrM1NRNlNYTXZzWT0"
          };
        }

        throw `Invalid POST request: ${url}`;
      });
      sinon.stub(request, 'put').rejects({
        "error": {
          "message": "An error has occurred"
        }
      });
      sinon.stub(request, 'delete').rejects(new Error('Issue DELETE request'));
      sinon.stub(fs, 'readFileSync').returns('abc');

      await assert.rejects(command.action(logger, {
        options: {
          sourceFile: 'https://contoso.sharepoint.com/Shared Documents/file.docx',
          targetFile: 'https://contoso.sharepoint.com/Shared Documents/file.pdf'
        }
      }), new CommandError('An error has occurred'));

      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.calledOnce, `Didn't remove the local file`);
    });

    it('returns error when after conversion removing the temporarily uploaded file failed', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        if (url.startsWith('https://graph.microsoft.com/v1.0/drive/root:/') &&
          url.endsWith(':/content?format=pdf')) {
          return {
            data: pdfConvertResponseStream
          };
        }

        throw `Invalid GET request: ${url}`;
      });
      sinon.stub(request, 'post').callsFake(async opts => {
        const url: string = opts.url as string;
        if (url.startsWith('https://graph.microsoft.com/v1.0/drive/root:/') &&
          url.endsWith(':/createUploadSession')) {
          return {
            "expirationDateTime": "2020-12-27T13:36:41.895Z",
            "nextExpectedRanges": [
              "0-"
            ],
            "uploadUrl": "https://contoso.sharepoint.com/_api/v2.0/drive/items/01AH65SIN6Y2GOVW7725BZO354PWSELRRZ/uploadSession?guid='12da75d9-3bb5-45b3-9145-3587993b1b34'&path='~tmp66_7f17e1b7-b40c-4259-9859-c94e7f2bd1c8.docx'&overwrite=True&rename=False&dc=0&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbTM2NXgyNzE1MzQuc2hhcmVwb2ludC5jb21AZjczMjIzODAtZjIwMy00MmZmLTkzZTgtNjZlMjY2ZjZkMmU0IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYwOTA3NTMwMiIsImV4cCI6IjE2MDkxNjE3MDIiLCJlbmRwb2ludHVybCI6IjVhRjUvSWxwOTFKTkhFVHhvOWU3ekJHcmw0a1hRZ1lEbmdpR0dubDVVRlU9IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIyMzgiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6Ik56ZzRPV1k0WkdNdE5UZ3lOeTAwTm1GbUxUZzBNMlF0WmpnMk1HVXpZelJrTXpFeiIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJaV0UwT1dFek9UTXRaVE5sTmkwME56WXdMV0V4WWpJdFpUazJOVE01WlRFMU16Y3kiLCJhcHBfZGlzcGxheW5hbWUiOiJDTEkgdGVzdCIsIm5hbWVpZCI6IjgxYzZkODNhLWViYzYtNDM5Ni1hZTYwLTk1NDhiMmRlZTQ2ZEBmNzMyMjM4MC1mMjAzLTQyZmYtOTNlOC02NmUyNjZmNmQyZTQiLCJyb2xlcyI6ImFsbGZpbGVzLndyaXRlIiwidHQiOiIxIiwidXNlUGVyc2lzdGVudENvb2tpZSI6bnVsbH0.cUhHUFVOSHNZR2lFellqalpJQ2R2SUpOMjl5d3RpY0g0WHZYQXVUMmtIaz0"
          };
        }

        throw `Invalid POST request: ${url}`;
      });
      sinon.stub(request, 'put').callsFake(async opts => {
        const headers: any = opts.headers as any;

        if (opts.url === `https://contoso.sharepoint.com/_api/v2.0/drive/items/01AH65SIN6Y2GOVW7725BZO354PWSELRRZ/uploadSession?guid='12da75d9-3bb5-45b3-9145-3587993b1b34'&path='~tmp66_7f17e1b7-b40c-4259-9859-c94e7f2bd1c8.docx'&overwrite=True&rename=False&dc=0&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbTM2NXgyNzE1MzQuc2hhcmVwb2ludC5jb21AZjczMjIzODAtZjIwMy00MmZmLTkzZTgtNjZlMjY2ZjZkMmU0IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYwOTA3NTMwMiIsImV4cCI6IjE2MDkxNjE3MDIiLCJlbmRwb2ludHVybCI6IjVhRjUvSWxwOTFKTkhFVHhvOWU3ekJHcmw0a1hRZ1lEbmdpR0dubDVVRlU9IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIyMzgiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6Ik56ZzRPV1k0WkdNdE5UZ3lOeTAwTm1GbUxUZzBNMlF0WmpnMk1HVXpZelJrTXpFeiIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJaV0UwT1dFek9UTXRaVE5sTmkwME56WXdMV0V4WWpJdFpUazJOVE01WlRFMU16Y3kiLCJhcHBfZGlzcGxheW5hbWUiOiJDTEkgdGVzdCIsIm5hbWVpZCI6IjgxYzZkODNhLWViYzYtNDM5Ni1hZTYwLTk1NDhiMmRlZTQ2ZEBmNzMyMjM4MC1mMjAzLTQyZmYtOTNlOC02NmUyNjZmNmQyZTQiLCJyb2xlcyI6ImFsbGZpbGVzLndyaXRlIiwidHQiOiIxIiwidXNlUGVyc2lzdGVudENvb2tpZSI6bnVsbH0.cUhHUFVOSHNZR2lFellqalpJQ2R2SUpOMjl5d3RpY0g0WHZYQXVUMmtIaz0` &&
          headers['x-anonymous'] === true &&
          headers['Content-Length'] === 3 &&
          headers['Content-Range'] === 'bytes 0-2/3') {
          return {
            webUrl: "https://contoso.sharepoint.com/_layouts/15/Doc.aspx?sourcedoc=%7B219C4C3B-F61A-4661-B51F-7E560CA53E4E%7D&file=7f17e1b7-b40c-4259-9859-c94e7f2bd1c8.docx&action=default&mobileredirect=true"
          };
        }

        throw `Invalid PUT request: ${opts}`;
      });
      sinon.stub(request, 'delete').rejects({
        "error": {
          "message": "An error has occurred"
        }
      });
      sinon.stub(fs, 'readFileSync').returns('abc');

      await assert.rejects(command.action(logger, {
        options: {
          debug: true,
          sourceFile: 'file.docx',
          targetFile: 'file.pdf'
        }
      }), new CommandError('An error has occurred'));

      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });

    it('returns error when removing the temporary local file after conversion failed', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        if (url.startsWith('https://graph.microsoft.com/v1.0/drive/root:/') &&
          url.endsWith(':/content?format=pdf')) {
          return {
            data: pdfConvertResponseStream
          };
        }

        switch (url) {
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/?$select=id':
            return {
              "id": "contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42"
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/Shared%20Documents?$select=id':
            throw {
              "error": {
                "code": "itemNotFound",
                "message": "The provided path does not exist, or does not represent a site",
                "innerError": {
                  "date": "2020-12-27T18:08:36",
                  "request-id": "e44abe41-7f08-43d2-92b6-089e3335b47c",
                  "client-request-id": "e44abe41-7f08-43d2-92b6-089e3335b47c"
                }
              }
            };
          case 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives?$select=webUrl,id':
            return {
              "value": [
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KAXP5NlvNnQLH92D7KrxA5",
                  "webUrl": "https://contoso.sharepoint.com/DemoDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU",
                  "webUrl": "https://contoso.sharepoint.com/Shared%20Documents"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KCswD4M9qeR6qB9K5J5Kvp",
                  "webUrl": "https://contoso.sharepoint.com/JTDesignDocs"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LCxmZShRH-S4chwRsWoq23",
                  "webUrl": "https://contoso.sharepoint.com/MCASDemoFiles"
                },
                {
                  "id": "b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0LxywkjzYwYSqUtcpywFv6S",
                  "webUrl": "https://contoso.sharepoint.com/RMSDemoLib"
                }
              ]
            };
          default:
            throw `Invalid GET request: ${url}`;
        }
      });
      sinon.stub(request, 'post').callsFake(async opts => {
        const url: string = opts.url as string;
        if (url.startsWith('https://graph.microsoft.com/v1.0/drive/root:/') &&
          url.endsWith(':/createUploadSession')) {
          return {
            "expirationDateTime": "2020-12-27T13:36:41.895Z",
            "nextExpectedRanges": [
              "0-"
            ],
            "uploadUrl": "https://contoso.sharepoint.com/_api/v2.0/drive/items/01AH65SIN6Y2GOVW7725BZO354PWSELRRZ/uploadSession?guid='12da75d9-3bb5-45b3-9145-3587993b1b34'&path='~tmp66_7f17e1b7-b40c-4259-9859-c94e7f2bd1c8.docx'&overwrite=True&rename=False&dc=0&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbTM2NXgyNzE1MzQuc2hhcmVwb2ludC5jb21AZjczMjIzODAtZjIwMy00MmZmLTkzZTgtNjZlMjY2ZjZkMmU0IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYwOTA3NTMwMiIsImV4cCI6IjE2MDkxNjE3MDIiLCJlbmRwb2ludHVybCI6IjVhRjUvSWxwOTFKTkhFVHhvOWU3ekJHcmw0a1hRZ1lEbmdpR0dubDVVRlU9IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIyMzgiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6Ik56ZzRPV1k0WkdNdE5UZ3lOeTAwTm1GbUxUZzBNMlF0WmpnMk1HVXpZelJrTXpFeiIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJaV0UwT1dFek9UTXRaVE5sTmkwME56WXdMV0V4WWpJdFpUazJOVE01WlRFMU16Y3kiLCJhcHBfZGlzcGxheW5hbWUiOiJDTEkgdGVzdCIsIm5hbWVpZCI6IjgxYzZkODNhLWViYzYtNDM5Ni1hZTYwLTk1NDhiMmRlZTQ2ZEBmNzMyMjM4MC1mMjAzLTQyZmYtOTNlOC02NmUyNjZmNmQyZTQiLCJyb2xlcyI6ImFsbGZpbGVzLndyaXRlIiwidHQiOiIxIiwidXNlUGVyc2lzdGVudENvb2tpZSI6bnVsbH0.cUhHUFVOSHNZR2lFellqalpJQ2R2SUpOMjl5d3RpY0g0WHZYQXVUMmtIaz0"
          };
        }

        if (url === 'https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,ea49a393-e3e6-4760-a1b2-e96539e15372,66e2861c-96d9-4418-a75c-0ed1bca68b42/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU/root:/file.pdf:/createUploadSession') {
          return {
            "expirationDateTime": "2020-12-27T18:23:37.078Z",
            "nextExpectedRanges": [
              "0-"
            ],
            "uploadUrl": "https://contoso.sharepoint.com/_api/v2.0/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU/items/01AH65SIN6Y2GOVW7725BZO354PWSELRRZ/uploadSession?guid='19a2b995-5b72-4460-980a-a564ff63108c'&path='~tmpEF_file.pdf'&overwrite=True&rename=False&dc=0&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbTM2NXgyNzE1MzQuc2hhcmVwb2ludC5jb21AZjczMjIzODAtZjIwMy00MmZmLTkzZTgtNjZlMjY2ZjZkMmU0IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYwOTA5MjUxNyIsImV4cCI6IjE2MDkxNzg5MTciLCJlbmRwb2ludHVybCI6Ild5dUNlVWluMHBaQmUvTGI1WXQ1SDY2RGQzSDVzOFhZWUF6eU1KZ0VJcFE9IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIyNzMiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6Ik4ySmlObUkyWldRdE9ETXhOQzAwTnpaaExXRmlPVEF0TVRjNVpHVTFZemxoWlRFMCIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJaV0UwT1dFek9UTXRaVE5sTmkwME56WXdMV0V4WWpJdFpUazJOVE01WlRFMU16Y3kiLCJhcHBfZGlzcGxheW5hbWUiOiJDTEkgdGVzdCIsIm5hbWVpZCI6IjgxYzZkODNhLWViYzYtNDM5Ni1hZTYwLTk1NDhiMmRlZTQ2ZEBmNzMyMjM4MC1mMjAzLTQyZmYtOTNlOC02NmUyNjZmNmQyZTQiLCJyb2xlcyI6ImFsbGZpbGVzLndyaXRlIiwidHQiOiIxIiwidXNlUGVyc2lzdGVudENvb2tpZSI6bnVsbH0.N2d0Tll4WFlqVWJmNWxnMHZTMjBaaEdJVXpUWC9NaDBrM1NRNlNYTXZzWT0"
          };
        }

        throw `Invalid POST request: ${url}`;
      });
      sinon.stub(request, 'put').callsFake(async opts => {
        const headers: any = opts.headers as any;

        if (opts.url === `https://contoso.sharepoint.com/_api/v2.0/drive/items/01AH65SIN6Y2GOVW7725BZO354PWSELRRZ/uploadSession?guid='12da75d9-3bb5-45b3-9145-3587993b1b34'&path='~tmp66_7f17e1b7-b40c-4259-9859-c94e7f2bd1c8.docx'&overwrite=True&rename=False&dc=0&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbTM2NXgyNzE1MzQuc2hhcmVwb2ludC5jb21AZjczMjIzODAtZjIwMy00MmZmLTkzZTgtNjZlMjY2ZjZkMmU0IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYwOTA3NTMwMiIsImV4cCI6IjE2MDkxNjE3MDIiLCJlbmRwb2ludHVybCI6IjVhRjUvSWxwOTFKTkhFVHhvOWU3ekJHcmw0a1hRZ1lEbmdpR0dubDVVRlU9IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIyMzgiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6Ik56ZzRPV1k0WkdNdE5UZ3lOeTAwTm1GbUxUZzBNMlF0WmpnMk1HVXpZelJrTXpFeiIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJaV0UwT1dFek9UTXRaVE5sTmkwME56WXdMV0V4WWpJdFpUazJOVE01WlRFMU16Y3kiLCJhcHBfZGlzcGxheW5hbWUiOiJDTEkgdGVzdCIsIm5hbWVpZCI6IjgxYzZkODNhLWViYzYtNDM5Ni1hZTYwLTk1NDhiMmRlZTQ2ZEBmNzMyMjM4MC1mMjAzLTQyZmYtOTNlOC02NmUyNjZmNmQyZTQiLCJyb2xlcyI6ImFsbGZpbGVzLndyaXRlIiwidHQiOiIxIiwidXNlUGVyc2lzdGVudENvb2tpZSI6bnVsbH0.cUhHUFVOSHNZR2lFellqalpJQ2R2SUpOMjl5d3RpY0g0WHZYQXVUMmtIaz0` &&
          headers['x-anonymous'] === true &&
          headers['Content-Length'] === 3 &&
          headers['Content-Range'] === 'bytes 0-2/3') {
          return {
            webUrl: "https://contoso.sharepoint.com/_layouts/15/Doc.aspx?sourcedoc=%7B219C4C3B-F61A-4661-B51F-7E560CA53E4E%7D&file=7f17e1b7-b40c-4259-9859-c94e7f2bd1c8.docx&action=default&mobileredirect=true"
          };
        }

        if (opts.url === `https://contoso.sharepoint.com/_api/v2.0/drives/b!k6NJ6ubjYEehsullOeFTchyG4mbZlhhEp1wO0bymi0KkhVdx52mJQ5y68EfLYQYU/items/01AH65SIN6Y2GOVW7725BZO354PWSELRRZ/uploadSession?guid='19a2b995-5b72-4460-980a-a564ff63108c'&path='~tmpEF_file.pdf'&overwrite=True&rename=False&dc=0&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbTM2NXgyNzE1MzQuc2hhcmVwb2ludC5jb21AZjczMjIzODAtZjIwMy00MmZmLTkzZTgtNjZlMjY2ZjZkMmU0IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYwOTA5MjUxNyIsImV4cCI6IjE2MDkxNzg5MTciLCJlbmRwb2ludHVybCI6Ild5dUNlVWluMHBaQmUvTGI1WXQ1SDY2RGQzSDVzOFhZWUF6eU1KZ0VJcFE9IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIyNzMiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6Ik4ySmlObUkyWldRdE9ETXhOQzAwTnpaaExXRmlPVEF0TVRjNVpHVTFZemxoWlRFMCIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJaV0UwT1dFek9UTXRaVE5sTmkwME56WXdMV0V4WWpJdFpUazJOVE01WlRFMU16Y3kiLCJhcHBfZGlzcGxheW5hbWUiOiJDTEkgdGVzdCIsIm5hbWVpZCI6IjgxYzZkODNhLWViYzYtNDM5Ni1hZTYwLTk1NDhiMmRlZTQ2ZEBmNzMyMjM4MC1mMjAzLTQyZmYtOTNlOC02NmUyNjZmNmQyZTQiLCJyb2xlcyI6ImFsbGZpbGVzLndyaXRlIiwidHQiOiIxIiwidXNlUGVyc2lzdGVudENvb2tpZSI6bnVsbH0.N2d0Tll4WFlqVWJmNWxnMHZTMjBaaEdJVXpUWC9NaDBrM1NRNlNYTXZzWT0`) {
          return {
            webUrl: "https://contoso.sharepoint.com/Shared%20Documents/file.pdf"
          };
        }

        throw `Invalid PUT request: ${opts}`;
      });
      sinon.stub(request, 'delete').callsFake(async opts => {
        if (opts.url!.startsWith('https://graph.microsoft.com/v1.0/drive/root:/')) {
          return;
        }

        throw `Invalid DELETE request: ${opts.url}`;
      });

      sinon.stub(fs, 'readFileSync').returns('abc');
      sinonUtil.restore(fs.unlinkSync);
      unlinkSyncStub = sinon.stub(fs, 'unlinkSync').throws(new Error('An error has occurred'));

      await assert.rejects(command.action(logger, {
        options: {
          debug: true,
          sourceFile: 'file.docx',
          targetFile: 'https://contoso.sharepoint.com/Shared Documents/file.pdf'
        }
      }), new CommandError('An error has occurred'));
      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.calledOnce, 'Did not remove local file');
    });
  });

  describe('user auth', () => {
    before(() => {
      auth.connection.accessTokens[auth.defaultResource] = {
        expiresOn: '123',
        accessToken: '123.eyJ1cG4iOiJzdGV2ZUBjb250b3NvLmNvbSJ9.456' // {upn: "steve@contoso.com"}
      };
    });

    it('converts local file to a local PDF file, removes the temporarily uploaded file after conversion succeeded', async () => {
      sinon.stub(request, 'get').callsFake(async opts => {
        const url: string = opts.url as string;

        if (url.startsWith('https://graph.microsoft.com/v1.0/me/drive/root:/') &&
          url.endsWith(':/content?format=pdf')) {
          return {
            data: pdfConvertResponseStream
          };
        }

        throw `Invalid GET request: ${url}`;
      });
      sinon.stub(request, 'post').callsFake(async opts => {
        const url: string = opts.url as string;
        if (url.startsWith('https://graph.microsoft.com/v1.0/me/drive/root:/') &&
          url.endsWith(':/createUploadSession')) {
          return {
            "expirationDateTime": "2020-12-27T13:36:41.895Z",
            "nextExpectedRanges": [
              "0-"
            ],
            "uploadUrl": "https://contoso.sharepoint.com/_api/v2.0/drive/items/01AH65SIN6Y2GOVW7725BZO354PWSELRRZ/uploadSession?guid='12da75d9-3bb5-45b3-9145-3587993b1b34'&path='~tmp66_7f17e1b7-b40c-4259-9859-c94e7f2bd1c8.docx'&overwrite=True&rename=False&dc=0&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbTM2NXgyNzE1MzQuc2hhcmVwb2ludC5jb21AZjczMjIzODAtZjIwMy00MmZmLTkzZTgtNjZlMjY2ZjZkMmU0IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYwOTA3NTMwMiIsImV4cCI6IjE2MDkxNjE3MDIiLCJlbmRwb2ludHVybCI6IjVhRjUvSWxwOTFKTkhFVHhvOWU3ekJHcmw0a1hRZ1lEbmdpR0dubDVVRlU9IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIyMzgiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6Ik56ZzRPV1k0WkdNdE5UZ3lOeTAwTm1GbUxUZzBNMlF0WmpnMk1HVXpZelJrTXpFeiIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJaV0UwT1dFek9UTXRaVE5sTmkwME56WXdMV0V4WWpJdFpUazJOVE01WlRFMU16Y3kiLCJhcHBfZGlzcGxheW5hbWUiOiJDTEkgdGVzdCIsIm5hbWVpZCI6IjgxYzZkODNhLWViYzYtNDM5Ni1hZTYwLTk1NDhiMmRlZTQ2ZEBmNzMyMjM4MC1mMjAzLTQyZmYtOTNlOC02NmUyNjZmNmQyZTQiLCJyb2xlcyI6ImFsbGZpbGVzLndyaXRlIiwidHQiOiIxIiwidXNlUGVyc2lzdGVudENvb2tpZSI6bnVsbH0.cUhHUFVOSHNZR2lFellqalpJQ2R2SUpOMjl5d3RpY0g0WHZYQXVUMmtIaz0"
          };
        }

        throw `Invalid POST request: ${url}`;
      });
      sinon.stub(request, 'put').callsFake(async opts => {
        const headers: any = opts.headers as any;

        if (opts.url === `https://contoso.sharepoint.com/_api/v2.0/drive/items/01AH65SIN6Y2GOVW7725BZO354PWSELRRZ/uploadSession?guid='12da75d9-3bb5-45b3-9145-3587993b1b34'&path='~tmp66_7f17e1b7-b40c-4259-9859-c94e7f2bd1c8.docx'&overwrite=True&rename=False&dc=0&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbTM2NXgyNzE1MzQuc2hhcmVwb2ludC5jb21AZjczMjIzODAtZjIwMy00MmZmLTkzZTgtNjZlMjY2ZjZkMmU0IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYwOTA3NTMwMiIsImV4cCI6IjE2MDkxNjE3MDIiLCJlbmRwb2ludHVybCI6IjVhRjUvSWxwOTFKTkhFVHhvOWU3ekJHcmw0a1hRZ1lEbmdpR0dubDVVRlU9IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIyMzgiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6Ik56ZzRPV1k0WkdNdE5UZ3lOeTAwTm1GbUxUZzBNMlF0WmpnMk1HVXpZelJrTXpFeiIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJaV0UwT1dFek9UTXRaVE5sTmkwME56WXdMV0V4WWpJdFpUazJOVE01WlRFMU16Y3kiLCJhcHBfZGlzcGxheW5hbWUiOiJDTEkgdGVzdCIsIm5hbWVpZCI6IjgxYzZkODNhLWViYzYtNDM5Ni1hZTYwLTk1NDhiMmRlZTQ2ZEBmNzMyMjM4MC1mMjAzLTQyZmYtOTNlOC02NmUyNjZmNmQyZTQiLCJyb2xlcyI6ImFsbGZpbGVzLndyaXRlIiwidHQiOiIxIiwidXNlUGVyc2lzdGVudENvb2tpZSI6bnVsbH0.cUhHUFVOSHNZR2lFellqalpJQ2R2SUpOMjl5d3RpY0g0WHZYQXVUMmtIaz0` &&
          headers['x-anonymous'] === true &&
          headers['Content-Length'] === 3 &&
          headers['Content-Range'] === 'bytes 0-2/3') {
          return {
            webUrl: "https://contoso.sharepoint.com/_layouts/15/Doc.aspx?sourcedoc=%7B219C4C3B-F61A-4661-B51F-7E560CA53E4E%7D&file=7f17e1b7-b40c-4259-9859-c94e7f2bd1c8.docx&action=default&mobileredirect=true"
          };
        }

        throw `Invalid PUT request: ${opts}`;
      });
      sinon.stub(request, 'delete').callsFake(async opts => {
        if (opts.url!.startsWith('https://graph.microsoft.com/v1.0/me/drive/root:/')) {
          return;
        }

        throw `Invalid DELETE request: ${opts.url}`;
      });

      sinon.stub(fs, 'readFileSync').returns('abc');

      await command.action(logger, {
        options: {
          debug: true,
          sourceFile: 'file.docx',
          targetFile: 'file.pdf'
        }
      });
      assert.strictEqual(Buffer.from(pdfConvertWriteStream.read()).toString(), mockPdfFile, 'Invalid PDF contents');
      assert(unlinkSyncStub.notCalled, 'Removed local file');
    });
  });

  it('returns error when unable to detect authentication type', async () => {
    auth.connection.accessTokens[auth.defaultResource] = {
      expiresOn: '123',
      accessToken: '123.YQ==.456' // 'a' simulating invalid token
    };

    await assert.rejects(command.action(logger, {
      options: {
        sourceFile: 'file.docx',
        targetFile: 'file.pdf'
      }
    }), new CommandError('Unable to determine authentication type'));
  });

  it(`fails validation if the specified local source file doesn't exist`, async () => {
    sinon.stub(fs, 'existsSync').callsFake(() => false);
    const actual = await command.validate({ options: { sourceFile: 'file.docx', targetFile: 'file.pdf' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it(`fails validation if another file exists at the path specified in the target file`, async () => {
    sinon.stub(fs, 'existsSync').callsFake(() => true);
    const actual = await command.validate({ options: { sourceFile: 'file.docx', targetFile: 'file.pdf' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it(`passes validation if the source file is a URL`, async () => {
    sinon.stub(fs, 'existsSync').callsFake(() => false);
    const actual = await command.validate({ options: { sourceFile: 'https://contoso.sharepoint.com/Shared Documents/file.docx', targetFile: 'file.pdf' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it(`passes validation if the target file is a URL`, async () => {
    sinon.stub(fs, 'existsSync').callsFake(() => true);
    const actual = await command.validate({ options: { sourceFile: 'file.docx', targetFile: 'https://contoso.sharepoint.com/Shared Documents/file.pdf' } }, commandInfo);
    assert.strictEqual(actual, true);
  });
});
