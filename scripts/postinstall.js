const fs = require("fs");
const path = require("path");

function normalizeNewlines(value) {
  return value.replace(/\r\n/g, "\n");
}

function replaceOrSkip(source, originalSnippet, replacementSnippet, filePath) {
  if (source.includes(replacementSnippet)) {
    return source;
  }

  if (!source.includes(originalSnippet)) {
    console.warn(`Skipping patch because the expected source block was not found in ${filePath}.`);
    return source;
  }

  return source.replace(originalSnippet, replacementSnippet);
}

function patchFile(relativePath, replacements) {
  const filePath = path.join(process.cwd(), ...relativePath);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  const source = normalizeNewlines(fs.readFileSync(filePath, "utf8"));
  let updated = source;

  for (const replacement of replacements) {
    updated = replaceOrSkip(
      updated,
      replacement.original,
      replacement.replacement,
      filePath
    );
  }

  if (updated === source) {
    return false;
  }

  fs.writeFileSync(filePath, updated);
  return true;
}

const ngrokUtilsPatched = patchFile(
  ["node_modules", "@expo", "ngrok", "src", "utils.js"],
  [
    {
      original: `function isRetriable(err) {
  if (!err.response) {
    return false;
  }
  const statusCode = err.response.statusCode;
  const body = err.body;
  const notReady500 = statusCode === 500 && /panic/.test(body);
  const notReady502 =
    statusCode === 502 &&
    body.details &&
    body.details.err === "tunnel session not ready yet";
  const notReady503 =
    statusCode === 503 &&
    body.details &&
    body.details.err ===
      "a successful ngrok tunnel session has not yet been established";
  return notReady500 || notReady502 || notReady503;
}`,
      replacement: `function isRetriable(err) {
  if (!err.response) {
    return false;
  }
  const statusCode = err.response.statusCode;
  const body = err.body;
  const bodyText =
    typeof body === "string"
      ? body
      : typeof err.response.body === "string"
        ? err.response.body
        : "";
  const bodyDetails =
    body && typeof body === "object" && "details" in body ? body.details : null;
  const notReady500 = statusCode === 500 && /panic/.test(bodyText);
  const notReady502 =
    statusCode === 502 &&
    bodyDetails &&
    bodyDetails.err === "tunnel session not ready yet";
  const notReady503 =
    statusCode === 503 &&
    bodyDetails &&
    bodyDetails.err ===
      "a successful ngrok tunnel session has not yet been established";
  return notReady500 || notReady502 || notReady503;
}`,
    },
  ]
);

const ngrokClientPatched = patchFile(
  ["node_modules", "@expo", "ngrok", "src", "client.js"],
  [
    {
      original: `    } catch (error) {
      let clientError;
      try {
        const response = JSON.parse(error.response.body);
        clientError = new NgrokClientError(
          response.msg,
          error.response,
          response
        );
      } catch (e) {
        clientError = new NgrokClientError(
          error.response.body,
          error.response,
          error.response.body
        );
      }
      throw clientError;
    }`,
      replacement: `    } catch (error) {
      const responseBody = error && error.response ? error.response.body : undefined;
      if (!error || !error.response) {
        throw new NgrokClientError(
          error && error.message ? error.message : "ngrok request failed",
          undefined,
          responseBody
        );
      }
      let clientError;
      try {
        const response = JSON.parse(responseBody);
        clientError = new NgrokClientError(
          response.msg,
          error.response,
          response
        );
      } catch (e) {
        clientError = new NgrokClientError(
          responseBody,
          error.response,
          responseBody
        );
      }
      throw clientError;
    }`,
    },
  ]
);

const expoCliPatched = patchFile(
  ["node_modules", "expo", "node_modules", "@expo", "cli", "build", "src", "start", "server", "AsyncNgrok.js"],
  [
    {
      original: `const debug = require('debug')('expo:start:server:ngrok');
const NGROK_CONFIG = {
    authToken: '5W1bR67GNbWcXqmxZzBG1_56GezNeaX6sSRvn8npeQ8',
    domain: 'exp.direct'
};`,
      replacement: `const debug = require('debug')('expo:start:server:ngrok');
const DEFAULT_NGROK_AUTH_TOKEN = '5W1bR67GNbWcXqmxZzBG1_56GezNeaX6sSRvn8npeQ8';
const CUSTOM_NGROK_AUTH_TOKEN = _env.env.EXPO_TUNNEL_AUTH_TOKEN;
const NGROK_CONFIG = {
    authToken: CUSTOM_NGROK_AUTH_TOKEN || DEFAULT_NGROK_AUTH_TOKEN,
    domain: CUSTOM_NGROK_AUTH_TOKEN ? undefined : 'exp.direct'
};`,
    },
    {
      original: `    async _getConnectionPropsAsync() {
        const userDefinedSubdomain = _env.env.EXPO_TUNNEL_SUBDOMAIN;
        if (userDefinedSubdomain) {
            const subdomain = typeof userDefinedSubdomain === 'string' ? userDefinedSubdomain : await this._getProjectSubdomainAsync();
            debug('Subdomain:', subdomain);
            return {
                subdomain
            };
        } else {
            const hostname = await this._getProjectHostnameAsync();
            debug('Hostname:', hostname);
            return {
                hostname
            };
        }
    }`,
      replacement: `    async _getConnectionPropsAsync() {
        const userDefinedSubdomain = _env.env.EXPO_TUNNEL_SUBDOMAIN;
        if (CUSTOM_NGROK_AUTH_TOKEN) {
            if (userDefinedSubdomain) {
                debug('Ignoring EXPO_TUNNEL_SUBDOMAIN because a custom ngrok auth token is configured.');
            }
            return {};
        }
        if (userDefinedSubdomain) {
            const subdomain = typeof userDefinedSubdomain === 'string' ? userDefinedSubdomain : await this._getProjectSubdomainAsync();
            debug('Subdomain:', subdomain);
            return {
                subdomain
            };
        } else {
            const hostname = await this._getProjectHostnameAsync();
            debug('Hostname:', hostname);
            return {
                hostname
            };
        }
    }`,
    },
  ]
);

if (ngrokUtilsPatched || ngrokClientPatched || expoCliPatched) {
  console.log("Patched Expo tunnel dependencies for deterministic startup and custom ngrok auth token support.");
}
