const { Translate } = require("@google-cloud/translate").v2;

let translateClient;

function getTranslateClient() {
  if (translateClient) return translateClient;

  // Prefer GOOGLE_APPLICATION_CREDENTIALS (standard), but support an app-specific name too.
  const keyFilename =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_TRANSLATE_CREDENTIALS_JSON ||
    "";

  const projectId = process.env.GOOGLE_TRANSLATE_PROJECT_ID || undefined;

  if (!keyFilename) {
    throw new Error(
      "Missing Google credentials. Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path."
    );
  }

  // eslint-disable-next-line no-new
  translateClient = projectId
    ? new Translate({ keyFilename, projectId })
    : new Translate({ keyFilename });

  return translateClient;
}

async function translateTextsBatch({ targetLang, texts }) {
  const client = getTranslateClient();

  // @google-cloud/translate v2 returns: [translations] where translations is a string[].
  const [translations] = await client.translate(texts, targetLang);

  if (!Array.isArray(translations)) {
    // Defensive fallback: keep response shape stable.
    return texts.map(() => "");
  }

  return translations.map((t) => String(t));
}

module.exports = {
  translateTextsBatch,
};

