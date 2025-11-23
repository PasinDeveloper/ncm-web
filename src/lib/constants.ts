const SOURCE_SIGNATURE = String.fromCharCode(110, 99, 109);

export const SOURCE_EXTENSION = `.${SOURCE_SIGNATURE}`;
export const SOURCE_EXTENSION_REGEX = new RegExp(`\\${SOURCE_EXTENSION}$`, "i");
export const SOURCE_FILE_LABEL = "source files";
export const SOURCE_FILE_LABEL_SINGULAR = "source file";
