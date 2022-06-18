import { NFTFXMetadata } from "./metaplex-metadata-nftfx";
export declare type CSSRules = Record<string, string | number>;
export declare const makeCSSString: (cssRules: CSSRules) => string;
export declare const MESSAGE_CSS: string;
export declare const safeFetchJson: <T>(url: string) => Promise<T>;
export declare const safeFetch: (url: string, type?: string) => Promise<any>;
export declare const makeAbsUrl: (metadata: NFTFXMetadata) => (assetUrl: string) => string;
