import { NFTFXMetadata } from "./metaplex-metadata-nftfx";
export declare type CSSRules = Partial<CSSStyleDeclaration>;
export declare const setStyle: (elem: HTMLElement, rules: Partial<CSSStyleDeclaration>) => void;
export declare const MESSAGE_CSS: CSSRules;
export declare const safeFetchJson: <T>(url: string) => Promise<T>;
export declare const safeFetch: (url: string, type?: string) => Promise<any>;
export declare const makeAbsUrl: (metadata: NFTFXMetadata) => (assetUrl: string) => string;
export declare const makeResourceUrl: (metadata: NFTFXMetadata) => (url: string) => string;
