import escapeRegExp from "lodash/escapeRegExp";
import trim from "lodash/trim";

export function escape(str: string): string {
  return str.replace(/'/g, "\\'");
}

export function regexpValue(target: string, searchFromBegin = true): string {
  if (typeof target === "string" && target) {
    const isRegexp = /^\/.*?\/$/.test(target);

    if (isRegexp) {
      return trim(target, "/");
    }

    target = escape(target);
    target = escapeRegExp(target);

    if (searchFromBegin) {
      return `^${target}.*$`;
    }

    return `.*${target}.*$`;
  }

  return "";
}
