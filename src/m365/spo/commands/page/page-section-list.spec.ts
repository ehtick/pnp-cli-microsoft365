import assert from 'assert';
import sinon from 'sinon';
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
import { ClientSidePage } from './clientsidepages.js';
import command from './page-section-list.js';

describe(commands.PAGE_SECTION_LIST, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  const apiResponse = {
    "ListItemAllFields": {
      "FileSystemObjectType": 0,
      "Id": 9,
      "ServerRedirectedEmbedUri": null,
      "ServerRedirectedEmbedUrl": "",
      "ContentTypeId": "0x0101009D1CB255DA76424F860D91F20E6C41180070E97A63FCC58F47B8FE04D0654FD44E",
      "WikiField": null,
      "Title": "Nova",
      "ClientSideApplicationId": "b6917cb1-93a0-4b97-a84d-7cf49975d4ec",
      "CanvasContent1": "<div><div data-sp-canvascontrol=\"\" data-sp-canvasdataversion=\"1.0\" data-sp-controldata=\"&#123;&quot;controlType&quot;&#58;4,&quot;displayMode&quot;&#58;2,&quot;id&quot;&#58;&quot;ccaa96dc-4d16-4940-bf0d-7b179628a8fd&quot;,&quot;position&quot;&#58;&#123;&quot;zoneIndex&quot;&#58;1,&quot;sectionIndex&quot;&#58;1,&quot;controlIndex&quot;&#58;1,&quot;sectionFactor&quot;&#58;6&#125;,&quot;editorType&quot;&#58;&quot;CKEditor&quot;&#125;\"><div data-sp-rte=\"\"><p>asd</p>\n</div></div><div data-sp-canvascontrol=\"\" data-sp-canvasdataversion=\"1.0\" data-sp-controldata=\"&#123;&quot;displayMode&quot;&#58;2,&quot;position&quot;&#58;&#123;&quot;sectionIndex&quot;&#58;2,&quot;sectionFactor&quot;&#58;6,&quot;zoneIndex&quot;&#58;1&#125;&#125;\"></div><div data-sp-canvascontrol=\"\" data-sp-canvasdataversion=\"1.0\" data-sp-controldata=\"&#123;&quot;displayMode&quot;&#58;2,&quot;position&quot;&#58;&#123;&quot;sectionIndex&quot;&#58;1,&quot;sectionFactor&quot;&#58;6,&quot;zoneIndex&quot;&#58;2&#125;&#125;\"></div><div data-sp-canvascontrol=\"\" data-sp-canvasdataversion=\"1.0\" data-sp-controldata=\"&#123;&quot;displayMode&quot;&#58;2,&quot;position&quot;&#58;&#123;&quot;sectionIndex&quot;&#58;2,&quot;sectionFactor&quot;&#58;6,&quot;zoneIndex&quot;&#58;2&#125;&#125;\"></div></div>",
      "BannerImageUrl": {
        "Description": "/_layouts/15/images/sitepagethumbnail.png",
        "Url": "/_layouts/15/images/sitepagethumbnail.png"
      },
      "Description": "asd",
      "PromotedState": 0,
      "FirstPublishedDate": null,
      "LayoutWebpartsContent": "<div><div data-sp-canvascontrol=\"\" data-sp-canvasdataversion=\"1.4\" data-sp-controldata=\"&#123;&quot;id&quot;&#58;&quot;cbe7b0a9-3504-44dd-a3a3-0e5cacd07788&quot;,&quot;instanceId&quot;&#58;&quot;cbe7b0a9-3504-44dd-a3a3-0e5cacd07788&quot;,&quot;title&quot;&#58;&quot;Região do Título&quot;,&quot;description&quot;&#58;&quot;Descrição da Região de Título&quot;,&quot;serverProcessedContent&quot;&#58;&#123;&quot;htmlStrings&quot;&#58;&#123;&#125;,&quot;searchablePlainTexts&quot;&#58;&#123;&#125;,&quot;imageSources&quot;&#58;&#123;&#125;,&quot;links&quot;&#58;&#123;&#125;&#125;,&quot;dataVersion&quot;&#58;&quot;1.4&quot;,&quot;properties&quot;&#58;&#123;&quot;title&quot;&#58;&quot;Nova&quot;,&quot;imageSourceType&quot;&#58;4,&quot;layoutType&quot;&#58;&quot;FullWidthImage&quot;,&quot;textAlignment&quot;&#58;&quot;Left&quot;,&quot;showTopicHeader&quot;&#58;false,&quot;showPublishDate&quot;&#58;false,&quot;topicHeader&quot;&#58;&quot;&quot;&#125;&#125;\"></div></div>",
      "ComplianceAssetId": null,
      "OData__AuthorBylineId": null,
      "_AuthorBylineStringId": null,
      "OData__OriginalSourceUrl": null,
      "OData__OriginalSourceSiteId": null,
      "OData__OriginalSourceWebId": null,
      "OData__OriginalSourceListId": null,
      "OData__OriginalSourceItemId": null,
      "ID": 9,
      "Created": "2018-07-11T16:24:12",
      "AuthorId": 9,
      "Modified": "2018-07-11T16:33:57",
      "EditorId": 9,
      "OData__CopySource": null,
      "CheckoutUserId": 9,
      "OData__UIVersionString": "1.0",
      "GUID": "903cdabe-7a28-4e96-a55e-c768185d7d9a"
    },
    "CheckInComment": "",
    "CheckOutType": 0,
    "ContentTag": "{16035D61-EDB9-4758-A490-3D13FCD9FDAA},10,8",
    "CustomizedPageStatus": 0,
    "ETag": "\"{16035D61-EDB9-4758-A490-3D13FCD9FDAA},10\"",
    "Exists": true,
    "IrmEnabled": false,
    "Length": "4708",
    "Level": 255,
    "LinkingUri": null,
    "LinkingUrl": "",
    "MajorVersion": 1,
    "MinorVersion": 0,
    "Name": "Nova.aspx",
    "ServerRelativeUrl": "/SitePages/Nova.aspx",
    "TimeCreated": "2018-07-11T19:24:12Z",
    "TimeLastModified": "2018-07-11T19:33:57Z",
    "Title": "Nova",
    "UIVersion": 512,
    "UIVersionLabel": "1.0",
    "UniqueId": "16035d61-edb9-4758-a490-3d13fcd9fdaa"
  };

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    auth.connection.active = true;
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
    loggerLogSpy = sinon.spy(logger, 'log');
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get,
      ClientSidePage.fromHtml
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.PAGE_SECTION_LIST);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('lists sections on the modern page', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/GetFileByServerRelativePath(DecodedUrl='/sites/team-a/SitePages/home.aspx')`) > -1) {
        return apiResponse;
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com/sites/team-a', pageName: 'home.aspx', output: 'text' } });
    assert(loggerLogSpy.calledWith([{
      "order": 1,
      "columns": 2
    },
    {
      "order": 2,
      "columns": 2
    }]));
  });

  it('lists sections on the modern page - no sections available', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/GetFileByServerRelativePath(DecodedUrl='/sites/team-a/SitePages/home.aspx')`) > -1) {
        return {
          "ListItemAllFields": {
            "FileSystemObjectType": 0,
            "Id": 9,
            "ServerRedirectedEmbedUri": null,
            "ServerRedirectedEmbedUrl": "",
            "ContentTypeId": "0x0101009D1CB255DA76424F860D91F20E6C41180070E97A63FCC58F47B8FE04D0654FD44E",
            "WikiField": null,
            "Title": "Nova",
            "ClientSideApplicationId": "b6917cb1-93a0-4b97-a84d-7cf49975d4ec",
            "CanvasContent1": "<div></div>",
            "BannerImageUrl": {
              "Description": "/_layouts/15/images/sitepagethumbnail.png",
              "Url": "/_layouts/15/images/sitepagethumbnail.png"
            },
            "Description": "asd",
            "PromotedState": 0,
            "FirstPublishedDate": null,
            "LayoutWebpartsContent": "<div><div data-sp-canvascontrol=\"\" data-sp-canvasdataversion=\"1.4\" data-sp-controldata=\"&#123;&quot;id&quot;&#58;&quot;cbe7b0a9-3504-44dd-a3a3-0e5cacd07788&quot;,&quot;instanceId&quot;&#58;&quot;cbe7b0a9-3504-44dd-a3a3-0e5cacd07788&quot;,&quot;title&quot;&#58;&quot;Região do Título&quot;,&quot;description&quot;&#58;&quot;Descrição da Região de Título&quot;,&quot;serverProcessedContent&quot;&#58;&#123;&quot;htmlStrings&quot;&#58;&#123;&#125;,&quot;searchablePlainTexts&quot;&#58;&#123;&#125;,&quot;imageSources&quot;&#58;&#123;&#125;,&quot;links&quot;&#58;&#123;&#125;&#125;,&quot;dataVersion&quot;&#58;&quot;1.4&quot;,&quot;properties&quot;&#58;&#123;&quot;title&quot;&#58;&quot;Nova&quot;,&quot;imageSourceType&quot;&#58;4,&quot;layoutType&quot;&#58;&quot;FullWidthImage&quot;,&quot;textAlignment&quot;&#58;&quot;Left&quot;,&quot;showTopicHeader&quot;&#58;false,&quot;showPublishDate&quot;&#58;false,&quot;topicHeader&quot;&#58;&quot;&quot;&#125;&#125;\"></div></div>",
            "ComplianceAssetId": null,
            "OData__AuthorBylineId": null,
            "_AuthorBylineStringId": null,
            "OData__OriginalSourceUrl": null,
            "OData__OriginalSourceSiteId": null,
            "OData__OriginalSourceWebId": null,
            "OData__OriginalSourceListId": null,
            "OData__OriginalSourceItemId": null,
            "ID": 9,
            "Created": "2018-07-11T16:24:12",
            "AuthorId": 9,
            "Modified": "2018-07-11T16:33:57",
            "EditorId": 9,
            "OData__CopySource": null,
            "CheckoutUserId": 9,
            "OData__UIVersionString": "1.0",
            "GUID": "903cdabe-7a28-4e96-a55e-c768185d7d9a"
          },
          "CheckInComment": "",
          "CheckOutType": 0,
          "ContentTag": "{16035D61-EDB9-4758-A490-3D13FCD9FDAA},10,8",
          "CustomizedPageStatus": 0,
          "ETag": "\"{16035D61-EDB9-4758-A490-3D13FCD9FDAA},10\"",
          "Exists": true,
          "IrmEnabled": false,
          "Length": "4708",
          "Level": 255,
          "LinkingUri": null,
          "LinkingUrl": "",
          "MajorVersion": 1,
          "MinorVersion": 0,
          "Name": "Nova.aspx",
          "ServerRelativeUrl": "/SitePages/Nova.aspx",
          "TimeCreated": "2018-07-11T19:24:12Z",
          "TimeLastModified": "2018-07-11T19:33:57Z",
          "Title": "Nova",
          "UIVersion": 512,
          "UIVersionLabel": "1.0",
          "UniqueId": "16035d61-edb9-4758-a490-3d13fcd9fdaa"
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com/sites/team-a', pageName: 'home.aspx' } });
    assert(loggerLogSpy.notCalled);
  });

  it('lists sections on the modern page (debug)', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/GetFileByServerRelativePath(DecodedUrl='/sites/team-a/SitePages/home.aspx')`) > -1) {
        return apiResponse;
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, webUrl: 'https://contoso.sharepoint.com/sites/team-a', pageName: 'home.aspx', output: 'text' } });
    assert(loggerLogSpy.calledWith([{
      "order": 1,
      "columns": 2
    },
    {
      "order": 2,
      "columns": 2
    }]));
  });

  it('lists sections on the modern page when the specified page name doesn\'t contain extension', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/GetFileByServerRelativePath(DecodedUrl='/sites/team-a/SitePages/home.aspx')`) > -1) {
        return apiResponse;
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com/sites/team-a', pageName: 'home', output: 'text' } });
    assert(loggerLogSpy.calledWith([{
      "order": 1,
      "columns": 2
    },
    {
      "order": 2,
      "columns": 2
    }]));
  });

  it('lists all information about sections on the modern page in json output mode', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/GetFileByServerRelativePath(DecodedUrl='/sites/team-a/SitePages/home.aspx')`) > -1) {
        return apiResponse;
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com/sites/team-a', pageName: 'home.aspx', output: 'json' } });
    const result = JSON.stringify(log[0]).replace(/zoneId&quot;&#58;&quot;[a-f0-9-]+&quot;/g, 'zoneId&quot;&#58;&quot;f14c54a6-6d2b-4fc3-aa90-902d38d18bdb&quot;');
    assert.strictEqual(result, JSON.stringify([{
      "order": 1,
      "columns": [{
        "factor": 6,
        "order": 1,
        "dataVersion": "1.0",
        "jsonData": "&#123;&quot;position&quot;&#58;&#123;&quot;sectionFactor&quot;&#58;6,&quot;sectionIndex&quot;&#58;1,&quot;zoneIndex&quot;&#58;1,&quot;zoneId&quot;&#58;&quot;f14c54a6-6d2b-4fc3-aa90-902d38d18bdb&quot;,&quot;layoutIndex&quot;&#58;1&#125;&#125;"
      },
      {
        "factor": 6,
        "order": 2,
        "dataVersion": "1.0",
        "jsonData": "&#123;&quot;position&quot;&#58;&#123;&quot;sectionFactor&quot;&#58;6,&quot;sectionIndex&quot;&#58;2,&quot;zoneIndex&quot;&#58;1,&quot;zoneId&quot;&#58;&quot;f14c54a6-6d2b-4fc3-aa90-902d38d18bdb&quot;,&quot;layoutIndex&quot;&#58;1&#125;,&quot;id&quot;&#58;&quot;emptySection&quot;,&quot;controlType&quot;&#58;1&#125;"
      }]
    },
    {
      "order": 2,
      "columns": [{
        "factor": 6,
        "order": 1,
        "dataVersion": "1.0",
        "jsonData": "&#123;&quot;position&quot;&#58;&#123;&quot;sectionFactor&quot;&#58;6,&quot;sectionIndex&quot;&#58;1,&quot;zoneIndex&quot;&#58;2,&quot;zoneId&quot;&#58;&quot;f14c54a6-6d2b-4fc3-aa90-902d38d18bdb&quot;,&quot;layoutIndex&quot;&#58;1&#125;,&quot;id&quot;&#58;&quot;emptySection&quot;,&quot;controlType&quot;&#58;1&#125;"
      },
      {
        "factor": 6,
        "order": 2,
        "dataVersion": "1.0",
        "jsonData": "&#123;&quot;position&quot;&#58;&#123;&quot;sectionFactor&quot;&#58;6,&quot;sectionIndex&quot;&#58;2,&quot;zoneIndex&quot;&#58;2,&quot;zoneId&quot;&#58;&quot;f14c54a6-6d2b-4fc3-aa90-902d38d18bdb&quot;,&quot;layoutIndex&quot;&#58;1&#125;,&quot;id&quot;&#58;&quot;emptySection&quot;,&quot;controlType&quot;&#58;1&#125;"
      }]
    }]));
  });

  it('shows error when the specified page is a classic page', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/GetFileByServerRelativePath(DecodedUrl='/sites/team-a/SitePages/home.aspx')`) > -1) {
        return {
          "ListItemAllFields": {
            "CommentsDisabled": false,
            "FileSystemObjectType": 0,
            "Id": 1,
            "ServerRedirectedEmbedUri": null,
            "ServerRedirectedEmbedUrl": "",
            "ContentTypeId": "0x0101080088E2A2ED69D0324A8981DD7FAC103494",
            "FileLeafRef": "Home.aspx",
            "ComplianceAssetId": null,
            "WikiField": "<div class=\"ExternalClass1188FC9011E046D4BED9C05BAD4DA96E\">\r\n            <table id=\"layoutsTable\" style=\"width&#58;100%;\">\r\n                <tbody>\r\n                    <tr style=\"vertical-align&#58;top;\">\r\n            <td colspan=\"2\"><div class=\"ms-rte-layoutszone-outer\" style=\"width&#58;100%;\"><div class=\"ms-rte-layoutszone-inner\" style=\"word-wrap&#58;break-word;margin&#58;0px;border&#58;0px;\"><div class=\"ms-rtestate-read ms-rte-wpbox\"><div class=\"ms-rtestate-read f01b62ca-c190-410c-aef9-2499ab79436e\" id=\"div_f01b62ca-c190-410c-aef9-2499ab79436e\"></div>\n  <div class=\"ms-rtestate-read\" id=\"vid_f01b62ca-c190-410c-aef9-2499ab79436e\" style=\"display&#58;none;\"></div>\n</div>\n</div></div></td>\r\n                    </tr>\r\n                    <tr style=\"vertical-align&#58;top;\">\r\n            <td style=\"width&#58;49.95%;\"><div class=\"ms-rte-layoutszone-outer\" style=\"width&#58;100%;\"><div class=\"ms-rte-layoutszone-inner\" style=\"word-wrap&#58;break-word;margin&#58;0px;border&#58;0px;\"><div class=\"ms-rtestate-read ms-rte-wpbox\"><div class=\"ms-rtestate-read 837b046b-6a02-4770-9a25-3292d955e903\" id=\"div_837b046b-6a02-4770-9a25-3292d955e903\"></div>\n  <div class=\"ms-rtestate-read\" id=\"vid_837b046b-6a02-4770-9a25-3292d955e903\" style=\"display&#58;none;\"></div>\n</div>\n</div></div></td>\r\n            <td class=\"ms-wiki-columnSpacing\" style=\"width&#58;49.95%;\"><div class=\"ms-rte-layoutszone-outer\" style=\"width&#58;100%;\"><div class=\"ms-rte-layoutszone-inner\" style=\"word-wrap&#58;break-word;margin&#58;0px;border&#58;0px;\"><div class=\"ms-rtestate-read ms-rte-wpbox\"><div class=\"ms-rtestate-read f36dd97b-6f2b-437b-a169-26a97962074d\" id=\"div_f36dd97b-6f2b-437b-a169-26a97962074d\"></div>\n  <div class=\"ms-rtestate-read\" id=\"vid_f36dd97b-6f2b-437b-a169-26a97962074d\" style=\"display&#58;none;\"></div>\n</div>\n</div></div></td>\r\n                    </tr>\r\n                </tbody>\r\n            </table>\r\n            <span id=\"layoutsData\" style=\"display&#58;none;\">true,false,2</span></div>",
            "Title": null,
            "ClientSideApplicationId": null,
            "PageLayoutType": null,
            "CanvasContent1": null,
            "BannerImageUrl": null,
            "Description": null,
            "PromotedState": null,
            "FirstPublishedDate": null,
            "LayoutWebpartsContent": null,
            "AuthorsId": null,
            "AuthorsStringId": null,
            "OriginalSourceUrl": null,
            "ID": 1,
            "Created": "2018-03-19T17:52:56",
            "AuthorId": 1073741823,
            "Modified": "2018-03-24T07:14:28",
            "EditorId": 1073741823,
            "OData__CopySource": null,
            "CheckoutUserId": null,
            "OData__UIVersionString": "1.0",
            "GUID": "19ac5510-bba6-427b-9c1b-a3329a3b0cad"
          },
          "CheckInComment": "",
          "CheckOutType": 2,
          "ContentTag": "{8F33F78C-9F39-48E2-B99D-01C2937A56BB},4,1",
          "CustomizedPageStatus": 1,
          "ETag": "\"{8F33F78C-9F39-48E2-B99D-01C2937A56BB},4\"",
          "Exists": true,
          "IrmEnabled": false,
          "Length": "3356",
          "Level": 1,
          "LinkingUri": null,
          "LinkingUrl": "",
          "MajorVersion": 1,
          "MinorVersion": 0,
          "Name": "home.aspx",
          "ServerRelativeUrl": "/sites/team-a/SitePages/home.aspx",
          "TimeCreated": "2018-03-20T00:52:56Z",
          "TimeLastModified": "2018-03-24T14:14:28Z",
          "Title": null,
          "UIVersion": 512,
          "UIVersionLabel": "1.0",
          "UniqueId": "8f33f78c-9f39-48e2-b99d-01c2937a56bb"
        };
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com/sites/team-a', pageName: 'home.aspx', sectipn: 1 } } as any),
      new CommandError('Page home.aspx is not a modern page.'));
  });

  it('correctly handles page not found', async () => {
    sinon.stub(request, 'get').callsFake(() => {
      throw {
        error: {
          "odata.error": {
            "code": "-2130575338, Microsoft.SharePoint.SPException",
            "message": {
              "lang": "en-US",
              "value": "The file /sites/team-a/SitePages/home1.aspx does not exist."
            }
          }
        }
      };
    });

    await assert.rejects(command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com/sites/team-a', pageName: 'home.aspx' } } as any),
      new CommandError('The file /sites/team-a/SitePages/home1.aspx does not exist.'));
  });

  it('correctly handles OData error when retrieving pages', async () => {
    sinon.stub(request, 'get').callsFake(() => {
      throw { error: { 'odata.error': { message: { value: 'An error has occurred' } } } };
    });

    await assert.rejects(command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com/sites/team-a', pageName: 'home.aspx' } } as any),
      new CommandError('An error has occurred'));
  });

  it('fails validation if the webUrl option is not a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'foo', pageName: 'home.aspx' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });
});
