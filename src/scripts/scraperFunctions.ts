// export const cors_bypass_fetch = async (url: string, options: any) => {
//     return new Promise((resolve, reject) => {
//         window.addEventListener('message', (event: MessageEvent) => {
//             if (event.data && event.data.type === 'cors-bypass-fetch-result') {
//                 resolve(event.data.result);
//             }
//         })
//         window.postMessage({type: 'cors-bypass-fetch', url: url, options: options})
//     })
// }

type PendingRequest = {
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
};

const pending = new Map<string, PendingRequest>();

window.addEventListener("message", (event) => {
    if (event.source !== window) {
        return;
    }

    const message = event.data;

    if (message?.type !== "extension-response") {
        return;
    }

    const request = pending.get(message.id);

    if (!request) {
        return;
    }

    pending.delete(message.id);

    if (message.error) {
        request.reject(new Error(message.error));
    } else {
        request.resolve(message.result);
    }
});

const callbacks = new Map<string, Function>();
const functionsToCallbackId = new Map<Function, string>();

function sendMessage(
    path: string[],
    args: unknown[]
): Promise<unknown> {
    return new Promise((resolve, reject) => {
        const id = crypto.randomUUID();

        pending.set(id, {
            resolve,
            reject
        });

        if (path.join('.') === 'scripting.executeScript') {
            const fnStr = ((args as any)[0].func).toString();
            (args as any)[0].func = `const data = (${fnStr})(); window.postMessage({type: 'extension-response', id: '${id}', result: 
            [
                {frameId: 0, result: data}
            ]
            })()`;
        }

        const processedArgs = processValue(args);
        window.postMessage(
            {
                type: "extension-call",
                id,
                path,
                args: processedArgs
            },
            "*"
        );
    });
}

// converts all functions to ids
function processValue(value: unknown): unknown {

    if (typeof value === "function") {
        if (functionsToCallbackId.has(value as Function)) {
            return { callbackId: functionsToCallbackId.get(value as Function) };
        }
        const callbackId = crypto.randomUUID();
        functionsToCallbackId.set(value as Function, callbackId);
        callbacks.set(callbackId, value as Function);
        return { callbackId };
    }

    if (Array.isArray(value)) {
        return value.map(processValue);
    }


    if (value !== null && typeof value === "object") {
        const obj: Record<string, unknown> = {};

        for (const [key, val] of Object.entries(value)) {
            obj[key] = processValue(val);
        }

        return obj;
    }


    return value;
}


function createBrowserProxy(
    path: string[] = []
): any {
    return new Proxy(() => {}, {
        get(target, property) {
            if (typeof property !== "string") {
                throw new Error(
                    "Symbols are not supported"
                );
            }

            return createBrowserProxy([
                ...path,
                property
            ]);
        },

        apply(target, thisArg, args) {
            return sendMessage(
                path,
                args
            );
        }
    });
}

window.addEventListener("message", (event) => {
    if (event.data.type === "callback") {
        const callback = callbacks.get(
            event.data.callbackId
        );
        if(callback)
            callback(...event.data.args);
    }
});

// function extensionFetch(
//     ...args: Parameters<typeof fetch>
// ): Promise<unknown> {
//     return sendMessage(
//         "globalThis",
//         ["fetch"],
//         args
//     );
// }

export const browser = createBrowserProxy();
//export const fetchProxy = extensionFetch;