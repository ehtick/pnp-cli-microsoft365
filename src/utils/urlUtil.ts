export const urlUtil = {
  /**
     * Returns server relative path.
     * @param webUrl web full or web relative url e.g. https://contoso.sharepoint.com/sites/team1
     * @param folderRelativePath folder relative path e.g. /Shared Documents
     * @example
     * // returns "/sites/team1"
     * urlUtil.getServerRelativePath("https://contoso.sharepoint.com/sites/team1", "");
     * @example
     * // returns "/sites/team1/Shared Documents"
     * urlUtil.getServerRelativePath("https://contoso.sharepoint.com/sites/team1", "/Shared Documents");
     * @example
     * // returns "/sites/team1/Shared Documents"
     * urlUtil.getServerRelativePath("/sites/team1/", "/Shared Documents");
     */
  getServerRelativePath(webUrl: string, folderRelativePath: string): string {
    let webRelativePath = this.getUrlRelativePath(webUrl);
    let relativePathToRemove: string = webRelativePath;

    // add '/' at 0
    if (webRelativePath[0] !== '/') {
      webRelativePath = `/${webRelativePath}`;
    }
    else {
      relativePathToRemove = webRelativePath.substring(1);
    }

    // remove last '/' of webRelativePath
    const webPathLastCharPos: number = webRelativePath.length - 1;

    if (webRelativePath.length > 1 &&
      webRelativePath[webPathLastCharPos] === '/') {
      webRelativePath = webRelativePath.substring(0, webPathLastCharPos);
    }

    // remove the web relative path if it is contained in the folder relative path
    const relativePathToRemoveIdx: number = folderRelativePath.toLowerCase().indexOf(relativePathToRemove.toLowerCase());

    if (relativePathToRemoveIdx > -1) {
      const pos: number = relativePathToRemoveIdx + relativePathToRemove.length;
      folderRelativePath = folderRelativePath.substring(pos, folderRelativePath.length);
    }

    if (folderRelativePath !== '') {
      // add '/' at 0 for siteRelativePath
      if (folderRelativePath[0] !== '/') {
        folderRelativePath = `/${folderRelativePath}`;
      }

      // remove last '/' of siteRelativePath
      const folderPathLastCharPos: number = folderRelativePath.length - 1;

      if (folderRelativePath[folderPathLastCharPos] === '/') {
        folderRelativePath = folderRelativePath.substring(0, folderPathLastCharPos);
      }

      if (webRelativePath === '/' && folderRelativePath !== '') {
        webRelativePath = folderRelativePath;
      }
      else {
        webRelativePath = `${webRelativePath}${folderRelativePath}`;
      }
    }

    return webRelativePath.replace('//', '/');
  },

  /**
   * Returns server relative site url.
   * @param webUrl web full or web relative url e.g. https://contoso.sharepoint.com/sites/team1
   * @example
   * // returns "/sites/team1"
   * urlUtil.getServerRelativeSiteUrl("https://contoso.sharepoint.com/sites/team1";
   * @example
   * // returns ""
   * urlUtil.getServerRelativeSiteUrl("https://contoso.sharepoint.com");
   * @example
   * // returns "/sites/team1/Shared Documents"
   * urlUtil.getServerRelativePath("/sites/team1/", "/Shared Documents");
   */
  getServerRelativeSiteUrl(webUrl: string): string {
    const serverRelativeSiteUrl = urlUtil.getServerRelativePath(webUrl, '');

    // return an empty string instead of / to prevent // replies
    return serverRelativeSiteUrl === '/' ? "" : serverRelativeSiteUrl;
  },

  /**
   * Returns web relative path from webUrl and folderUrl.
   * @param webUrl web full or web relative url e.g. https://contoso.sharepoint.com/sites/team1/
   * @param folderUrl folder server relative url e.g. /sites/team1/Lists/MyList
   * @example
   * // returns "/Lists/MyList"
   * Utils.getWebRelativePath("https://contoso.sharepoint.com/sites/team1/", "/sites/team1/Lists/MyList");
   * @example
   * // returns "/Shared Documents"
   * Utils.getWebRelativePath("/sites/team1/", "/sites/team1/Shared Documents");
   */
  getWebRelativePath(webUrl: string, folderUrl: string): string {
    let webRelativePath = this.getUrlRelativePath(webUrl);
    let folderWebRelativePath: string = '';

    // will be used to remove relative path from the folderRelativePath
    // in case the web relative url is included
    let relativePathToRemove: string = webRelativePath;

    // add '/' at 0
    if (webRelativePath[0] !== '/') {
      webRelativePath = `/${webRelativePath}`;
    }
    else {
      relativePathToRemove = webRelativePath.substring(1);
    }

    // remove last '/' of webRelativePath
    const webPathLastCharPos: number = webRelativePath.length - 1;

    if (webRelativePath.length > 1 &&
      webRelativePath[webPathLastCharPos] === '/') {
      webRelativePath = webRelativePath.substring(0, webPathLastCharPos);
    }

    // remove the web relative path if it is contained in the folder relative path
    const relativePathToRemoveIdx: number = folderUrl.toLowerCase().indexOf(relativePathToRemove.toLowerCase());

    if (relativePathToRemoveIdx > -1) {
      const pos: number = relativePathToRemoveIdx + relativePathToRemove.length;
      folderWebRelativePath = folderUrl.substring(pos, folderUrl.length);
    }
    else {
      folderWebRelativePath = folderUrl;
    }

    // add '/' at 0 for folderWebRelativePath
    if (folderWebRelativePath[0] !== '/') {
      folderWebRelativePath = `/${folderWebRelativePath}`;
    }

    // remove last '/' of folderWebRelativePath
    const folderPathLastCharPos: number = folderWebRelativePath.length - 1;

    if (folderWebRelativePath.length > 1 && folderWebRelativePath[folderPathLastCharPos] === '/') {
      folderWebRelativePath = folderWebRelativePath.substring(0, folderPathLastCharPos);
    }

    return folderWebRelativePath.replace('//', '/');
  },

  /**
   * Returns the absolute URL according to a Web URL and the server relative URL of a folder
   * @param webUrl The full URL of a web
   * @param serverRelativeUrl The server relative URL of a folder
   * @example
   * // returns "https://contoso.sharepoint.com/sites/team1/Lists/MyList"
   * urlUtil.getAbsoluteUrl("https://contoso.sharepoint.com/sites/team1/", "/sites/team1/Lists/MyList");
   */
  getAbsoluteUrl(webUrl: string, serverRelativeUrl: string): string {
    const parsedUrl = new URL(webUrl);
    if (serverRelativeUrl[0] !== '/') {
      serverRelativeUrl = `/${serverRelativeUrl}`;
    }
    return `${parsedUrl.origin}${serverRelativeUrl}`;
  },

  /**
   * Combines base and relative url considering any missing slashes
   * @param baseUrl https://contoso.com
   * @param relativeUrl sites/abc
   */
  urlCombine(baseUrl: string, relativeUrl: string): string {
    // remove last '/' of base if exists
    if (baseUrl.lastIndexOf('/') === baseUrl.length - 1) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 1);
    }

    // remove '/' at 0
    if (relativeUrl.charAt(0) === '/') {
      relativeUrl = relativeUrl.substring(1, relativeUrl.length);
    }

    // remove last '/' of next if exists
    if (relativeUrl.lastIndexOf('/') === relativeUrl.length - 1) {
      relativeUrl = relativeUrl.substring(0, relativeUrl.length - 1);
    }

    return `${baseUrl}/${relativeUrl}`;
  },

  /**
   * Get the absolute URL from the target SharePoint URL.
   * @param {string} webUrl - The base web URL.
   * @param {string} url - The target SharePoint URL.
   * @returns {string} - The target site absolute URL.
   * 
   * Example Scenarios:
   * - webUrl = "https://contoso.sharepoint.com" and targetUrl = "/teams/sales/Shared Documents/temp/123/234",
   *    returns "https://contoso.sharepoint.com/teams/sales".
   * - webUrl = "https://contoso.sharepoint.com" and targetUrl = "https://contoso-my.sharepoint.com/personal/john_contoso_onmicrosoft_com/Documents/123",
   *    returns "https://contoso-my.sharepoint.com/personal/john_contoso_onmicrosoft_com".
   * - webUrl = "https://contoso.sharepoint.com/teams/sales" and targetUrl = "/Shared Documents/temp",
   *    returns "https://contoso.sharepoint.com".
   * - webUrl = "https://contoso.sharepoint.com" and targetUrl = "/teams/sales/Shared Documents/temp",
   *    returns "https://contoso.sharepoint.com/teams/sales".
  */
  getTargetSiteAbsoluteUrl(webUrl: string, url: string): string {
    const fullUrl: string = url.startsWith('https://') ? url : urlUtil.getAbsoluteUrl(webUrl, url);

    // Pattern to match SharePoint URLs
    const urlPattern = /https:\/\/[\w\-]+\.sharepoint\.com\/(teams|sites|personal)\/([\w\-]+)/;

    const match = fullUrl.match(urlPattern);

    if (match) {
      // If a match is found, return the matched URL
      return match[0];
    }
    else {
      // Extract the root URL
      const rootUrl = new URL(fullUrl);
      return rootUrl.origin;
    }
  },

  /**
   * Removes leading slashes from the URL.
   * @param url The URL to process.
   * @returns The URL without leading slashes.
   */
  removeLeadingSlashes(url: string): string {
    return url.replace(/^\/+/, '');
  },

  /**
   * Removes trailing slashes from the URL.
   * @param url The URL to process.
   * @returns The URL without trailing slashes.
   */
  removeTrailingSlashes(url: string): string {
    return url.replace(/\/+$/, '');
  },

  getUrlRelativePath(url: string): string {
    if (url.includes('://')) {
      const parsedUrl = new URL(url);
      return url.substring(parsedUrl.origin.length);
    }
    return url;
  }
};