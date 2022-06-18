export interface NFTFXMetadata extends MetaplexMetadata<{
    nftfx: NFTFXProperties;
}> {
}
export declare const isNFTFXMetadata: (x: any) => x is NFTFXMetadata;
export interface MetaplexMetadata<EXT_PROPS extends any> {
    name: string;
    symbol: string;
    description: string;
    seller_fee_basis_points: number;
    image: string;
    external_url: string;
    attributes: Array<{
        trait_type: string;
        value: string;
    }>;
    collection: {
        name: string;
        family: string;
    };
    properties: MetaplexProperties & EXT_PROPS;
}
export interface MetaplexProperties {
    category: string;
    creators: Creator[];
    files: File[];
}
export interface File {
    uri: string;
    type: string;
}
export interface Creator {
    address: string;
    share: number;
}
export interface NFTFXProperties {
    version: string;
    width: number;
    height: number;
    baseUrl: string;
    shaders: {
        Main: string;
        Background?: string;
        Filter?: string;
        Compute?: string;
    };
    textures: Record<string, string>;
    uniforms: Record<string, number>;
}
