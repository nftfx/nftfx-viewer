import { NFTFXMetadata } from "./metaplex-metadata-nftfx";

export type CSSRules = Partial<CSSStyleDeclaration>;

export const setStyle = (elem: HTMLElement, rules: Partial<CSSStyleDeclaration>) => {
    Object.entries(rules)
        .forEach(([k, v]) => (elem.style as any)[k] = v);
}

export const MESSAGE_CSS: CSSRules = {
    'position': 'absolute',
    'bottom': '0',
    'width': '100%',
    'margin': '0',
    'padding': '10px 15px',
    'textAlign': 'center',
    'textShadow': '0 1px 2px #000',
    'backgroundColor': '#33333380',
};

export const safeFetchJson = <T>(url: string): Promise<T> =>
    safeFetch(url, 'json');

export const safeFetch = (url: string, type: string = 'blob') =>
    fetch(url)
        .then(res => {
            if (res.ok)
                return res;
            else
                throw new Error(`[safeFetch] Request ${url} failed with code: ${res.status} ${res.statusText}`);
        })
        .then(res => type === 'json' ? res.json() : res.blob());

export const makeAbsUrl = (metadata: NFTFXMetadata) => (assetUrl: string) => {
    let url = assetUrl;
    if (url.indexOf('://') !== -1)
        return url;
    let baseUrl = metadata.properties.nftfx.baseUrl;
    if (url.indexOf(baseUrl) === -1) {
        url = baseUrl + (baseUrl.substr(-1, 1) === '/' ? '' : '/') + url;
    }
    if (url.indexOf('://') === -1) {
        url = window.location.origin + (url[0] === '/' ? '' : '/') + url;
    }
    return url;
}

export const makeResourceUrl = (metadata: NFTFXMetadata) => {
    const attributes: Record<string, string | number> = metadata.attributes
        .reduce((acc, x) => ({ ...acc, [x.trait_type]: x.value }), {});

    return (url: string) =>
        url.replace(/\$\w+\$/g, x =>
            (attributes[x.replace(/\$/g, '')] ?? x).toString()
        );
}