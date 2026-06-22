export type SearchParamsValue = string | string[] | undefined;
export type SearchParamsRecord = Record<string, SearchParamsValue>;

const EMPTY_SEARCH_PARAMS: SearchParamsRecord = {};

export async function readSearchParams(
  searchParams?: Promise<SearchParamsRecord>,
): Promise<SearchParamsRecord> {
  return searchParams ?? EMPTY_SEARCH_PARAMS;
}

export function getSearchString(params: SearchParamsRecord, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export function buildSearchParams(input: SearchParamsRecord) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string" && value) {
      params.set(key, value);
    }
  }

  return params;
}

export function readFeedbackSearchParams(params: SearchParamsRecord) {
  return {
    success: getSearchString(params, "success"),
    error: getSearchString(params, "error"),
    focus: getSearchString(params, "focus"),
  };
}
