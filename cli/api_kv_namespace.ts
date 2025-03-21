import { KVGetOptions, KVListCompleteResult, KVListIncompleteResult, KVListOptions, KVNamespace, KVPutOptions, KVValueAndMetadata } from '../common/cloudflare_workers_types.d.ts';
import { getKeyMetadata, getKeyValue } from '../common/cloudflare_api.ts';
import { Profile } from '../common/config.ts';
import { Bytes } from '../common/bytes.ts';

export class ApiKVNamespace implements KVNamespace {

    readonly accountId: string;
    readonly apiToken: string;
    readonly namespaceId: string;

    constructor(accountId: string, apiToken: string, namespaceId: string) {
        this.accountId = accountId;
        this.apiToken = apiToken;
        this.namespaceId = namespaceId;
    }

    static ofProfile(profile: Profile | undefined, kvNamespace: string) {
        if (!profile) throw new Error('Cannot use a kvNamespace binding without configuring a profile to use for its credentials');
        const { accountId, apiToken } = profile;
        return new ApiKVNamespace(accountId, apiToken, kvNamespace);
    }
    
    get(key: string, opts?: { type: 'text' }): Promise<string|null>;
    get(key: string, opts: { type: 'json' }): Promise<Record<string,unknown>|null>;
    get(key: string, opts: { type: 'arrayBuffer' }): Promise<ArrayBuffer|null>;
    // deno-lint-ignore no-explicit-any
    get(key: string, opts: { type: 'stream' }): Promise<ReadableStream<any>|null>;
    // deno-lint-ignore no-explicit-any
    async get(key: any, opts: any): Promise<any> {
        const { accountId, namespaceId, apiToken } = this;
        const bytes = await getKeyValue({ accountId, namespaceId, key, apiToken });
        if (bytes === undefined) return null;
        if (opts && opts.type === 'arrayBuffer') {
            return bytes.buffer;
        } else if (opts && opts.type === 'json') {
            return JSON.parse(new Bytes(bytes).utf8());
        }
        throw new Error(`ApiKVNamespace.get not implemented. key=${typeof key} ${key}, opts=${JSON.stringify(opts)}`);
    } 

    getWithMetadata(key: string, opts?: KVGetOptions | { type: 'text' }): Promise<KVValueAndMetadata<string> | null>;
    getWithMetadata(key: string, opts: KVGetOptions | { type: 'json' }): Promise<KVValueAndMetadata<Record<string, unknown>> | null>;
    getWithMetadata(key: string, opts: KVGetOptions | { type: 'arrayBuffer' }): Promise<KVValueAndMetadata<ArrayBuffer> | null>;
    getWithMetadata(key: string, opts: KVGetOptions | { type: 'stream' }): Promise<KVValueAndMetadata<ReadableStream> | null>;
    // deno-lint-ignore no-explicit-any
    async getWithMetadata(key: string, opts: any): Promise<any> {
        const { accountId, namespaceId, apiToken } = this;
        const bytes = await getKeyValue({ accountId, namespaceId, key, apiToken });
        if (bytes === undefined) return null;
        const metadata = await getKeyMetadata(this.accountId, this.namespaceId, key, this.apiToken);
        if (opts && opts.type === 'arrayBuffer') {
            const rt: KVValueAndMetadata<ArrayBuffer> = { value: bytes.buffer, metadata: metadata || null };
            return rt;
        }
        if (opts && opts.type === 'json') {
            const value = JSON.parse(new Bytes(bytes).utf8());
            const rt: KVValueAndMetadata<Record<string, unknown>> = { value, metadata: metadata || null };
            return rt;
        }
        throw new Error(`ApiKVNamespace.getWithMetadata not implemented. key=${key} opts=${JSON.stringify(opts)}`);
    } 
    
    put(_key: string, _value: string | ReadableStream | ArrayBuffer, _opts?: KVPutOptions): Promise<void> {
        throw new Error(`ApiKVNamespace.put not implemented.`);
    }

    delete(_key: string): Promise<void> {
        throw new Error(`ApiKVNamespace.delete not implemented.`);
    }

    list(_opts?: KVListOptions): Promise<KVListCompleteResult | KVListIncompleteResult> {
        throw new Error(`ApiKVNamespace.list not implemented.`);
    }
    
}
