declare global {
  interface Window {
    google: any;
  }
}

export async function transliterateToGujarati(text: string): Promise<string> {
  return new Promise((resolve) => {
    if (!window.google || !window.google.elements) {
      resolve(text); // If API not loaded, return original text
      return;
    }

    const options = {
      sourceLanguage: "en",
      destinationLanguage: ["gu"], // Gujarati
      transliterationEnabled: true,
    };

    const control = new window.google.elements.transliteration.TransliterationControl(options);

    control.transliterate([text], "en", "gu", (result: string[]) => {
      resolve(result[0] || text); // Return first result or fallback
    });
  });
}
